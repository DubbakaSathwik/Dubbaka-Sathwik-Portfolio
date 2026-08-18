import { Router, Request, Response } from 'express';
import {
  generateToken,
  verifyAdminPassword,
  loginRateLimiter,
  requireAuth,
  AuthRequest,
} from '../middleware/auth';
import { sendTelegramNotification, formatConsoleLogMessage } from '../services/telegram';
import { ActivityLogModel } from '../db/mongo';

const router = Router();

// POST /api/auth/login
router.post('/login', loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body || {};
    const clientIp =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_PASSWORD', message: 'Password is required' },
      });
      return;
    }

    const isValid = await verifyAdminPassword(password);
    const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    if (!isValid) {
      // Log failed attempt to Telegram (Instant security alert)
      const alertHtml = formatConsoleLogMessage(
        'Admin Login Failed',
        `Unsuccessful CMS login attempt.\nIP: ${clientIp}\nTime: ${timeStr} IST`,
        'error',
        clientIp
      );
      sendTelegramNotification(alertHtml, 'consoleAlerts', {
        event: 'Admin Login Failed',
        details: `IP: ${clientIp}`,
        level: 'error',
        category: 'security',
        clientIp,
      }).catch(() => {});

      // Record to DB Activity Logs
      try {
        await ActivityLogModel.create({
          logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          event: 'Admin Login Failed',
          details: `Unsuccessful login attempt from IP: ${clientIp}`,
          category: 'security',
          level: 'warning',
          clientIp,
        });
      } catch (e) {}

      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect administrative password. Please try again.',
        },
      });
      return;
    }

    // Generate JWT
    const token = generateToken({ role: 'admin', username: 'sathwik' });

    // Set cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Notify Telegram of successful login
    const successHtml = formatConsoleLogMessage(
      'Admin Login Successful',
      `Sathwik logged in to the Portfolio CMS Portal.\nIP: ${clientIp}\nTime: ${timeStr} IST`,
      'success',
      clientIp
    );
    sendTelegramNotification(successHtml, 'consoleAlerts', {
      event: 'Admin Login Successful',
      details: `IP: ${clientIp}`,
      level: 'success',
      category: 'security',
      clientIp,
    }).catch(() => {});

    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: 'Admin Login Successful',
        details: `Sathwik authenticated to CMS Portal from IP: ${clientIp}`,
        category: 'security',
        level: 'success',
        clientIp,
      });
    } catch (e) {}

    res.json({
      success: true,
      token,
      message: 'Admin authenticated successfully',
      user: { role: 'admin', username: 'sathwik' },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: err?.message || 'Login failed' },
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('admin_token');
  res.json({
    success: true,
    message: 'Admin logged out successfully',
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    authenticated: true,
    user: req.user,
  });
});

export default router;
