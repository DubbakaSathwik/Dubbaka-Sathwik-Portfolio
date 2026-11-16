import { Router, Request, Response } from 'express';
import { requireAuth, telemetryRateLimiter } from '../middleware/auth';
import {
  formatHumanVerificationMessage,
  formatVisitorTelemetryMessage,
  sendTelegramNotification,
} from '../services/telegram';
import { ActivityLogModel } from '../db/mongo';
import {
  deleteVisitor,
  issueHumanChallenge,
  listVisitors,
  markVisitorChallengeResult,
  recordVisitorVisit,
  updateVisitorHeartbeat,
  updateVisitorLabel,
  VALID_VISITOR_LABELS,
  verifyHumanChallenge,
} from '../services/visitorSecurity';
import type { VisitorLabel } from '../../src/types';

const router = Router();

function extractClientIp(req: Request): string {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  const cfIp = (req.headers['cf-connecting-ip'] as string) || '';
  const raw = cfIp || xff.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  return String(raw).replace(/^::ffff:/, '').slice(0, 64);
}

function extractCountry(req: Request): string {
  return String(
    req.headers['cf-ipcountry'] ||
      req.headers['x-country'] ||
      req.headers['x-vercel-ip-country'] ||
      'Unknown'
  ).slice(0, 64);
}

function parseFlexibleBody(req: Request): Record<string, any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

// POST /api/telemetry/visit - Classify visitor, assign/update visitorId, send enriched Telegram alert
router.post('/visit', telemetryRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = parseFlexibleBody(req);
    const clientIp = extractClientIp(req);
    const country = extractCountry(req);
    const headerUa = String(req.headers['user-agent'] || '');

    const { visitor, isNewVisitor, challengeRequired } = await recordVisitorVisit({
      visitorId: body.visitorId,
      visitorSecret: body.visitorSecret,
      deviceType: body.deviceType || 'Desktop',
      browser: body.browser || 'Unknown Browser',
      os: body.os || 'Unknown OS',
      screenRes: body.screenRes || 'Unknown',
      language: body.language || 'en-US',
      timezone: body.timezone || 'Asia/Kolkata',
      clientIp,
      country,
      pageUrl: body.pageUrl || '/',
      referrer: body.referrer || 'Direct Visit',
      userAgent: body.userAgent || headerUa,
      webdriver: Boolean(body.webdriver),
      viewportWidth: typeof body.viewportWidth === 'number' ? body.viewportWidth : undefined,
      viewportHeight: typeof body.viewportHeight === 'number' ? body.viewportHeight : undefined,
      pluginsCount: typeof body.pluginsCount === 'number' ? body.pluginsCount : undefined,
      languagesCount: typeof body.languagesCount === 'number' ? body.languagesCount : undefined,
      hardwareConcurrency:
        typeof body.hardwareConcurrency === 'number' ? body.hardwareConcurrency : undefined,
      forceChallenge: Boolean(body.forceChallenge),
    });

    // 1. Dispatch enriched Telegram visitor & security notification
    const telegramHtml = formatVisitorTelemetryMessage({
      visitorId: visitor.visitorId,
      visitCount: visitor.visitCount,
      isNewVisitor,
      classification: visitor.classification,
      safetyStatus: visitor.safetyStatus,
      riskScore: visitor.riskScore,
      securitySignals: visitor.securitySignals,
      challengeStatus: visitor.challengeStatus,
      label: visitor.label,
      watchTimeSeconds: visitor.watchTimeSeconds,
      deviceType: visitor.deviceType,
      browser: visitor.browser,
      os: visitor.os,
      screenRes: visitor.screenRes,
      language: visitor.language,
      timezone: visitor.timezone,
      pageUrl: visitor.pageUrl,
      referrer: visitor.referrer,
      clientIp: visitor.clientIp,
      country: visitor.country,
      userAgent: visitor.userAgent,
    });

    sendTelegramNotification(telegramHtml, 'websiteVisit', {
      event: `${visitor.classification} Visit (${visitor.visitorId})`,
      details: `${visitor.safetyStatus} | Risk ${visitor.riskScore}/100 | ${visitor.deviceType} ${visitor.browser} (${visitor.os}) on ${visitor.pageUrl}`,
      level: visitor.classification === 'Suspicious' || visitor.classification === 'System' ? 'warning' : 'info',
      category: 'visit',
      clientIp,
    }).catch(() => {});

    // 2. If Human Verification challenge triggered, also send dedicated security alert
    if (challengeRequired) {
      const challengeHtml = formatHumanVerificationMessage({
        visitorId: visitor.visitorId,
        outcome: 'triggered',
        classification: visitor.classification,
        riskScore: visitor.riskScore,
        clientIp,
        reason: visitor.securitySignals.join(', '),
        pageUrl: visitor.pageUrl,
      });
      sendTelegramNotification(challengeHtml, 'consoleAlerts', {
        event: 'Human Verification Challenged',
        details: `Visitor ${visitor.visitorId} challenged (${visitor.securitySignals.join(', ')})`,
        level: 'warning',
        category: 'security',
        clientIp,
      }).catch(() => {});
    }

    // 3. Persist Activity Log
    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: `${visitor.classification} Visit • ${visitor.visitorId}`,
        details: `${visitor.safetyStatus} (Risk ${visitor.riskScore}/100) | ${visitor.deviceType} | ${visitor.browser} on ${visitor.os} | IP: ${clientIp}`,
        category: challengeRequired ? 'security' : 'visit',
        level: challengeRequired ? 'warning' : 'info',
        clientIp,
        metadata: {
          visitorId: visitor.visitorId,
          classification: visitor.classification,
          riskScore: visitor.riskScore,
          pageUrl: visitor.pageUrl,
          referrer: visitor.referrer,
        },
      });
    } catch {}

    res.json({
      success: true,
      visitorId: visitor.visitorId,
      visitCount: visitor.visitCount,
      classification: visitor.classification,
      safetyStatus: visitor.safetyStatus,
      riskScore: visitor.riskScore,
      challengeRequired,
      visitor,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'LOG_ERROR', message: err?.message } });
  }
});

