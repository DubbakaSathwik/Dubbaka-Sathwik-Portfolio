import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { VisitorModel, isDatabaseConnected } from '../db/mongo';
import type {
  VisitorClassification,
  VisitorSafetyStatus,
  VisitorChallengeStatus,
  VisitorLabel,
  VisitorRecord,
} from '../../src/types';

export const VALID_VISITOR_LABELS: VisitorLabel[] = [
  'unlabeled',
  'test',
  'myself',
  'company',
  'friends',
  'other',
];

export const ALLOWLISTED_CRAWLERS = [
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

export const SYSTEM_AUTOMATION_MARKERS = [
  'headlesschrome',
  'puppeteer',
  'playwright',
  'selenium',
  'phantomjs',
  'webdriver',
  'curl/',
  'wget/',
  'python-requests',
  'python-urllib',
  'scrapy',
  'httpclient',
  'go-http-client',
  'node-fetch',
  'undici',
  'axios/',
  'postmanruntime',
  'insomnia/',
];

const SUSPICIOUS_PROBE_PATTERNS = [
  '<script',
  '%3cscript',
  '../',
  '..\\',
  'wp-login',
  'wp-admin',
  'xmlrpc.php',
  '/.env',
  'union select',
  'javascript:',
  'onload=',
  'onerror=',
];

const VISITORS_FILE = path.join(process.cwd(), 'visitors_data.json');

interface StoredVisitorInternal extends VisitorRecord {
  visitorSecret: string;
}

// In-memory store synchronized with disk/MongoDB
let memoryVisitors: Map<string, StoredVisitorInternal> = new Map();

// In-memory burst tracking (IP / visitorId -> timestamps)
const recentActivityBuckets: Map<string, number[]> = new Map();

// Anti-replay nonce store (nonce -> expiry timestamp)
const usedChallengeNonces: Map<string, number> = new Map();

function loadVisitorsFromDisk(): void {
  try {
    if (fs.existsSync(VISITORS_FILE)) {
      const raw = fs.readFileSync(VISITORS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const nextMap = new Map<string, StoredVisitorInternal>();
        for (const item of parsed) {
          if (item && typeof item.visitorId === 'string') {
            nextMap.set(item.visitorId, item);
          }
        }
        memoryVisitors = nextMap;
      }
    }
  } catch (err) {
    console.warn('[VisitorSecurity] Failed loading visitors_data.json:', err);
  }
}

function saveVisitorsToDisk(): void {
  try {
    const arr = Array.from(memoryVisitors.values())
      .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
      .slice(0, 1000);
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    console.warn('[VisitorSecurity] Failed saving visitors_data.json:', err);
  }
}

loadVisitorsFromDisk();

export function sanitizeString(value: unknown, maxLen: number, fallback: string = ''): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLen) : fallback;
}

export function isValidVisitorId(id: unknown): id is string {
  return typeof id === 'string' && /^VIS-[a-zA-Z0-9_-]{4,64}$/.test(id);
}

export function generateVisitorId(): string {
  const now = new Date();
  const y = String(now.getUTCFullYear()).slice(-2);
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `VIS-${y}${m}${d}-${rand}`;
}

export function stripVisitorSecret(record: StoredVisitorInternal): VisitorRecord {
  const { visitorSecret: _secret, ...publicFields } = record;
  return publicFields;
}

export interface RiskAssessmentInput {
  userAgent?: string;
  clientIp?: string;
  visitorId?: string;
  pageUrl?: string;
  referrer?: string;
  webdriver?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
  pluginsCount?: number;
  languagesCount?: number;
  timezone?: string;
  hardwareConcurrency?: number;
  forceChallenge?: boolean;
  alreadyVerified?: boolean;
}

export interface RiskAssessmentResult {
  classification: VisitorClassification;
  safetyStatus: VisitorSafetyStatus;
  riskScore: number;
  securitySignals: string[];
  challengeRequired: boolean;
}

