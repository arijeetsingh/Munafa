import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { Otp, Vendor } from '../models/index.js';
import { ah, requireAuth, signToken } from '../middleware/auth.js';

export const DEMO_PHONE = '9876543210';

const router = Router();
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number.');

router.post('/request-otp', limiter, ah(async (req, res) => {
  const phone = phoneSchema.parse(req.body.phone);
  const code = String(crypto.randomInt(100000, 1000000));
  await Otp.deleteMany({ phone });
  await Otp.create({ phone, codeHash: await bcrypt.hash(code, 8), expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
  // Production: send `code` by SMS here (e.g. MSG91 or Twilio).
  if (!config.demoOtp) console.log(`[auth] OTP requested for ******${phone.slice(-4)}`);
  res.json({ sent: true, ...(config.demoOtp ? { demoCode: code } : {}) });
}));

router.post('/verify', limiter, ah(async (req, res) => {
  const phone = phoneSchema.parse(req.body.phone);
  const code = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.').parse(req.body.code);
  const otp = await Otp.findOne({ phone });
  if (!otp || otp.expiresAt < new Date()) return res.status(400).json({ error: 'Code expired. Request a new one.' });
  if (otp.attempts >= 5) return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
  if (!(await bcrypt.compare(code, otp.codeHash))) {
    otp.attempts += 1;
    await otp.save();
    return res.status(400).json({ error: 'Wrong code. Try again.' });
  }
  await otp.deleteOne();
  const vendor = await Vendor.findOneAndUpdate({ phone }, { $setOnInsert: { phone } }, { upsert: true, new: true });
  res.json({ token: signToken(vendor), vendor });
}));

// One-tap login to the seeded demo stall, for presentations.
router.post('/demo', ah(async (req, res) => {
  if (!config.demoOtp) return res.status(404).json({ error: 'Demo login is off.' });
  const vendor = await Vendor.findOne({ phone: DEMO_PHONE });
  if (!vendor) return res.status(404).json({ error: 'Demo data missing. Run: npm run seed' });
  res.json({ token: signToken(vendor), vendor });
}));

router.get('/me', requireAuth, (req, res) => res.json({ vendor: req.vendor }));

export default router;
