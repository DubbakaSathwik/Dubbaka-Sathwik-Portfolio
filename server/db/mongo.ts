import mongoose, { Document, Model, Schema } from 'mongoose';
import { config } from '../config/env';

// Disable buffering so queries fail-fast when offline
mongoose.set('bufferCommands', false);

export interface ICMSDoc extends Document {
  key: string;
  schemaVersion: number;
  version: number;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CMSSchema = new Schema<ICMSDoc>(
  {
    key: { type: String, default: 'portfolio_cms_v1', unique: true, index: true },
    schemaVersion: { type: Number, default: 1 },
    version: { type: Number, default: 1 },
    data: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    bufferCommands: false,
  }
);

export const CMSModel: Model<ICMSDoc> =
  (mongoose.models.CMS as Model<ICMSDoc>) || mongoose.model<ICMSDoc>('CMS', CMSSchema);

export interface IActivityLogDoc extends Document {
  logId: string;
  event: string;
  details: string;
  category: 'visit' | 'cms_update' | 'download' | 'contact' | 'security' | 'system';
  level: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  clientIp?: string;
  metadata?: Record<string, any>;
}

const ActivityLogSchema = new Schema<IActivityLogDoc>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    event: { type: String, required: true },
    details: { type: String, required: true },
    category: {
      type: String,
      enum: ['visit', 'cms_update', 'download', 'contact', 'security', 'system'],
      default: 'system',
      index: true,
    },
    level: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
      index: true,
    },
    timestamp: { type: Date, default: Date.now, index: true },
    clientIp: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    bufferCommands: false,
  }
);

export const ActivityLogModel: Model<IActivityLogDoc> =
  (mongoose.models.ActivityLog as Model<IActivityLogDoc>) ||
  mongoose.model<IActivityLogDoc>('ActivityLog', ActivityLogSchema);

export interface ITelegramSettingsDoc extends Document {
  key: string;
  masterEnabled: boolean;
  websiteVisit: boolean;
  contactInbox: boolean;
  cmsUpdates: boolean;
  consoleAlerts: boolean;
  resumeDownloads: boolean;
  consoleTimerEnabled: boolean;
  consoleTimerIntervalMinutes: number;
  updatedAt: Date;
}

const TelegramSettingsSchema = new Schema<ITelegramSettingsDoc>(
  {
    key: { type: String, default: 'telegram_settings_v1', unique: true },
    masterEnabled: { type: Boolean, default: true },
    websiteVisit: { type: Boolean, default: true },
    contactInbox: { type: Boolean, default: true },
    cmsUpdates: { type: Boolean, default: true },
    consoleAlerts: { type: Boolean, default: true },
    resumeDownloads: { type: Boolean, default: true },
    consoleTimerEnabled: { type: Boolean, default: false },
    consoleTimerIntervalMinutes: { type: Number, default: 2 },
  },
  {
    timestamps: true,
    bufferCommands: false,
  }
);

export const TelegramSettingsModel: Model<ITelegramSettingsDoc> =
  (mongoose.models.TelegramSettings as Model<ITelegramSettingsDoc>) ||
  mongoose.model<ITelegramSettingsDoc>('TelegramSettings', TelegramSettingsSchema);

let isConnected = false;

export async function connectMongoDB(): Promise<boolean> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    console.log('[Database] MongoDB Atlas Connected Successfully!');
    return true;
  } catch (error: any) {
    isConnected = false;
    console.warn('[Database Warning] MongoDB connection failed:', error?.message || error);
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function closeDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
      isConnected = false;
      console.log('[Database] MongoDB connection closed gracefully.');
    } catch (e) {
      console.warn('[Database] Error closing MongoDB connection:', e);
    }
  }
}
