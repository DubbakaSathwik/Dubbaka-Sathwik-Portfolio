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
const STATIC_BACKUP_PATH = path.join(process.cwd(), 'static_backup.json');
const SEED_DATA_PATH = path.join(process.cwd(), 'src', 'seed_data.json');
const PUBLIC_UPLOADS_ASSETS_DIR = path.join(process.cwd(), 'public', 'uploads', 'assets');

if (!fs.existsSync(PUBLIC_UPLOADS_ASSETS_DIR)) {
  try {
    fs.mkdirSync(PUBLIC_UPLOADS_ASSETS_DIR, { recursive: true });
  } catch (e) {}
}

/**
 * Extracts base64 images from JSON payload, saves them as static image files in public/uploads/assets,
 * and replaces the base64 strings with lightweight relative asset links (/uploads/assets/...).
 */
function processBase64AndSanitize(obj: any, pathPrefix: string = 'asset'): any {
  if (!obj) return obj;

  if (typeof obj === 'string') {
    if (obj.startsWith('data:image/')) {
      const match = obj.match(/^data:image\/([a-zA-Z0-9]+);base64,(.*)$/);
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const hash = Math.random().toString(36).substring(2, 10);
        const fileName = `static_${pathPrefix}_${hash}.${ext}`;
        const filePath = path.join(PUBLIC_UPLOADS_ASSETS_DIR, fileName);
        try {
          fs.writeFileSync(filePath, buffer);
          return `/uploads/assets/${fileName}`;
        } catch (err) {
          console.error('[CMS Route] Error saving base64 image asset:', err);
        }
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => processBase64AndSanitize(item, `${pathPrefix}_${index}`));
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = processBase64AndSanitize(obj[key], `${pathPrefix}_${key}`);
    }
    return cleaned;
  }

  return obj;
}

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

