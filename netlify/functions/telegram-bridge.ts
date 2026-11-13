interface NetlifyEvent {
  httpMethod: string;
  path: string;
  rawUrl?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
  isBase64Encoded?: boolean;
}

const DEFAULT_SETTINGS = {
  masterEnabled: true,
  websiteVisit: true,
  contactInbox: true,
  cmsUpdates: true,
  consoleAlerts: true,
  resumeDownloads: true,
  consoleTimerEnabled: false,
  consoleTimerIntervalMinutes: 2,
};

function escapeHtml(text: string = ''): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getCredentialsStatus() {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();
  const missing: string[] = [];
  if (!botToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (!chatId) missing.push('TELEGRAM_CHAT_ID');
  return {
    configured: missing.length === 0,
    botTokenSet: Boolean(botToken),
    chatIdSet: Boolean(chatId),
    missing,
  };
}

async function sendToTelegramApi(
  htmlText: string,
  override?: { botToken?: string; chatId?: string }
): Promise<{ ok: boolean; error?: string; missingCredentials?: boolean }> {
  const token = (override?.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (override?.chatId || process.env.TELEGRAM_CHAT_ID || '').trim();

  if (!token || !chatId) {
    const missing: string[] = [];
    if (!token) missing.push('TELEGRAM_BOT_TOKEN');
    if (!chatId) missing.push('TELEGRAM_CHAT_ID');
    return {
      ok: false,
      missingCredentials: true,
      error: `Missing ${missing.join(' and ')} in Netlify Environment Variables.`,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json: any = await response.json();
    if (!json.ok) {
      return {
        ok: false,
        error: json.description || `Telegram API error (${json.error_code || response.status})`,
      };
    }
    return { ok: true };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      error:
        err?.name === 'AbortError'
          ? 'Telegram API request timed out (8s)'
          : err?.message || 'Network error reaching api.telegram.org',
    };
  }
}

function jsonResponse(statusCode: number, body: Record<string, any>) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  };
}

