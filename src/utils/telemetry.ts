/**
 * Silent Telemetry & Activity Logging Utility
 * Captures visitor device metadata and sends to server for Telegram notifications & Console Audit Logs.
 * Runs 100% silently in the background with ZERO UI notifications to visitors.
 */

export interface TelemetryData {
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  screenRes: string;
  language: string;
  timezone: string;
  pageUrl: string;
  referrer: string;
}

function detectBrowserAndOS(): { browser: string; os: string; deviceType: 'Desktop' | 'Mobile' | 'Tablet' } {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Browser Detection
  if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Trident')) browser = 'Internet Explorer';
  else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Google Chrome';
  else if (ua.includes('Safari')) browser = 'Apple Safari';

  // OS Detection
  if (ua.includes('Win')) os = 'Windows OS';
  else if (ua.includes('Android')) os = 'Android OS';
  else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) os = 'iOS Device';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux OS';

  // Device Type
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  const width = window.innerWidth;
  if (/Mobi|Android|iPhone/i.test(ua) || width < 640) {
    deviceType = 'Mobile';
  } else if (/iPad|Tablet/i.test(ua) || (width >= 640 && width <= 1024)) {
    deviceType = 'Tablet';
  }

  return { browser, os, deviceType };
}

export const trackVisitorTelemetry = async (): Promise<boolean> => {
  try {
    const { browser, os, deviceType } = detectBrowserAndOS();
    const screenRes = `${window.screen.width}x${window.screen.height} (Viewport: ${window.innerWidth}x${window.innerHeight})`;
    const language = navigator.language || 'en-US';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    const pageUrl = window.location.href;
    const referrer = document.referrer || 'Direct Visit / Bookmark / Reload';

    const payload: TelemetryData = {
      deviceType,
      browser,
      os,
      screenRes,
      language,
      timezone,
      pageUrl,
      referrer,
    };

    // Send silently to server endpoint (no UI feedback or toasts)
    const response = await fetch('/api/telemetry/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return !!data.success;
  } catch (err) {
    // Fail silently without disturbing the user
    console.debug('Visitor telemetry ping complete');
    return false;
  }
};
