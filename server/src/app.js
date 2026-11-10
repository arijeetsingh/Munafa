import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ZodError } from 'zod';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendor.js';
import entryRoutes from './routes/entries.js';
import insightRoutes from './routes/insights.js';
import { llmEnabled } from './services/llm.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Behind Vercel / a load balancer: trust its X-Forwarded-For for rate limiting.
  if (config.isProd) app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  if (!config.isProd) app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan(config.isProd ? 'combined' : 'dev'));

  app.get('/api/health', (req, res) => res.json({ ok: true, parser: llmEnabled() ? 'llm+rules' : 'rules', demo: config.demoOtp }));
  app.use('/api/auth', authRoutes);
  app.use('/api', requireAuth, vendorRoutes, entryRoutes, insightRoutes);
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  // In production the API also serves the built React app.
  if (fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }));
    app.get('*', (req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues[0]?.message || 'Invalid input.', issues: err.issues });
    }
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id.' });
    if (err.code === 11000) return res.status(409).json({ error: 'Already saved.' });
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : err.message });
  });

  return app;
}
