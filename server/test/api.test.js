// End-to-end API test against a throwaway in-memory MongoDB.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.DEMO_OTP = 'true';
process.env.ANTHROPIC_API_KEY = '';

const { createApp } = await import('../src/app.js');
const { Benchmark } = await import('../src/models/index.js');
const { buildBenchmarks } = await import('../src/data/benchmarks.js');
const { INGREDIENTS } = await import('../src/data/catalog.js');

let mongo;
let server;
let base;
let token;

async function call(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Benchmark.insertMany(buildBenchmarks(Object.fromEntries(Object.entries(INGREDIENTS).map(([k, v]) => [k, v.unit]))));
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
});

test('vendor journey: login → onboard → speak → save → profit card', async () => {
  // Phone OTP login
  const otp = await call('POST', '/auth/request-otp', { phone: '9811122233' });
  assert.equal(otp.status, 200);
  const wrong = await call('POST', '/auth/verify', { phone: '9811122233', code: '000000' });
  assert.equal(wrong.status, 400);
  const login = await call('POST', '/auth/verify', { phone: '9811122233', code: otp.body.demoCode });
  assert.equal(login.status, 200);
  token = login.body.token;
  assert.equal(login.body.vendor.onboarded, false);

  // Protected routes need the token
  const saved = token;
  token = null;
  assert.equal((await call('GET', '/dashboard')).status, 401);
  token = saved;

  // Onboarding from templates
  const onboard = await call('POST', '/onboarding', {
    name: 'Sunita', language: 'en', businessType: 'momos', area: 'Pune', closingTime: '22:00',
    menu: [{ templateKey: 'veg_momos', price: 60 }, { templateKey: 'paneer_momos', price: 80 }],
  });
  assert.equal(onboard.status, 200);
  assert.equal(onboard.body.menu.length, 2);

  // Speak → parse
  const parsed = await call('POST', '/parse', { text: '3 kilo patta gobhi 90, 2 litre tel 300' });
  assert.equal(parsed.status, 200);
  assert.equal(parsed.body.entries.length, 2);

  // Confirm → save (with an offline clientId sent twice: stored once)
  const entries = parsed.body.entries.map((e, i) => ({ ...e, source: 'voice', parser: parsed.body.parser, clientId: `c-${i}` }));
  assert.equal((await call('POST', '/entries', { entries })).status, 201);
  assert.equal((await call('POST', '/entries', { entries })).status, 201);
  const sale = (await call('POST', '/parse', { text: 'sold 30 plates veg momos 1800' })).body.entries[0];
  await call('POST', '/entries', { entries: [{ ...sale, source: 'text', parser: 'rules' }] });

  const list = await call('GET', '/entries');
  assert.equal(list.body.entries.length, 3);

  // Profit card
  const dash = await call('GET', '/dashboard');
  assert.equal(dash.body.today.sales, 1800);
  assert.equal(dash.body.today.expenses, 390);
  assert.equal(dash.body.today.profit, 1410);
  assert.equal(dash.body.tip.kind, 'price_alert'); // ₹150/L oil vs Pune median
  assert.match(dash.body.tip.text, /area rate for cooking oil/);

  // Insights
  const ins = await call('GET', '/insights');
  assert.equal(ins.body.plates.length, 2);
  assert.equal(ins.body.trend.length, 7);
  assert.ok(ins.body.alerts.some((a) => a.ingredientKey === 'oil'));

  // Edit and delete
  const id = list.body.entries[0]._id;
  const edit = await call('PATCH', `/entries/${id}`, { amount: 1700 });
  assert.equal(edit.body.entry.edited, true);
  assert.equal((await call('DELETE', `/entries/${id}`)).status, 200);

  // Validation errors are readable
  const bad = await call('POST', '/entries', { entries: [{ type: 'expense', itemKey: 'x', item: 'x', amount: -5 }] });
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /more than ₹0/);
});