function recordActivityBurst(key: string): number {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const existing = (recentActivityBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
  existing.push(now);
  recentActivityBuckets.set(key, existing);
  if (recentActivityBuckets.size > 500) {
    const firstKey = recentActivityBuckets.keys().next().value;
    if (firstKey) recentActivityBuckets.delete(firstKey);
  }
  return existing.length;
}

export function resetBurstTrackerForTests(): void {
  recentActivityBuckets.clear();
  usedChallengeNonces.clear();
}

export function assessVisitorRisk(input: RiskAssessmentInput): RiskAssessmentResult {
  const ua = sanitizeString(input.userAgent, 500, '');
  const uaLower = ua.toLowerCase();
  const pageUrlLower = sanitizeString(input.pageUrl, 500, '/').toLowerCase();
  const referrerLower = sanitizeString(input.referrer, 300, '').toLowerCase();
  const signals: string[] = [];
  let riskScore = 0;

  // 1. Verified Search / AI Crawlers (NEVER blocked with CAPTCHA)
  const matchedCrawler = ALLOWLISTED_CRAWLERS.find((bot) => uaLower.includes(bot));
  if (matchedCrawler) {
    signals.push(`Allowlisted Crawler (${matchedCrawler})`);
    return {
      classification: 'Bot',
      safetyStatus: 'Crawler',
      riskScore: 5,
      securitySignals: signals,
      challengeRequired: false,
    };
  }

  // 2. Security attack probes in URL / Referrer
  const matchedProbe = SUSPICIOUS_PROBE_PATTERNS.find(
    (pat) => pageUrlLower.includes(pat) || referrerLower.includes(pat)
  );
  if (matchedProbe) {
    riskScore += 65;
    signals.push(`Suspicious Probe Pattern (${matchedProbe})`);
  }

  // 3. Automation / Webdriver / System tool signatures
  const matchedSystem = SYSTEM_AUTOMATION_MARKERS.find((marker) => uaLower.includes(marker));
  if (matchedSystem) {
    riskScore += 60;
    signals.push(`System/Automation UA (${matchedSystem})`);
  }
  if (input.webdriver === true) {
    riskScore += 55;
    signals.push('Navigator WebDriver Active');
  }

  // 4. Generic unclassified bots
  if (!matchedCrawler && !matchedSystem && /\b(bot|spider|crawler|scraper)\b/i.test(uaLower)) {
    riskScore += 50;
    signals.push('Unverified Bot User-Agent');
  }

  // 5. Missing or collapsed browser invariants
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
  if (
    typeof input.pluginsCount === 'number' &&
    input.pluginsCount === 0 &&
    !/mobi|android|iphone|ipad/i.test(uaLower) &&
    input.webdriver === true
  ) {
    riskScore += 15;
    signals.push('Zero Plugins with WebDriver');
  }
  if (typeof input.languagesCount === 'number' && input.languagesCount === 0) {
    riskScore += 25;
    signals.push('Empty Navigator Languages');
  }

  // 6. Burst / rapid reload rate spike
  const burstKey = sanitizeString(input.clientIp, 64, '') || sanitizeString(input.visitorId, 64, 'anon');
  const recentHits = recordActivityBurst(burstKey);
  if (recentHits >= 10) {
    riskScore += 50;
    signals.push(`Burst Traffic (${recentHits} hits/60s)`);
  }

  // 7. Explicit Security Challenge Test mode (CMS / manual test)
  if (input.forceChallenge === true) {
    riskScore = Math.max(riskScore, 65);
    signals.push('Manual Security Verification Check');
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  // If already passed human verification in this session/identity (unless forced re-test)
  if (input.alreadyVerified && !input.forceChallenge && !matchedProbe) {
    return {
      classification: 'Human',
      safetyStatus: 'Verified',
      riskScore: Math.min(riskScore, 15),
      securitySignals: signals.length > 0 ? signals : ['Human CAPTCHA Verified'],
      challengeRequired: false,
    };
  }

  if (matchedSystem || input.webdriver === true) {
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

// --- Human CAPTCHA Generation & Cryptographic Verification ---

const CAPTCHA_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCaptchaCode(length: number = 6): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CAPTCHA_ALPHABET[bytes[i] % CAPTCHA_ALPHABET.length];
  }
  return out;
}

function buildDistortedCaptchaSvg(code: string): string {
  const width = 220;
  const height = 74;
  const bgLines: string[] = [];

  for (let i = 0; i < 6; i++) {
    const x1 = crypto.randomInt(0, 40);
    const y1 = crypto.randomInt(8, height - 8);
    const cx = crypto.randomInt(60, 160);
    const cy = crypto.randomInt(5, height - 5);
    const x2 = crypto.randomInt(width - 40, width);
    const y2 = crypto.randomInt(8, height - 8);
    const strokeOpacity = (0.25 + crypto.randomInt(0, 3) * 0.1).toFixed(2);
    bgLines.push(
      `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" stroke="#34d399" stroke-opacity="${strokeOpacity}" stroke-width="1.4" fill="none" />`
    );
  }

  for (let i = 0; i < 24; i++) {
    const cx = crypto.randomInt(8, width - 8);
    const cy = crypto.randomInt(8, height - 8);
    const r = crypto.randomInt(1, 3);
    bgLines.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#a1a1aa" fill-opacity="0.35" />`);
  }

  const charNodes = code.split('').map((ch, idx) => {
    const x = 22 + idx * 31 + crypto.randomInt(-3, 4);
    const y = 46 + crypto.randomInt(-6, 7);
    const rot = crypto.randomInt(-19, 20);
    const fontSize = crypto.randomInt(24, 30);
    const colors = ['#ecfdf5', '#6ee7b7', '#f4f4f5', '#a7f3d0'];
    const fill = colors[idx % colors.length];
    return `<text x="${x}" y="${y}" fill="${fill}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize}" font-weight="800" transform="rotate(${rot} ${x} ${y})">${ch}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" rx="12" fill="#09090b" />
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="11" fill="none" stroke="#27272a" stroke-width="1.5" />
  ${bgLines.join('\n  ')}
  ${charNodes.join('\n  ')}
</svg>`;
}

function getChallengeHmacSecret(): string {
  return config.JWT_SECRET || 'portfolio-challenge-hmac-fallback';
}

function signChallengePayload(payloadObj: Record<string, any>): string {
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getChallengeHmacSecret())
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

export interface IssuedChallenge {
  challengeToken: string;
  captchaSvgDataUrl: string;
  expiresInSeconds: number;
}

export function issueHumanChallenge(visitorId?: string): IssuedChallenge {
  const code = generateCaptchaCode(6);
  const nonce = crypto.randomBytes(12).toString('hex');
  const salt = crypto.randomBytes(8).toString('hex');
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 5 * 60 * 1000;
  const expectedHash = crypto
    .createHash('sha256')
    .update(`${code.toUpperCase()}:${salt}`)
    .digest('hex');

  const challengeToken = signChallengePayload({
    nonce,
    salt,
    expectedHash,
    issuedAt,
    expiresAt,
    visitorId: isValidVisitorId(visitorId) ? visitorId : 'anonymous',
  });

  const svg = buildDistortedCaptchaSvg(code);
  const captchaSvgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;

  return {
    challengeToken,
    captchaSvgDataUrl,
    expiresInSeconds: 300,
  };
}

export interface VerifyChallengeInput {
  challengeToken: string;
  answer: string;
  visitorId?: string;
  checkboxConfirmed?: boolean;
  interactionCount?: number;
  nowMs?: number;
}

export interface VerifyChallengeResult {
  valid: boolean;
  reason?: string;
  code: 'VERIFIED' | 'INVALID_TOKEN' | 'EXPIRED' | 'REPLAYED' | 'TOO_FAST' | 'NO_INTERACTION' | 'WRONG_ANSWER';
}

export function verifyHumanChallenge(input: VerifyChallengeInput): VerifyChallengeResult {
  const now = typeof input.nowMs === 'number' ? input.nowMs : Date.now();
  const token = typeof input.challengeToken === 'string' ? input.challengeToken.trim() : '';
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, code: 'INVALID_TOKEN', reason: 'Malformed challenge token.' };
  }

  const [payloadB64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getChallengeHmacSecret())
    .update(payloadB64)
    .digest('base64url');

  const sigBufA = Buffer.from(providedSig, 'utf8');
  const sigBufB = Buffer.from(expectedSig, 'utf8');
  if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
    return { valid: false, code: 'INVALID_TOKEN', reason: 'Invalid challenge signature.' };
  }

  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, code: 'INVALID_TOKEN', reason: 'Corrupted challenge payload.' };
  }

  if (!payload || typeof payload.nonce !== 'string' || typeof payload.expiresAt !== 'number') {
    return { valid: false, code: 'INVALID_TOKEN', reason: 'Incomplete challenge payload.' };
  }

  if (now > payload.expiresAt) {
    return { valid: false, code: 'EXPIRED', reason: 'Verification challenge expired. Refresh and try again.' };
  }

  // Prune old used nonces
  for (const [k, exp] of usedChallengeNonces.entries()) {
    if (exp < now) usedChallengeNonces.delete(k);
  }

  if (usedChallengeNonces.has(payload.nonce)) {
    return { valid: false, code: 'REPLAYED', reason: 'Challenge token already used.' };
  }

  // Check human confirmation interaction
  if (input.checkboxConfirmed !== true) {
    return { valid: false, code: 'NO_INTERACTION', reason: 'Please confirm the "I am not a bot" checkbox.' };
  }

  // Prevent instant automated script solving (< 600ms)
  if (typeof payload.issuedAt === 'number' && now - payload.issuedAt < 600) {
    return { valid: false, code: 'TOO_FAST', reason: 'Verification submitted too quickly. Please try again.' };
  }

  const cleanAnswer = sanitizeString(input.answer, 16, '').replace(/\s+/g, '').toUpperCase();
  if (!cleanAnswer) {
    return { valid: false, code: 'WRONG_ANSWER', reason: 'Please enter the verification characters shown.' };
  }

  const candidateHash = crypto
    .createHash('sha256')
    .update(`${cleanAnswer}:${payload.salt}`)
    .digest('hex');

  const hashBufA = Buffer.from(candidateHash, 'hex');
  const hashBufB = Buffer.from(String(payload.expectedHash || ''), 'hex');
  if (hashBufA.length !== hashBufB.length || !crypto.timingSafeEqual(hashBufA, hashBufB)) {
    return { valid: false, code: 'WRONG_ANSWER', reason: 'CAPTCHA characters did not match.' };
  }

  // Burn single-use nonce after successful verification
  usedChallengeNonces.set(payload.nonce, payload.expiresAt);
  return { valid: true, code: 'VERIFIED' };
}

