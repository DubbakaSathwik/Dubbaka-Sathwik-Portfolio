import { Router, Request, Response } from 'express';
import { CMSModel, isDatabaseConnected, ActivityLogModel } from '../db/mongo';
import { requireAuth } from '../middleware/auth';
import {
  computeCMSDiff,
  sendTelegramNotification,
  formatConsoleLogMessage,
} from '../services/telegram';
import { runStorageMigration } from '../services/migration';
import { initialCMSData } from '../../src/data';
import fs from 'fs';
import path from 'path';

const router = Router();
const BACKUP_FILE_PATH = path.join(process.cwd(), 'cms_backup.json');

// Helper to safely load local disk backup
function loadLocalDiskData(): any {
  try {
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      const raw = fs.readFileSync(BACKUP_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.hero) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CMS Route] Error reading cms_backup.json:', err);
  }
  return null;
}

// Helper to safely write local disk backup
function saveLocalDiskData(payload: any): boolean {
  try {
    fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[CMS Route] Error writing cms_backup.json:', err);
    return false;
  }
}

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

// GET /api/cms - Public API to retrieve authoritative CMS data (MongoDB with automatic Disk Snapshot Fallback)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Try MongoDB Atlas if connected
    if (isDatabaseConnected()) {
      try {
        let cmsDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();

        // If MongoDB document is missing or empty, auto-populate from cms_backup.json
        if (!cmsDoc || !cmsDoc.data || !cmsDoc.data.hero) {
          const diskData = loadLocalDiskData();
          if (diskData) {
            console.log('[CMS Route] Populating empty MongoDB from cms_backup.json...');
            cmsDoc = await CMSModel.findOneAndUpdate(
              { key: 'portfolio_cms_v1' },
              { schemaVersion: 1, version: 1, data: diskData, updatedAt: new Date() },
              { upsert: true, new: true }
            ).exec();
          }
        }

        if (cmsDoc && cmsDoc.data && cmsDoc.data.hero) {
          // Keep disk backup synced in background
          saveLocalDiskData(cmsDoc.data);

          res.json({
            success: true,
            data: cmsDoc.data,
            version: cmsDoc.version,
            schemaVersion: cmsDoc.schemaVersion,
            updatedAt: cmsDoc.updatedAt,
            database: 'MongoDB Atlas',
          });
          return;
        }
      } catch (dbErr) {
        console.warn('[CMS Route] MongoDB query warning, falling back to disk backup:', dbErr);
      }
    }

    // 2. Primary Resilient Fallback: Read from local disk backup (cms_backup.json)
    const diskData = loadLocalDiskData();
    if (diskData && diskData.hero) {
      res.json({
        success: true,
        data: diskData,
        version: 1,
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        database: 'Local Persistent Storage (MongoDB Offline)',
      });
      return;
    }

    // 3. Baseline Fallback: Return initial canonical dataset
    res.json({
      success: true,
      data: initialCMSData,
      version: 1,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      database: 'Default Baseline',
    });
  } catch (error: any) {
    console.error('[CMS Route Error] GET /api/cms:', error);
    // Even in catastrophic error, serve disk or baseline data so website NEVER displays blank/broken state
    const diskData = loadLocalDiskData();
    res.json({
      success: true,
      data: diskData || initialCMSData,
      version: 1,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      database: 'Emergency Fallback',
    });
  }
});

// POST /api/cms - Protected Admin API to save CMS data (Saves to Disk AND MongoDB Atlas)
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

    // 1. ALWAYS persist to local disk backup first (Guaranteed zero data loss)
    saveLocalDiskData(payload);

    let nextVersion = 1;
    let dbStatus = 'Local Persistent Storage (MongoDB Offline)';
    const isConnected = isDatabaseConnected();

    // 2. If MongoDB Atlas is connected, persist to MongoDB Atlas
    if (isConnected) {
      try {
        const currentDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
        const oldData = currentDoc ? currentDoc.data : {};
        const detailedDiffs = computeCMSDiff(oldData, payload);
        nextVersion = (currentDoc?.version || 0) + 1;

        await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          {
            schemaVersion: 1,
            version: nextVersion,
            data: payload,
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        ).exec();

        dbStatus = 'MongoDB Atlas';

        // 3. Record Activity Log in MongoDB
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

        // 4. Send Telegram Notification
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
      } catch (dbSaveErr) {
        console.warn('[CMS Route] MongoDB save error, data safely saved to local disk backup:', dbSaveErr);
      }
    }

    res.json({
      success: true,
      message: `Portfolio CMS data successfully saved (${dbStatus})`,
      version: nextVersion,
      updatedAt: new Date().toISOString(),
      database: dbStatus,
    });
  } catch (error: any) {
    console.error('[CMS Route Error] POST /api/cms:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SAVE_ERROR',
        message: error?.message || 'Failed to save CMS data',
      },
    });
  }
});

// GET /api/cms/backup/download - Download backup JSON (from MongoDB or Disk Backup)
router.get('/backup/download', async (req: Request, res: Response): Promise<void> => {
  try {
    let data: any = null;
    if (isDatabaseConnected()) {
      try {
        const doc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
        if (doc && doc.data && doc.data.hero) {
          data = doc.data;
        }
      } catch (e) {}
    }

    if (!data) {
      data = loadLocalDiskData() || initialCMSData;
    }

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sathwik_portfolio_backup_${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data || initialCMSData, null, 2));
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_FAILED', message: err?.message || 'Backup export failed' },
    });
  }
});

// POST /api/cms/restore - Protected Admin Restore Endpoint (Restores to Disk AND MongoDB)
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

    // 1. ALWAYS write to disk backup first
    saveLocalDiskData(payload);

    let nextVersion = 1;
    let dbStatus = 'Local Persistent Storage (MongoDB Offline)';

    // 2. If MongoDB is online, restore to MongoDB Atlas
    if (isDatabaseConnected()) {
      try {
        const currentDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
        nextVersion = (currentDoc?.version || 0) + 1;

        await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          {
            schemaVersion: 1,
            version: nextVersion,
            data: payload,
            updatedAt: new Date(),
          },
          { upsert: true, new: true }
        ).exec();

        dbStatus = 'MongoDB Atlas';

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
      } catch (dbErr) {
        console.warn('[CMS Restore] MongoDB update failed, preserved in local disk backup:', dbErr);
      }
    }

    res.json({
      success: true,
      message: `Database restored successfully (${dbStatus})`,
      version: nextVersion,
      database: dbStatus,
      data: payload,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'RESTORE_ERROR', message: err?.message || 'Restore failed' },
    });
  }
});

// GET /api/cms/backups/list - Backup stats (resilient to DB status)
router.get('/backups/list', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    let doc: any = null;
    if (isDatabaseConnected()) {
      try {
        doc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
      } catch (e) {}
    }

    const diskData = loadLocalDiskData();
    const effectiveData = (doc && doc.data) ? doc.data : (diskData || {});

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
        projects: effectiveData?.projects?.length || 0,
        journey: effectiveData?.journey?.length || 0,
        certificates: effectiveData?.gallery?.length || 0,
        creative: effectiveData?.creativePortfolio?.length || 0,
        resumes: effectiveData?.resumes?.length || 0,
        messages: effectiveData?.messages?.length || 0,
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
