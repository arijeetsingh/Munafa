import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '../..');
dotenv.config({ path: path.join(ROOT, '.env') });

const isProd = process.env.NODE_ENV === 'production';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-in-production')) {
  throw new Error('Set a strong JWT_SECRET in production.');
}

export const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'munafa-dev-secret',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-opus-5-5',
  demoOtp: process.env.DEMO_OTP ? process.env.DEMO_OTP === 'true' : !isProd,
  timezone: 'Asia/Kolkata',
  dataDir: path.join(ROOT, 'server/.data'),
  clientDist: path.join(ROOT, 'client/dist'),
};
