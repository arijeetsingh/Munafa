// Seeds benchmarks, the demo stall and a simulated pilot cohort.
// `npm run seed` wipes the database first; the API server calls seed() itself
// on an empty database.

import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { INGREDIENTS, templateByKey } from './data/catalog.js';
import { buildBenchmarks } from './data/benchmarks.js';
import { Benchmark, DailySummary, Entry, MenuItem, Otp, Vendor } from './models/index.js';
import { addDays, dayKey } from './services/dates.js';
import { DEMO_PHONE } from './routes/auth.js';

// Deterministic PRNG so every seed produces the same demo.
function rng(seedValue) {
  let a = seedValue;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// IST wall-clock time on a given day → Date.
const at = (date, hhmm) => new Date(`${date}T${hhmm}:00+05:30`);

function entryDoc(vendor, date, time, e) {
  const now = at(date, time);
  return {
    vendor, date, createdAt: now, updatedAt: now,
    source: 'voice', parser: 'rules', edited: false, confidence: 0.9, ...e,
  };
}

function purchase(vendor, date, time, key, qty, unit, amount, extra = {}) {
  return entryDoc(vendor, date, time, { type: 'expense', category: 'ingredient', itemKey: key, item: INGREDIENTS[key].name, qty, unit, amount: Math.round(amount), ...extra });
}

async function seedDemoStall(today) {
  const r = rng(31);
  const between = (lo, hi) => lo + r() * (hi - lo);
  const int = (lo, hi) => Math.round(between(lo, hi));

  const vendor = await Vendor.create({
    phone: DEMO_PHONE, name: 'Ramesh', language: 'hinglish', businessType: 'chaat', area: 'Lucknow',
    closingTime: '21:30', onboarded: true, createdAt: at(addDays(today, -22), '09:00'),
  });
  const menuSpec = [['aloo_tikki_chaat', 40], ['papdi_chaat', 40], ['pani_puri', 30], ['samosa', 15]];
  const menu = await MenuItem.insertMany(menuSpec.map(([key, price]) => {
    const t = templateByKey(key);
    return { vendor: vendor._id, name: t.name, templateKey: key, serving: t.serving, price, recipe: t.recipe.map(([ingredientKey, qty]) => ({ ingredientKey, qty })) };
  }));
  const byKey = Object.fromEntries(menu.map((m) => [m.templateKey, m]));

  const docs = [];
  const summaries = [];
  const v = vendor._id;
  for (let back = 21; back >= 0; back -= 1) {
    const date = addDays(today, -back);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (back === 9 || back === 16) continue; // two missed days, as in real life
    const isToday = back === 0;
    const busy = weekday === 0 || weekday === 6 ? 1.25 : 1;

    // Morning mandi run.
    const potatoRate = between(25, 29.5);
    docs.push(purchase(v, date, '07:05', 'potato', 5, 'kg', 5 * potatoRate));
    docs.push(purchase(v, date, '07:07', 'chickpeas', 1, 'kg', between(80, 90)));
    docs.push(purchase(v, date, '07:10', 'curd', 2, 'kg', 2 * between(66, 74)));
    docs.push(purchase(v, date, '07:12', 'puri_shells', 300, 'pc', 300 * between(0.75, 0.85)));
    // Oil: Ramesh's usual supplier charges ~₹140/L, above the area median.
    docs.push(purchase(v, date, '07:15', 'oil', back % 2 ? 1 : 2, 'L', (back % 2 ? 1 : 2) * (back > 14 ? 132 : 140)));
    if (back % 2 === 0) docs.push(purchase(v, date, '07:18', 'papdi', 1, 'kg', between(112, 124)));
    if (back % 2 === 0) docs.push(purchase(v, date, '07:20', 'maida', 2, 'kg', 2 * between(38, 42)));
    if (back % 3 === 0) docs.push(purchase(v, date, '07:22', 'tamarind', 0.5, 'kg', 0.5 * between(110, 125)));
    docs.push(purchase(v, date, '07:24', 'coriander', 250, 'g', 0.25 * between(70, 90)));
    if (back % 2 === 1) docs.push(purchase(v, date, '07:26', 'packaging', 200, 'pc', 200 * 1.15));
    if (back % 4 === 0) docs.push(purchase(v, date, '07:28', 'masala', 250, 'g', 0.25 * between(280, 310)));
    if (back % 10 === 3) docs.push(purchase(v, date, '10:30', 'lpg', 1, 'pc', 1750, { qty: 1, unit: 'cylinder' }));
    docs.push(entryDoc(v, date, '07:40', { type: 'expense', category: 'overhead', itemKey: 'transport', item: 'Transport', amount: 60 }));
    if (weekday === 1) docs.push(entryDoc(v, date, '11:00', { type: 'expense', category: 'overhead', itemKey: 'fees', item: 'Fees', amount: 50 }));

    if (isToday) continue; // the demo starts after the morning purchases

    // Closing time: sales by item on most days, a single total on some.
    if (back % 5 === 2) {
      docs.push(entryDoc(v, date, '21:35', { type: 'sale', category: 'sales', itemKey: 'total_sales', item: 'Total sales', amount: Math.round(int(3000, 3600) * busy / 10) * 10 }));
    } else {
      const lines = [
        ['aloo_tikki_chaat', int(22, 32)], ['papdi_chaat', int(12, 20)], ['pani_puri', int(30, 45)], ['samosa', int(20, 35)],
      ];
      lines.forEach(([key, qty], i) => {
        const m = byKey[key];
        const q = Math.round(qty * busy);
        docs.push(entryDoc(v, date, `21:3${i}`, { type: 'sale', category: 'menu', itemKey: key, item: m.name, menuItem: m._id, qty: q, unit: 'plate', amount: q * m.price, edited: r() < 0.1 }));
      });
    }
    summaries.push({ vendor: v, date, viewedAt: at(date, '21:45'), sharedCount: r() < 0.3 ? 1 : 0 });
  }
  await Entry.collection.insertMany(docs);
  await DailySummary.insertMany(summaries);
  return vendor;
}

// A simulated pilot cohort so the metrics page has something to show.
async function seedPilotCohort(today) {
  const r = rng(7);
  const areas = ['Lucknow', 'Pune', 'Bengaluru', 'Delhi', 'Mumbai'];
  const types = ['chaat', 'momos', 'tea', 'juice', 'dosa', 'snacks'];
  const docs = [];
  const summaries = [];
  for (let i = 1; i <= 24; i += 1) {
    const joinedBack = 27 - Math.floor(r() * 10);
    const vendor = await Vendor.create({
      phone: `90000000${String(i).padStart(2, '0')}`, name: `Pilot vendor ${String(i).padStart(2, '0')}`,
      area: areas[i % areas.length], businessType: types[i % types.length], onboarded: true,
    });
    // Each vendor has a habit strength that decays a little over the weeks.
    const habit = 0.35 + r() * 0.6;
    // About half the cohort drops off after one to three weeks.
    const churnBack = r() < 0.5 ? joinedBack - 7 - Math.floor(r() * 14) : -1;
    for (let back = joinedBack; back >= 0; back -= 1) {
      const date = addDays(today, -back);
      if (back <= churnBack) break;
      const p = habit * (0.75 + 0.25 * (back / 28));
      if (r() > p) continue;
      const sales = Math.round(between(r, 1800, 6000) / 10) * 10;
      const edited = r() < 0.12;
      docs.push(entryDoc(vendor._id, date, '07:30', { type: 'expense', category: 'ingredient', itemKey: 'potato', item: 'Potato', qty: 5, unit: 'kg', amount: 150, edited }));
      if (r() < 0.9) docs.push(entryDoc(vendor._id, date, '21:30', { type: 'sale', category: 'sales', itemKey: 'total_sales', item: 'Total sales', amount: sales, source: r() < 0.8 ? 'voice' : 'text' }));
      if (r() < 0.8) summaries.push({ vendor: vendor._id, date, viewedAt: at(date, '21:40'), sharedCount: r() < 0.15 ? 1 : 0 });
    }
  }
  await Entry.collection.insertMany(docs);
  await DailySummary.insertMany(summaries);
}

function between(r, lo, hi) {
  return lo + r() * (hi - lo);
}

export async function seed() {
  const today = dayKey();
  await Benchmark.deleteMany({});
  const units = Object.fromEntries(Object.entries(INGREDIENTS).map(([k, v]) => [k, v.unit]));
  await Benchmark.insertMany(buildBenchmarks(units));
  await seedDemoStall(today);
  await seedPilotCohort(today);
  console.log(`[seed] done: benchmarks, demo stall (login ${DEMO_PHONE}), 24 pilot vendors`);
}

// CLI: wipe and reseed.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { connectDb, disconnectDb } = await import('./db.js');
  await connectDb();
  await Promise.all([Vendor, MenuItem, Entry, Benchmark, DailySummary, Otp].map((m) => m.deleteMany({})));
  await seed();
  await disconnectDb();
  await mongoose.disconnect().catch(() => {});
}
