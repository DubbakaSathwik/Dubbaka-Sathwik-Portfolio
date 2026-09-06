import { config } from '../config/env';
import { TelegramSettingsModel } from '../db/mongo';
import fs from 'fs';
import path from 'path';

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

export function loadTelegramSettingsFromDisk(): ITelegramSettings {
  try {
    if (fs.existsSync(TELEGRAM_SETTINGS_FILE)) {
      const raw = fs.readFileSync(TELEGRAM_SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...telegramSettings, ...parsed };
    }
  } catch (e) {
    console.warn('[Telegram] Failed to read disk settings:', e);
  }
  return telegramSettings;
}

export function saveTelegramSettingsToDisk(settings: ITelegramSettings) {
  try {
    fs.writeFileSync(TELEGRAM_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Telegram] Failed to write disk settings:', e);
  }
}

telegramSettings = loadTelegramSettingsFromDisk();

export async function initTelegramSettingsFromDB(): Promise<void> {
  try {
    const doc = await TelegramSettingsModel.findOne({ key: 'telegram_settings_v1' }).exec();
    if (doc) {
      telegramSettings = {
        masterEnabled: doc.masterEnabled,
        websiteVisit: doc.websiteVisit,
        contactInbox: doc.contactInbox,
        cmsUpdates: doc.cmsUpdates,
        consoleAlerts: doc.consoleAlerts,
        resumeDownloads: doc.resumeDownloads,
        consoleTimerEnabled: doc.consoleTimerEnabled,
        consoleTimerIntervalMinutes: doc.consoleTimerIntervalMinutes,
      };
      saveTelegramSettingsToDisk(telegramSettings);
    }
  } catch (err) {
    console.warn('[Telegram] Initial DB settings sync skipped or offline.');
  }
}

export function getTelegramSettings(): ITelegramSettings {
  return { ...telegramSettings };
}

