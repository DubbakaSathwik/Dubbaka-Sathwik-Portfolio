/**
 * Telegram Notification Helper Utilities
 * Sends Console Logs and Inbox Notifications to Sathwik's Telegram Bot
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

export const getTelegramSettings = async (): Promise<TelegramSettings> => {
  try {
    const res = await fetch('/api/telegram/settings');
    const data = await res.json();
    if (data.settings) return data.settings;
  } catch (err) {
    console.warn('Failed to fetch Telegram settings:', err);
  }
  return {
    masterEnabled: true,
    websiteVisit: true,
    contactInbox: true,
    cmsUpdates: true,
    consoleAlerts: true,
    resumeDownloads: true,
    consoleTimerEnabled: false,
    consoleTimerIntervalMinutes: 2,
  };
};

export const updateTelegramSettings = async (
  settings: Partial<TelegramSettings>
): Promise<{ success: boolean; settings: TelegramSettings }> => {
  try {
    const res = await fetch('/api/telegram/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    return {
      success: !!data.success,
      settings: data.settings || {
        masterEnabled: true,
        websiteVisit: true,
        contactInbox: true,
        cmsUpdates: true,
        consoleAlerts: true,
        resumeDownloads: true,
        consoleTimerEnabled: false,
        consoleTimerIntervalMinutes: 2,
      },
    };
  } catch (err) {
    console.warn('Failed to update Telegram settings:', err);
    return {
      success: false,
      settings: {
        masterEnabled: true,
        websiteVisit: true,
        contactInbox: true,
        cmsUpdates: true,
        consoleAlerts: true,
        resumeDownloads: true,
        consoleTimerEnabled: false,
        consoleTimerIntervalMinutes: 2,
      },
    };
  }
};

export const flushConsoleTimerLogs = async (): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    const res = await fetch('/api/telegram/timer/flush', { method: 'POST' });
    const data = await res.json();
    return {
      success: !!data.success,
      count: data.count || 0,
      message: data.message || 'Buffer flushed',
    };
  } catch (err: any) {
    console.warn('Failed to flush console timer logs:', err);
    return {
      success: false,
      count: 0,
      message: err?.message || 'Flush failed due to network error',
    };
  }
};

export const sendTelegramConsoleLog = async (
  event: string,
  details: string,
  level: 'info' | 'warning' | 'success' | 'error' = 'info'
): Promise<boolean> => {
  try {
    const res = await fetch('/api/telegram/console', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, details, level }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('Failed to send Telegram console log:', err);
    return false;
  }
};

export const sendTelegramInboxMessage = async (msg: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<boolean> => {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('Failed to send Telegram inbox notification:', err);
    return false;
  }
};

export const testTelegramBot = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/telegram/test');
    const data = await res.json();
    return {
      success: !!data.success,
      message: data.message || 'Test complete',
    };
  } catch (err: any) {
    console.warn('Failed to test Telegram bot:', err);
    return {
      success: false,
      message: err?.message || 'Network error connecting to Telegram API',
    };
  }
};
