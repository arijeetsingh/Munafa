import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { Vendor } from '../models/index.js';

export function signToken(vendor) {
  return jwt.sign({ sub: String(vendor._id) }, config.jwtSecret, { expiresIn: '30d' });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in.' });
  try {
    const { sub } = jwt.verify(token, config.jwtSecret);
    const vendor = await Vendor.findById(sub);
    if (!vendor) return res.status(401).json({ error: 'Account not found. Please log in again.' });
    req.vendor = vendor;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// Wrap async handlers so thrown errors reach the error middleware.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
