import { Router, Request, Response } from 'express';
import { CMSModel, isDatabaseConnected, ActivityLogModel } from '../db/mongo';
import { requireAuth } from '../middleware/auth';
import {
  computeCMSDiff,
  sendTelegramNotification,
  formatConsoleLogMessage,
} from '../services/telegram';
import { runStorageMigration } from '../services/migration';
import fs from 'fs';
import path from 'path';

const router = Router();
const BACKUP_FILE_PATH = path.join(process.cwd(), 'cms_backup.json');

// Helper to validate CMS payload structure
function validateCMSPayload(payload: any): { valid: boolean; reason?: string } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, reason: 'Payload must be a non-empty object' };
  }
  if (!payload.hero || typeof payload.hero !== 'object') {
    return { valid: false, reason: 'Missing or invalid hero section' };
  }
  if (!payload.about || typeof payload.about !== 'object') {
    return { valid: false, reason: 'Missing or invalid about section' };
  }
  if (!Array.isArray(payload.projects)) {
    return { valid: false, reason: 'Projects must be an array' };
  }
  return { valid: true };
}

// GET /api/cms - Public API to retrieve authoritative CMS data from MongoDB
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const isConnected = isDatabaseConnected();
    if (!isConnected) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'MongoDB database is currently offline or unreachable. Please try again in a moment.',
        },
      });
      return;
    }

    let cmsDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();

    // If no document exists in MongoDB yet, run initial migration automatically
    if (!cmsDoc || !cmsDoc.data) {
      console.log('[CMS Route] Empty MongoDB detected. Running initial migration...');
      await runStorageMigration(false);
      cmsDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
    }

    if (!cmsDoc) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No CMS data found in MongoDB',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: cmsDoc.data,
      version: cmsDoc.version,
      schemaVersion: cmsDoc.schemaVersion,
      updatedAt: cmsDoc.updatedAt,
      database: 'MongoDB Atlas',
    });
  } catch (error: any) {
    console.error('[CMS Route Error] GET /api/cms:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error?.message || 'Failed to fetch CMS content from MongoDB Atlas',
      },
    });
  }
});

// POST /api/cms - Protected Admin API to save CMS data to MongoDB
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const validation = validateCMSPayload(payload);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: validation.reason || 'Invalid CMS data payload structure',
        },
      });
      return;
    }

    const isConnected = isDatabaseConnected();
    if (!isConnected) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Cannot save: MongoDB Atlas is currently unreachable. No changes were applied.',
        },
      });
      return;
    }

    // 1. Fetch current MongoDB doc to compute diffs & optimistic locking
    const currentDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
    const oldData = currentDoc ? currentDoc.data : {};
    const detailedDiffs = computeCMSDiff(oldData, payload);
    const nextVersion = (currentDoc?.version || 0) + 1;

    // 2. Persist authoritative update to MongoDB Atlas
    const updatedDoc = await CMSModel.findOneAndUpdate(
      { key: 'portfolio_cms_v1' },
      {
        schemaVersion: 1,
        version: nextVersion,
        data: payload,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    ).exec();

    // 3. Optional local disk backup export (treated strictly as backup, not primary DB)
    try {
      fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {}

    // 4. Record Activity Log
    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: 'Portfolio CMS Content Saved',
        details: `Admin updated portfolio content (v${nextVersion}). Diffs:\n${detailedDiffs
          .map((d) => '• ' + d.replace(/<[^>]*>/g, ''))
          .join('\n')}`,
        category: 'cms_update',
        level: 'info',
      });
    } catch (e) {}

    // 5. Send Telegram Notification
    const diffBullets = detailedDiffs.map((d) => `• ${d}`).join('\n');
    const cmsHtml = `<b>🟢 PORTFOLIO CMS DATA STORED & SYNCED</b>
━━━━━━━━━━━━━━━━━━━━
<b>👤 Editor:</b> Portfolio Admin
<b>📁 Projects Count:</b> ${payload.projects?.length || 0}
<b>🎓 Certificates:</b> ${payload.gallery?.length || 0}
<b>🗺️ Journey Steps:</b> ${payload.journey?.length || 0}
<b>🔢 DB Version:</b> v${nextVersion}

<b>📝 DETAILED CHANGES DETECTED:</b>
${diffBullets}

<b>🕒 Time (IST):</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
━━━━━━━━━━━━━━━━━━━━
🟢 <i>Sathwik Portfolio CMS Sync Engine</i>`;

    sendTelegramNotification(cmsHtml, 'cmsUpdates', {
      event: 'Portfolio CMS Content Saved',
      details: detailedDiffs.map((d) => d.replace(/<[^>]*>/g, '')).join('\n'),
      level: 'success',
      category: 'cms_update',
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Portfolio CMS data successfully saved to MongoDB Atlas',
      version: updatedDoc.version,
      updatedAt: updatedDoc.updatedAt,
      database: 'MongoDB Atlas',
    });
  } catch (error: any) {
    console.error('[CMS Route Error] POST /api/cms:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SAVE_ERROR',
        message: error?.message || 'Failed to save CMS data to MongoDB Atlas',
      },
    });
  }
});