export async function updateTelegramSettings(
  updates: Partial<ITelegramSettings>
): Promise<ITelegramSettings> {
  telegramSettings = {
    ...telegramSettings,
    ...updates,
  };
  saveTelegramSettingsToDisk(telegramSettings);

  try {
    await TelegramSettingsModel.findOneAndUpdate(
      { key: 'telegram_settings_v1' },
      { ...telegramSettings, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after' }
    ).exec();
  } catch (e) {
    console.warn('[Telegram] Failed to sync settings to MongoDB:', e);
  }

  return telegramSettings;
}

export function escapeHtml(text: string = ''): string {
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

export async function sendTelegramMessageDirect(htmlText: string): Promise<boolean> {
  if (!telegramSettings.masterEnabled) return false;
  if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_CHAT_ID) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

  try {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.TELEGRAM_CHAT_ID,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const resJson = await response.json();
    if (!resJson.ok) {
      console.warn('[Telegram API] Response error:', resJson);
      return false;
    }
    return true;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[Telegram API] Direct send warning (non-blocking):', err?.message || err);
    return false;
  }
}

export async function flushConsoleLogBuffer(): Promise<{ success: boolean; count: number }> {
  lastConsoleTimerFlushTime = Date.now();
  if (consoleLogBuffer.length === 0) {
    return { success: true, count: 0 };
  }

  const logsToFlush = [...consoleLogBuffer];
  consoleLogBuffer = [];

  const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const interval = telegramSettings.consoleTimerIntervalMinutes || 2;

  const messageLines: string[] = [
    `<b>🟡 CONSOLE GROUPED LOG SUMMARY</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>⏱️ Console Timer Mode:</b> Grouped every ${interval} min(s)`,
    `<b>📊 Total Events in Window:</b> ${logsToFlush.length}`,
    ``,
    `<b>📜 LOG MESSAGES SUMMARY:</b>`,
  ];

  logsToFlush.forEach((item, index) => {
    const icon =
      item.level === 'error'
        ? '🔴'
        : item.level === 'warning'
        ? '🟠'
        : item.level === 'success'
        ? '🟢'
        : '💻';
    messageLines.push(
      `<b>${index + 1}. ${icon} ${escapeHtml(item.event)}</b> [<i>${item.timestamp}</i>]`
    );
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

// Background timer to auto-flush buffered logs
setInterval(() => {
  if (telegramSettings.masterEnabled && telegramSettings.consoleTimerEnabled) {
    const intervalMs = (telegramSettings.consoleTimerIntervalMinutes || 2) * 60 * 1000;
    if (Date.now() - lastConsoleTimerFlushTime >= intervalMs && consoleLogBuffer.length > 0) {
      flushConsoleLogBuffer().catch((e) => console.warn('[Telegram] Interval flush error:', e));
    }
  }
}, 5000);

export function getConsoleTimerStatus() {
  return {
    enabled: telegramSettings.consoleTimerEnabled,
    intervalMinutes: telegramSettings.consoleTimerIntervalMinutes,
    pendingCount: consoleLogBuffer.length,
    lastFlushTime: new Date(lastConsoleTimerFlushTime).toISOString(),
  };
}

export async function sendTelegramNotification(
  htmlText: string,
  type?: keyof Omit<ITelegramSettings, 'masterEnabled' | 'consoleTimerEnabled' | 'consoleTimerIntervalMinutes'>,
  metadata?: { event?: string; details?: string; level?: string; category?: string; clientIp?: string; metadata?: Record<string, any> }
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

  // Buffer console & cms events if timer enabled (unless login/security event)
  if (
    telegramSettings.consoleTimerEnabled &&
    !isLoginOrAuthEvent &&
    (type === 'consoleAlerts' || type === 'cmsUpdates' || type === undefined)
  ) {
    const timeStr = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    consoleLogBuffer.push({
      id: 'buf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: timeStr,
      event: metadata?.event || 'Console / CMS Event',
      details: metadata?.details || htmlText.replace(/<[^>]*>/g, '').substring(0, 300),
      level: metadata?.level || 'info',
      category: metadata?.category || 'cms_update',
      clientIp: metadata?.clientIp,
    });
    return { success: true, buffered: true };
  }

  const sent = await sendTelegramMessageDirect(htmlText);
  return { success: sent, buffered: false };
}

export function formatInboxNotificationMessage(msg: {
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

export function formatConsoleLogMessage(
  event: string,
  details: string,
  level: string = 'info',
  clientIp?: string
): string {
  let colorBadge = '💻';
  let titleColor = 'CONSOLE LOG';

  if (
    event.toLowerCase().includes('login') ||
    event.toLowerCase().includes('session') ||
    event.toLowerCase().includes('auth')
  ) {
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
${clientIp ? `<b>🌐 Client IP:</b> <code>${escapeHtml(clientIp)}</code>\n` : ''}━━━━━━━━━━━━━━━━━━━━
${colorBadge} <i>Sathwik Portfolio Console Monitor</i>`;
}

export function formatVisitorTelemetryMessage(meta: {
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

export function computeCMSDiff(oldData: any, newData: any): string[] {
  const diffs: string[] = [];
  if (!oldData || typeof oldData !== 'object' || Object.keys(oldData).length === 0) {
    diffs.push('Initial CMS dataset saved to storage');
    return diffs;
  }

  // 1. Hero Section
  if (newData.hero) {
    const o = oldData.hero || {};
    const n = newData.hero;
    if (o.heading !== n.heading)
      diffs.push(
        `<b>Hero Heading:</b> "${escapeHtml(o.heading || 'None')}" ➔ "${escapeHtml(
          n.heading || 'None'
        )}"`
      );
    if (o.subtitle !== n.subtitle)
      diffs.push(
        `<b>Hero Subtitle:</b> "${escapeHtml(o.subtitle || 'None')}" ➔ "${escapeHtml(
          n.subtitle || 'None'
        )}"`
      );
    if (o.tagline !== n.tagline)
      diffs.push(
        `<b>Hero Tagline:</b> "${escapeHtml(o.tagline || 'None')}" ➔ "${escapeHtml(
          n.tagline || 'None'
        )}"`
      );
  }

  // 2. About Section
  if (newData.about) {
    const o = oldData.about || {};
    const n = newData.about;
    if (o.degree !== n.degree)
      diffs.push(`<b>Degree:</b> "${escapeHtml(o.degree || '')}" ➔ "${escapeHtml(n.degree || '')}"`);
    if (o.department !== n.department)
      diffs.push(
        `<b>Department:</b> "${escapeHtml(o.department || '')}" ➔ "${escapeHtml(
          n.department || ''
        )}"`
      );
    if (o.location !== n.location)
      diffs.push(
        `<b>Location:</b> "${escapeHtml(o.location || '')}" ➔ "${escapeHtml(n.location || '')}"`
      );
    if (o.yearOfStudy !== n.yearOfStudy)
      diffs.push(
        `<b>Year of Study:</b> "${escapeHtml(o.yearOfStudy || '')}" ➔ "${escapeHtml(
          n.yearOfStudy || ''
        )}"`
      );
    if (o.avatarUrl !== n.avatarUrl) {
      const desc = n.avatarUrl?.startsWith('/uploads/')
        ? 'New Uploaded Photo'
        : n.avatarUrl
        ? 'External Image URL'
        : 'Default Avatar';
      diffs.push(`<b>Profile Photo/Avatar:</b> Updated (${desc})`);
    }
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
        diffs.push(
          `<b>New Project Added:</b> "${escapeHtml(np.title || 'Untitled')}" (${escapeHtml(
            np.category || 'General'
          )})`
        );
      } else if (
        op.title !== np.title ||
        op.description !== np.description ||
        op.category !== np.category
      ) {
        diffs.push(
          `<b>Project Updated:</b> "${escapeHtml(np.title || 'Untitled')}" (${escapeHtml(
            np.category || 'General'
          )})`
        );
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
  }

  // 5. Gallery / Certificates
  if (Array.isArray(newData.gallery)) {
    const oG = Array.isArray(oldData.gallery) ? oldData.gallery : [];
    const nG = newData.gallery;
    if (oG.length !== nG.length) {
      diffs.push(`<b>Certificates & Awards Count:</b> ${oG.length} ➔ ${nG.length}`);
    }
  }

  if (diffs.length === 0) {
    diffs.push('General CMS structure or layout refreshed');
  }

  return diffs;
}
