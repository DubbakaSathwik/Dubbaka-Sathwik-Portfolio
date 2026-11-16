import assert from 'assert';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import {
  assessVisitorRisk,
  deleteVisitor,
  issueHumanChallenge,
  resetBurstTrackerForTests,
  verifyHumanChallenge,
} from '../server/services/visitorSecurity';
import { generateToken, verifyTokenAsync } from '../server/middleware/auth';
import {
  formatHumanVerificationMessage,
  formatVisitorTelemetryMessage,
} from '../server/services/telegram';
import telemetryRouter from '../server/routes/telemetry';

async function runTests() {
  console.log('\n=== Portfolio Security & Visitor Intelligence Test Suite ===\n');
  resetBurstTrackerForTests();

  // 1. Visitor Classification Tests
  const humanRes = assessVisitorRisk({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    clientIp: '103.10.20.1',
    viewportWidth: 1440,
    viewportHeight: 900,
    webdriver: false,
    pluginsCount: 4,
    languagesCount: 2,
  });
  assert.strictEqual(humanRes.classification, 'Human');
  assert.strictEqual(humanRes.safetyStatus, 'Safe');
  assert.strictEqual(humanRes.challengeRequired, false);
  console.log('✓ 1. Normal browser visitor classified as Human (Safe, unchallenged)');

  for (const botUa of [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ClaudeBot/1.0',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; PerplexityBot/1.0',
  ]) {
    const botRes = assessVisitorRisk({
      userAgent: botUa,
      clientIp: '66.249.66.1',
    });
    assert.strictEqual(botRes.classification, 'Bot');
    assert.strictEqual(botRes.safetyStatus, 'Crawler');
    assert.strictEqual(botRes.challengeRequired, false);
  }
  console.log('✓ 2. Search & AI Crawlers (Googlebot, GPTBot, ClaudeBot, PerplexityBot) classified as Bot (Crawler, never blocked)');

  const systemRes = assessVisitorRisk({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/131.0.0.0',
    webdriver: true,
    viewportWidth: 800,
    viewportHeight: 600,
    clientIp: '10.0.0.55',
  });
  assert.strictEqual(systemRes.classification, 'System');
  assert.strictEqual(systemRes.challengeRequired, true);
  assert.ok(systemRes.riskScore >= 60);
  console.log('✓ 3. HeadlessChrome/WebDriver detected as System and challenged');

  const xssProbeRes = assessVisitorRisk({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0',
    pageUrl: 'https://dubbakasathwik.in/?search=<script>alert(1)</script>',
    clientIp: '192.0.2.99',
  });
  assert.strictEqual(xssProbeRes.classification, 'Suspicious');
  assert.strictEqual(xssProbeRes.challengeRequired, true);
  console.log('✓ 4. XSS / exploit probe classified as Suspicious and challenged');

  let lastBurstRes = humanRes;
  for (let i = 0; i < 11; i++) {
    lastBurstRes = assessVisitorRisk({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0.0.0',
      clientIp: '198.51.100.77',
    });
  }
  assert.strictEqual(lastBurstRes.classification, 'Suspicious');
  assert.strictEqual(lastBurstRes.challengeRequired, true);
  console.log('✓ 5. Rapid burst reload traffic flagged as Suspicious and challenged');

  // 2. Cryptographic CAPTCHA Security Tests
  const challenge = issueHumanChallenge('VIS-TEST-1001');
  assert.ok(challenge.captchaSvgDataUrl.startsWith('data:image/svg+xml;base64,'));
  assert.ok(!('answer' in challenge), 'Plaintext CAPTCHA answer must never leak in API payload');

  // Extract SVG letters cleanly just like human visual reading
  const svgXml = Buffer.from(
    challenge.captchaSvgDataUrl.replace('data:image/svg+xml;base64,', ''),
    'base64'
  ).toString('utf8');
  const codeChars = Array.from(svgXml.matchAll(/<text[^>]*>([A-Z0-9])<\/text>/g)).map((m) => m[1]);
  assert.strictEqual(codeChars.length, 6, 'SVG CAPTCHA must render 6 characters');
  const solvedCode = codeChars.join('');

  // Signature tamper fails
  const tamperedToken = challenge.challengeToken.slice(0, -4) + 'XXXX';
  assert.strictEqual(
    verifyHumanChallenge({
      challengeToken: tamperedToken,
      answer: solvedCode,
      checkboxConfirmed: true,
      nowMs: Date.now() + 2000,
    }).code,
    'INVALID_TOKEN'
  );

  // Missing checkbox fails
  assert.strictEqual(
    verifyHumanChallenge({
      challengeToken: challenge.challengeToken,
      answer: solvedCode,
      checkboxConfirmed: false,
      nowMs: Date.now() + 2000,
    }).code,
    'NO_INTERACTION'
  );

  // Too fast (<600ms) fails
  assert.strictEqual(
    verifyHumanChallenge({
      challengeToken: challenge.challengeToken,
      answer: solvedCode,
      checkboxConfirmed: true,
      nowMs: Date.now() + 100,
    }).code,
    'TOO_FAST'
  );

  // Wrong answer fails
  assert.strictEqual(
    verifyHumanChallenge({
      challengeToken: challenge.challengeToken,
      answer: 'WRONG1',
      checkboxConfirmed: true,
      nowMs: Date.now() + 2000,
    }).code,
    'WRONG_ANSWER'
  );

  // Valid solve passes
  const validPass = verifyHumanChallenge({
    challengeToken: challenge.challengeToken,
    answer: solvedCode,
    checkboxConfirmed: true,
    nowMs: Date.now() + 2000,
  });
  assert.strictEqual(validPass.valid, true);
  assert.strictEqual(validPass.code, 'VERIFIED');

  // Replay fails
  assert.strictEqual(
    verifyHumanChallenge({
      challengeToken: challenge.challengeToken,
      answer: solvedCode,
      checkboxConfirmed: true,
      nowMs: Date.now() + 2500,
    }).code,
    'REPLAYED'
  );
  console.log('✓ 6. CAPTCHA HMAC integrity, checkbox check, timing check, and anti-replay verified');

  // 3. JWT & Auth Hardening Tests
  const forgedUnsignedPayload = Buffer.from(
    JSON.stringify({
      iss: 'https://securetoken.google.com/potent-box-hs6r9',
      aud: 'potent-box-hs6r9',
      email: 'dubbakasathwik@gmail.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: 'attacker',
    })
  ).toString('base64url');
  const forgedNoneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const forgedToken = `${forgedNoneHeader}.${forgedUnsignedPayload}.`;
  assert.strictEqual(await verifyTokenAsync(forgedToken), null, 'Forged alg:none token must be rejected');

  const forgedHs256 = jwt.sign(
    {
      iss: 'https://securetoken.google.com/potent-box-hs6r9',
      aud: 'potent-box-hs6r9',
      email: 'dubbakasathwik@gmail.com',
      email_verified: true,
      sub: 'attacker',
    },
    'wrong-secret',
    { algorithm: 'HS256', expiresIn: '1h' }
  );
  assert.strictEqual(await verifyTokenAsync(forgedHs256), null, 'Forged HS256 token must be rejected');

  const validAdminJwt = generateToken({ role: 'admin', username: 'dubbakasathwik' });
  const verifiedAdmin = await verifyTokenAsync(validAdminJwt);
  assert.ok(verifiedAdmin && verifiedAdmin.role === 'admin');
  console.log('✓ 7. Auth hardening rejects alg:none & forged JWTs while accepting signed admin JWTs');

  // 4. End-to-End Telemetry API & RBAC HTTP Tests
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.text({ type: 'text/plain' }));
  app.use('/api/telemetry', telemetryRouter);

  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const createdIds: string[] = [];

  try {
    // 4a. Unauthenticated GET /visitors -> 401
    const unauthRes = await fetch(`${baseUrl}/api/telemetry/visitors`);
    assert.strictEqual(unauthRes.status, 401);

    // 4b. Forged token GET /visitors -> 403
    const forgedRes = await fetch(`${baseUrl}/api/telemetry/visitors`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.strictEqual(forgedRes.status, 403);

    // 4c. Record new visitor
    const testVid = `VIS-TEST-${Date.now().toString(36).toUpperCase()}`;
    createdIds.push(testVid);
    const visitRes = await fetch(`${baseUrl}/api/telemetry/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: testVid,
        visitorSecret: 'test_secret_1234567890abcdef',
        deviceType: 'Desktop',
        browser: 'Google Chrome',
        os: 'Windows OS',
        screenRes: '1920x1080',
        pageUrl: 'https://dubbakasathwik.in/',
        referrer: 'Google Search',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36',
        viewportWidth: 1920,
        viewportHeight: 1080,
      }),
    });
    const visitJson: any = await visitRes.json();
    assert.strictEqual(visitRes.status, 200);
    assert.strictEqual(visitJson.visitorId, testVid);
    assert.strictEqual(visitJson.classification, 'Human');
    assert.strictEqual(visitJson.challengeRequired, false);

    // 4d. Heartbeat clamps massive deltas & ignores negative values
    const hbRes1 = await fetch(`${baseUrl}/api/telemetry/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        visitorId: testVid,
        visitorSecret: 'test_secret_1234567890abcdef',
        deltaSeconds: 45,
        pagePath: '/insights',
      }),
    });
    const hbJson1: any = await hbRes1.json();
    assert.strictEqual(hbJson1.watchTimeSeconds, 45);

    const hbResTamper = await fetch(`${baseUrl}/api/telemetry/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: testVid,
        visitorSecret: 'test_secret_1234567890abcdef',
        deltaSeconds: 999999,
      }),
    });
    const hbJsonTamper: any = await hbResTamper.json();
    assert.strictEqual(hbJsonTamper.watchTimeSeconds, 345, 'Delta must be clamped to <= 300s');

    const hbResNeg = await fetch(`${baseUrl}/api/telemetry/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: testVid,
        visitorSecret: 'test_secret_1234567890abcdef',
        deltaSeconds: -200,
      }),
    });
    const hbJsonNeg: any = await hbResNeg.json();
    assert.strictEqual(hbJsonNeg.watchTimeSeconds, 345, 'Watch time must remain monotonically non-decreasing');

    // 4e. Admin GET /visitors strips visitorSecret & exposes watch time
    const adminListRes = await fetch(`${baseUrl}/api/telemetry/visitors`, {
      headers: { Authorization: `Bearer ${validAdminJwt}` },
    });
    assert.strictEqual(adminListRes.status, 200);
    const adminListJson: any = await adminListRes.json();
    const matched = adminListJson.visitors.find((v: any) => v.visitorId === testVid);
    assert.ok(matched, 'Tracked visitor should appear in admin visitor list');
    assert.strictEqual('visitorSecret' in matched, false, 'visitorSecret must never leak to client');
    assert.strictEqual(matched.watchTimeSeconds, 345);
    assert.ok(matched.pagesVisited.includes('/insights'));

    // 4f. Label update validation & persistence
    const badLabelRes = await fetch(`${baseUrl}/api/telemetry/visitors/${testVid}/label`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validAdminJwt}`,
      },
      body: JSON.stringify({ label: 'hacker_invalid_label' }),
    });
    assert.strictEqual(badLabelRes.status, 400);

    const goodLabelRes = await fetch(`${baseUrl}/api/telemetry/visitors/${testVid}/label`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validAdminJwt}`,
      },
      body: JSON.stringify({ label: 'company', adminNotes: 'Recruiter session test' }),
    });
    const goodLabelJson: any = await goodLabelRes.json();
    assert.strictEqual(goodLabelRes.status, 200);
    assert.strictEqual(goodLabelJson.visitor.label, 'company');
    assert.strictEqual(goodLabelJson.visitor.adminNotes, 'Recruiter session test');

    console.log('✓ 8. Telemetry HTTP API RBAC, secret stripping, heartbeat clamping, and label validation passed');
  } finally {
    server.close();
    for (const id of createdIds) {
      await deleteVisitor(id);
    }
  }

  // 5. Telegram HTML Escaping & Content Test
  const tgHtml = formatVisitorTelemetryMessage({
    visitorId: 'VIS-261115-ABC123',
    visitCount: 2,
    isNewVisitor: false,
    classification: 'Suspicious',
    safetyStatus: 'Challenged',
    riskScore: 80,
    securitySignals: ['XSS <script>alert(1)</script> Probe'],
    challengeStatus: 'triggered',
    label: 'test',
    deviceType: 'Desktop',
    browser: 'Chrome',
    os: 'Linux',
    screenRes: '1280x720',
    language: 'en-US',
    timezone: 'Asia/Kolkata',
    pageUrl: 'https://dubbakasathwik.in/?q=<script>',
    referrer: '<img src=x onerror=alert(1)>',
    clientIp: '203.0.113.5',
    userAgent: 'Custom<script>',
  });
  assert.ok(!tgHtml.includes('<script>'), 'Telegram HTML must escape raw <script> tags');
  assert.ok(tgHtml.includes('&lt;script&gt;'), 'Telegram HTML must entity-encode XSS characters');
  assert.ok(tgHtml.includes('VIS-261115-ABC123'));
  assert.ok(tgHtml.includes('80/100'));

  const humanGateTg = formatHumanVerificationMessage({
    visitorId: 'VIS-261115-ABC123',
    outcome: 'passed',
    classification: 'Human',
    riskScore: 10,
    clientIp: '203.0.113.5',
  });
  assert.ok(humanGateTg.includes('HUMAN VERIFICATION PASSED'));
  console.log('✓ 9. Telegram Visitor & Security message formatting and HTML escaping verified');

  // 6. Firestore Rules Audit
  const rulesText = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
  assert.ok(rulesText.includes('allow read, write: if false;'), 'Default deny must exist');
  assert.ok(rulesText.includes('match /visitors/{visitorId}'), 'Visitors collection rule must exist');
  assert.ok(rulesText.includes('allow get: if isSuperAdmin()'), 'Visitor reads restricted to SuperAdmin');
  assert.ok(rulesText.includes('allow list: if isSuperAdmin()'), 'Visitor list restricted to SuperAdmin');
  assert.ok(rulesText.includes('incoming().visitorSecret == existing().visitorSecret'), 'Ownership secret check required');
  assert.ok(rulesText.includes('incoming().watchTimeSeconds >= existing().watchTimeSeconds'), 'Monotonic watch time enforced');
  console.log('✓ 10. Firestore security rules audit verified (RBAC, secret ownership, monotonic watch time)');

  console.log('\nALL 10 SECURITY & TELEMETRY TEST SUITES PASSED!\n');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('TEST FAILURE:', err);
    process.exit(1);
  });
