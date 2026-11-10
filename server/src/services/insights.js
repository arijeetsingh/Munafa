// Insights engine. All money maths lives here, in plain code: the LLM only
// parses text and (optionally) rephrases the tip. Functions take plain arrays
// so they are easy to test.

import { INGREDIENTS, OVERHEADS, toBase } from '../data/catalog.js';
import { addDays, dayRange } from './dates.js';

export const ALERT_THRESHOLD = 0.1; // 10% above area median (PRD F6)
export const MIN_SAMPLE = 5; // benchmark needs 5+ data points (PRD F6)

const round2 = (n) => Math.round(n * 100) / 100;

function label(key, lang) {
  const src = INGREDIENTS[key] || OVERHEADS[key];
  if (!src) return key;
  return lang === 'en' ? src.name : src.hi;
}

// ₹ per base unit for an ingredient purchase, or null when it can't be known.
export function unitPrice(entry) {
  if (entry.type !== 'expense' || entry.category !== 'ingredient' || !entry.qty || !entry.unit) return null;
  const base = toBase(entry.qty, entry.unit);
  const ing = INGREDIENTS[entry.itemKey];
  if (!base || !ing || base.unit !== ing.unit || base.qty <= 0) return null;
  return { price: entry.amount / base.qty, unit: base.unit, baseQty: base.qty };
}

// Latest price paid per ingredient (entries sorted newest first is not required).
export function latestPrices(entries) {
  const out = {};
  for (const e of entries) {
    const up = unitPrice(e);
    if (!up) continue;
    const ts = new Date(e.createdAt || `${e.date}T12:00:00Z`).getTime();
    const prev = out[e.itemKey];
    if (!prev || ts > prev.ts) out[e.itemKey] = { price: round2(up.price), unit: up.unit, date: e.date, ts };
  }
  return out;
}

export function summariseDay(entries) {
  let sales = 0;
  let expenses = 0;
  const costs = {};
  for (const e of entries) {
    if (e.type === 'sale') sales += e.amount;
    else {
      expenses += e.amount;
      const k = e.itemKey === 'other' ? `other:${e.item}` : e.itemKey;
      costs[k] ??= { itemKey: e.itemKey, item: e.item, amount: 0 };
      costs[k].amount += e.amount;
    }
  }
  const topCosts = Object.values(costs)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((c) => ({ ...c, share: expenses ? Math.round((c.amount / expenses) * 100) : 0 }));
  return {
    sales,
    expenses,
    profit: sales - expenses,
    topCosts,
    entryCount: entries.length,
    hasSale: entries.some((e) => e.type === 'sale'),
    hasExpense: entries.some((e) => e.type === 'expense'),
  };
}

export function trend(entries, endKey, days = 7) {
  const byDay = {};
  for (const e of entries) (byDay[e.date] ??= []).push(e);
  return dayRange(endKey, days).map((date) => {
    const s = summariseDay(byDay[date] || []);
    return { date, sales: s.sales, expenses: s.expenses, profit: s.profit, logged: s.entryCount > 0 };
  });
}

/**
 * Cost and margin per plate. Uses the vendor's latest price for each
 * ingredient, falling back to the area benchmark when they haven't logged it.
 */
export function costPerPlate(menuItems, prices, benchmarks, lang = 'hinglish') {
  return menuItems.map((m) => {
    const lines = (m.recipe || []).map((r) => {
      const own = prices[r.ingredientKey];
      const bm = benchmarks[r.ingredientKey];
      const price = own ? own.price : bm ? bm.medianPrice : 0;
      return {
        ingredientKey: r.ingredientKey,
        name: label(r.ingredientKey, lang),
        qty: r.qty,
        unit: INGREDIENTS[r.ingredientKey]?.unit || 'pc',
        unitPrice: round2(price),
        priceSource: own ? 'yours' : bm ? 'area' : 'missing',
        cost: round2(r.qty * price),
      };
    });
    const cost = round2(lines.reduce((s, l) => s + l.cost, 0));
    const margin = round2(m.price - cost);
    return {
      menuItemId: String(m._id),
      name: m.name,
      serving: m.serving,
      price: m.price,
      cost,
      margin,
      marginPct: m.price ? Math.round((margin / m.price) * 100) : 0,
      lines: lines.sort((a, b) => b.cost - a.cost),
    };
  });
}

// Average daily purchase quantity (base units) over the last `days` days.
export function dailyUsage(entries, endKey, days = 14) {
  const from = addDays(endKey, -days + 1);
  const totals = {};
  const activeDays = new Set();
  for (const e of entries) {
    if (e.date < from || e.date > endKey) continue;
    activeDays.add(e.date);
    const up = unitPrice(e);
    if (up) totals[e.itemKey] = (totals[e.itemKey] || 0) + up.baseQty;
  }
  const n = Math.max(activeDays.size, 1);
  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / n]));
}

export function priceAlerts(prices, benchmarks, usage, lang = 'hinglish') {
  const alerts = [];
  for (const [key, own] of Object.entries(prices)) {
    const bm = benchmarks[key];
    if (!bm || bm.unit !== own.unit || bm.sampleSize < MIN_SAMPLE) continue;
    const pct = (own.price - bm.medianPrice) / bm.medianPrice;
    if (pct < ALERT_THRESHOLD) continue;
    const perDay = usage[key] || 0;
    alerts.push({
      ingredientKey: key,
      name: label(key, lang),
      unit: own.unit,
      paid: own.price,
      median: bm.medianPrice,
      pctAbove: Math.round(pct * 100),
      sampleSize: bm.sampleSize,
      date: own.date,
      monthlyExtra: Math.round((own.price - bm.medianPrice) * perDay * 30),
    });
  }
  return alerts.sort((a, b) => b.monthlyExtra - a.monthlyExtra || b.pctAbove - a.pctAbove);
}

