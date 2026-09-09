import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
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
import githubRouter from './server/routes/github';

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

  // Permissive CORS and iframe headers for AI Studio preview
  app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Origin-Agent-Cluster');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
  });

  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Ensure public, profile, and uploads directories exist
  const publicDir = path.join(process.cwd(), 'public');
  const publicProfileDir = path.join(process.cwd(), 'public', 'profile');
  const rootProfileDir = path.join(process.cwd(), 'profile');
  const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');

  [publicDir, publicProfileDir, rootProfileDir, publicUploadsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {}
    }
  });

  // Serve static assets from public, profile, and uploads directories
  app.use(express.static(publicDir));
  app.use('/profile', express.static(publicProfileDir));
  app.use('/profile', express.static(rootProfileDir));
  app.use('/uploads', express.static(publicUploadsDir));
  app.use('/public/uploads', express.static(publicUploadsDir));

  // Intelligent fallback asset resolver for /uploads/assets/
  app.use(['/uploads/assets/:file', '/public/uploads/assets/:file'], (req, res, next) => {
    const requestedFile = req.params.file;
    const directPath = path.join(publicUploadsDir, 'assets', requestedFile);
    if (fs.existsSync(directPath)) {
      return res.sendFile(directPath);
    }

    try {
      const assetsDir = path.join(publicUploadsDir, 'assets');
      if (fs.existsSync(assetsDir)) {
        const diskFiles = fs.readdirSync(assetsDir);
        const cleaned = requestedFile.replace(/^static_asset_/, 'static_');
        const parts = cleaned.split('_');
        if (parts.length >= 4) {
          const category = parts[1];
          const idx = parts[2];
          const field = parts[3];
          const subIdx = parts.length > 5 ? parts[4] : null;

          const match =
            diskFiles.find((df) => {
              if (df.startsWith(`static_${category}_${idx}_`)) {
                if (
                  subIdx !== null &&
                  (df.includes(`images_${subIdx}_`) ||
                    (category === 'creativePortfolio' && df.includes('ima_')))
                ) {
                  return true;
                }
                if (field === 'thumbnail' && (df.includes('thumbnail') || df.includes('thu_'))) {
                  return true;
                }
                if (field === 'image' && (df.includes('_image_') || df.includes('ima_'))) {
                  return true;
                }
              }
              return false;
            }) ||
            diskFiles.find((df) => df.startsWith(`static_${category}_${idx}_`)) ||
            diskFiles.find((df) => df.startsWith(`static_${category}_`));

          if (match) {
            return res.sendFile(path.join(assetsDir, match));
          }
        }
      }
    } catch (e) {}

    // Never fall through to Vite SPA index.html for image requests
    return res.status(404).end();
  });

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
  app.use('/api/github', githubRouter);

  // Central error handler for API routes
  app.use(errorHandler);

  // Vite Middleware in development / Static bundle in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: [
            '**/*.json',
            '**/*.log',
            '**/activity_logs.json',
            '**/cms_backup.json',
            '**/static_backup.json',
            '**/static_backups/**',
            '**/telegram_settings.json',
            '**/pre_migration_snapshots/**',
            '**/public/uploads/**',
            '**/.env*',
          ],
        },
      },
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
      console.warn('[Server Startup] MongoDB is currently offline or connecting in background. Resilient local persistent disk backup (cms_backup.json) active.');
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