// --- Visitor Persistence (MongoDB + JSON Disk Fallback) ---

export interface RecordVisitInput {
  visitorId?: string;
  visitorSecret?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  screenRes?: string;
  language?: string;
  timezone?: string;
  clientIp?: string;
  country?: string;
  pageUrl?: string;
  referrer?: string;
  userAgent?: string;
  webdriver?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
  pluginsCount?: number;
  languagesCount?: number;
  hardwareConcurrency?: number;
  forceChallenge?: boolean;
}

export async function recordVisitorVisit(input: RecordVisitInput): Promise<{
  visitor: VisitorRecord;
  isNewVisitor: boolean;
  challengeRequired: boolean;
}> {
  const safeId = isValidVisitorId(input.visitorId) ? input.visitorId : generateVisitorId();
  const providedSecret =
    typeof input.visitorSecret === 'string' && /^[a-zA-Z0-9_-]{16,128}$/.test(input.visitorSecret)
      ? input.visitorSecret
      : crypto.randomBytes(16).toString('hex');

  let existing: StoredVisitorInternal | undefined = memoryVisitors.get(safeId);

  if (!existing && isDatabaseConnected()) {
    try {
      const dbDoc = await VisitorModel.findOne({ visitorId: safeId }).lean().exec();
      if (dbDoc) {
        existing = {
          visitorId: dbDoc.visitorId,
          visitorSecret: dbDoc.visitorSecret,
          visitCount: dbDoc.visitCount || 1,
          watchTimeSeconds: dbDoc.watchTimeSeconds || 0,
          classification: (dbDoc.classification as VisitorClassification) || 'Human',
          safetyStatus: (dbDoc.safetyStatus as VisitorSafetyStatus) || 'Safe',
          riskScore: dbDoc.riskScore || 0,
          securitySignals: Array.isArray(dbDoc.securitySignals) ? dbDoc.securitySignals : [],
          challengeStatus: (dbDoc.challengeStatus as VisitorChallengeStatus) || 'none',
          humanVerified: Boolean(dbDoc.humanVerified),
          label: (dbDoc.label as VisitorLabel) || 'unlabeled',
          adminNotes: dbDoc.adminNotes || '',
          deviceType: dbDoc.deviceType || 'Desktop',
          browser: dbDoc.browser || 'Unknown',
          os: dbDoc.os || 'Unknown',
          screenRes: dbDoc.screenRes || 'Unknown',
          language: dbDoc.language || 'en-US',
          timezone: dbDoc.timezone || 'Asia/Kolkata',
          clientIp: dbDoc.clientIp || 'Unknown',
          country: dbDoc.country || 'Unknown',
          pageUrl: dbDoc.pageUrl || '/',
          referrer: dbDoc.referrer || 'Direct Visit',
          userAgent: dbDoc.userAgent || '',
          pagesVisited: Array.isArray(dbDoc.pagesVisited) ? dbDoc.pagesVisited : ['/'],
          firstSeenAt: dbDoc.firstSeenAt ? new Date(dbDoc.firstSeenAt).toISOString() : new Date().toISOString(),
          lastSeenAt: dbDoc.lastSeenAt ? new Date(dbDoc.lastSeenAt).toISOString() : new Date().toISOString(),
        };
      }
    } catch {}
  }

  const assessment = assessVisitorRisk({
    userAgent: input.userAgent,
    clientIp: input.clientIp,
    visitorId: safeId,
    pageUrl: input.pageUrl,
    referrer: input.referrer,
    webdriver: input.webdriver,
    viewportWidth: input.viewportWidth,
    viewportHeight: input.viewportHeight,
    pluginsCount: input.pluginsCount,
    languagesCount: input.languagesCount,
    hardwareConcurrency: input.hardwareConcurrency,
    forceChallenge: input.forceChallenge,
    alreadyVerified: Boolean(existing?.humanVerified),
  });

  const nowIso = new Date().toISOString();
  const cleanPage = sanitizeString(input.pageUrl, 200, '/');
  let pathnameOnly = '/';
  try {
    pathnameOnly = cleanPage.startsWith('http') ? new URL(cleanPage).pathname || '/' : cleanPage;
  } catch {
    pathnameOnly = cleanPage.slice(0, 120) || '/';
  }

  const prevPages = existing?.pagesVisited || [];
  const nextPages = Array.from(new Set([...prevPages, pathnameOnly])).slice(0, 50);

  const isNewVisitor = !existing;
  const challengeStatus: VisitorChallengeStatus = assessment.challengeRequired
    ? 'triggered'
    : existing?.humanVerified
    ? 'passed'
    : existing?.challengeStatus || 'none';

  const updated: StoredVisitorInternal = {
    visitorId: safeId,
    visitorSecret: existing?.visitorSecret || providedSecret,
    visitCount: existing ? existing.visitCount + 1 : 1,
    watchTimeSeconds: existing?.watchTimeSeconds || 0,
    classification: assessment.classification,
    safetyStatus: assessment.safetyStatus,
    riskScore: assessment.riskScore,
    securitySignals: assessment.securitySignals.slice(0, 12),
    challengeStatus,
    humanVerified: existing?.humanVerified && !input.forceChallenge ? true : false,
    label: existing?.label || 'unlabeled',
    adminNotes: existing?.adminNotes || '',
    deviceType: sanitizeString(input.deviceType, 40, existing?.deviceType || 'Desktop'),
    browser: sanitizeString(input.browser, 80, existing?.browser || 'Unknown'),
    os: sanitizeString(input.os, 80, existing?.os || 'Unknown'),
    screenRes: sanitizeString(input.screenRes, 80, existing?.screenRes || 'Unknown'),
    language: sanitizeString(input.language, 32, existing?.language || 'en-US'),
    timezone: sanitizeString(input.timezone, 64, existing?.timezone || 'Asia/Kolkata'),
    clientIp: sanitizeString(input.clientIp, 64, existing?.clientIp || 'Unknown'),
    country: sanitizeString(input.country, 64, existing?.country || 'Unknown'),
    pageUrl: sanitizeString(input.pageUrl, 300, '/'),
    referrer: sanitizeString(input.referrer, 300, existing?.referrer || 'Direct Visit'),
    userAgent: sanitizeString(input.userAgent, 400, existing?.userAgent || ''),
    pagesVisited: nextPages,
    firstSeenAt: existing?.firstSeenAt || nowIso,
    lastSeenAt: nowIso,
  };

  memoryVisitors.set(safeId, updated);
  saveVisitorsToDisk();

  if (isDatabaseConnected()) {
    try {
      await VisitorModel.findOneAndUpdate(
        { visitorId: safeId },
        {
          ...updated,
          firstSeenAt: new Date(updated.firstSeenAt),
          lastSeenAt: new Date(updated.lastSeenAt),
        },
        { upsert: true, returnDocument: 'after' }
      ).exec();
    } catch (e) {
      console.warn('[VisitorSecurity] MongoDB upsert failed:', e);
    }
  }

  return {
    visitor: stripVisitorSecret(updated),
    isNewVisitor,
    challengeRequired: assessment.challengeRequired,
  };
}

