import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ActivityLogModel, isDatabaseConnected } from '../db/mongo';
import { requireAuth } from '../middleware/auth';

const router = Router();
const LOGS_FILE_PATH = path.join(process.cwd(), 'activity_logs.json');

function loadDiskLogs(): any[] {
  try {
    if (fs.existsSync(LOGS_FILE_PATH)) {
      const raw = fs.readFileSync(LOGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('[Logs Route] Failed to read activity_logs.json:', e);
  }
  return [];
}

function saveDiskLogs(logs: any[]) {
  try {
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(logs.slice(0, 500), null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Logs Route] Failed to write activity_logs.json:', e);
  }
}

// GET /api/logs - Fetch recent activity logs
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);
    const category = req.query.category as string;

    const filter: Record<string, any> = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    let logs: any[] = [];
    if (isDatabaseConnected()) {
      try {
        logs = await ActivityLogModel.find(filter)
          .sort({ timestamp: -1 })
          .limit(limit)
          .lean()
          .exec();
      } catch (dbErr) {
        console.warn('[Logs Route] MongoDB query failed, falling back to disk logs:', dbErr);
      }
    }

    if (logs.length === 0) {
      const diskLogs = loadDiskLogs();
      logs = diskLogs
        .filter((l) => !category || category === 'all' || l.category === category)
        .slice(0, limit);
    }

    // Map to frontend expected shape
    const formattedLogs = logs.map((l) => ({
      id: l.logId || l.id || 'log_' + Math.random().toString(36).substring(2, 8),
      timestamp: new Date(l.timestamp || Date.now()).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      event: l.event || 'System Event',
      details: l.details || '',
      level: l.level || 'info',
      category: l.category || 'system',
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

    const logEntry = {
      logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      event,
      details: details || '',
      category,
      level,
      clientIp,
      timestamp: new Date(),
    };

    // Save to disk backup
    const diskLogs = loadDiskLogs();
    diskLogs.unshift(logEntry);
    saveDiskLogs(diskLogs);

    // Save to MongoDB if connected
    if (isDatabaseConnected()) {
      try {
        await ActivityLogModel.create(logEntry);
      } catch (e) {}
    }

    res.json({ success: true, log: logEntry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'LOG_ERROR', message: err?.message } });
  }
});

// DELETE /api/logs - Clear logs (Protected Admin)
router.delete('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    saveDiskLogs([]);
    if (isDatabaseConnected()) {
      try {
        await ActivityLogModel.deleteMany({}).exec();
      } catch (e) {}
    }
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