// POST /api/telemetry/heartbeat - Update active watch time (capped safely per interval)
router.post('/heartbeat', telemetryRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = parseFlexibleBody(req);
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId : '';
    const visitorSecret = typeof body.visitorSecret === 'string' ? body.visitorSecret : undefined;
    const deltaSeconds = Number(body.deltaSeconds || 0);
    const pagePath = typeof body.pagePath === 'string' ? body.pagePath : undefined;

    if (!visitorId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_VISITOR_ID', message: 'visitorId is required' },
      });
      return;
    }

    const result = await updateVisitorHeartbeat({
      visitorId,
      visitorSecret,
      deltaSeconds,
      pagePath,
    });

    res.json({
      success: result.ok,
      watchTimeSeconds: result.watchTimeSeconds,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'HEARTBEAT_ERROR', message: err?.message } });
  }
});

// GET /api/telemetry/challenge - Issue cryptographic SVG CAPTCHA challenge (never leaks answer)
router.get('/challenge', telemetryRateLimiter, (req: Request, res: Response): void => {
  const visitorId = typeof req.query.visitorId === 'string' ? req.query.visitorId : undefined;
  const issued = issueHumanChallenge(visitorId);
  res.json({
    success: true,
    challengeToken: issued.challengeToken,
    captchaSvgDataUrl: issued.captchaSvgDataUrl,
    expiresInSeconds: issued.expiresInSeconds,
  });
});

// POST /api/telemetry/verify-human - Verify "I am not a bot" + distorted SVG CAPTCHA
router.post('/verify-human', telemetryRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = parseFlexibleBody(req);
    const clientIp = extractClientIp(req);
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId : 'VIS-UNKNOWN';

    const check = verifyHumanChallenge({
      challengeToken: body.challengeToken,
      answer: body.answer,
      visitorId,
      checkboxConfirmed: Boolean(body.checkboxConfirmed),
      interactionCount: typeof body.interactionCount === 'number' ? body.interactionCount : undefined,
    });

    if (!check.valid) {
      await markVisitorChallengeResult({ visitorId, passed: false });
      const failHtml = formatHumanVerificationMessage({
        visitorId,
        outcome: 'failed',
        classification: 'Suspicious',
        riskScore: 75,
        clientIp,
        reason: check.reason || check.code,
      });
      sendTelegramNotification(failHtml, 'consoleAlerts', {
        event: 'Human CAPTCHA Verification Failed',
        details: `Visitor ${visitorId} failed human verification (${check.code})`,
        level: 'warning',
        category: 'security',
        clientIp,
      }).catch(() => {});

      res.status(400).json({
        success: false,
        verified: false,
        code: check.code,
        message: check.reason || 'Verification failed.',
      });
      return;
    }

    const updated = await markVisitorChallengeResult({ visitorId, passed: true });
    const passHtml = formatHumanVerificationMessage({
      visitorId,
      outcome: 'passed',
      classification: updated?.classification || 'Human',
      riskScore: updated?.riskScore ?? 10,
      clientIp,
      reason: 'Visitor confirmed "I am not a bot" checkbox and solved distorted CAPTCHA.',
    });
    sendTelegramNotification(passHtml, 'consoleAlerts', {
      event: 'Human CAPTCHA Verification Passed',
      details: `Visitor ${visitorId} verified as human`,
      level: 'success',
      category: 'security',
      clientIp,
    }).catch(() => {});

    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: `Human Verification Passed • ${visitorId}`,
        details: `Visitor ${visitorId} completed "I am not a bot" + SVG CAPTCHA check.`,
        category: 'security',
        level: 'success',
        clientIp,
      });
    } catch {}

    res.json({
      success: true,
      verified: true,
      visitor: updated,
      message: 'Human verification passed. Welcome to the portfolio.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'VERIFY_ERROR', message: err?.message } });
  }
});

// GET /api/telemetry/visitors - Admin only list of unique visitors & stats
router.get('/visitors', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const label = typeof req.query.label === 'string' ? req.query.label : undefined;
    const classification =
      typeof req.query.classification === 'string' ? req.query.classification : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await listVisitors({ label, classification, search });
    res.json({
      success: true,
      visitors: result.visitors,
      stats: result.stats,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'LIST_ERROR', message: err?.message } });
  }
});

// PATCH /api/telemetry/visitors/:visitorId/label - Admin only label/notes update
router.patch('/visitors/:visitorId/label', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { visitorId } = req.params;
    const body = parseFlexibleBody(req);
    const label = body.label as VisitorLabel;
    const adminNotes = typeof body.adminNotes === 'string' ? body.adminNotes : undefined;

    if (!VALID_VISITOR_LABELS.includes(label)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LABEL',
          message: `Label must be one of: ${VALID_VISITOR_LABELS.join(', ')}`,
        },
      });
      return;
    }

    const updated = await updateVisitorLabel(visitorId, { label, adminNotes });
    if (!updated.success) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: updated.error || 'Visitor not found' },
      });
      return;
    }

    res.json({
      success: true,
      visitor: updated.visitor,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: err?.message } });
  }
});

// DELETE /api/telemetry/visitors/:visitorId - Admin only visitor deletion
router.delete('/visitors/:visitorId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await deleteVisitor(req.params.visitorId);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'DELETE_ERROR', message: err?.message } });
  }
});

export default router;
