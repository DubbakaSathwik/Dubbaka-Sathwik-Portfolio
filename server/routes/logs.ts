import { Router, Request, Response } from 'express';
import { ActivityLogModel } from '../db/mongo';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/logs - Fetch recent activity logs
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);
    const category = req.query.category as string;

    const filter: Record<string, any> = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    const logs = await ActivityLogModel.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
      .exec();

    // Map to frontend expected shape
    const formattedLogs = logs.map((l) => ({
      id: l.logId,
      timestamp: new Date(l.timestamp).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      event: l.event,
      details: l.details,
      level: l.level,
      category: l.category,
      clientIp: l.clientIp,
    }));

    res.json({
      success: true,
      logs: formattedLogs,
      totalCount: formattedLogs.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_LOGS_FAILED', message: err?.message || 'Failed to fetch logs' },
    });
  }
});

// POST /api/logs - Log an event
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, details, level = 'info', category = 'system' } = req.body || {};
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!event) {
      res.status(400).json({ success: false, error: { code: 'MISSING_EVENT', message: 'Event required' } });
      return;
    }

    const newLog = await ActivityLogModel.create({
      logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      event,
      details: details || '',
      category,
      level,
      clientIp,
      timestamp: new Date(),
    });

    res.json({ success: true, log: newLog });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'LOG_ERROR', message: err?.message } });
  }
});

// DELETE /api/logs - Clear logs (Protected Admin)
router.delete('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await ActivityLogModel.deleteMany({}).exec();
    res.json({
      success: true,
      message: 'Activity logs successfully cleared',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CLEAR_FAILED', message: err?.message || 'Failed to clear logs' },
    });
  }
});

export default router;