export async function updateVisitorHeartbeat(input: {
  visitorId: string;
  visitorSecret?: string;
  deltaSeconds: number;
  pagePath?: string;
}): Promise<{ ok: boolean; watchTimeSeconds: number }> {
  if (!isValidVisitorId(input.visitorId)) {
    return { ok: false, watchTimeSeconds: 0 };
  }

  const rawDelta = Number(input.deltaSeconds);
  if (!Number.isFinite(rawDelta) || rawDelta <= 0) {
    const existing = memoryVisitors.get(input.visitorId);
    return { ok: true, watchTimeSeconds: existing?.watchTimeSeconds || 0 };
  }

  // Strictly clamp delta to [0, 300] seconds per heartbeat ping to prevent tampering
  const clampedDelta = Math.min(300, Math.max(0, Math.round(rawDelta)));

  let existing = memoryVisitors.get(input.visitorId);
  if (!existing && isDatabaseConnected()) {
    try {
      const dbDoc = await VisitorModel.findOne({ visitorId: input.visitorId }).lean().exec();
      if (dbDoc) {
        existing = {
          ...(dbDoc as any),
          firstSeenAt: new Date(dbDoc.firstSeenAt).toISOString(),
          lastSeenAt: new Date(dbDoc.lastSeenAt).toISOString(),
        };
      }
    } catch {}
  }

  if (!existing) {
    return { ok: false, watchTimeSeconds: 0 };
  }

  if (input.visitorSecret && existing.visitorSecret && input.visitorSecret !== existing.visitorSecret) {
    return { ok: false, watchTimeSeconds: existing.watchTimeSeconds };
  }

  const nextWatch = Math.min(86400 * 30, existing.watchTimeSeconds + clampedDelta);
  const nextPage = sanitizeString(input.pagePath, 160, '');
  const nextPages =
    nextPage && !existing.pagesVisited.includes(nextPage)
      ? [...existing.pagesVisited, nextPage].slice(0, 50)
      : existing.pagesVisited;

  const updated: StoredVisitorInternal = {
    ...existing,
    watchTimeSeconds: nextWatch,
    pagesVisited: nextPages,
    lastSeenAt: new Date().toISOString(),
  };

  memoryVisitors.set(input.visitorId, updated);
  saveVisitorsToDisk();

  if (isDatabaseConnected()) {
    try {
      await VisitorModel.updateOne(
        { visitorId: input.visitorId },
        {
          $set: {
            watchTimeSeconds: nextWatch,
            pagesVisited: nextPages,
            lastSeenAt: new Date(updated.lastSeenAt),
          },
        }
      ).exec();
    } catch {}
  }

  return { ok: true, watchTimeSeconds: nextWatch };
}