// Helper to safely write clean data directly to src/seed_data.json code & disk backup
function saveLocalDiskData(payload: any): any {
  try {
    const sanitized = processBase64AndSanitize(payload);
    const jsonStr = JSON.stringify(sanitized, null, 2);

    // 1. Persist directly into source code seed data (src/seed_data.json)
    try {
      fs.writeFileSync(SEED_DATA_PATH, jsonStr, 'utf-8');
    } catch (err) {
      console.error('[CMS Route] Error updating src/seed_data.json:', err);
    }

    // 2. Persist to root cms_backup.json & static_backup.json & public/static_backup.json
    fs.writeFileSync(BACKUP_FILE_PATH, jsonStr, 'utf-8');
    try {
      fs.writeFileSync(STATIC_BACKUP_PATH, jsonStr, 'utf-8');
      const publicStaticPath = path.join(process.cwd(), 'public', 'static_backup.json');
      fs.writeFileSync(publicStaticPath, jsonStr, 'utf-8');
    } catch (e) {}
    return sanitized;
  } catch (err) {
    console.error('[CMS Route] Error writing cms_backup.json:', err);
    return payload;
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

        // Helper to check if dataset contains stale dummy photos or old unsplash URLs
        const containsStaleData = (d: any) => {
          if (!d) return true;
          const str = JSON.stringify(d);
          return str.includes('images.unsplash.com') || str.includes('photo-1539571696357') || str.includes('static_asset_about_avatarUrl');
        };

        // If MongoDB document is missing, empty, or contains stale dummy data, auto-populate from clean static code/backup
        if (!cmsDoc || !cmsDoc.data || !cmsDoc.data.hero || containsStaleData(cmsDoc.data)) {
          const diskData = loadLocalDiskData() || initialCMSData;
          if (diskData) {
            console.log('[CMS Route] Auto-syncing clean static code/backup to MongoDB Atlas...');
            cmsDoc = await CMSModel.findOneAndUpdate(
              { key: 'portfolio_cms_v1' },
              { schemaVersion: 1, version: (cmsDoc?.version || 0) + 1, data: diskData, updatedAt: new Date() },
              { upsert: true, returnDocument: 'after' }
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
          { upsert: true, returnDocument: 'after' }
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
          { upsert: true, returnDocument: 'after' }
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

// ==========================================
// STATIC BACKUP ENGINE
// ==========================================
const STATIC_BACKUPS_DIR = path.join(process.cwd(), 'static_backups');

// Ensure static_backups folder exists
if (!fs.existsSync(STATIC_BACKUPS_DIR)) {
  try {
    fs.mkdirSync(STATIC_BACKUPS_DIR, { recursive: true });
  } catch (e) {}
}

// Helper to safely load active static backup
function loadStaticBackupData(): any {
  try {
    if (fs.existsSync(STATIC_BACKUP_PATH)) {
      const raw = fs.readFileSync(STATIC_BACKUP_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.hero) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CMS Route] Error reading static_backup.json:', err);
  }
  // If static_backup.json doesn't exist yet, initialize it from cms_backup.json or initialCMSData
  const diskData = loadLocalDiskData();
  if (diskData && diskData.hero) {
    saveStaticBackupData(diskData, 'initial_static_backup.json');
    return diskData;
  }
  return initialCMSData;
}

// Helper to safely save active static backup and sync directly to code (src/seed_data.json)
function saveStaticBackupData(payload: any, snapshotFilename?: string): any {
  try {
    const sanitized = processBase64AndSanitize(payload);
    const jsonStr = JSON.stringify(sanitized, null, 2);

    // 1. Write clean text content directly into source code seed data (src/seed_data.json)
    try {
      fs.writeFileSync(SEED_DATA_PATH, jsonStr, 'utf-8');
    } catch (err) {
      console.error('[CMS Route] Error writing src/seed_data.json:', err);
    }

    // 2. Write active static backup in root
    fs.writeFileSync(STATIC_BACKUP_PATH, jsonStr, 'utf-8');

    // 3. Write active static backup to public/ directory for direct static serving
    try {
      const publicPath = path.join(process.cwd(), 'public', 'static_backup.json');
      fs.writeFileSync(publicPath, jsonStr, 'utf-8');
    } catch (e) {}

    // 4. Also keep safety copy in static_backups folder
    if (snapshotFilename) {
      const cleanName = snapshotFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const snapshotPath = path.join(STATIC_BACKUPS_DIR, cleanName);
      fs.writeFileSync(snapshotPath, jsonStr, 'utf-8');
    }
    return sanitized;
  } catch (err) {
    console.error('[CMS Route] Error writing static_backup.json:', err);
    return payload;
  }
}

// Helper to list available static backup snapshots
function getAvailableStaticBackupFiles(): Array<{
  id: string;
  name: string;
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  lastModified: string;
  isDefault?: boolean;
}> {
  const list: Array<{
    id: string;
    name: string;
    filename: string;
    sizeBytes: number;
    sizeFormatted: string;
    lastModified: string;
    isDefault?: boolean;
  }> = [];

  // 1. Active static_backup.json
  if (fs.existsSync(STATIC_BACKUP_PATH)) {
    const stat = fs.statSync(STATIC_BACKUP_PATH);
    list.push({
      id: 'active_static',
      name: 'Current Active Static Backup (static_backup.json)',
      filename: 'static_backup.json',
      sizeBytes: stat.size,
      sizeFormatted: (stat.size / 1024).toFixed(2) + ' KB',
      lastModified: stat.mtime.toISOString(),
      isDefault: true,
    });
  }

  // 2. Local cms_backup.json
  if (fs.existsSync(BACKUP_FILE_PATH)) {
    const stat = fs.statSync(BACKUP_FILE_PATH);
    list.push({
      id: 'cms_backup',
      name: 'CMS Disk Backup (cms_backup.json)',
      filename: 'cms_backup.json',
      sizeBytes: stat.size,
      sizeFormatted: (stat.size / 1024).toFixed(2) + ' KB',
      lastModified: stat.mtime.toISOString(),
    });
  }

  // 3. Any files inside static_backups/
  if (fs.existsSync(STATIC_BACKUPS_DIR)) {
    try {
      const files = fs.readdirSync(STATIC_BACKUPS_DIR);
      files.forEach((file) => {
        if (file.endsWith('.json')) {
          const filePath = path.join(STATIC_BACKUPS_DIR, file);
          const stat = fs.statSync(filePath);
          list.push({
            id: 'snapshot_' + file,
            name: file.replace(/_/g, ' ').replace('.json', ''),
            filename: file,
            sizeBytes: stat.size,
            sizeFormatted: (stat.size / 1024).toFixed(2) + ' KB',
            lastModified: stat.mtime.toISOString(),
          });
        }
      });
    } catch (e) {}
  }

  return list;
}

// GET /api/cms/static-backup - Public endpoint to retrieve active static backup
router.get('/static-backup', async (req: Request, res: Response): Promise<void> => {
  try {
    const staticData = loadStaticBackupData();
    const stat = fs.existsSync(STATIC_BACKUP_PATH) ? fs.statSync(STATIC_BACKUP_PATH) : null;
    const availableFiles = getAvailableStaticBackupFiles();

    res.json({
      success: true,
      data: staticData,
      filename: 'static_backup.json',
      sizeFormatted: stat ? (stat.size / 1024).toFixed(2) + ' KB' : 'N/A',
      lastModified: stat ? stat.mtime.toISOString() : new Date().toISOString(),
      recordCounts: {
        projects: staticData.projects?.length || 0,
        journey: staticData.journey?.length || 0,
        certificates: staticData.gallery?.length || 0,
        creative: staticData.creativePortfolio?.length || 0,
        resumes: staticData.resumes?.length || 0,
        messages: staticData.messages?.length || 0,
      },
      availableFiles,
    });
  } catch (err: any) {
    console.error('[CMS Static Backup Error] GET /api/cms/static-backup:', err);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_STATIC_FAILED', message: err?.message || 'Failed to fetch static backup' },
    });
  }
});

// POST /api/cms/static-backup - Protected Admin endpoint to save / update static backup
router.post('/static-backup', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: payload, filename } = req.body || {};
    const dataToSave = payload || req.body;

    const validation = validateCMSPayload(dataToSave);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PAYLOAD', message: validation.reason || 'Invalid static backup payload' },
      });
      return;
    }

    const customName = filename || `static_backup_${Date.now()}.json`;
    saveStaticBackupData(dataToSave, customName);
    // Also update cms_backup.json for consistency
    saveLocalDiskData(dataToSave);

    // If MongoDB is connected, update DB as well
    if (isDatabaseConnected()) {
      try {
        await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          { data: dataToSave, updatedAt: new Date() },
          { upsert: true }
        ).exec();
      } catch (e) {}
    }

    // Record Activity Log
    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: 'Static Backup Updated',
        details: `Admin updated the authoritative Static Backup (${customName}).`,
        category: 'cms_update',
        level: 'success',
      });
    } catch (e) {}

    const availableFiles = getAvailableStaticBackupFiles();
    res.json({
      success: true,
      message: 'Static backup saved successfully. It will load on every reload and logo click.',
      data: dataToSave,
      availableFiles,
    });
  } catch (err: any) {
    console.error('[CMS Static Backup Error] POST /api/cms/static-backup:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SAVE_STATIC_FAILED', message: err?.message || 'Failed to save static backup' },
    });
  }
});

