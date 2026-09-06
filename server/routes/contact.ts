import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { CMSModel, isDatabaseConnected, ActivityLogModel } from '../db/mongo';
import { contactRateLimiter } from '../middleware/auth';
import {
  formatInboxNotificationMessage,
  sendTelegramNotification,
} from '../services/telegram';

const router = Router();

// POST /api/contact - Submit visitor inquiry
router.post('/', contactRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !message) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, email, and message are required fields',
        },
      });
      return;
    }

    if (typeof email !== 'string' || !email.includes('@') || email.length < 5) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address',
        },
      });
      return;
    }

    const newMessage = {
      id: 'msg-' + Date.now(),
      name: String(name).trim().substring(0, 100),
      email: String(email).trim().substring(0, 150),
      subject: String(subject || 'Portfolio Inquiry').trim().substring(0, 200),
      message: String(message).trim().substring(0, 3000),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'unread',
    };

    // 1. Send Telegram Notification (instant delivery)
    const telegramHtml = formatInboxNotificationMessage(newMessage);
    sendTelegramNotification(telegramHtml, 'contactInbox', {
      event: 'Contact Inbox Message Received',
      details: `New inquiry from ${newMessage.name} (${newMessage.email}): "${newMessage.subject}"`,
      level: 'success',
      category: 'contact',
      metadata: { name: newMessage.name, email: newMessage.email, subject: newMessage.subject },
    }).catch((err) => console.warn('[Contact] Telegram notification error:', err));

    // 2. Persist to MongoDB & Local Disk Backup
    try {
      const backupPath = path.join(process.cwd(), 'cms_backup.json');
      if (fs.existsSync(backupPath)) {
        const raw = fs.readFileSync(backupPath, 'utf-8');
        const diskData = JSON.parse(raw);
        if (diskData && typeof diskData === 'object') {
          diskData.messages = [newMessage, ...(diskData.messages || [])];
          fs.writeFileSync(backupPath, JSON.stringify(diskData, null, 2), 'utf-8');
        }
      }
    } catch (diskErr) {
      console.warn('[Contact] Error saving message to local disk backup:', diskErr);
    }

    if (isDatabaseConnected()) {
      try {
        const cmsDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
        if (cmsDoc) {
          const existingMessages = cmsDoc.data?.messages || [];
          cmsDoc.data.messages = [newMessage, ...existingMessages];
          cmsDoc.markModified('data');
          await cmsDoc.save();
        }
      } catch (dbErr) {
        console.warn('[Contact] Error saving message to MongoDB:', dbErr);
      }
    }

    // 3. Record Activity Log
    try {
      await ActivityLogModel.create({
        logId: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        event: 'Contact Inbox Message Received',
        details: `Message from ${newMessage.name} (${newMessage.email}): "${newMessage.subject}"`,
        category: 'contact',
        level: 'success',
        metadata: { name: newMessage.name, email: newMessage.email, subject: newMessage.subject },
      });
    } catch (e) {}

    res.json({
      success: true,
      message: 'Thank you! Your message has been received and saved.',
      newMessage,
    });
  } catch (error: any) {
    console.error('[Contact Error] POST /api/contact:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBMISSION_FAILED',
        message: error?.message || 'Failed to submit contact message',
      },
    });
  }
});

export default router;
