import express from 'express';
import path from 'path';
import mongoose, { Document } from 'mongoose';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dubbakasathwik_db_user:bachi200@cluster0.6dd9987.mongodb.net/?appName=Cluster0';

// Disable Mongoose command buffering so queries fail-fast when offline
mongoose.set('bufferCommands', false);

export interface ICMSDoc extends Document {
  key: string;
  data: any;
  updatedAt: Date;
}

// Mongoose Schema for Portfolio CMS Data
const CMSSchema = new mongoose.Schema<ICMSDoc>(
  {
    key: { type: String, default: 'portfolio_cms_v1', unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { bufferCommands: false }
);

const CMSModel = (mongoose.models.CMS as mongoose.Model<ICMSDoc>) || mongoose.model<ICMSDoc>('CMS', CMSSchema);

let isDbConnected = false;
let inMemoryCMSCache: any = null;

async function connectToMongo() {
  if (isDbConnected && mongoose.connection.readyState === 1) return true;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isDbConnected = true;
    console.log('MongoDB Atlas Connected Successfully!');
    return true;
  } catch (err: any) {
    isDbConnected = false;
    console.warn('MongoDB Atlas Connection Warning:', err?.message || err);
    console.warn('Running with In-Memory fallback mode for CMS data.');
    return false;
  }
}

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 50MB (for uploaded image/video base64 strings)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Connect DB on server start asynchronously
  connectToMongo();

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      database: isDbConnected && mongoose.connection.readyState === 1 ? 'connected' : 'fallback-memory',
      timestamp: new Date().toISOString(),
    });
  });

  // GET CMS Data from MongoDB Atlas (with in-memory fallback)
  app.get('/api/cms', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        const cmsDoc = await CMSModel.findOne({ key: 'portfolio_cms_v1' }).exec();
        if (cmsDoc) {
          inMemoryCMSCache = cmsDoc.data;
          res.json({ data: cmsDoc.data, updatedAt: cmsDoc.updatedAt, database: 'MongoDB Atlas' });
          return;
        }
      }
    } catch (error: any) {
      console.warn('Unable to read from MongoDB Atlas, falling back to memory cache:', error?.message);
    }

    // Fallback response if MongoDB is offline or empty
    res.json({
      data: inMemoryCMSCache,
      message: inMemoryCMSCache ? 'Served from server memory cache' : 'No CMS record in memory yet',
      database: 'Server In-Memory Fallback',
    });
  });

  // POST/PUT CMS Data to MongoDB Atlas (with in-memory fallback)
  app.post('/api/cms', async (req, res) => {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Invalid data payload' });
      return;
    }

    // Always update in-memory cache first
    inMemoryCMSCache = payload;

    try {
      if (mongoose.connection.readyState === 1) {
        const updatedDoc = await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          { data: payload, updatedAt: new Date() },
          { upsert: true, new: true }
        ).exec();

        res.json({
          success: true,
          message: 'Saved to MongoDB Atlas',
          updatedAt: updatedDoc ? updatedDoc.updatedAt : new Date(),
          database: 'MongoDB Atlas',
        });
        return;
      }
    } catch (error: any) {
      console.warn('Failed to persist CMS payload to MongoDB Atlas:', error?.message);
    }

    // Fallback response when MongoDB is unreachable
    res.json({
      success: true,
      message: 'Saved to Server Memory (MongoDB Atlas offline or IP restricted)',
      updatedAt: new Date(),
      database: 'Server In-Memory Fallback',
    });
  });

  // POST New Contact Message to MongoDB (with in-memory fallback)
  app.post('/api/contact', async (req, res) => {
    const messageObj = req.body;
    if (!messageObj || !messageObj.name || !messageObj.email || !messageObj.message) {
      res.status(400).json({ error: 'Name, email, and message are required' });
      return;
    }

    const newMessage = {
      id: 'msg-' + Date.now(),
      name: messageObj.name,
      email: messageObj.email,
      subject: messageObj.subject || 'Portfolio Inquiry',
      message: messageObj.message,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'unread',
    };

    let currentData = inMemoryCMSCache || {};
    const existingMessages = currentData.messages || [];
    currentData = {
      ...currentData,
      messages: [newMessage, ...existingMessages],
    };
    inMemoryCMSCache = currentData;

    try {
      if (mongoose.connection.readyState === 1) {
        await CMSModel.findOneAndUpdate(
          { key: 'portfolio_cms_v1' },
          { data: currentData, updatedAt: new Date() },
          { upsert: true }
        ).exec();

        res.json({
          success: true,
          message: 'Message submitted and saved to MongoDB Atlas',
          newMessage,
          database: 'MongoDB Atlas',
        });
        return;
      }
    } catch (error: any) {
      console.warn('Failed to save contact message to MongoDB Atlas:', error?.message);
    }

    res.json({
      success: true,
      message: 'Message received and stored in server memory (MongoDB Atlas offline)',
      newMessage,
      database: 'Server In-Memory Fallback',
    });
  });

  // Vite Middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Full-Stack Server with MongoDB Atlas active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