export async function markVisitorChallengeResult(input: {
  visitorId?: string;
  passed: boolean;
}): Promise<VisitorRecord | null> {
  if (!isValidVisitorId(input.visitorId)) return null;
  const existing = memoryVisitors.get(input.visitorId);
  if (!existing) return null;

  const updated: StoredVisitorInternal = {
    ...existing,
    challengeStatus: input.passed ? 'passed' : 'failed',
    humanVerified: input.passed ? true : existing.humanVerified,
    safetyStatus: input.passed ? 'Verified' : 'Challenged',
    classification: input.passed ? 'Human' : existing.classification,
    riskScore: input.passed ? Math.min(existing.riskScore, 15) : Math.min(100, existing.riskScore + 15),
    securitySignals: Array.from(
      new Set([
        ...existing.securitySignals,
        input.passed ? 'Passed Human Verification CAPTCHA' : 'Failed CAPTCHA Attempt',
      ])
    ).slice(0, 12),
    lastSeenAt: new Date().toISOString(),
  };

  memoryVisitors.set(existing.visitorId, updated);
  saveVisitorsToDisk();

  if (isDatabaseConnected()) {
    try {
      await VisitorModel.updateOne(
        { visitorId: existing.visitorId },
        {
          $set: {
            challengeStatus: updated.challengeStatus,
            humanVerified: updated.humanVerified,
            safetyStatus: updated.safetyStatus,
            classification: updated.classification,
            riskScore: updated.riskScore,
            securitySignals: updated.securitySignals,
            lastSeenAt: new Date(updated.lastSeenAt),
          },
        }
      ).exec();
    } catch {}
  }

  return stripVisitorSecret(updated);
}

