import test from 'node:test';
import assert from 'node:assert/strict';
import {
  costPerPlate, latestPrices, pickTip, priceAlerts, summariseDay, trend, unitPrice, weekly,
} from '../src/services/insights.js';

const buy = (itemKey, qty, unit, amount, date = '2026-11-10', createdAt) => ({
  type: 'expense', category: 'ingredient', itemKey, item: itemKey, qty, unit, amount, date, createdAt,
});
const sell = (amount, date = '2026-11-10', extra = {}) => ({ type: 'sale', category: 'sales', itemKey: 'total_sales', item: 'Total sales', amount, date, ...extra });

test('profit is sales minus expenses, with top 3 costs', () => {
  const s = summariseDay([buy('oil', 2, 'L', 280), buy('potato', 5, 'kg', 150), buy('onion', 3, 'kg', 90), buy('curd', 1, 'kg', 70), sell(4200)]);
  assert.equal(s.sales, 4200);
  assert.equal(s.expenses, 590);
  assert.equal(s.profit, 3610);
  assert.deepEqual(s.topCosts.map((c) => c.itemKey), ['oil', 'potato', 'onion']);
  assert.equal(s.topCosts[0].share, 47);
});

test('unit price converts grams and dozens to base units', () => {
  assert.equal(unitPrice(buy('coriander', 250, 'g', 20)).price, 80);
  assert.equal(unitPrice(buy('banana', 2, 'dozen', 120)).price, 5);
  assert.equal(unitPrice(buy('onion', 3, 'packet', 90)), null); // can't compare packets with kg
});

test('latest price wins', () => {
  const prices = latestPrices([
    buy('oil', 1, 'L', 130, '2026-11-08', '2026-11-08T07:00:00Z'),
    buy('oil', 2, 'L', 280, '2026-11-10', '2026-11-10T07:00:00Z'),
  ]);
  assert.equal(prices.oil.price, 140);
});

test('price alert fires at 10%+ above median with 5+ data points only', () => {
  const prices = { oil: { price: 140, unit: 'L', date: 'd' }, potato: { price: 31, unit: 'kg', date: 'd' }, curd: { price: 90, unit: 'kg', date: 'd' } };
  const benchmarks = {
    oil: { medianPrice: 125, unit: 'L', sampleSize: 12 }, // 12% above → alert
    potato: { medianPrice: 30, unit: 'kg', sampleSize: 20 }, // 3% above → no alert
    curd: { medianPrice: 70, unit: 'kg', sampleSize: 3 }, // too few data points → no alert
  };
  const alerts = priceAlerts(prices, benchmarks, { oil: 2 });
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].ingredientKey, 'oil');
  assert.equal(alerts[0].pctAbove, 12);
  assert.equal(alerts[0].monthlyExtra, 900); // (140 − 125) × 2 L × 30 days, as on the deck
});

test('cost per plate uses own prices first, then the area benchmark', () => {
  const menu = [{ _id: 'm1', name: 'Chai', price: 12, recipe: [{ ingredientKey: 'milk', qty: 0.1 }, { ingredientKey: 'sugar', qty: 0.01 }] }];
  const [plate] = costPerPlate(menu, { milk: { price: 60, unit: 'L' } }, { sugar: { medianPrice: 40, unit: 'kg', sampleSize: 9 } });
  assert.equal(plate.cost, 6.4);
  assert.equal(plate.margin, 5.6);
  assert.equal(plate.marginPct, 47);
  assert.deepEqual(plate.lines.map((l) => l.priceSource), ['yours', 'area']);
});

test('tip priority: price alert, then weak margin, then nudges', () => {
  const today = summariseDay([buy('oil', 2, 'L', 280)]);
  const alert = { ingredientKey: 'oil', name: 'Tel', unit: 'L', paid: 140, median: 125, pctAbove: 12, monthlyExtra: 900 };
  assert.equal(pickTip({ today, alerts: [alert], plates: [] }).kind, 'price_alert');
  const weak = { menuItemId: 'm', name: 'Samosa', price: 10, cost: 8, margin: 2, marginPct: 20 };
  assert.equal(pickTip({ today, alerts: [], plates: [weak] }).kind, 'low_margin');
  assert.equal(pickTip({ today, alerts: [], plates: [] }).kind, 'no_sales');
  assert.equal(pickTip({ today: summariseDay([]), alerts: [], plates: [] }).kind, 'start');
  assert.match(pickTip({ today, alerts: [alert], plates: [], lang: 'en' }).text, /12% above the area rate/);
});

test('trend fills missing days with zero', () => {
  const t = trend([sell(1000, '2026-11-09'), buy('oil', 1, 'L', 140, '2026-11-10')], '2026-11-10', 3);
  assert.deepEqual(t.map((d) => d.profit), [0, 1000, -140]);
  assert.deepEqual(t.map((d) => d.logged), [false, true, true]);
});

test('weekly finds best and worst menu item', () => {
  const menuSale = (item, amount) => sell(amount, '2026-11-10', { category: 'menu', item });
  const w = weekly([menuSale('Tikki', 1200), menuSale('Samosa', 300), menuSale('Tikki', 800), sell(500, '2026-11-01')], '2026-11-10');
  assert.equal(w.best.item, 'Tikki');
  assert.equal(w.worst.item, 'Samosa');
  assert.equal(w.profit, 2300);
  assert.equal(w.previousProfit, 500);
});
