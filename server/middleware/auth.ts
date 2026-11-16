import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    role: string;
    username: string;
    iat?: number;
    exp?: number;
  };
}

const FIREBASE_PROJECT_ID = 'potent-box-hs6r9';
const ADMIN_EMAIL = 'dubbakasathwik@gmail.com';
const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedGoogleCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  if (cachedGoogleCerts && Date.now() < cachedGoogleCerts.expiresAt) {
    return cachedGoogleCerts.certs;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(GOOGLE_CERTS_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching Google x509 certs`);
    }
    const certs = (await res.json()) as Record<string, string>;
    const cacheControl = res.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const maxAgeSec = maxAgeMatch ? Math.min(86400, parseInt(maxAgeMatch[1], 10)) : 3600;
    cachedGoogleCerts = {
      certs,
      expiresAt: Date.now() + maxAgeSec * 1000,
    };
    return certs;
  } catch (err) {
    clearTimeout(timeoutId);
    if (cachedGoogleCerts) {
      return cachedGoogleCerts.certs;
    }
    throw err;
  }
}

export function generateToken(payload: { role: string; username: string }): string {
  return jwt.sign(payload, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
}

export function verifyToken(token: string): { role: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as { role: string; username: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function verifyTokenAsync(
  token: string
): Promise<{ role: string; username: string } | null> {
  // 1. Try internal HS256 server-signed admin JWT
  const localDecoded = verifyToken(token);
  if (localDecoded) {
    return localDecoded;
  }

  // 2. Try Firebase RS256 Google Auth ID token verified strictly against Google public certs
  try {
    const decodedComplete = jwt.decode(token, { complete: true }) as {
      header?: { alg?: string; kid?: string };
    } | null;

    const alg = decodedComplete?.header?.alg;
    const kid = decodedComplete?.header?.kid;
    if (alg !== 'RS256' || !kid) {
      return null;
    }

    const certs = await getGooglePublicCerts();
    const cert = certs[kid];
    if (!cert) {
      return null;
    }

    const verified = jwt.verify(token, cert, {
      algorithms: ['RS256'],
      audience: FIREBASE_PROJECT_ID,
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    }) as jwt.JwtPayload;

    if (
      verified &&
      typeof verified === 'object' &&
      typeof verified.sub === 'string' &&
      verified.sub.length > 0 &&
      typeof verified.email === 'string' &&
      verified.email.toLowerCase() === ADMIN_EMAIL &&
      verified.email_verified === true
    ) {
      return { role: 'admin', username: 'dubbakasathwik' };
    }
  } catch {
    return null;
  }

  return null;
}

export async function verifyAdminPassword(candidatePassword: string): Promise<boolean> {
  if (!candidatePassword) return false;

  // Check bcrypt hash comparison against configured admin hash
  if (config.ADMIN_PASSWORD_HASH) {
    try {
      const isMatch = await bcrypt.compare(candidatePassword, config.ADMIN_PASSWORD_HASH);
      if (isMatch) return true;
    } catch (e) {}
  }

  return false;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required for administrative operations',
      },
    });
    return;
  }

  const decoded = await verifyTokenAsync(token);
  if (!decoded) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or expired session token. Please log in again.',
      },
    });
    return;
  }

  req.user = decoded;
  next();
}

// Rate Limiter for Admin Login attempts
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many failed login attempts from this IP. Please try again after 15 minutes.',
    },
  },
});

// Rate Limiter for Visitor Contact Submissions
export const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // 15 messages per hour
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Message submission limit reached. Please wait before sending another inquiry.',
    },
  },
});

// Rate Limiter for Telemetry pings
export const telemetryRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  skipSuccessfulRequests: true,
});

// Rate Limiter for File Uploads
export const uploadRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Upload rate limit exceeded. Please wait a few moments.',
    },
  },
});
