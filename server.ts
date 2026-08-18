import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';

import { config, validateConfig } from './server/config/env';
import { connectMongoDB, isDatabaseConnected, closeDatabase } from './server/db/mongo';
import { errorHandler } from './server/middleware/errorHandler';
import { initTelegramSettingsFromDB } from './server/services/telegram';
import { runStorageMigration } from './server/services/migration';

// Route imports
import authRouter from './server/routes/auth';
import cmsRouter from './server/routes/cms';
import contactRouter from './server/routes/contact';
import uploadRouter from './server/routes/upload';
import telegramRouter from './server/routes/telegram';
import telemetryRouter from './server/routes/telemetry';
import logsRouter from './server/routes/logs';

async function startServer() {
  const envValidation = validateConfig();
  if (envValidation.warnings.length > 0) {
    console.log('[Config Warnings]:');
    envValidation.warnings.forEach((w) => console.log(` - ${w}`));
  }

  const app = express();
  const PORT = config.PORT;

  // Trust proxy for reverse proxies (nginx, Cloud Run, preview container)
  app.set('trust proxy', 1);

  // Security Headers (Helmet) - configured to allow Spline 3D, Unsplash, Google Fonts, and inline styles for Tailwind
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite and Spline 3D scripts require dynamic inline script/eval in preview
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Ensure uploads directory exists
  const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(publicUploadsDir)) {
    try {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    } catch (e) {}
  }

  // Serve static uploads
  app.use('/uploads', express.static(publicUploadsDir));
  app.use('/public/uploads', express.static(publicUploadsDir));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: isDatabaseConnected() ? 'MongoDB Atlas (Connected)' : 'Offline / Disconnected',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/cms', cmsRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/telegram', telegramRouter);
  app.use('/api/telemetry', telemetryRouter);
  app.use('/api/logs', logsRouter);

  // Central error handler for API routes
  app.use(errorHandler);

  // Vite Middleware in development / Static bundle in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[Server] Portfolio backend running at http://0.0.0.0:${PORT}`);

    // Connect to MongoDB Atlas
    const dbOk = await connectMongoDB();
    if (dbOk) {
      // Initialize Telegram Settings from DB
      await initTelegramSettingsFromDB();

      // Run idempotent migration check to ensure authoritative data is populated
      try {
        await runStorageMigration(false);
      } catch (migErr: any) {
        console.warn('[Startup Migration Warning]:', migErr?.message || migErr);
      }
    } else {
      console.warn('[Server Startup] Running with database offline. API will return 503 for DB operations.');
    }
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]:', err);
  process.exit(1);
});
