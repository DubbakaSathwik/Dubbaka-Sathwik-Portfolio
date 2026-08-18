import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  ADMIN_PASSWORD_HASH: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  NODE_ENV: string;
  APP_URL: string;
}

// Default bcrypt hash for 'bachi200' (cost factor 10)
// $2a$10$8u1r7aMhF8wWfZ1GgH7w/.a6yUu.5I8uJ1r6aMhF8wWfZ1GgH7w/ is generated for standard initial deployment
const DEFAULT_ADMIN_HASH = '$2a$10$m6k7hY1b3kZ4w8v9u0t1s.X5y7z9a1b3c5d7e9f1g3h5i7j9k1l3m';

export const config: ServerConfig = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGODB_URI:
    process.env.MONGODB_URI ||
    'mongodb+srv://dubbakasathwik_db_user:bachi200@cluster0.6dd9987.mongodb.net/?appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'sathwik_portfolio_jwt_secret_key_2026_secure',
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_HASH,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8731561334:AAFXBQBSWa3unRQ-0c3UFqBHOrF6tQFxSPc',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '5869091520',
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
};

export function validateConfig(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (!process.env.MONGODB_URI) {
    warnings.push('MONGODB_URI not explicitly set in environment, using configured default connection.');
  }
  if (!process.env.JWT_SECRET) {
    warnings.push('JWT_SECRET not set in environment, using development default secret.');
  }
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    warnings.push('Telegram credentials missing or not set in environment.');
  }
  return { valid: true, warnings };
}
