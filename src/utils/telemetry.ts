/**
 * Silent Visitor Telemetry, Watch-Time Tracker & Security Signal Utility
 * Runs silently in the background with ZERO login prompts or banners for normal visitors.
 * Only doubted/suspicious visitors trigger the Human Verification ("I am not a bot") challenge.
 */
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { VisitorClassification, VisitorSafetyStatus, VisitorChallengeStatus } from '../types';

export interface TelemetryData {
  visitorId: string;
  visitorSecret: string;
  visitCount: number;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  screenRes: string;
  language: string;
  timezone: string;
  pageUrl: string;
  referrer: string;
  userAgent: string;
  webdriver: boolean;
  viewportWidth: number;
  viewportHeight: number;
  pluginsCount: number;
  languagesCount: number;
  hardwareConcurrency: number;
  alreadyVerified: boolean;
}

const VISITOR_ID_KEY = 'portfolio_visitor_id';
const VISITOR_SECRET_KEY = 'portfolio_visitor_secret';
const VISITOR_COUNT_KEY = 'portfolio_visitor_count';
const VISITOR_WATCH_KEY = 'portfolio_visitor_watch_sec';
const VISITOR_FS_CREATED_KEY = 'portfolio_visitor_fs_created';
const VISITOR_HUMAN_VERIFIED_KEY = 'portfolio_human_verified';

