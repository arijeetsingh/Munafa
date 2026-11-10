import { Router } from 'express';
import { z } from 'zod';
import { AREAS, BUSINESS_TYPES, INGREDIENTS, MENU_TEMPLATES, OVERHEADS, UNIT_ALIASES, templateByKey } from '../data/catalog.js';
import { MenuItem } from '../models/index.js';
import { ah } from '../middleware/auth.js';

const router = Router();

const profileSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  language: z.enum(['hi', 'hinglish', 'en']).optional(),
  businessType: z.enum(BUSINESS_TYPES.map((b) => b.key)).optional(),
  area: z.enum(AREAS).optional(),
  closingTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  remindersOn: z.boolean().optional(),
});

const menuInputSchema = z.object({
  templateKey: z.string().optional(),
  name: z.string().trim().min(1).max(60).optional(),
  price: z.number().min(1).max(5000),
  recipe: z.array(z.object({ ingredientKey: z.enum(Object.keys(INGREDIENTS)), qty: z.number().min(0).max(100) })).max(20).optional(),
});

function menuDoc(vendorId, input) {
  const tpl = input.templateKey ? templateByKey(input.templateKey) : null;
  if (!tpl && !input.name) throw Object.assign(new Error('Give the item a name.'), { status: 400 });
  return {
    vendor: vendorId,
    name: input.name || tpl.name,
    templateKey: tpl?.key,
    serving: tpl?.serving || '1 plate',
    price: input.price,
    recipe: input.recipe ?? (tpl ? tpl.recipe.map(([ingredientKey, qty]) => ({ ingredientKey, qty })) : []),
  };
}

router.get('/catalog', (req, res) => {
  res.json({
    businessTypes: BUSINESS_TYPES,
    areas: AREAS,
    templates: MENU_TEMPLATES.map(({ key, name, serving, price, businessTypes, recipe }) => ({ key, name, serving, price, businessTypes, recipe })),
    ingredients: Object.entries(INGREDIENTS).map(([key, v]) => ({ key, name: v.name, hi: v.hi, unit: v.unit })),
    overheads: Object.entries(OVERHEADS).map(([key, v]) => ({ key, name: v.name, hi: v.hi })),
    units: Object.keys(UNIT_ALIASES),
  });
});

router.patch('/me', ah(async (req, res) => {
  Object.assign(req.vendor, profileSchema.parse(req.body));
  await req.vendor.save();
  res.json({ vendor: req.vendor });
}));

router.post('/onboarding', ah(async (req, res) => {
  const body = profileSchema.extend({ menu: z.array(menuInputSchema).min(1, 'Pick at least one menu item.').max(30) }).parse(req.body);
  const { menu, ...profile } = body;
  Object.assign(req.vendor, profile, { onboarded: true });
  await req.vendor.save();
  await MenuItem.deleteMany({ vendor: req.vendor._id });
  const items = await MenuItem.insertMany(menu.map((m) => menuDoc(req.vendor._id, m)));
  res.json({ vendor: req.vendor, menu: items });
}));

router.get('/menu', ah(async (req, res) => {
  res.json({ menu: await MenuItem.find({ vendor: req.vendor._id, active: true }).sort({ createdAt: 1 }) });
}));

router.post('/menu', ah(async (req, res) => {
  const item = await MenuItem.create(menuDoc(req.vendor._id, menuInputSchema.parse(req.body)));
  res.status(201).json({ item });
}));

router.patch('/menu/:id', ah(async (req, res) => {
  const patch = menuInputSchema.partial().parse(req.body);
  const item = await MenuItem.findOneAndUpdate({ _id: req.params.id, vendor: req.vendor._id }, patch, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ error: 'Menu item not found.' });
  res.json({ item });
}));

router.delete('/menu/:id', ah(async (req, res) => {
  await MenuItem.updateOne({ _id: req.params.id, vendor: req.vendor._id }, { active: false });
  res.json({ ok: true });
}));

export default router;
