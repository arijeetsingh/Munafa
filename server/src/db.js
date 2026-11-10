import fs from 'node:fs';
import mongoose from 'mongoose';
import { config } from './config.js';

let memoryServer;

// Connects to MONGO_URI when set. Otherwise starts an embedded MongoDB that
// persists to server/.data, so the app runs without installing MongoDB.
export async function connectDb() {
  let uri = config.mongoUri;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    fs.mkdirSync(config.dataDir, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: { dbPath: config.dataDir, storageEngine: 'wiredTiger', port: 27027 },
    });
    uri = memoryServer.getUri('munafa');
    console.log(`[db] embedded MongoDB at ${uri} (data in server/.data)`);
  }
  await mongoose.connect(uri);
  return uri;
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop({ doCleanup: false });
}
