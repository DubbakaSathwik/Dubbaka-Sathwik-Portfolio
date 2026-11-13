/**
 * Telegram Notification Helper Utilities
 * Sends Console Logs and Inbox Notifications to Sathwik's Telegram Bot
 * Works seamlessly across Express backend (dev/Cloud Run) and Netlify Functions (production).
 */

export interface TelegramSettings {
  masterEnabled: boolean;
  websiteVisit: boolean;
  contactInbox: boolean;
  cmsUpdates: boolean;
  consoleAlerts: boolean;
  resumeDownloads: boolean;
  consoleTimerEnabled: boolean;
  consoleTimerIntervalMinutes: number;
}

export interface TelegramCredentialsStatus {
  configured: boolean;
  botTokenSet: boolean;
  chatIdSet: boolean;
  missing: string[];
}

const DEFAULT_TELEGRAM_SETTINGS: TelegramSettings = {
  masterEnabled: true,
  websiteVisit: true,
  contactInbox: true,
  cmsUpdates: true,
  consoleAlerts: true,
  resumeDownloads: true,
  consoleTimerEnabled: false,
  consoleTimerIntervalMinutes: 2,
};

const LOCAL_SETTINGS_KEY = 'sathwik_telegram_settings_v1';

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('sathwik_portfolio_auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getLocalSettings(): TelegramSettings {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (raw) {
        return { ...DEFAULT_TELEGRAM_SETTINGS, ...JSON.parse(raw) };
      }
    }
  } catch {}
  return { ...DEFAULT_TELEGRAM_SETTINGS };
}

function saveLocalSettings(settings: TelegramSettings) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
    }
  } catch {}
}

async function safeJsonRequest(url: string, options?: RequestInit): Promise<{ ok: boolean; data: any; isHtml?: boolean }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, data: null, isHtml: true };
    }
    const data = await res.json();
    return { ok: res.ok && data?.success !== false, data };
  } catch (err) {
    return { ok: false, data: null };
  }
}

export const getTelegramDiagnostics = async (): Promise<{
  settings: TelegramSettings;
  credentials?: TelegramCredentialsStatus;
  backendReachable: boolean;
}> => {
  const { ok, data } = await safeJsonRequest('/api/telegram/settings');
  if (ok && data?.settings) {
    const merged = { ...getLocalSettings(), ...data.settings };
    return {
      settings: merged,
      credentials: data.credentials,
      backendReachable: true,
    };
  }
  return {
    settings: getLocalSettings(),
    backendReachable: false,
  };
};

export const getTelegramSettings = async (): Promise<TelegramSettings> => {
  const { settings } = await getTelegramDiagnostics();
  return settings;
};

export const updateTelegramSettings = async (
  settings: Partial<TelegramSettings>
): Promise<{ success: boolean; settings: TelegramSettings; message?: string }> => {
  const optimistic = { ...getLocalSettings(), ...settings };
  saveLocalSettings(optimistic);

  const { ok, data, isHtml } = await safeJsonRequest('/api/telegram/settings', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });

  if (ok && data?.settings) {
    saveLocalSettings(data.settings);
    return {
      success: true,
      settings: data.settings,
      message: data.message,
    };
  }

  // On static preview where no API server is attached, keep local state synced cleanly
  if (isHtml) {
    return {
      success: true,
      settings: optimistic,
      message: 'Settings saved locally (static hosting mode)',
    };
  }

  return {
    success: false,
    settings: optimistic,
    message: data?.error?.message || data?.message || 'Failed to save Telegram settings on server',
  };
};

export const flushConsoleTimerLogs = async (): Promise<{ success: boolean; count: number; message: string }> => {
  const { ok, data, isHtml } = await safeJsonRequest('/api/telegram/timer/flush', {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (isHtml) {
    return {
      success: true,
      count: 0,
      message: 'Static/Serverless mode sends logs immediately (no pending server buffer).',
    };
  }

  if (data) {
    return {
      success: !!data.success,
      count: data.count || 0,
      message: data.message || data.error?.message || 'Buffer flushed',
    };
  }

  return {
    success: false,
    count: 0,
    message: 'Failed to flush console timer logs due to network error',
  };
};

export const sendTelegramConsoleLog = async (
  event: string,
  details: string,
  level: 'info' | 'warning' | 'success' | 'error' = 'info'
): Promise<boolean> => {
  const { ok, data } = await safeJsonRequest('/api/telegram/console', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, details, level }),
  });
  return Boolean(ok && data?.success);
};

export const sendTelegramInboxMessage = async (msg: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<boolean> => {
  const { ok, data } = await safeJsonRequest('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(msg),
  });
  return Boolean(ok && data?.success);
};

export const sendTelegramDirectBrowserTest = async (
  botToken: string,
  chatId: string
): Promise<{ success: boolean; message: string }> => {
  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();
  if (!cleanToken || !cleanChatId) {
    return {
      success: false,
      message: 'Please provide both a Bot Token and a Chat ID to run a direct test.',
    };
  }

  try {
    const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const html = `<b>🟢 TELEGRAM BOT DIRECT TEST PING</b>
━━━━━━━━━━━━━━━━━━━━
<b>Status:</b> Online & Operational
<b>Source:</b> Direct Browser API Verification
<b>Time (IST):</b> ${timeStr}
━━━━━━━━━━━━━━━━━━━━
🟢 <i>Sathwik Portfolio Notification Engine</i>`;

    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: html,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return {
        success: true,
        message: 'Direct test ping delivered to Telegram! Credentials are valid.',
      };
    }
    return {
      success: false,
      message: data.description || `Telegram API error (${data.error_code || res.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to connect directly to api.telegram.org',
    };
  }
};

export const testTelegramBot = async (override?: {
  botToken?: string;
  chatId?: string;
}): Promise<{
  success: boolean;
  message: string;
  missingCredentials?: boolean;
  credentials?: TelegramCredentialsStatus;
}> => {
  const { data, isHtml } = await safeJsonRequest('/api/telegram/test', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...(override?.botToken ? { botToken: override.botToken.trim() } : {}),
      ...(override?.chatId ? { chatId: override.chatId.trim() } : {}),
    }),
  });

  if (data) {
    if (data.success) {
      return {
        success: true,
        message: data.message || 'Telegram test ping sent!',
        credentials: data.credentials,
      };
    }

    // If server didn't have env vars configured, but user provided one-time credentials, try browser direct test
    if (override?.botToken && override?.chatId) {
      const direct = await sendTelegramDirectBrowserTest(override.botToken, override.chatId);
      return {
        ...direct,
        missingCredentials: data.missingCredentials,
        credentials: data.credentials,
      };
    }

    return {
      success: false,
      missingCredentials: !!data.missingCredentials,
      credentials: data.credentials,
      message:
        data.message ||
        data.error?.message ||
        'Telegram API rejected the request. Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.',
    };
  }

  // Static hosting without Netlify function deployed yet: allow one-time direct test if provided
  if (override?.botToken && override?.chatId) {
    return sendTelegramDirectBrowserTest(override.botToken, override.chatId);
  }

  return {
    success: false,
    missingCredentials: true,
    message: isHtml
      ? 'Serverless Telegram function not yet deployed on this domain. Push the latest Netlify Functions update and set TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID in Netlify Environment Variables.'
      : 'Network error connecting to Telegram API endpoint.',
  };
};