// Best and worst menu item by sales over a window, plus week-on-week profit.
export function weekly(entries, endKey) {
  const thisWeek = new Set(dayRange(endKey, 7));
  const lastWeek = new Set(dayRange(addDays(endKey, -7), 7));
  const items = {};
  let profitThis = 0;
  let profitLast = 0;
  for (const e of entries) {
    const sign = e.type === 'sale' ? 1 : -1;
    if (thisWeek.has(e.date)) {
      profitThis += sign * e.amount;
      if (e.type === 'sale' && e.category === 'menu') {
        items[e.item] ??= { item: e.item, amount: 0, qty: 0 };
        items[e.item].amount += e.amount;
        items[e.item].qty += e.qty || 0;
      }
    } else if (lastWeek.has(e.date)) profitLast += sign * e.amount;
  }
  const ranked = Object.values(items).sort((a, b) => b.amount - a.amount);
  return {
    profit: profitThis,
    previousProfit: profitLast,
    change: profitLast ? Math.round(((profitThis - profitLast) / Math.abs(profitLast)) * 100) : null,
    best: ranked[0] || null,
    worst: ranked.length > 1 ? ranked[ranked.length - 1] : null,
  };
}

const fmtINR = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const TIPS = {
  alert: {
    hinglish: (a) => `${a.name} ka rate area se ${a.pctAbove}% zyada hai (${fmtINR(a.paid)} vs ${fmtINR(a.median)}/${a.unit}).${a.monthlyExtra > 0 ? ` Doosre supplier se lagbhag ${fmtINR(a.monthlyExtra)} mahina bach sakta hai.` : ''}`,
    hi: (a) => `${a.name} का रेट इलाके से ${a.pctAbove}% ज़्यादा है (${fmtINR(a.paid)} बनाम ${fmtINR(a.median)}/${a.unit})।${a.monthlyExtra > 0 ? ` दूसरे सप्लायर से लगभग ${fmtINR(a.monthlyExtra)} महीना बच सकता है।` : ''}`,
    en: (a) => `You paid ${a.pctAbove}% above the area rate for ${a.name.toLowerCase()} (${fmtINR(a.paid)} vs ${fmtINR(a.median)}/${a.unit}).${a.monthlyExtra > 0 ? ` Switching supplier could save about ${fmtINR(a.monthlyExtra)} a month.` : ''}`,
  },
  lowMargin: {
    hinglish: (p) => `${p.name} par margin sirf ${p.marginPct}% hai (${fmtINR(p.margin)} per plate). Daam ${fmtINR(p.suggest)} karne par ${p.target}% margin milega.`,
    hi: (p) => `${p.name} पर मार्जिन सिर्फ़ ${p.marginPct}% है (${fmtINR(p.margin)} प्रति प्लेट)। दाम ${fmtINR(p.suggest)} करने पर ${p.target}% मार्जिन मिलेगा।`,
    en: (p) => `${p.name} earns only ${p.marginPct}% (${fmtINR(p.margin)} a plate). Pricing it at ${fmtINR(p.suggest)} gets you to ${p.target}%.`,
  },
  noSales: {
    hinglish: () => 'Aaj ki bikri abhi tak nahi boli. Dukaan band karte waqt bas bolo: "aaj 4,000 ki bikri".',
    hi: () => 'आज की बिक्री अभी तक नहीं बोली। दुकान बंद करते समय बस बोलिए: "आज 4,000 की बिक्री"।',
    en: () => 'No sales logged yet today. At closing, just say: "sales today 4,000".',
  },
  topCost: {
    hinglish: (c) => `Aaj ka sabse bada kharcha: ${c.item} (${fmtINR(c.amount)}, kul kharche ka ${c.share}%).`,
    hi: (c) => `आज का सबसे बड़ा खर्चा: ${c.item} (${fmtINR(c.amount)}, कुल खर्चे का ${c.share}%)।`,
    en: (c) => `Biggest cost today: ${c.item} (${fmtINR(c.amount)}, ${c.share}% of spending).`,
  },
  start: {
    hinglish: () => 'Pehli entry bolo, jaise: "teen kilo pyaaz 90 rupaye".',
    hi: () => 'पहली एंट्री बोलिए, जैसे: "तीन किलो प्याज़ 90 रुपये"।',
    en: () => 'Log your first entry, for example: "3 kg onions 90 rupees".',
  },
};

// One tip a day, picked by rule in priority order.
export function pickTip({ today, alerts, plates, lang = 'hinglish' }) {
  const L = ['hi', 'en', 'hinglish'].includes(lang) ? lang : 'hinglish';
  if (alerts.length) return { kind: 'price_alert', text: TIPS.alert[L](alerts[0]), ref: alerts[0].ingredientKey };
  const weak = plates.filter((p) => p.price > 0 && p.marginPct < 35).sort((a, b) => a.marginPct - b.marginPct)[0];
  if (weak) {
    const target = 40;
    const suggest = Math.ceil(weak.cost / (1 - target / 100));
    return { kind: 'low_margin', text: TIPS.lowMargin[L]({ ...weak, suggest, target }), ref: weak.menuItemId };
  }
  if (today.entryCount === 0) return { kind: 'start', text: TIPS.start[L]() };
  if (!today.hasSale) return { kind: 'no_sales', text: TIPS.noSales[L]() };
  if (today.topCosts[0]) return { kind: 'top_cost', text: TIPS.topCost[L](today.topCosts[0]) };
  return { kind: 'start', text: TIPS.start[L]() };
}
