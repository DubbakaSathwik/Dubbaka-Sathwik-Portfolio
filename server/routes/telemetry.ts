import { Router, Request, Response } from 'express';
import { telemetryRateLimiter } from '../middleware/auth';
import {
  formatVisitorTelemetryMessage,
  sendTelegramNotification,
} from '../services/telegram';
import { ActivityLogModel } from '../db/mongo';

const router = Router();

// POST /api/telemetry/visit - Record silent visitor telemetry
router.post('/visit', telemetryRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      deviceType = 'Desktop',
      browser = 'Unknown Browser',
      os = 'Unknown OS',
      screenRes = 'Unknown',
      language = 'en-US',
      timezone = 'Asia/Kolkata',
      pageUrl = '/',
      referrer = 'Direct Visit',
    } = req.body || {};

    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    // 1. Dispatch Telegram visitor notification
    const telegramHtml = formatVisitorTelemetryMessage({
      deviceType,
      browser,
      os,
      screenRes,
      language,
      timezone,
      pageUrl,
      referrer,
      clientIp,
    });

    sendTelegramNotification(telegramHtml, 'websiteVisit', {
      event: 'Website Visit',
      details: `${deviceType} visitor via ${browser} (${os}) on ${pageUrl}`,
      level: 'info',
      category: 'visit',
      clientIp,
    }).catch(() => {});

    // 2. Persist Activity Log
    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: 'Website Visit / Reload',
        details: `${deviceType} | ${browser} on ${os} | ${screenRes} | IP: ${clientIp}`,
        category: 'visit',
        level: 'info',
        clientIp,
        metadata: { pageUrl, referrer, timezone },
      });
    } catch (e) {}

    res.json({ success: true, message: 'Telemetry logged' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'LOG_ERROR', message: err?.message } });
  }
});

export default router;