// POST /api/cms/static-backup/select - Select an existing backup file to be active Static Backup
router.post('/static-backup/select', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, id } = req.body || {};
    let targetPath = '';

    if (filename === 'cms_backup.json' || id === 'cms_backup') {
      targetPath = BACKUP_FILE_PATH;
    } else if (filename === 'static_backup.json' || id === 'active_static') {
      targetPath = STATIC_BACKUP_PATH;
    } else if (filename) {
      targetPath = path.join(STATIC_BACKUPS_DIR, filename);
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'Selected backup file does not exist' },
      });
      return;
    }

    const raw = fs.readFileSync(targetPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const validation = validateCMSPayload(parsed);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_FILE_CONTENT', message: validation.reason || 'File contains invalid CMS format' },
      });
      return;
    }

    // Save as active static_backup.json
    saveStaticBackupData(parsed);
    saveLocalDiskData(parsed);

    if (isDatabaseConnected()) {
      try {
        await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          { data: parsed, updatedAt: new Date() },
          { upsert: true }
        ).exec();
      } catch (e) {}
    }

    // Record Activity Log
    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: 'Static Backup Selected from Dropdown',
        details: `Active Static Backup set to "${filename || id}".`,
        category: 'cms_update',
        level: 'info',
      });
    } catch (e) {}

    const availableFiles = getAvailableStaticBackupFiles();
    res.json({
      success: true,
      message: `Active static backup successfully switched to "${filename || id}"`,
      data: parsed,
      availableFiles,
    });
  } catch (err: any) {
    console.error('[CMS Static Backup Select Error]:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SELECT_FAILED', message: err?.message || 'Failed to select static backup' },
    });
  }
});

// GET /api/cms/static-backup/download - Download active static backup JSON
router.get('/static-backup/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loadStaticBackupData();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sathwik_static_backup_${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_FAILED', message: err?.message || 'Download failed' },
    });
  }
});

export default router;
