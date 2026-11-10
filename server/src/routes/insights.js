import { Router } from 'express';
import { z } from 'zod';
import { Benchmark, DailySummary, Entry, MenuItem, Vendor } from '../models/index.js';
import { ah } from '../middleware/auth.js';
import { addDays, dayKey, dayRange } from '../services/dates.js';
import {
  costPerPlate, dailyUsage, latestPrices, pickTip, priceAlerts, summariseDay, trend, weekly,
} from '../services/insights.js';

const router = Router();
const dateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();

async function context(vendor, endKey, days = 30) {
  const [entries, menu, benchmarks] = await Promise.all([
    Entry.find({ vendor: vendor._id, date: { $gte: addDays(endKey, -days + 1), $lte: endKey } }).sort({ createdAt: -1 }).lean(),
    MenuItem.find({ vendor: vendor._id, active: true }).sort({ createdAt: 1 }).lean(),
    Benchmark.find({ area: vendor.area }).lean(),
  ]);
  const bmMap = Object.fromEntries(benchmarks.map((b) => [b.ingredientKey, b]));
  const prices = latestPrices(entries);
  const lang = vendor.language;
  const plates = costPerPlate(menu, prices, bmMap, lang);
  const alerts = priceAlerts(prices, bmMap, dailyUsage(entries, endKey), lang);
  return { entries, menu, bmMap, prices, plates, alerts, lang };
}

router.get('/dashboard', ah(async (req, res) => {
  const date = dateParam.parse(req.query.date) || dayKey();
  const ctx = await context(req.vendor, date, 30);
  const todays = ctx.entries.filter((e) => e.date === date);
  const today = summariseDay(todays);
  const yesterday = summariseDay(ctx.entries.filter((e) => e.date === addDays(date, -1)));
  const summary = await DailySummary.findOneAndUpdate(
    { vendor: req.vendor._id, date },
    { $set: { viewedAt: new Date() } },
    { upsert: true, new: true },
  );
  // Logging streak: consecutive days up to today (or yesterday) with an entry.
  const loggedDays = new Set(ctx.entries.map((e) => e.date));
  let streak = 0;
  for (let d = loggedDays.has(date) ? date : addDays(date, -1); loggedDays.has(d); d = addDays(d, -1)) streak += 1;

  res.json({
    date,
    today,
    yesterday: { profit: yesterday.profit, logged: yesterday.entryCount > 0 },
    change: yesterday.entryCount ? today.profit - yesterday.profit : null,
    tip: pickTip({ today, alerts: ctx.alerts, plates: ctx.plates, lang: ctx.lang }),
    alertCount: ctx.alerts.length,
    recent: todays.slice(0, 5),
    cashCounted: summary.cashCounted ?? null,
    streak,
  });
}));

router.post('/dashboard/cash', ah(async (req, res) => {
  const { date, cashCounted } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), cashCounted: z.number().min(0).max(10000000) }).parse(req.body);
  const doc = await DailySummary.findOneAndUpdate({ vendor: req.vendor._id, date }, { cashCounted }, { upsert: true, new: true });
  res.json({ cashCounted: doc.cashCounted });
}));

router.post('/dashboard/shared', ah(async (req, res) => {
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.body.date);
  await DailySummary.updateOne({ vendor: req.vendor._id, date }, { $inc: { sharedCount: 1 } }, { upsert: true });
  res.json({ ok: true });
}));

router.get('/insights', ah(async (req, res) => {
  const date = dateParam.parse(req.query.date) || dayKey();
  const ctx = await context(req.vendor, date, 30);
  const sparse = Object.values(ctx.bmMap).filter((b) => b.sampleSize < 5).map((b) => b.ingredientKey);
  res.json({
    date,
    area: req.vendor.area,
    plates: ctx.plates,
    trend: trend(ctx.entries, date, 7),
    alerts: ctx.alerts,
    weekly: weekly(ctx.entries, date),
    prices: Object.entries(ctx.prices).map(([key, p]) => ({
      ingredientKey: key,
      price: p.price,
      unit: p.unit,
      date: p.date,
      median: ctx.bmMap[key]?.medianPrice ?? null,
      sampleSize: ctx.bmMap[key]?.sampleSize ?? 0,
      enoughData: (ctx.bmMap[key]?.sampleSize ?? 0) >= 5 && !sparse.includes(key),
    })),
  });
}));

// Pilot success metrics from the PRD, computed over every vendor in the database.
router.get('/metrics', ah(async (req, res) => {
  const end = dayKey();
  const week = dayRange(end, 7);
  const from28 = addDays(end, -27);
  const [vendors, entries, summaries] = await Promise.all([
    Vendor.find({ onboarded: true }).select('_id createdAt').lean(),
    Entry.find({ date: { $gte: from28, $lte: end } }).select('vendor date type source parser edited').lean(),
    DailySummary.find({ date: { $gte: from28, $lte: end } }).select('vendor date viewedAt sharedCount').lean(),
  ]);

  const perVendorDay = {};
  for (const e of entries) {
    const k = `${e.vendor}|${e.date}`;
    perVendorDay[k] ??= { sale: false, expense: false };
    perVendorDay[k][e.type] = true;
  }
  const viewed = new Set(summaries.filter((s) => s.viewedAt).map((s) => `${s.vendor}|${s.date}`));
  const loggingDays = (vid, days) => days.filter((d) => {
    const v = perVendorDay[`${vid}|${d}`];
    return v && v.sale && v.expense;
  }).length;

  let wpav = 0;
  let totalLoggingDays = 0;
  for (const v of vendors) {
    const n = loggingDays(v._id, week);
    totalLoggingDays += n;
    if (n >= 4 && week.some((d) => viewed.has(`${v._id}|${d}`))) wpav += 1;
  }

  // W4 retention: vendors active in their first week who still logged in days 22–28.
  const week1 = dayRange(addDays(end, -21), 7);
  const week4 = week;
  const activeIn = (vid, days) => days.some((d) => perVendorDay[`${vid}|${d}`]);
  const cohort = vendors.filter((v) => activeIn(v._id, week1));
  const retained = cohort.filter((v) => activeIn(v._id, week4));

  const parsed = entries.filter((e) => e.parser !== 'none' && e.parser);
  const activeDays = new Set(entries.map((e) => `${e.vendor}|${e.date}`)).size;
  const shares = summaries.reduce((s, x) => s + (x.sharedCount ? 1 : 0), 0);

  res.json({
    asOf: end,
    vendors: vendors.length,
    northStar: { name: 'Weekly Profit-Aware Vendors', value: wpav },
    metrics: [
      { level: 'Primary', name: 'Logging days per week', value: vendors.length ? +(totalLoggingDays / vendors.length).toFixed(1) : 0, target: 4.5, unit: 'days' },
      { level: 'Primary', name: 'Week-4 retention', value: cohort.length ? Math.round((retained.length / cohort.length) * 100) : null, target: 40, unit: '%' },
      { level: 'Secondary', name: 'Parse accuracy', value: parsed.length ? Math.round((parsed.filter((e) => !e.edited).length / parsed.length) * 100) : null, target: 85, unit: '%' },
      { level: 'Secondary', name: 'Summary shares', value: activeDays ? Math.round((shares / activeDays) * 100) : null, target: 10, unit: '%' },
    ],
  });
}));

export default router;