// GET /api/cms/backup/download - Download backup JSON
router.get('/backup/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
    const data = doc ? doc.data : {};
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sathwik_portfolio_backup_${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_FAILED', message: err?.message || 'Backup export failed' },
    });
  }
});

// POST /api/cms/restore - Protected Admin Restore Endpoint
router.post('/restore', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const validation = validateCMSPayload(payload);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_BACKUP', message: validation.reason || 'Invalid backup payload' },
      });
      return;
    }

    if (!isDatabaseConnected()) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'MongoDB is offline. Cannot restore database at this time.',
        },
      });
      return;
    }

    const currentDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
    const nextVersion = (currentDoc?.version || 0) + 1;

    const updatedDoc = await CMSModel.findOneAndUpdate(
      { key: 'portfolio_cms_v1' },
      {
        schemaVersion: 1,
        version: nextVersion,
        data: payload,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    ).exec();

    // Update backup disk file
    try {
      fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {}

    // Record activity log
    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: 'Full Portfolio Database Restored',
        details: `Restored CMS backup containing ${payload.projects?.length || 0} projects, ${
          payload.gallery?.length || 0
        } certificates, and ${payload.journey?.length || 0} journey milestones. Version: v${nextVersion}`,
        category: 'cms_update',
        level: 'success',
      });
    } catch (e) {}

    res.json({
      success: true,
      message: 'Database restored successfully to MongoDB Atlas',
      version: updatedDoc.version,
      database: 'MongoDB Atlas',
      data: payload,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'RESTORE_ERROR', message: err?.message || 'Restore failed' },
    });
  }
});

// GET /api/cms/backups/list - Backup stats
router.get('/backups/list', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
    const localBackupExists = fs.existsSync(BACKUP_FILE_PATH);
    let localStats = null;
    if (localBackupExists) {
      const stat = fs.statSync(BACKUP_FILE_PATH);
      localStats = {
        filename: 'cms_backup.json',
        sizeBytes: stat.size,
        sizeFormatted: (stat.size / 1024).toFixed(2) + ' KB',
        lastModified: stat.mtime.toISOString(),
      };
    }

    res.json({
      success: true,
      localDiskBackup: localStats,
      mongoDbAtlasStatus: isDatabaseConnected() ? 'Connected' : 'Offline',
      databaseVersion: doc?.version || 1,
      recordCounts: {
        projects: doc?.data?.projects?.length || 0,
        journey: doc?.data?.journey?.length || 0,
        certificates: doc?.data?.gallery?.length || 0,
        creative: doc?.data?.creativePortfolio?.length || 0,
        resumes: doc?.data?.resumes?.length || 0,
        messages: doc?.data?.messages?.length || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'STATS_ERROR', message: err?.message || 'Failed to list backups' },
    });
  }
});

export default router;
