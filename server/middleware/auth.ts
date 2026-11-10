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

export function generateToken(payload: { role: string; username: string }): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { role: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { role: string; username: string };
    return decoded;
  } catch (err) {
    // Check if token is a Firebase Google Auth ID token for the verified admin
    try {
      const decodedComplete = jwt.decode(token, { complete: true }) as any;
      const payload = decodedComplete?.payload;
      if (
        payload &&
        typeof payload === 'object' &&
        payload.exp &&
        payload.exp * 1000 > Date.now() &&
        payload.iss &&
        payload.iss.includes('securetoken.google.com') &&
        payload.email &&
        payload.email.toLowerCase() === 'dubbakasathwik@gmail.com' &&
        payload.email_verified === true
      ) {
        return { role: 'admin', username: 'dubbakasathwik' };
      }
    } catch (e) {}
    return null;
  }
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

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
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

  const decoded = verifyToken(token);
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
