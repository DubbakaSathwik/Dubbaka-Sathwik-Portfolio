import crypto from 'crypto';

interface NetlifyEvent {
  httpMethod: string;
  path: string;
  rawUrl?: string;
  queryStringParameters?: Record<string, string | undefined>;
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

const ALLOWLISTED_CRAWLERS = [
  'googlebot',
  'google-inspectiontool',
  'apis-google',
  'mediapartners-google',
  'adsbot-google',
  'bingbot',
  'duckduckbot',
  'applebot',
  'gptbot',
  'oai-searchbot',
  'chatgpt-user',
  'claudebot',
  'claude-web',
  'anthropic-ai',
  'perplexitybot',
  'perplexity-user',
  'yandexbot',
  'slurp',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
];

const SYSTEM_AUTOMATION_MARKERS = [
  'headlesschrome',
  'puppeteer',
  'playwright',
  'selenium',
  'phantomjs',
  'webdriver',
  'curl/',
  'wget/',
  'python-requests',
  'scrapy',
  'httpclient',
  'go-http-client',
  'node-fetch',
  'axios/',
  'postmanruntime',
];

const SUSPICIOUS_PROBE_PATTERNS = [
  '<script',
  '%3cscript',
  '../',
  'wp-login',
  'wp-admin',
  'xmlrpc.php',
  '/.env',
  'union select',
  'javascript:',
];

function escapeHtml(text: string = ''): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeText(val: unknown, maxLen: number, fallback: string = ''): string {
  if (typeof val !== 'string') return fallback;
  const cleaned = val.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLen) : fallback;
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

function getChallengeSecret(): string {
  return (
    (process.env.CHALLENGE_HMAC_SECRET || '').trim() ||
    (process.env.JWT_SECRET || '').trim() ||
    (process.env.TELEGRAM_BOT_TOKEN || '').trim() ||
    'sathwik-netlify-human-gate-key'
  );
}

const usedNonces = new Set<string>();

function assessVisitorServerless(input: Record<string, any>, headerUa: string) {
  const ua = sanitizeText(input.userAgent || headerUa, 400, '');
  const uaLower = ua.toLowerCase();
  const pageLower = sanitizeText(input.pageUrl, 400, '/').toLowerCase();
  const refLower = sanitizeText(input.referrer, 300, '').toLowerCase();
  const signals: string[] = [];
  let riskScore = 0;

  const crawler = ALLOWLISTED_CRAWLERS.find((b) => uaLower.includes(b));
  if (crawler) {
    return {
      classification: 'Bot',
      safetyStatus: 'Crawler',
      riskScore: 5,
      securitySignals: [`Allowlisted Crawler (${crawler})`],
      challengeRequired: false,
    };
  }

  const probe = SUSPICIOUS_PROBE_PATTERNS.find((p) => pageLower.includes(p) || refLower.includes(p));
  if (probe) {
    riskScore += 65;
    signals.push(`Suspicious Probe Pattern (${probe})`);
  }

  const sysMarker = SYSTEM_AUTOMATION_MARKERS.find((m) => uaLower.includes(m));
  if (sysMarker) {
    riskScore += 60;
    signals.push(`System/Automation UA (${sysMarker})`);
  }
  if (input.webdriver === true) {
    riskScore += 55;
    signals.push('Navigator WebDriver Active');
  }

  if (!ua) {
    riskScore += 45;
    signals.push('Missing User-Agent Header');
  }
  if (
    typeof input.viewportWidth === 'number' &&
    typeof input.viewportHeight === 'number' &&
    (input.viewportWidth === 0 || input.viewportHeight === 0)
  ) {
    riskScore += 45;
    signals.push('Zero-Dimension Headless Viewport');
  }
  if (input.forceChallenge === true) {
    riskScore = Math.max(riskScore, 65);
    signals.push('Manual Security Verification Check');
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  if (input.alreadyVerified && !input.forceChallenge && !probe) {
    return {
      classification: 'Human',
      safetyStatus: 'Verified',
      riskScore: Math.min(riskScore, 15),
      securitySignals: signals.length > 0 ? signals : ['Human CAPTCHA Verified'],
      challengeRequired: false,
    };
  }

  if (sysMarker || input.webdriver === true) {
    return {
      classification: 'System',
      safetyStatus: 'Challenged',
      riskScore: Math.max(riskScore, 60),
      securitySignals: signals,
      challengeRequired: true,
    };
  }

  if (riskScore >= 45) {
    return {
      classification: 'Suspicious',
      safetyStatus: 'Challenged',
      riskScore,
      securitySignals: signals,
      challengeRequired: true,
    };
  }

  return {
    classification: 'Human',
    safetyStatus: 'Safe',
    riskScore,
    securitySignals: signals.length > 0 ? signals : ['Normal Browser Behavior'],
    challengeRequired: false,
  };
}

function buildDistortedSvg(code: string): string {
  const width = 220;
  const height = 74;
  const lines: string[] = [];
  for (let i = 0; i < 6; i++) {
    const x1 = crypto.randomInt(0, 40);
    const y1 = crypto.randomInt(8, height - 8);
    const cx = crypto.randomInt(60, 160);
    const cy = crypto.randomInt(5, height - 5);
    const x2 = crypto.randomInt(width - 40, width);
    const y2 = crypto.randomInt(8, height - 8);
    lines.push(
      `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" stroke="#34d399" stroke-opacity="0.35" stroke-width="1.4" fill="none" />`
    );
  }
  const chars = code.split('').map((ch, idx) => {
    const x = 22 + idx * 31 + crypto.randomInt(-3, 4);
    const y = 46 + crypto.randomInt(-6, 7);
    const rot = crypto.randomInt(-19, 20);
    const fontSize = crypto.randomInt(24, 30);
    return `<text x="${x}" y="${y}" fill="#ecfdf5" font-family="ui-monospace, monospace" font-size="${fontSize}" font-weight="800" transform="rotate(${rot} ${x} ${y})">${ch}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" rx="12" fill="#09090b" />
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="11" fill="none" stroke="#27272a" stroke-width="1.5" />
  ${lines.join('\n  ')}
  ${chars.join('\n  ')}
</svg>`;
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
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
  const country = sanitizeText(
    event.headers?.['x-country'] || event.headers?.['x-nf-geo-country'],
    64,
    'Unknown'
  );
  const headerUa = sanitizeText(event.headers?.['user-agent'], 400, '');

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
<b>Status:</b> Online &amp; Operational
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
    const { name, email, subject, message, visitorId } = body;
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
    const visitorLine =
      typeof visitorId === 'string' && visitorId
        ? `\n<b>🪪 Visitor ID:</b> <code>${escapeHtml(visitorId.slice(0, 64))}</code>`
        : '';

    const html = `<b>🟢 NEW PORTFOLIO INBOX MESSAGE</b>
━━━━━━━━━━━━━━━━━━━━
<b>👤 Name:</b> <i>${escapeHtml(String(name))}</i>
<b>✉️ Email:</b> <code>${escapeHtml(String(email))}</code>
<b>📌 Subject:</b> <i>${escapeHtml(String(subject || 'Portfolio Inquiry'))}</i>${visitorLine}

<b>💬 Message:</b>
<blockquote>${escapeHtml(String(message))}</blockquote>

<b>🕒 Received:</b> ${date} at ${time}
<b>🆔 ID:</b> <code>${escapeHtml(id)}</code>
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

  // 7. /api/telemetry/challenge
  if (reqPath.endsWith('/challenge')) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) code += alphabet[bytes[i] % alphabet.length];

    const nonce = crypto.randomBytes(12).toString('hex');
    const salt = crypto.randomBytes(8).toString('hex');
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 5 * 60 * 1000;
    const expectedHash = crypto.createHash('sha256').update(`${code}:${salt}`).digest('hex');

    const payloadB64 = Buffer.from(
      JSON.stringify({ nonce, salt, expectedHash, issuedAt, expiresAt }),
      'utf8'
    ).toString('base64url');
    const sig = crypto.createHmac('sha256', getChallengeSecret()).update(payloadB64).digest('base64url');
    const svg = buildDistortedSvg(code);

    return jsonResponse(200, {
      success: true,
      challengeToken: `${payloadB64}.${sig}`,
      captchaSvgDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`,
      expiresInSeconds: 300,
    });
  }

  // 8. /api/telemetry/verify-human
  if (reqPath.endsWith('/verify-human')) {
    const token = String(body.challengeToken || '').trim();
    const visitorId = sanitizeText(body.visitorId, 64, 'VIS-UNKNOWN');
    const parts = token.split('.');
    if (parts.length !== 2) {
      return jsonResponse(400, { success: false, verified: false, message: 'Invalid challenge token.' });
    }
    const [payloadB64, providedSig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getChallengeSecret())
      .update(payloadB64)
      .digest('base64url');

    const a = Buffer.from(providedSig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return jsonResponse(400, { success: false, verified: false, message: 'Invalid token signature.' });
    }

    let payload: any = null;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch {
      return jsonResponse(400, { success: false, verified: false, message: 'Invalid challenge payload.' });
    }

    const now = Date.now();
    if (!payload || now > payload.expiresAt) {
      return jsonResponse(400, { success: false, verified: false, message: 'Challenge expired.' });
    }
    if (usedNonces.has(payload.nonce)) {
      return jsonResponse(400, { success: false, verified: false, message: 'Challenge already used.' });
    }
    if (body.checkboxConfirmed !== true) {
      return jsonResponse(400, { success: false, verified: false, message: 'Please confirm "I am not a bot".' });
    }
    if (now - payload.issuedAt < 600) {
      return jsonResponse(400, { success: false, verified: false, message: 'Submitted too quickly.' });
    }

    const cleanAnswer = sanitizeText(body.answer, 16, '').replace(/\s+/g, '').toUpperCase();
    const candidateHash = crypto.createHash('sha256').update(`${cleanAnswer}:${payload.salt}`).digest('hex');
    const ha = Buffer.from(candidateHash, 'hex');
    const hb = Buffer.from(String(payload.expectedHash || ''), 'hex');
    const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    if (ha.length !== hb.length || !crypto.timingSafeEqual(ha, hb)) {
      await sendToTelegramApi(
        `<b>🔴 BOT / CAPTCHA VERIFICATION FAILED</b>\n━━━━━━━━━━━━━━━━━━━━\n<b>🪪 Visitor ID:</b> <code>${escapeHtml(visitorId)}</code>\n<b>🌐 Client IP:</b> <code>${escapeHtml(clientIp)}</code>\n<b>🕒 Time (IST):</b> ${timeStr}\n━━━━━━━━━━━━━━━━━━━━\n🔴 <i>Sathwik Portfolio Human Gate</i>`
      );
      return jsonResponse(400, {
        success: false,
        verified: false,
        message: 'CAPTCHA characters did not match.',
      });
    }

    usedNonces.add(payload.nonce);
    await sendToTelegramApi(
      `<b>🛡️ HUMAN VERIFICATION PASSED ("I AM NOT A BOT")</b>\n━━━━━━━━━━━━━━━━━━━━\n<b>🪪 Visitor ID:</b> <code>${escapeHtml(visitorId)}</code>\n<b>🌐 Client IP:</b> <code>${escapeHtml(clientIp)}</code>\n<b>🕒 Time (IST):</b> ${timeStr}\n━━━━━━━━━━━━━━━━━━━━\n🛡️ <i>Sathwik Portfolio Human Gate</i>`
    );

    return jsonResponse(200, {
      success: true,
      verified: true,
      message: 'Human verification passed.',
    });
  }

  // 9. /api/telemetry/heartbeat
  if (reqPath.endsWith('/heartbeat')) {
    return jsonResponse(200, { success: true });
  }

  // 10. /api/telemetry/visit
  if (reqPath.endsWith('/visit')) {
    const visitorId = sanitizeText(body.visitorId, 64, `VIS-WEB-${Date.now().toString(36).toUpperCase()}`);
    const visitCount = typeof body.visitCount === 'number' && body.visitCount > 0 ? body.visitCount : 1;
    const isNewVisitor = visitCount <= 1;
    const deviceType = sanitizeText(body.deviceType, 40, 'Desktop');
    const browser = sanitizeText(body.browser, 80, 'Unknown Browser');
    const os = sanitizeText(body.os, 80, 'Unknown OS');
    const screenRes = sanitizeText(body.screenRes, 80, 'Unknown');
    const language = sanitizeText(body.language, 32, 'en-US');
    const timezone = sanitizeText(body.timezone, 64, 'Asia/Kolkata');
    const pageUrl = sanitizeText(body.pageUrl, 300, '/');
    const referrer = sanitizeText(body.referrer, 300, 'Direct Visit');
    const ua = sanitizeText(body.userAgent || headerUa, 400, '');

    const assessment = assessVisitorServerless(body, headerUa);
    const headerEmoji =
      assessment.classification === 'Suspicious'
        ? '🚨'
        : assessment.classification === 'System'
        ? '⚙️'
        : assessment.classification === 'Bot'
        ? '🤖'
        : '🟢';

    const typeLabel =
      assessment.classification === 'Human'
        ? '👤 Human Visitor'
        : assessment.classification === 'Bot'
        ? '🤖 Search / AI Crawler Bot'
        : assessment.classification === 'System'
        ? '⚙️ Automated System / Headless'
        : '🚨 Suspicious Visitor';

    const safetyLine =
      assessment.safetyStatus === 'Safe'
        ? '✅ Safe &amp; Trusted'
        : assessment.safetyStatus === 'Verified'
        ? '🛡️ Verified Human (CAPTCHA Passed)'
        : assessment.safetyStatus === 'Crawler'
        ? '🔎 Verified Allowlisted Crawler'
        : '⚠️ Challenged ("I am not a bot" Gate)';

    const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const html = `<b>${headerEmoji} PORTFOLIO VISITOR &amp; SECURITY REPORT</b>
━━━━━━━━━━━━━━━━━━━━
<b>🪪 Visitor ID:</b> <code>${escapeHtml(visitorId)}</code> • ${isNewVisitor ? '🆕 First Visit (#1)' : `🔁 Returning (#${visitCount})`}
<b>🧭 Visitor Type:</b> ${typeLabel}
<b>🛡️ Website Safety:</b> ${safetyLine}
<b>📊 Risk Score:</b> <code>${assessment.riskScore}/100</code>
<b>🧪 Security Signals:</b> <i>${escapeHtml(assessment.securitySignals.join(', '))}</i>
<b>🔒 Challenge Gate:</b> <code>${assessment.challengeRequired ? 'triggered' : 'none'}</code>

<b>📱 Device:</b> ${escapeHtml(deviceType)} • ${escapeHtml(browser)} on ${escapeHtml(os)}
<b>📐 Viewport/Screen:</b> <code>${escapeHtml(screenRes)}</code>
<b>🌍 IP &amp; Region:</b> <code>${escapeHtml(clientIp)}</code>${country !== 'Unknown' ? ` (${escapeHtml(country)})` : ''}
<b>🕒 Timezone:</b> ${escapeHtml(timezone)} (${escapeHtml(language)})
<b>🔗 Page URL:</b> <code>${escapeHtml(pageUrl)}</code>
<b>🧭 Referrer:</b> <i>${escapeHtml(referrer)}</i>${ua ? `\n<b>🧬 User-Agent:</b> <code>${escapeHtml(ua.slice(0, 140))}</code>` : ''}

<b>🕒 Time (IST):</b> ${timeStr}
━━━━━━━━━━━━━━━━━━━━
${headerEmoji} <i>Sathwik Portfolio Security Shield</i>`;

    const result = await sendToTelegramApi(html);

    if (assessment.challengeRequired) {
      await sendToTelegramApi(
        `<b>⚠️ SUSPICIOUS VISITOR CHALLENGED BY CAPTCHA</b>\n━━━━━━━━━━━━━━━━━━━━\n<b>🪪 Visitor ID:</b> <code>${escapeHtml(visitorId)}</code>\n<b>🧭 Classification:</b> ${escapeHtml(assessment.classification)}\n<b>📊 Risk Score:</b> <code>${assessment.riskScore}/100</code>\n<b>🌐 Client IP:</b> <code>${escapeHtml(clientIp)}</code>\n<b>📝 Signals:</b> <i>${escapeHtml(assessment.securitySignals.join(', '))}</i>\n<b>🕒 Time (IST):</b> ${timeStr}\n━━━━━━━━━━━━━━━━━━━━\n⚠️ <i>Sathwik Portfolio Human Gate</i>`
      );
    }

    return jsonResponse(200, {
      success: true,
      telegramSent: result.ok,
      visitorId,
      classification: assessment.classification,
      safetyStatus: assessment.safetyStatus,
      riskScore: assessment.riskScore,
      securitySignals: assessment.securitySignals,
      challengeRequired: assessment.challengeRequired,
    });
  }

  return jsonResponse(404, {
    success: false,
    error: { code: 'NOT_FOUND', message: `Unsupported endpoint: ${reqPath}` },
  });
};
