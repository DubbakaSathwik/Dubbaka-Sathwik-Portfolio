import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { requireAuth, uploadRateLimiter } from '../middleware/auth';

const router = Router();
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Supported MIME types and safe extensions
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

// POST /api/upload - Secure file upload endpoint
router.post('/', requireAuth, uploadRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, fileData, mimeType } = req.body || {};

    if (!fileData || typeof fileData !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_DATA', message: 'No file data provided' },
      });
      return;
    }

    // Determine MIME type from prefix if not provided
    let detectedMime = mimeType || '';
    let base64Content = fileData;

    if (fileData.startsWith('data:')) {
      const match = fileData.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        detectedMime = match[1];
        base64Content = match[2];
      }
    }

    if (!ALLOWED_MIME_TYPES[detectedMime]) {
      res.status(400).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_TYPE',
          message: `Unsupported file type: ${detectedMime}. Only images (JPG, PNG, WebP, GIF) and PDF files are allowed.`,
        },
      });
      return;
    }

    const buffer = Buffer.from(base64Content, 'base64');
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB

    if (buffer.length > MAX_SIZE) {
      res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds maximum allowable limit of 15MB',
        },
      });
      return;
    }

    const ext = ALLOWED_MIME_TYPES[detectedMime] || path.extname(filename || '') || '.bin';
    const cleanBaseName = (filename || 'upload')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const uniqueFileName = `${cleanBaseName}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: uniqueFileName,
      size: buffer.length,
      mimeType: detectedMime,
    });
  } catch (error: any) {
    console.error('[Upload Error]:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: error?.message || 'File upload failed' },
    });
  }
});

export default router;
