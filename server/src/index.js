import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb, disconnectDb } from './db.js';
import { Vendor } from './models/index.js';
import { seed } from './seed.js';

await connectDb();

// First run: load benchmarks and the demo stall so the app is usable at once.
if ((await Vendor.estimatedDocumentCount()) === 0) {
  console.log('[seed] empty database, loading demo data…');
  await seed();
}

const server = createApp().listen(config.port, () => {
  console.log(`[api] Munafa API on http://localhost:${config.port}`);
});

async function shutdown() {
  server.close();
  await disconnectDb();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
