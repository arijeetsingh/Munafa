// Vercel serverless entry point: the same Express app, with a MongoDB
// connection reused across warm invocations. Requires MONGO_URI (Atlas).
import mongoose from 'mongoose';
import { createApp } from '../server/src/app.js';

const app = createApp();

let connecting = globalThis.__munafaDb;

function connect() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!process.env.MONGO_URI) return Promise.reject(new Error('MONGO_URI is not set'));
  connecting ??= mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
    .catch((err) => {
      connecting = null;
      globalThis.__munafaDb = null;
      throw err;
    });
  globalThis.__munafaDb = connecting;
  return connecting;
}

export default async function handler(req, res) {
  try {
    await connect();
  } catch (err) {
    console.error('[db]', err.message);
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Database unavailable. Check MONGO_URI on Vercel.' }));
    return;
  }
  return app(req, res);
}
