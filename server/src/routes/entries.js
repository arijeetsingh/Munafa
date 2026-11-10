import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { INGREDIENTS, UNIT_ALIASES } from '../data/catalog.js';
import { Entry, MenuItem } from '../models/index.js';
import { ah } from '../middleware/auth.js';
import { parseText } from '../services/parser.js';
import { llmEnabled, parseWithClaude } from '../services/llm.js';
import { addDays, dayKey } from '../services/dates.js';

const router = Router();

router.post('/parse', ah(async (req, res) => {
  const text = z.string().trim().min(1, 'Say or type something first.').max(500).parse(req.body.text);
  const menu = await MenuItem.find({ vendor: req.vendor._id, active: true }).lean();
  const started = Date.now();
  let entries = null;
  let parser = 'rules';
  if (llmEnabled()) {
    entries = await parseWithClaude(text, menu);
    if (entries?.length) parser = 'llm';
  }
  if (!entries?.length) entries = parseText(text, menu);
  res.json({ entries, parser, ms: Date.now() - started });
}));

const entryInput = z.object({
  type: z.enum(['expense', 'sale']),
  category: z.enum(['ingredient', 'overhead', 'menu', 'sales', 'other']).default('other'),
  itemKey: z.string().min(1).max(60),
  item: z.string().trim().min(1).max(80),
  menuItemId: z.string().optional().nullable(),
  qty: z.number().positive().max(100000).nullable().optional(),
  unit: z.enum(Object.keys(UNIT_ALIASES)).nullable().optional(),
  amount: z.number().positive('Amount must be more than ₹0.').max(10000000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: z.enum(['voice', 'text', 'manual']).default('text'),
  parser: z.enum(['rules', 'llm', 'none']).default('none'),
  rawText: z.string().max(500).optional(),
  confidence: z.number().min(0).max(1).optional(),
  edited: z.boolean().default(false),
  clientId: z.string().max(64).optional(),
});

// Keep category consistent with the item key whatever the client sends.
function reconcile(e) {
  if (INGREDIENTS[e.itemKey] && e.type === 'expense') e.category = 'ingredient';
  if (e.type === 'expense' && (e.category === 'menu' || e.category === 'sales')) e.category = 'other';
  if (e.type === 'sale' && !['menu', 'sales'].includes(e.category)) e.category = 'sales';
  if (!e.qty) { e.qty = undefined; e.unit = undefined; }
  return e;
}

router.post('/entries', ah(async (req, res) => {
  const list = z.array(entryInput).min(1).max(50).parse(req.body.entries);
  const today = dayKey();
  const menuIds = new Set((await MenuItem.find({ vendor: req.vendor._id }).select('_id').lean()).map((m) => String(m._id)));
  const saved = [];
  for (const raw of list) {
    const e = reconcile({ ...raw });
    // Offline entries keep their own day, but never a future one or older than a week.
    const date = e.date && e.date <= today && e.date >= addDays(today, -7) ? e.date : today;
    const doc = {
      ...e,
      date,
      vendor: req.vendor._id,
      menuItem: e.menuItemId && menuIds.has(e.menuItemId) ? e.menuItemId : undefined,
    };
    delete doc.menuItemId;
    if (e.clientId) {
      // Idempotent: a retried offline sync returns the stored entry.
      saved.push(await Entry.findOneAndUpdate({ vendor: req.vendor._id, clientId: e.clientId }, { $setOnInsert: doc }, { upsert: true, new: true }));
    } else {
      saved.push(await Entry.create(doc));
    }
  }
  res.status(201).json({ entries: saved });
}));

router.get('/entries', ah(async (req, res) => {
  const q = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    days: z.coerce.number().int().min(1).max(90).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  }).parse(req.query);
  const end = q.date || dayKey();
  const entries = await Entry.find({ vendor: req.vendor._id, date: { $gte: addDays(end, -q.days + 1), $lte: end } })
    .sort({ date: -1, createdAt: -1 })
    .limit(q.limit);
  res.json({ entries });
}));

router.patch('/entries/:id', ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Entry not found.' });
  const patch = reconcile(entryInput.partial().omit({ clientId: true, date: true }).parse(req.body));
  delete patch.menuItemId;
  const entry = await Entry.findOneAndUpdate({ _id: req.params.id, vendor: req.vendor._id }, { ...patch, edited: true }, { new: true, runValidators: true });
  if (!entry) return res.status(404).json({ error: 'Entry not found.' });
  res.json({ entry });
}));

router.delete('/entries/:id', ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Entry not found.' });
  await Entry.deleteOne({ _id: req.params.id, vendor: req.vendor._id });
  res.json({ ok: true });
}));

export default router;