function randomHex(byteLen: number): string {
  const bytes = new Uint8Array(byteLen);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLen; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function generateClientVisitorId(): string {
  const now = new Date();
  const y = String(now.getUTCFullYear()).slice(-2);
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `VIS-${y}${m}${d}-${randomHex(3)}`;
}

export function getOrCreateVisitorIdentity(): {
  visitorId: string;
  visitorSecret: string;
  visitCount: number;
  watchTimeSeconds: number;
  fsCreated: boolean;
} {
  let visitorId = '';
  let visitorSecret = '';
  let visitCount = 1;
  let watchTimeSeconds = 0;
  let fsCreated = false;

  try {
    visitorId = localStorage.getItem(VISITOR_ID_KEY) || '';
    if (!/^VIS-[a-zA-Z0-9_-]{4,64}$/.test(visitorId)) {
      visitorId = generateClientVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    visitorSecret = localStorage.getItem(VISITOR_SECRET_KEY) || '';
    if (!/^[a-zA-Z0-9_-]{16,128}$/.test(visitorSecret)) {
      visitorSecret = randomHex(16).toLowerCase();
      localStorage.setItem(VISITOR_SECRET_KEY, visitorSecret);
    }

    visitCount = Math.max(1, parseInt(localStorage.getItem(VISITOR_COUNT_KEY) || '1', 10) || 1);
    watchTimeSeconds = Math.max(
      0,
      parseInt(localStorage.getItem(VISITOR_WATCH_KEY) || '0', 10) || 0
    );
    fsCreated = localStorage.getItem(VISITOR_FS_CREATED_KEY) === 'true';
  } catch {
    visitorId = generateClientVisitorId();
    visitorSecret = randomHex(16).toLowerCase();
  }

  return { visitorId, visitorSecret, visitCount, watchTimeSeconds, fsCreated };
}

export function getCurrentVisitorId(): string {
  return getOrCreateVisitorIdentity().visitorId;
}

function detectBrowserAndOS(): {
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
} {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Trident')) browser = 'Internet Explorer';
  else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Google Chrome';
  else if (ua.includes('Safari')) browser = 'Apple Safari';

  if (ua.includes('Win')) os = 'Windows OS';
  else if (ua.includes('Android')) os = 'Android OS';
  else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS Device';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux OS';

  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
  if (/Mobi|Android|iPhone/i.test(ua) || width < 640) {
    deviceType = 'Mobile';
  } else if (/iPad|Tablet/i.test(ua) || (width >= 640 && width <= 1024)) {
    deviceType = 'Tablet';
  }

  return { browser, os, deviceType };
}

const KNOWN_BOT_UA_RE =
  /(googlebot|google-inspectiontool|bingbot|duckduckbot|applebot|gptbot|oai-searchbot|claudebot|perplexitybot|yandexbot|slurp)/i;

let hasTrackedThisSession = false;
let watchIntervalStarted = false;
let pendingWatchSeconds = 0;
let currentTrackedPage = '/';
const pagesVisitedSet = new Set<string>();

function sanitizePath(p: string): string {
  return (p || '/').slice(0, 140);
}

async function syncVisitorToFirestore(params: {
  visitorId: string;
  visitorSecret: string;
  visitCount: number;
  watchTimeSeconds: number;
  classification: VisitorClassification;
  safetyStatus: VisitorSafetyStatus;
  riskScore: number;
  securitySignals: string[];
  challengeStatus: VisitorChallengeStatus;
  humanVerified: boolean;
  payload: TelemetryData;
  isNewFirestoreDoc: boolean;
}): Promise<void> {
  try {
    const ref = doc(db, 'visitors', params.visitorId);
    const nowIso = new Date().toISOString().slice(0, 40);
    const pagesArr = Array.from(pagesVisitedSet).slice(0, 50);
    if (pagesArr.length === 0) pagesArr.push('/');

    if (params.isNewFirestoreDoc) {
      await setDoc(ref, {
        visitorId: params.visitorId,
        visitorSecret: params.visitorSecret,
        visitCount: 1,
        watchTimeSeconds: Math.min(300, Math.max(0, Math.round(params.watchTimeSeconds))),
        classification: params.classification,
        safetyStatus: params.safetyStatus,
        riskScore: Math.min(100, Math.max(0, Math.round(params.riskScore))),
        securitySignals: (params.securitySignals || []).slice(0, 15).map((s) => String(s).slice(0, 120)),
        challengeStatus: params.challengeStatus,
        humanVerified: Boolean(params.humanVerified),
        label: 'unlabeled',
        adminNotes: '',
        deviceType: params.payload.deviceType.slice(0, 40),
        browser: params.payload.browser.slice(0, 80),
        os: params.payload.os.slice(0, 80),
        screenRes: params.payload.screenRes.slice(0, 80),
        language: params.payload.language.slice(0, 32),
        timezone: params.payload.timezone.slice(0, 64),
        clientIp: 'Client-Edge',
        country: 'Unknown',
        pageUrl: params.payload.pageUrl.slice(0, 300),
        referrer: params.payload.referrer.slice(0, 300),
        userAgent: params.payload.userAgent.slice(0, 400),
        pagesVisited: pagesArr,
        firstSeenAt: nowIso,
        lastSeenAt: nowIso,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      try {
        localStorage.setItem(VISITOR_FS_CREATED_KEY, 'true');
        localStorage.setItem(VISITOR_COUNT_KEY, '1');
      } catch {}
      return;
    }

    try {
      await updateDoc(ref, {
        visitCount: Math.max(1, Math.round(params.visitCount)),
        watchTimeSeconds: Math.max(0, Math.round(params.watchTimeSeconds)),
        classification: params.classification,
        safetyStatus: params.safetyStatus,
        riskScore: Math.min(100, Math.max(0, Math.round(params.riskScore))),
        securitySignals: (params.securitySignals || []).slice(0, 15).map((s) => String(s).slice(0, 120)),
        challengeStatus: params.challengeStatus,
        humanVerified: Boolean(params.humanVerified),
        deviceType: params.payload.deviceType.slice(0, 40),
        browser: params.payload.browser.slice(0, 80),
        os: params.payload.os.slice(0, 80),
        screenRes: params.payload.screenRes.slice(0, 80),
        language: params.payload.language.slice(0, 32),
        timezone: params.payload.timezone.slice(0, 64),
        pageUrl: params.payload.pageUrl.slice(0, 300),
        referrer: params.payload.referrer.slice(0, 300),
        userAgent: params.payload.userAgent.slice(0, 400),
        pagesVisited: pagesArr,
        lastSeenAt: nowIso,
        updatedAt: serverTimestamp(),
      });
    } catch (updateErr: any) {
      const code = updateErr?.code || '';
      if (code === 'not-found') {
        await setDoc(ref, {
          visitorId: params.visitorId,
          visitorSecret: params.visitorSecret,
          visitCount: 1,
          watchTimeSeconds: 0,
          classification: params.classification,
          safetyStatus: params.safetyStatus,
          riskScore: Math.min(100, Math.max(0, Math.round(params.riskScore))),
          securitySignals: (params.securitySignals || []).slice(0, 15).map((s) => String(s).slice(0, 120)),
          challengeStatus: params.challengeStatus,
          humanVerified: Boolean(params.humanVerified),
          label: 'unlabeled',
          adminNotes: '',
          deviceType: params.payload.deviceType.slice(0, 40),
          browser: params.payload.browser.slice(0, 80),
          os: params.payload.os.slice(0, 80),
          screenRes: params.payload.screenRes.slice(0, 80),
          language: params.payload.language.slice(0, 32),
          timezone: params.payload.timezone.slice(0, 64),
          clientIp: 'Client-Edge',
          country: 'Unknown',
          pageUrl: params.payload.pageUrl.slice(0, 300),
          referrer: params.payload.referrer.slice(0, 300),
          userAgent: params.payload.userAgent.slice(0, 400),
          pagesVisited: pagesArr,
          firstSeenAt: nowIso,
          lastSeenAt: nowIso,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        try {
          localStorage.setItem(VISITOR_FS_CREATED_KEY, 'true');
          localStorage.setItem(VISITOR_COUNT_KEY, '1');
        } catch {}
      }
    }
  } catch {
    // Silent failure so visitors never experience any console/UI errors
  }
}

async function flushWatchTimeHeartbeat(useBeacon: boolean = false): Promise<void> {
  if (pendingWatchSeconds <= 0) return;
  const delta = Math.min(300, Math.round(pendingWatchSeconds));
  pendingWatchSeconds = 0;

  const { visitorId, visitorSecret, watchTimeSeconds, fsCreated } = getOrCreateVisitorIdentity();
  const nextTotal = watchTimeSeconds + delta;
  try {
    localStorage.setItem(VISITOR_WATCH_KEY, String(nextTotal));
  } catch {}

  const bodyObj = {
    visitorId,
    visitorSecret,
    deltaSeconds: delta,
    pagePath: currentTrackedPage,
  };

  if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([JSON.stringify(bodyObj)], { type: 'text/plain;charset=UTF-8' });
      navigator.sendBeacon('/api/telemetry/heartbeat', blob);
    } catch {}
  } else {
    fetch('/api/telemetry/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj),
      keepalive: true,
    }).catch(() => {});
  }

  if (fsCreated) {
    try {
      await updateDoc(doc(db, 'visitors', visitorId), {
        watchTimeSeconds: nextTotal,
        pagesVisited: Array.from(pagesVisitedSet).slice(0, 50),
        lastSeenAt: new Date().toISOString().slice(0, 40),
        updatedAt: serverTimestamp(),
      });
    } catch {}
  }
}

function startActiveWatchTimeTracker(): void {
  if (watchIntervalStarted || typeof window === 'undefined') return;
  watchIntervalStarted = true;

  currentTrackedPage = sanitizePath(window.location.pathname || '/');
  pagesVisitedSet.add(currentTrackedPage);

  // Increment active watch counter every 1s only while tab is visible
  window.setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      pendingWatchSeconds += 1;
    }
  }, 1000);

  // Flush to backend & Firestore every 15s
  window.setInterval(() => {
    if (pendingWatchSeconds > 0) {
      flushWatchTimeHeartbeat(false).catch(() => {});
    }
  }, 15000);

  const handleVisibilityOrExit = () => {
    if (document.visibilityState === 'hidden') {
      flushWatchTimeHeartbeat(true).catch(() => {});
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityOrExit);
  window.addEventListener('pagehide', () => {
    flushWatchTimeHeartbeat(true).catch(() => {});
  });
}

export function trackPageNavigation(pathname: string): void {
  const clean = sanitizePath(pathname);
  currentTrackedPage = clean;
  pagesVisitedSet.add(clean);
}

export function markLocalHumanVerified(): void {
  try {
    sessionStorage.setItem(VISITOR_HUMAN_VERIFIED_KEY, 'true');
  } catch {}

  const { visitorId, fsCreated } = getOrCreateVisitorIdentity();
  if (fsCreated) {
    updateDoc(doc(db, 'visitors', visitorId), {
      classification: 'Human',
      safetyStatus: 'Verified',
      challengeStatus: 'passed',
      humanVerified: true,
      riskScore: 10,
      lastSeenAt: new Date().toISOString().slice(0, 40),
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  }
}

export function triggerHumanVerificationTest(): void {
  if (typeof window === 'undefined') return;
  const { visitorId } = getOrCreateVisitorIdentity();
  window.dispatchEvent(
    new CustomEvent('portfolio:human-challenge', {
      detail: {
        visitorId,
        classification: 'Suspicious',
        riskScore: 72,
        reason: 'Admin Security Verification Test ("I am not a bot" + SVG CAPTCHA)',
        isTestMode: true,
      },
    })
  );
}

export const trackVisitorTelemetry = async (): Promise<boolean> => {
  try {
    startActiveWatchTimeTracker();

    const identity = getOrCreateVisitorIdentity();
    const { browser, os, deviceType } = detectBrowserAndOS();
    const screenRes = `${window.screen.width}x${window.screen.height} (Viewport: ${window.innerWidth}x${window.innerHeight})`;
    const language = navigator.language || 'en-US';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    const pageUrl = window.location.href;
    const referrer = document.referrer || 'Direct Visit / Bookmark / Reload';
    const userAgent = navigator.userAgent || '';

    const alreadyTrackedSession =
      hasTrackedThisSession ||
      (typeof sessionStorage !== 'undefined' &&
        Boolean(sessionStorage.getItem('portfolio_telemetry_tracked')));

    if (alreadyTrackedSession) {
      hasTrackedThisSession = true;
      return true;
    }

    const nextVisitCount = identity.fsCreated ? identity.visitCount + 1 : 1;
    try {
      localStorage.setItem(VISITOR_COUNT_KEY, String(nextVisitCount));
      sessionStorage.setItem('portfolio_telemetry_tracked', 'true');
    } catch {}
    hasTrackedThisSession = true;

    const isVerified =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(VISITOR_HUMAN_VERIFIED_KEY) === 'true';

    const payload: TelemetryData = {
      visitorId: identity.visitorId,
      visitorSecret: identity.visitorSecret,
      visitCount: nextVisitCount,
      deviceType,
      browser,
      os,
      screenRes,
      language,
      timezone,
      pageUrl,
      referrer,
      userAgent,
      webdriver: Boolean((navigator as any).webdriver),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pluginsCount: navigator.plugins ? navigator.plugins.length : 0,
      languagesCount: navigator.languages ? navigator.languages.length : 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      alreadyVerified: isVerified,
    };

    const response = await fetch('/api/telemetry/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let classification: VisitorClassification = KNOWN_BOT_UA_RE.test(userAgent) ? 'Bot' : 'Human';
    let safetyStatus: VisitorSafetyStatus = classification === 'Bot' ? 'Crawler' : 'Safe';
    let riskScore = classification === 'Bot' ? 5 : 0;
    let securitySignals: string[] =
      classification === 'Bot' ? ['Search/AI Crawler'] : ['Normal Browser Behavior'];
    let challengeRequired = false;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data?.classification) classification = data.classification;
      if (data?.safetyStatus) safetyStatus = data.safetyStatus;
      if (typeof data?.riskScore === 'number') riskScore = data.riskScore;
      if (Array.isArray(data?.visitor?.securitySignals)) {
        securitySignals = data.visitor.securitySignals;
      } else if (Array.isArray(data?.securitySignals)) {
        securitySignals = data.securitySignals;
      }
      challengeRequired = Boolean(data?.challengeRequired);
    }

    // Client-side backup suspicion guard (in case backend unreachable & headless detected)
    if (!KNOWN_BOT_UA_RE.test(userAgent) && !isVerified) {
      if (payload.webdriver || payload.viewportWidth === 0 || payload.viewportHeight === 0) {
        classification = payload.webdriver ? 'System' : 'Suspicious';
        safetyStatus = 'Challenged';
        riskScore = Math.max(riskScore, 65);
        challengeRequired = true;
      }
    }

    // Sync quietly to Firestore so live portfolio (Netlify) records every unique visitor & watch time
    syncVisitorToFirestore({
      visitorId: identity.visitorId,
      visitorSecret: identity.visitorSecret,
      visitCount: nextVisitCount,
      watchTimeSeconds: identity.watchTimeSeconds,
      classification,
      safetyStatus,
      riskScore,
      securitySignals,
      challengeStatus: challengeRequired ? 'triggered' : isVerified ? 'passed' : 'none',
      humanVerified: isVerified,
      payload,
      isNewFirestoreDoc: !identity.fsCreated,
    }).catch(() => {});

    // Trigger interactive Human CAPTCHA overlay ONLY if doubted / suspicious
    if (challengeRequired && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('portfolio:human-challenge', {
          detail: {
            visitorId: identity.visitorId,
            classification,
            riskScore,
            reason: securitySignals.join(', ') || 'Unusual browser signals detected',
            isTestMode: false,
          },
        })
      );
    }

    return true;
  } catch {
    return false;
  }
};