function parseBody(event: NetlifyEvent): Record<string, any> {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  const reqPath = (event.path || '').toLowerCase().replace(/\/+$/, '');
  const body = parseBody(event);
  const clientIp =
    event.headers?.['x-nf-client-connection-ip'] ||
    event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    'Visitor';

  // 1. /api/telegram/settings
  if (reqPath.endsWith('/settings')) {
    if (event.httpMethod === 'POST') {
      return jsonResponse(200, {
        success: true,
        settings: { ...DEFAULT_SETTINGS, ...body },
        credentials: getCredentialsStatus(),
        mode: 'netlify_serverless',
        message: 'Telegram settings updated',
      });
    }
    return jsonResponse(200, {
      success: true,
      settings: DEFAULT_SETTINGS,
      credentials: getCredentialsStatus(),
      mode: 'netlify_serverless',
    });
  }

  // 2. /api/telegram/timer/status
  if (reqPath.endsWith('/timer/status')) {
    return jsonResponse(200, {
      success: true,
      status: {
        enabled: false,
        intervalMinutes: 2,
        pendingCount: 0,
        lastFlushTime: new Date().toISOString(),
      },
      mode: 'netlify_serverless',
    });
  }

  // 3. /api/telegram/timer/flush
  if (reqPath.endsWith('/timer/flush')) {
    return jsonResponse(200, {
      success: true,
      count: 0,
      message: 'Netlify serverless mode dispatches Telegram alerts in real time.',
    });
  }

  // 4. /api/telegram/test
  if (reqPath.endsWith('/test')) {
    const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const html = `<b>🟢 TELEGRAM BOT TEST PING</b>
━━━━━━━━━━━━━━━━━━━━
<b>Status:</b> Online & Operational
<b>Source:</b> Netlify Serverless Function
<b>Time (IST):</b> ${timeStr}
━━━━━━━━━━━━━━━━━━━━
🟢 <i>Sathwik Portfolio Notification Engine</i>`;

    const result = await sendToTelegramApi(html, {
      botToken: body.botToken,
      chatId: body.chatId,
    });

    return jsonResponse(200, {
      success: result.ok,
      missingCredentials: !!result.missingCredentials,
      credentials: getCredentialsStatus(),
      message: result.ok
        ? 'Test ping sent to Sathwik Telegram channel!'
        : result.error || 'Failed to send test message.',
    });
  }

  // 5. /api/telegram/console
  if (reqPath.endsWith('/console')) {
    const { event: evtName, details = '', level = 'info' } = body;
    if (!evtName) {
      return jsonResponse(400, {
        success: false,
        error: { code: 'MISSING_EVENT', message: 'Event description required' },
      });
    }

    const evtLower = String(evtName).toLowerCase();
    let colorBadge = '💻';
    let titleColor = 'CONSOLE LOG';
    if (evtLower.includes('login') || evtLower.includes('session') || evtLower.includes('auth')) {
      colorBadge = level === 'error' || evtLower.includes('failed') ? '🟠' : '🟣';
      titleColor =
        level === 'error' || evtLower.includes('failed')
          ? 'ADMIN SECURITY / LOGIN FAILED'
          : 'ADMIN LOGIN / SESSION ACTIVE';
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
    const html = `<b>${colorBadge} ${titleColor}: ${escapeHtml(String(evtName).toUpperCase())}</b>
━━━━━━━━━━━━━━━━━━━━
<b>⚡ Event:</b> ${escapeHtml(String(evtName))}
<b>📝 Details:</b>
<blockquote>${escapeHtml(String(details))}</blockquote>

<b>🕒 Time (IST):</b> ${timeStr}
<b>🌐 Client IP:</b> <code>${escapeHtml(clientIp)}</code>
━━━━━━━━━━━━━━━━━━━━
${colorBadge} <i>Sathwik Portfolio Console Monitor</i>`;

    const result = await sendToTelegramApi(html, {
      botToken: body.botToken,
      chatId: body.chatId,
    });

    return jsonResponse(200, {
      success: result.ok,
      buffered: false,
      missingCredentials: !!result.missingCredentials,
      message: result.ok
        ? 'Console log dispatched to Telegram'
        : result.error || 'Failed to dispatch log to Telegram',
    });
  }

  // 6. /api/contact
  if (reqPath.endsWith('/contact')) {
    const { name, email, subject, message } = body;
    if (!name || !email || !message) {
      return jsonResponse(400, {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, email, and message are required' },
      });
    }

    const now = new Date();
    const id =
      typeof body.id === 'string' && /^[a-zA-Z0-9_-]{3,128}$/.test(body.id)
        ? body.id
        : 'msg-' + Date.now();
    const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const html = `<b>🟢 NEW PORTFOLIO INBOX MESSAGE</b>
━━━━━━━━━━━━━━━━━━━━
<b>👤 Name:</b> <i>${escapeHtml(String(name))}</i>
<b>✉️ Email:</b> <code>${escapeHtml(String(email))}</code>
<b>📌 Subject:</b> <i>${escapeHtml(String(subject || 'Portfolio Inquiry'))}</i>

<b>💬 Message:</b>
<blockquote>${escapeHtml(String(message))}</blockquote>

<b>🕒 Received:</b> ${date} at ${time}
<b>🆔 ID:</b> <code>${id}</code>
━━━━━━━━━━━━━━━━━━━━
🟢 <i>Sathwik Portfolio Inbox Bot</i>`;

    const result = await sendToTelegramApi(html);
    return jsonResponse(200, {
      success: true,
      telegramSent: result.ok,
      telegramError: result.error,
      message: 'Thank you! Your message has been received.',
    });
  }

  // 7. /api/telemetry/visit
  if (reqPath.endsWith('/visit')) {
    const {
      deviceType = 'Desktop',
      browser = 'Unknown Browser',
      os = 'Unknown OS',
      screenRes = 'Unknown',
      language = 'en-US',
      timezone = 'Asia/Kolkata',
      pageUrl = '/',
      referrer = 'Direct Visit',
    } = body;

    const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const html = `<b>🔵 NEW WEBSITE VISIT / RELOAD</b>
━━━━━━━━━━━━━━━━━━━━
<b>📱 Device Type:</b> ${escapeHtml(String(deviceType))}
<b>💻 Browser & OS:</b> ${escapeHtml(String(browser))} on ${escapeHtml(String(os))}
<b>📐 Resolution:</b> <code>${escapeHtml(String(screenRes))}</code>
<b>🌐 Location / IP:</b> <code>${escapeHtml(clientIp)}</code>
<b>🕒 Timezone:</b> ${escapeHtml(String(timezone))} (${escapeHtml(String(language))})
<b>🔗 Page URL:</b> <code>${escapeHtml(String(pageUrl))}</code>
<b>🧭 Referrer:</b> <i>${escapeHtml(String(referrer))}</i>

<b>🕒 Time (IST):</b> ${timeStr}
━━━━━━━━━━━━━━━━━━━━
🔵 <i>Sathwik Portfolio Live Telemetry</i>`;

    const result = await sendToTelegramApi(html);
    return jsonResponse(200, {
      success: result.ok,
      message: result.ok ? 'Telemetry logged' : result.error || 'Telemetry recorded without Telegram',
    });
  }

  return jsonResponse(404, {
    success: false,
    error: { code: 'NOT_FOUND', message: `Unsupported endpoint: ${reqPath}` },
  });
};