export async function listVisitors(filters?: {
  label?: string;
  classification?: string;
  search?: string;
}): Promise<{
  visitors: VisitorRecord[];
  stats: {
    totalUniqueVisitors: number;
    totalVisits: number;
    totalWatchTimeSeconds: number;
    humanCount: number;
    botCount: number;
    systemCount: number;
    suspiciousCount: number;
  };
}> {
  if (isDatabaseConnected()) {
    try {
      const dbDocs = await VisitorModel.find().sort({ lastSeenAt: -1 }).limit(500).lean().exec();
      for (const doc of dbDocs) {
        if (!memoryVisitors.has(doc.visitorId)) {
          memoryVisitors.set(doc.visitorId, {
            visitorId: doc.visitorId,
            visitorSecret: doc.visitorSecret,
            visitCount: doc.visitCount || 1,
            watchTimeSeconds: doc.watchTimeSeconds || 0,
            classification: (doc.classification as VisitorClassification) || 'Human',
            safetyStatus: (doc.safetyStatus as VisitorSafetyStatus) || 'Safe',
            riskScore: doc.riskScore || 0,
            securitySignals: Array.isArray(doc.securitySignals) ? doc.securitySignals : [],
            challengeStatus: (doc.challengeStatus as VisitorChallengeStatus) || 'none',
            humanVerified: Boolean(doc.humanVerified),
            label: (doc.label as VisitorLabel) || 'unlabeled',
            adminNotes: doc.adminNotes || '',
            deviceType: doc.deviceType || 'Desktop',
            browser: doc.browser || 'Unknown',
            os: doc.os || 'Unknown',
            screenRes: doc.screenRes || 'Unknown',
            language: doc.language || 'en-US',
            timezone: doc.timezone || 'Asia/Kolkata',
            clientIp: doc.clientIp || 'Unknown',
            country: doc.country || 'Unknown',
            pageUrl: doc.pageUrl || '/',
            referrer: doc.referrer || 'Direct Visit',
            userAgent: doc.userAgent || '',
            pagesVisited: Array.isArray(doc.pagesVisited) ? doc.pagesVisited : ['/'],
            firstSeenAt: new Date(doc.firstSeenAt).toISOString(),
            lastSeenAt: new Date(doc.lastSeenAt).toISOString(),
          });
        }
      }
    } catch {}
  }

  const all = Array.from(memoryVisitors.values()).sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  );

  const stats = {
    totalUniqueVisitors: all.length,
    totalVisits: all.reduce((sum, v) => sum + (v.visitCount || 1), 0),
    totalWatchTimeSeconds: all.reduce((sum, v) => sum + (v.watchTimeSeconds || 0), 0),
    humanCount: all.filter((v) => v.classification === 'Human').length,
    botCount: all.filter((v) => v.classification === 'Bot').length,
    systemCount: all.filter((v) => v.classification === 'System').length,
    suspiciousCount: all.filter((v) => v.classification === 'Suspicious').length,
  };

  let filtered = all;
  if (filters?.label && filters.label !== 'all') {
    filtered = filtered.filter((v) => v.label === filters.label);
  }
  if (filters?.classification && filters.classification !== 'all') {
    filtered = filtered.filter((v) => v.classification === filters.classification);
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.visitorId.toLowerCase().includes(q) ||
        v.browser.toLowerCase().includes(q) ||
        v.os.toLowerCase().includes(q) ||
        v.clientIp.toLowerCase().includes(q) ||
        v.country.toLowerCase().includes(q) ||
        v.adminNotes.toLowerCase().includes(q) ||
        v.label.toLowerCase().includes(q)
    );
  }

  return {
    visitors: filtered.map(stripVisitorSecret),
    stats,
  };
}

