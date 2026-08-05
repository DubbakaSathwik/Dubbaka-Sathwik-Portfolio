import express from 'express';
import path from 'path';
import fs from 'fs';
import mongoose, { Document } from 'mongoose';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dubbakasathwik_db_user:bachi200@cluster0.6dd9987.mongodb.net/?appName=Cluster0';
const BACKUP_FILE_PATH = path.join(process.cwd(), 'cms_backup.json');
const ACTIVITY_LOGS_FILE = path.join(process.cwd(), 'activity_logs.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {
    console.warn('Failed to create uploads directory:', e);
  }
}

export interface ActivityLogItem {
  id: string;
  event: string;
  details: string;
  category: 'visit' | 'cms_update' | 'download' | 'contact' | 'security' | 'system';
  level: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  clientIp?: string;
  metadata?: Record<string, any>;
}

// Helper functions for local disk backup
function loadFromDiskBackup(): any {
  try {
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      const raw = fs.readFileSync(BACKUP_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read cms_backup.json:', err);
  }
  return null;
}

function saveToDiskBackup(data: any) {
  try {
    fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Saved CMS data backup to disk (cms_backup.json)');
  } catch (err) {
    console.warn('Could not write cms_backup.json:', err);
  }
}

// Activity Log Store logic
let activityLogs: ActivityLogItem[] = loadActivityLogsFromDisk();

function loadActivityLogsFromDisk(): ActivityLogItem[] {
  try {
    if (fs.existsSync(ACTIVITY_LOGS_FILE)) {
      const raw = fs.readFileSync(ACTIVITY_LOGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Could not read activity_logs.json:', err);
  }
  return [];
}

function saveActivityLogsToDisk() {
  try {
    fs.writeFileSync(ACTIVITY_LOGS_FILE, JSON.stringify(activityLogs.slice(0, 500), null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write activity_logs.json:', err);
  }
}

function addActivityLog(item: Omit<ActivityLogItem, 'id' | 'timestamp'>): ActivityLogItem {
  const newLog: ActivityLogItem = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    ...item,
  };
  activityLogs.unshift(newLog);
  if (activityLogs.length > 500) {
    activityLogs = activityLogs.slice(0, 500);
  }
  saveActivityLogsToDisk();
  return newLog;
}

// Disable Mongoose command buffering so queries fail-fast when offline
mongoose.set('bufferCommands', false);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8731561334:AAFXBQBSWa3unRQ-0c3UFqBHOrF6tQFxSPc';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5869091520';

export interface ITelegramSettings {
  masterEnabled: boolean;
  websiteVisit: boolean;
  contactInbox: boolean;
  cmsUpdates: boolean;
  consoleAlerts: boolean;
  resumeDownloads: boolean;
  consoleTimerEnabled: boolean;
  consoleTimerIntervalMinutes: number;
}

const TELEGRAM_SETTINGS_FILE = path.join(process.cwd(), 'telegram_settings.json');

let telegramSettings: ITelegramSettings = {
  masterEnabled: true,
  websiteVisit: true,
  contactInbox: true,
  cmsUpdates: true,
  consoleAlerts: true,
  resumeDownloads: true,
  consoleTimerEnabled: false,
  consoleTimerIntervalMinutes: 2,
};

function loadTelegramSettingsFromDisk(): ITelegramSettings {
  try {
    if (fs.existsSync(TELEGRAM_SETTINGS_FILE)) {
      const raw = fs.readFileSync(TELEGRAM_SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...telegramSettings, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load telegram settings from disk:', e);
  }
  return telegramSettings;
}

function saveTelegramSettingsToDisk() {
  try {
    fs.writeFileSync(TELEGRAM_SETTINGS_FILE, JSON.stringify(telegramSettings, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save telegram settings to disk:', e);
  }
}

telegramSettings = loadTelegramSettingsFromDisk();

function escapeHtml(text: string = ''): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface BufferedLogEntry {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  level: string;
  category: string;
  clientIp?: string;
}

let consoleLogBuffer: BufferedLogEntry[] = [];
let lastConsoleTimerFlushTime = Date.now();

// Raw low-level sender that sends immediately to Telegram API
async function sendTelegramMessageDirect(htmlText: string): Promise<boolean> {
  if (!telegramSettings.masterEnabled) return false;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const resJson = await response.json();
    if (!resJson.ok) {
      console.warn('Telegram API response error:', resJson);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error sending Telegram notification:', err);
    return false;
  }
}

// Function to flush the buffered console logs into a single grouped message
async function flushConsoleLogBuffer(): Promise<{ success: boolean; count: number }> {
  lastConsoleTimerFlushTime = Date.now();
  if (consoleLogBuffer.length === 0) {
    return { success: true, count: 0 };
  }

  const logsToFlush = [...consoleLogBuffer];
  consoleLogBuffer = [];

  const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const interval = telegramSettings.consoleTimerIntervalMinutes || 2;

  let messageLines: string[] = [
    `<b>🟡 CONSOLE GROUPED LOG SUMMARY</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>⏱️ Console Timer Mode:</b> Grouped every ${interval} min(s)`,
    `<b>📊 Total Events in Window:</b> ${logsToFlush.length}`,
    ``,
    `<b>📜 LOG MESSAGES SUMMARY:</b>`,
  ];

  logsToFlush.forEach((item, index) => {
    const icon = item.level === 'error' ? '🔴' : item.level === 'warning' ? '🟠' : item.level === 'success' ? '🟢' : '💻';
    messageLines.push(`<b>${index + 1}. ${icon} ${escapeHtml(item.event)}</b> [<i>${item.timestamp}</i>]`);
    if (item.details) {
      messageLines.push(`<blockquote>${escapeHtml(item.details)}</blockquote>`);
    }
  });

  messageLines.push(``);
  messageLines.push(`<b>🕒 Flushed At (IST):</b> ${timeStr}`);
  messageLines.push(`━━━━━━━━━━━━━━━━━━━━`);
  messageLines.push(`🟡 <i>Sathwik Grouped Console Buffer</i>`);

  const fullText = messageLines.join('\n');
  const success = await sendTelegramMessageDirect(fullText);
  return { success, count: logsToFlush.length };
}

// Check every 5s if Console Timer interval has expired and needs flushing
setInterval(() => {
  if (telegramSettings.masterEnabled && telegramSettings.consoleTimerEnabled) {
    const intervalMs = (telegramSettings.consoleTimerIntervalMinutes || 2) * 60 * 1000;
    if (Date.now() - lastConsoleTimerFlushTime >= intervalMs && consoleLogBuffer.length > 0) {
      flushConsoleLogBuffer().catch((e) => console.warn('Interval flush error:', e));
    }
  }
}, 5000);

async function sendTelegramMessage(
  htmlText: string,
  type?: keyof Omit<ITelegramSettings, 'masterEnabled' | 'consoleTimerEnabled' | 'consoleTimerIntervalMinutes'>,
  metadata?: { event?: string; details?: string; level?: string; category?: string; clientIp?: string }
): Promise<{ success: boolean; buffered: boolean }> {
  if (!telegramSettings.masterEnabled) {
    return { success: false, buffered: false };
  }
  if (type && !telegramSettings[type]) {
    return { success: false, buffered: false };
  }

  const eventLower = (metadata?.event || '').toLowerCase();
  const textLower = htmlText.toLowerCase();
  const isLoginOrAuthEvent =
    eventLower.includes('login') ||
    eventLower.includes('auth') ||
    eventLower.includes('admin portal') ||
    eventLower.includes('session') ||
    eventLower.includes('security') ||
    textLower.includes('login') ||
    textLower.includes('admin portal') ||
    textLower.includes('authenticated');

  // If Console Timer is ENABLED and message is a console alert, cms update, or system event (AND NOT A LOGIN/AUTH EVENT): buffer it!
  if (
    telegramSettings.consoleTimerEnabled &&
    !isLoginOrAuthEvent &&
    (type === 'consoleAlerts' || type === 'cmsUpdates' || type === undefined)
  ) {
    const timeStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    consoleLogBuffer.push({
      id: 'buf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: timeStr,
      event: metadata?.event || 'Console / CMS Event',
      details: metadata?.details || htmlText.replace(/<[^>]*>/g, '').substring(0, 300),
      level: metadata?.level || 'info',
      category: metadata?.category || 'cms_update',
      clientIp: metadata?.clientIp,
    });
    return { success: true, buffered: true }; // Buffered successfully
  }

  const sent = await sendTelegramMessageDirect(htmlText);
  return { success: sent, buffered: false };
}

// Detailed Diff Generator function for CMS Updates
function computeCMSDiff(oldData: any, newData: any): string[] {
  const diffs: string[] = [];
  if (!oldData || typeof oldData !== 'object' || Object.keys(oldData).length === 0) {
    diffs.push('Initial CMS dataset saved to storage');
    return diffs;
  }

  // 1. Hero Section
  if (newData.hero) {
    const o = oldData.hero || {};
    const n = newData.hero;
    if (o.heading !== n.heading) diffs.push(`<b>Hero Heading:</b> "${escapeHtml(o.heading || 'None')}" ➔ "${escapeHtml(n.heading || 'None')}"`);
    if (o.subtitle !== n.subtitle) diffs.push(`<b>Hero Subtitle:</b> "${escapeHtml(o.subtitle || 'None')}" ➔ "${escapeHtml(n.subtitle || 'None')}"`);
    if (o.tagline !== n.tagline) diffs.push(`<b>Hero Tagline:</b> "${escapeHtml(o.tagline || 'None')}" ➔ "${escapeHtml(n.tagline || 'None')}"`);
    if (o.availabilityStatus !== n.availabilityStatus) diffs.push(`<b>Status Badge:</b> "${escapeHtml(o.availabilityStatus || '')}" ➔ "${escapeHtml(n.availabilityStatus || '')}"`);
  }

  // 2. About Section
  if (newData.about) {
    const o = oldData.about || {};
    const n = newData.about;
    if (o.degree !== n.degree) diffs.push(`<b>Degree:</b> "${escapeHtml(o.degree || '')}" ➔ "${escapeHtml(n.degree || '')}"`);
    if (o.department !== n.department) diffs.push(`<b>Department:</b> "${escapeHtml(o.department || '')}" ➔ "${escapeHtml(n.department || '')}"`);
    if (o.location !== n.location) diffs.push(`<b>Location:</b> "${escapeHtml(o.location || '')}" ➔ "${escapeHtml(n.location || '')}"`);
    if (o.yearOfStudy !== n.yearOfStudy) diffs.push(`<b>Year of Study:</b> "${escapeHtml(o.yearOfStudy || '')}" ➔ "${escapeHtml(n.yearOfStudy || '')}"`);
    if (o.avatarUrl !== n.avatarUrl) {
      const desc = n.avatarUrl?.startsWith('/uploads/') ? 'New Uploaded Photo' : n.avatarUrl ? 'External Image URL' : 'Default Avatar';
      diffs.push(`<b>Profile Photo/Avatar:</b> Updated (${desc})`);
    }
    if (o.bioParagraph1 !== n.bioParagraph1) diffs.push(`<b>Bio Paragraph 1:</b> Content edited`);
    if (o.bioParagraph2 !== n.bioParagraph2) diffs.push(`<b>Bio Paragraph 2:</b> Content edited`);
  }

  // 3. Projects Section
  if (Array.isArray(newData.projects)) {
    const oProjects = Array.isArray(oldData.projects) ? oldData.projects : [];
    const nProjects = newData.projects;
    if (oProjects.length !== nProjects.length) {
      diffs.push(`<b>Projects Total Count:</b> ${oProjects.length} ➔ ${nProjects.length}`);
    }
    nProjects.forEach((np: any) => {
      const op = oProjects.find((p: any) => p.id === np.id);
      if (!op) {
        diffs.push(`<b>New Project Added:</b> "${escapeHtml(np.title || 'Untitled')}" (${escapeHtml(np.category || 'General')})`);
      } else if (op.title !== np.title || op.description !== np.description || op.category !== np.category) {
        diffs.push(`<b>Project Updated:</b> "${escapeHtml(np.title || 'Untitled')}" (${escapeHtml(np.category || 'General')})`);
      }
    });
  }

  // 4. Journey Timeline
  if (Array.isArray(newData.journey)) {
    const oJourney = Array.isArray(oldData.journey) ? oldData.journey : [];
    const nJourney = newData.journey;
    if (oJourney.length !== nJourney.length) {
      diffs.push(`<b>Journey Milestones Count:</b> ${oJourney.length} ➔ ${nJourney.length}`);
    }
    nJourney.forEach((nj: any) => {
      const oj = oJourney.find((j: any) => j.id === nj.id);
      if (!oj) {
        diffs.push(`<b>New Journey Item Added:</b> "${escapeHtml(nj.title || '')}" (${escapeHtml(nj.year || '')})`);
      } else if (oj.title !== nj.title || oj.description !== nj.description) {
        diffs.push(`<b>Journey Item Updated:</b> "${escapeHtml(nj.title || '')}" (${escapeHtml(nj.year || '')})`);
      }
    });
  }

  // 5. Creative Portfolio
  if (Array.isArray(newData.creativePortfolio)) {
    const oCP = Array.isArray(oldData.creativePortfolio) ? oldData.creativePortfolio : [];
    const nCP = newData.creativePortfolio;
    if (oCP.length !== nCP.length) {
      diffs.push(`<b>Creative Portfolio Count:</b> ${oCP.length} ➔ ${nCP.length}`);
    }
  }

  // 6. Gallery / Certificates
  if (Array.isArray(newData.gallery)) {
    const oG = Array.isArray(oldData.gallery) ? oldData.gallery : [];
    const nG = newData.gallery;
    if (oG.length !== nG.length) {
      diffs.push(`<b>Certificates & Awards Count:</b> ${oG.length} ➔ ${nG.length}`);
    }
  }

  // 7. Contact Details
  if (newData.contactInfo) {
    const o = oldData.contactInfo || {};
    const n = newData.contactInfo;
    if (o.email !== n.email) diffs.push(`<b>Email:</b> "${escapeHtml(o.email || '')}" ➔ "${escapeHtml(n.email || '')}"`);
    if (o.phone !== n.phone) diffs.push(`<b>Phone:</b> "${escapeHtml(o.phone || '')}" ➔ "${escapeHtml(n.phone || '')}"`);
    if (o.github !== n.github) diffs.push(`<b>GitHub Link:</b> Updated`);
    if (o.linkedin !== n.linkedin) diffs.push(`<b>LinkedIn Link:</b> Updated`);
    if (o.instagram !== n.instagram) diffs.push(`<b>Instagram Link:</b> Updated`);
    if (o.telegram !== n.telegram) diffs.push(`<b>Telegram Link:</b> Updated`);
  }

  if (diffs.length === 0) {
    diffs.push('General CMS structure or layout refreshed');
  }

  return diffs;
}

function formatInboxNotificationMessage(msg: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  time: string;
}): string {
  return `<b>🟢 NEW PORTFOLIO INBOX MESSAGE</b>
━━━━━━━━━━━━━━━━━━━━
<b>👤 Name:</b> <i>${escapeHtml(msg.name)}</i>
<b>✉️ Email:</b> <code>${escapeHtml(msg.email)}</code>
<b>📌 Subject:</b> <i>${escapeHtml(msg.subject)}</i>

<b>💬 Message:</b>
<blockquote>${escapeHtml(msg.message)}</blockquote>

<b>🕒 Received:</b> ${msg.date} at ${msg.time}
<b>🆔 ID:</b> <code>${msg.id}</code>
━━━━━━━━━━━━━━━━━━━━
🟢 <i>Sathwik Portfolio Inbox Bot</i>`;
}

function formatConsoleLogMessage(event: string, details: string, level: string = 'info', clientIp?: string): string {
  let colorBadge = '💻';
  let titleColor = 'CONSOLE LOG';

  if (event.toLowerCase().includes('login') || event.toLowerCase().includes('session') || event.toLowerCase().includes('auth')) {
    if (level === 'error' || event.toLowerCase().includes('failed')) {
      colorBadge = '🟠';
      titleColor = 'ADMIN SECURITY / LOGIN FAILED';
    } else {
      colorBadge = '🟣';
      titleColor = 'ADMIN LOGIN / SESSION ACTIVE';
    }
  } else if (level === 'error') {
    colorBadge = '🔴';
    titleColor = 'SYSTEM ERROR ALERT';
  } else if (level === 'warning') {
    colorBadge = '🟠';
    titleColor = 'WARNING ALERT';
  } else if (level === 'success') {
    colorBadge = '🟢';
    titleColor = 'ACTION SUCCESSFUL';
  }

  const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return `<b>${colorBadge} ${titleColor}: ${escapeHtml(event.toUpperCase())}</b>
━━━━━━━━━━━━━━━━━━━━
<b>⚡ Event:</b> ${escapeHtml(event)}
<b>📝 Details:</b>
<blockquote>${escapeHtml(details)}</blockquote>

<b>🕒 Time (IST):</b> ${timeStr}
${clientIp ? `<b>🌐 Client IP:</b> <code>${escapeHtml(clientIp)}</code>` : ''}
━━━━━━━━━━━━━━━━━━━━
${colorBadge} <i>Sathwik Portfolio Console Monitor</i>`;
}

function formatVisitorTelemetryMessage(meta: {
  deviceType: string;
  browser: string;
  os: string;
  screenRes: string;
  language: string;
  timezone: string;
  pageUrl: string;
  referrer: string;
  clientIp: string;
}): string {
  const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return `<b>🔵 NEW WEBSITE VISIT / RELOAD</b>
━━━━━━━━━━━━━━━━━━━━
<b>📱 Device Type:</b> ${escapeHtml(meta.deviceType)}
<b>💻 Browser & OS:</b> ${escapeHtml(meta.browser)} on ${escapeHtml(meta.os)}
<b>📐 Resolution:</b> <code>${escapeHtml(meta.screenRes)}</code>
<b>🌐 Location / IP:</b> <code>${escapeHtml(meta.clientIp)}</code>
<b>🕒 Timezone:</b> ${escapeHtml(meta.timezone)} (${escapeHtml(meta.language)})
<b>🔗 Page URL:</b> <code>${escapeHtml(meta.pageUrl)}</code>
<b>🧭 Referrer:</b> <i>${escapeHtml(meta.referrer)}</i>

<b>🕒 Time (IST):</b> ${timeStr}
━━━━━━━━━━━━━━━━━━━━
🔵 <i>Sathwik Portfolio Live Telemetry</i>`;
}

export interface ICMSDoc extends Document {
  key: string;
  data: any;
  updatedAt: Date;
}

// Mongoose Schema for Portfolio CMS Data
const CMSSchema = new mongoose.Schema<ICMSDoc>(
  {
    key: { type: String, default: 'portfolio_cms_v1', unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { bufferCommands: false }
);

const CMSModel = (mongoose.models.CMS as mongoose.Model<ICMSDoc>) || mongoose.model<ICMSDoc>('CMS', CMSSchema);

let isDbConnected = false;
let inMemoryCMSCache: any = loadFromDiskBackup();

async function connectToMongo() {
  if (isDbConnected && mongoose.connection.readyState === 1) return true;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isDbConnected = true;
    console.log('MongoDB Atlas Connected Successfully!');
    return true;
  } catch (err: any) {
    isDbConnected = false;
    console.warn('MongoDB Atlas Connection Warning:', err?.message || err);
    console.warn('Running with In-Memory fallback mode for CMS data.');
    return false;
  }
}

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 50MB (for uploaded image/video base64 strings)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve uploaded image assets statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Connect DB on server start asynchronously
  connectToMongo();

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: isDbConnected && mongoose.connection.readyState === 1 ? 'connected' : 'fallback-memory',
      timestamp: new Date().toISOString(),
    });
  });

  // POST /api/upload - Direct File Asset Upload Route
  app.post('/api/upload', (req, res) => {
    try {
      const { name, dataUrl } = req.body || {};
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ success: false, error: 'No dataUrl provided' });
        return;
      }

      // If it's already an HTTP URL or uploaded path, return as is
      if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('/uploads/')) {
        res.json({ success: true, url: dataUrl });
        return;
      }

      const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
      if (!matches) {
        res.json({ success: true, url: dataUrl });
        return;
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      let ext = 'jpg';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else if (mimeType.includes('svg')) ext = 'svg';

      const safeName = (name || 'photo')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .substring(0, 30);
      const filename = `${safeName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${filename}`;
      res.json({
        success: true,
        url: publicUrl,
        filename,
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Upload failed' });
    }
  });

  // GET CMS Data from MongoDB Atlas (with in-memory fallback)
  app.get('/api/cms', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const cmsDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
        if (cmsDoc) {
          inMemoryCMSCache = cmsDoc.data;
          res.json({ data: cmsDoc.data, updatedAt: cmsDoc.updatedAt, database: 'MongoDB Atlas' });
          return;
        }
      }
    } catch (error: any) {
      console.warn('Unable to read from MongoDB Atlas, falling back to memory cache:', error?.message);
    }

    // Fallback response if MongoDB is offline or empty
    res.json({
      data: inMemoryCMSCache,
      message: inMemoryCMSCache ? 'Served from server memory cache' : 'No CMS record in memory yet',
      database: 'Server In-Memory Fallback',
    });
  });

  // POST/PUT CMS Data to MongoDB Atlas (with in-memory fallback)
  app.post('/api/cms', async (req, res) => {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Invalid data payload' });
      return;
    }

    // Compute detailed diffs before updating inMemoryCMSCache
    const detailedDiffs = computeCMSDiff(inMemoryCMSCache, payload);

    // Always update in-memory cache and local disk backup
    inMemoryCMSCache = payload;
    saveToDiskBackup(payload);

    addActivityLog({
      event: 'Portfolio CMS Content Saved',
      details: `Admin updated portfolio content. Diffs:\n${detailedDiffs.map(d => '• ' + d.replace(/<[^>]*>/g, '')).join('\n')}`,
      category: 'cms_update',
      level: 'info',
    });

    const diffBullets = detailedDiffs.map(d => `• ${d}`).join('\n');

    const cmsHtml = `<b>🟢 PORTFOLIO CMS DATA STORED & SYNCED</b>
━━━━━━━━━━━━━━━━━━━━
<b>👤 Editor:</b> Portfolio Admin
<b>📁 Projects Count:</b> ${payload.projects?.length || 0}
<b>🎓 Certificates:</b> ${payload.gallery?.length || 0}
<b>🗺️ Journey Steps:</b> ${payload.journey?.length || 0}

<b>📝 DETAILED CHANGES DETECTED:</b>
${diffBullets}

<b>🕒 Time (IST):</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
━━━━━━━━━━━━━━━━━━━━
🟢 <i>Sathwik Portfolio CMS Sync Engine</i>`;

    sendTelegramMessage(cmsHtml, 'cmsUpdates', {
      event: 'Portfolio CMS Content Saved',
      details: detailedDiffs.map(d => d.replace(/<[^>]*>/g, '')).join('\n'),
      level: 'success',
      category: 'cms_update',
    }).catch(() => {});

    try {
      if (mongoose.connection.readyState === 1) {
        const updatedDoc = await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          { data: payload, updatedAt: new Date() },
          { upsert: true, new: true }
        ).exec();

        res.json({
          success: true,
          message: 'Saved to MongoDB Atlas',
          updatedAt: updatedDoc ? updatedDoc.updatedAt : new Date(),
          database: 'MongoDB Atlas',
        });
        return;
      }
    } catch (error: any) {
      console.warn('Failed to persist CMS payload to MongoDB Atlas:', error?.message);
    }

    // Fallback response when MongoDB is unreachable
    res.json({
      success: true,
      message: 'Saved to Server Memory (MongoDB Atlas offline or IP restricted)',
      updatedAt: new Date(),
      database: 'Server In-Memory Fallback',
    });
  });

  // POST New Contact Message to MongoDB (with in-memory fallback)
  app.post('/api/contact', async (req, res) => {
    const messageObj = req.body;
    if (!messageObj || !messageObj.name || !messageObj.email || !messageObj.message) {
      res.status(400).json({ error: 'Name, email, and message are required' });
      return;
    }

    const newMessage = {
      id: 'msg-' + Date.now(),
      name: messageObj.name,
      email: messageObj.email,
      subject: messageObj.subject || 'Portfolio Inquiry',
      message: messageObj.message,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'unread',
    };

    let currentData = inMemoryCMSCache || {};
    const existingMessages = currentData.messages || [];
    currentData = {
      ...currentData,
      messages: [newMessage, ...existingMessages],
    };
    inMemoryCMSCache = currentData;

    // Send Telegram Notification for new inbox message
    const telegramHtml = formatInboxNotificationMessage(newMessage);
    sendTelegramMessage(telegramHtml, 'contactInbox').catch((err) => console.warn('Telegram inbox notification error:', err));

    addActivityLog({
      event: 'Contact Inbox Message Received',
      details: `New message from ${newMessage.name} (${newMessage.email}): "${newMessage.subject}"`,
      category: 'contact',
      level: 'success',
      metadata: { name: newMessage.name, email: newMessage.email, subject: newMessage.subject },
    });

    try {
      if (mongoose.connection.readyState === 1) {
        await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          { data: currentData, updatedAt: new Date() },
          { upsert: true }
        ).exec();

        res.json({
          success: true,
          message: 'Message submitted and saved to MongoDB Atlas',
          newMessage,
          telegramNotification: 'Sent',
          database: 'MongoDB Atlas',
        });
        return;
      }
    } catch (error: any) {
      console.warn('Failed to save contact message to MongoDB Atlas:', error?.message);
    }

    res.json({
      success: true,
      message: 'Message received and stored in server memory (MongoDB Atlas offline)',
      newMessage,
      telegramNotification: 'Sent',
      database: 'Server In-Memory Fallback',
    });
  });

  // API Endpoint: Send Console / System Log to Telegram
  app.post('/api/telegram/console', async (req, res) => {
    const { event, details, level = 'info' } = req.body || {};
    if (!event || !details) {
      res.status(400).json({ error: 'event and details parameters are required' });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown IP';
    const logHtml = formatConsoleLogMessage(event, details, level, clientIp);

    const isResume = (event || '').toLowerCase().includes('resume') || (event || '').toLowerCase().includes('download');
    const notificationType = isResume ? 'resumeDownloads' : 'consoleAlerts';

    const tgResult = await sendTelegramMessage(logHtml, notificationType, {
      event,
      details,
      level,
      category: 'consoleAlerts',
      clientIp,
    });

    res.json({
      success: tgResult.success,
      message: tgResult.success ? (tgResult.buffered ? 'Console log buffered for timer' : 'Console log sent instantly to Telegram') : 'Failed to process console log',
      buffered: tgResult.buffered,
      timestamp: new Date().toISOString(),
    });
  });

  // API Endpoints: Console Timer Manual Flush & Status
  app.post('/api/telegram/timer/flush', async (req, res) => {
    try {
      const result = await flushConsoleLogBuffer();
      res.json({
        success: result.success,
        count: result.count,
        message: result.count > 0 ? `Flushed ${result.count} buffered log(s) to Telegram` : 'Console log buffer is empty',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Flush failed' });
    }
  });

  app.get('/api/telegram/timer/status', (req, res) => {
    res.json({
      success: true,
      enabled: telegramSettings.consoleTimerEnabled,
      intervalMinutes: telegramSettings.consoleTimerIntervalMinutes,
      pendingCount: consoleLogBuffer.length,
      lastFlushTime: new Date(lastConsoleTimerFlushTime).toISOString(),
    });
  });

  // API Endpoints: Telegram Settings Management
  app.get('/api/telegram/settings', (req, res) => {
    res.json({
      success: true,
      settings: telegramSettings,
    });
  });

  app.post('/api/telegram/settings', (req, res) => {
    const updates = req.body || {};
    telegramSettings = {
      ...telegramSettings,
      ...updates,
    };
    saveTelegramSettingsToDisk();

    addActivityLog({
      event: 'Telegram Notification Toggles Updated',
      details: `Updated Telegram notification toggles. Master: ${telegramSettings.masterEnabled ? 'ON' : 'OFF'}, Website Visits: ${telegramSettings.websiteVisit ? 'ON' : 'OFF'}, Contact Inbox: ${telegramSettings.contactInbox ? 'ON' : 'OFF'}, CMS Edits: ${telegramSettings.cmsUpdates ? 'ON' : 'OFF'}, Console Alerts: ${telegramSettings.consoleAlerts ? 'ON' : 'OFF'}, Downloads: ${telegramSettings.resumeDownloads ? 'ON' : 'OFF'}`,
      category: 'system',
      level: 'info',
    });

    res.json({
      success: true,
      message: 'Telegram notification settings updated successfully',
      settings: telegramSettings,
    });
  });

  // API Endpoint: Send Direct Test Notification to Telegram
  app.get('/api/telegram/test', async (req, res) => {
    const testMsg = `<b>🚀 SATHWIK PORTFOLIO BOT TEST</b>
━━━━━━━━━━━━━━━━━━━━
<b>✅ Status:</b> Bot Operational
<b>🤖 Bot User:</b> @SathwikPortfolioNotification_bot
<b>💬 Chat ID:</b> <code>${TELEGRAM_CHAT_ID}</code>
<b>🕒 Connected At:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
<b>⚙️ Master Toggle:</b> ${telegramSettings.masterEnabled ? 'ENABLED ✅' : 'DISABLED ❌'}
━━━━━━━━━━━━━━━━━━━━
<i>Ready to receive Inbox Notifications and Console Logs!</i>`;

    const tgRes = await sendTelegramMessage(testMsg);
    res.json({
      success: tgRes.success,
      message: tgRes.success ? 'Test notification sent to Telegram bot successfully!' : 'Failed to send Telegram test message. Check bot token and chat ID.',
      chatId: TELEGRAM_CHAT_ID,
    });
  });

  // API Endpoint: Silent Visitor Telemetry Ping & Telegram Notification
  app.post('/api/telemetry/visit', async (req, res) => {
    try {
      const { deviceType, browser, os, screenRes, language, timezone, pageUrl, referrer } = req.body || {};
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      const meta = {
        deviceType: deviceType || 'Desktop',
        browser: browser || 'Unknown Browser',
        os: os || 'Unknown OS',
        screenRes: screenRes || '1920x1080',
        language: language || 'en',
        timezone: timezone || 'Asia/Kolkata',
        pageUrl: pageUrl || '/',
        referrer: referrer || 'Direct Visit',
        clientIp,
      };

      // 1. Send silent Telegram notification (if websiteVisit toggle is enabled)
      const telegramHtml = formatVisitorTelemetryMessage(meta);
      sendTelegramMessage(telegramHtml, 'websiteVisit').catch((err) => console.warn('Telegram visitor notification error:', err));

      // 2. Add to Activity Console Logs
      const logEntry = addActivityLog({
        event: 'Site Visit / Reload',
        category: 'visit',
        level: 'info',
        details: `Visitor opened portfolio via ${meta.browser} on ${meta.os} (${meta.deviceType}). IP: ${clientIp}`,
        clientIp,
        metadata: meta,
      });

      res.json({
        success: true,
        message: 'Telemetry logged silently',
        logId: logEntry.id,
      });
    } catch (err: any) {
      console.warn('Telemetry endpoint error:', err);
      res.json({ success: false, error: err?.message || 'Failed to record visit' });
    }
  });

  // API Endpoints: Activity Console Logs
  app.get('/api/logs', (req, res) => {
    res.json({
      success: true,
      logs: activityLogs,
      total: activityLogs.length,
    });
  });

  app.post('/api/logs', async (req, res) => {
    const { event, details, level = 'info', category = 'system', metadata } = req.body || {};
    if (!event || !details) {
      res.status(400).json({ error: 'event and details are required' });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown IP';
    const logItem = addActivityLog({
      event,
      details,
      level,
      category,
      clientIp,
      metadata,
    });

    if (level === 'warning' || level === 'error') {
      const telegramHtml = formatConsoleLogMessage(event, details, level, clientIp);
      sendTelegramMessage(telegramHtml).catch(() => {});
    }

    res.json({
      success: true,
      log: logItem,
    });
  });

  app.delete('/api/logs', (req, res) => {
    activityLogs = [];
    saveActivityLogsToDisk();
    addActivityLog({
      event: 'Console Activity Logs Cleared',
      details: 'All recorded activity logs were cleared by Admin.',
      category: 'security',
      level: 'warning',
    });

    res.json({
      success: true,
      message: 'Console activity logs cleared successfully',
    });
  });

  // API Endpoints: Backup & Restore
  app.get('/api/cms/backup/download', (req, res) => {
    const data = inMemoryCMSCache || loadFromDiskBackup() || {};
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sathwik_portfolio_backup_${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  });

  app.post('/api/cms/restore', async (req, res) => {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Invalid backup JSON payload' });
      return;
    }

    inMemoryCMSCache = payload;
    saveToDiskBackup(payload);

    addActivityLog({
      event: 'Full Portfolio Database Restored',
      details: `Restored CMS backup containing ${payload.projects?.length || 0} projects, ${payload.gallery?.length || 0} certificates, and ${payload.journey?.length || 0} journey milestones.`,
      category: 'cms_update',
      level: 'success',
    });

    try {
      if (mongoose.connection.readyState === 1) {
        await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          { data: payload, updatedAt: new Date() },
          { upsert: true }
        ).exec();

        res.json({
          success: true,
          message: 'Database restored successfully and synced to MongoDB Atlas',
          data: payload,
          database: 'MongoDB Atlas',
        });
        return;
      }
    } catch (err: any) {
      console.warn('Restore failed to write to MongoDB Atlas:', err?.message);
    }

    res.json({
      success: true,
      message: 'Database restored successfully to server memory (MongoDB Atlas offline)',
      data: payload,
      database: 'Server In-Memory Fallback',
    });
  });

  app.get('/api/cms/backups/list', (req, res) => {
    const localBackupExists = fs.existsSync(BACKUP_FILE_PATH);
    let localStats = null;
    if (localBackupExists) {
      try {
        const stat = fs.statSync(BACKUP_FILE_PATH);
        localStats = {
          filename: 'cms_backup.json',
          sizeBytes: stat.size,
          sizeFormatted: (stat.size / 1024).toFixed(2) + ' KB',
          lastModified: stat.mtime.toISOString(),
        };
      } catch (e) {}
    }

    res.json({
      success: true,
      localDiskBackup: localStats,
      mongoDbAtlasStatus: isDbConnected && mongoose.connection.readyState === 1 ? 'Connected' : 'Offline',
      recordCounts: {
        projects: inMemoryCMSCache?.projects?.length || 0,
        journey: inMemoryCMSCache?.journey?.length || 0,
        certificates: inMemoryCMSCache?.gallery?.length || 0,
        creative: inMemoryCMSCache?.creativePortfolio?.length || 0,
        resumes: inMemoryCMSCache?.resumes?.length || 0,
        messages: inMemoryCMSCache?.messages?.length || 0,
      },
    });
  });

  // Vite Middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Full-Stack Server with MongoDB Atlas active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
