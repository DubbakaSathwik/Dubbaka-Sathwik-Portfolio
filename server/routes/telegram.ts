import { Router, Request, Response } from 'express';
import {
  getTelegramSettings,
  updateTelegramSettings,
  sendTelegramNotification,
  formatConsoleLogMessage,
  flushConsoleLogBuffer,
  getConsoleTimerStatus,
  sendTelegramMessageDirect,
} from '../services/telegram';
import { requireAuth, telemetryRateLimiter } from '../middleware/auth';
import { ActivityLogModel } from '../db/mongo';

const router = Router();

// GET /api/telegram/settings
router.get('/settings', (req: Request, res: Response) => {
  res.json({
    success: true,
    settings: getTelegramSettings(),
  });
});

// POST /api/telegram/settings - Protected Admin Endpoint
router.post('/settings', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body || {};
    const updated = await updateTelegramSettings(updates);

    // Record log
    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: 'Telegram Bot Settings Updated',
        details: `Updated toggles: masterEnabled=${updated.masterEnabled}, timer=${updated.consoleTimerEnabled} (${updated.consoleTimerIntervalMinutes}m)`,
        category: 'system',
        level: 'info',
      });
    } catch (e) {}

    res.json({
      success: true,
      settings: updated,
      message: 'Telegram settings saved successfully',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SETTINGS_ERROR', message: err?.message || 'Failed to update settings' },
    });
  }
});

// GET /api/telegram/timer/status
router.get('/timer/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: getConsoleTimerStatus(),
  });
});

// POST /api/telegram/timer/flush - Protected Admin Endpoint
router.post('/timer/flush', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await flushConsoleLogBuffer();
    res.json({
      success: result.success,
      count: result.count,
      message:
        result.count > 0
          ? `Flushed ${result.count} grouped log(s) to Telegram`
          : 'Console buffer was empty, nothing to flush',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FLUSH_ERROR', message: err?.message || 'Failed to flush timer logs' },
    });
  }
});

// POST /api/telegram/console - Send client console log
router.post('/console', telemetryRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, details, level = 'info', category = 'system' } = req.body || {};
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!event) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_EVENT', message: 'Event description required' },
      });
      return;
    }

    const html = formatConsoleLogMessage(event, details || '', level, clientIp);
    const result = await sendTelegramNotification(html, 'consoleAlerts', {
      event,
      details,
      level,
      category,
      clientIp,
    });

    // Record to Activity Log
    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: String(event).substring(0, 100),
        details: String(details || '').substring(0, 1000),
        category: category || 'system',
        level: level || 'info',
        clientIp,
      });
    } catch (e) {}

    res.json({
      success: result.success,
      buffered: result.buffered,
      message: result.buffered
        ? 'Console log added to grouped timer buffer'
        : 'Console log dispatched to Telegram',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'TELEGRAM_ERROR', message: err?.message || 'Failed to dispatch log' },
    });
  }
});

// POST /api/telegram/test - Send test ping
router.post('/test', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const html = `<b>🟢 TELEGRAM BOT TEST PING</b>
━━━━━━━━━━━━━━━━━━━━
<b>Status:</b> Online & Operational
<b>Database:</b> MongoDB Atlas
<b>Time (IST):</b> ${timeStr}
━━━━━━━━━━━━━━━━━━━━
🟢 <i>Sathwik Portfolio Notification Engine</i>`;

    const sent = await sendTelegramMessageDirect(html);
    res.json({
      success: sent,
      message: sent
        ? 'Test ping sent to Sathwik Telegram channel!'
        : 'Failed to send test message. Check bot credentials in environment.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'TEST_FAILED', message: err?.message || 'Test failed' },
    });
  }
});

export default router;