export function getPublicVisitorById(visitorId?: string): VisitorRecord | null {
  if (!isValidVisitorId(visitorId)) return null;
  const item = memoryVisitors.get(visitorId);
  return item ? stripVisitorSecret(item) : null;
}

export async function updateVisitorLabel(
  visitorId: string,
  updates: { label: VisitorLabel; adminNotes?: string }
): Promise<{ success: boolean; visitor?: VisitorRecord; error?: string }> {
  if (!isValidVisitorId(visitorId)) {
    return { success: false, error: 'Invalid visitorId format.' };
  }
  if (!VALID_VISITOR_LABELS.includes(updates.label)) {
    return { success: false, error: 'Invalid label value.' };
  }

  const existing = memoryVisitors.get(visitorId);
  if (!existing) {
    return { success: false, error: 'Visitor record not found.' };
  }

  const updated: StoredVisitorInternal = {
    ...existing,
    label: updates.label,
    adminNotes:
      typeof updates.adminNotes === 'string'
        ? sanitizeString(updates.adminNotes, 500, '')
        : existing.adminNotes,
  };

  memoryVisitors.set(visitorId, updated);
  saveVisitorsToDisk();

  if (isDatabaseConnected()) {
    try {
      await VisitorModel.updateOne(
        { visitorId },
        { $set: { label: updated.label, adminNotes: updated.adminNotes } }
      ).exec();
    } catch {}
  }

  return { success: true, visitor: stripVisitorSecret(updated) };
}

export async function deleteVisitor(visitorId: string): Promise<boolean> {
  if (!isValidVisitorId(visitorId)) return false;
  const existed = memoryVisitors.delete(visitorId);
  saveVisitorsToDisk();

  if (isDatabaseConnected()) {
    try {
      await VisitorModel.deleteOne({ visitorId }).exec();
    } catch {}
  }

  return existed;
}
