// Optional Claude-backed parser. Active only when ANTHROPIC_API_KEY is set;
// any failure falls back to the rule-based parser, so the app always works.

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { INGREDIENTS, OVERHEADS, UNIT_ALIASES } from '../data/catalog.js';

let client;
function getClient() {
  if (!config.anthropicKey) return null;
  client ??= new Anthropic({ apiKey: config.anthropicKey, timeout: 15_000, maxRetries: 1 });
  return client;
}

export const llmEnabled = () => Boolean(config.anthropicKey);

const nullable = (type) => ({ anyOf: [{ type }, { type: 'null' }] });

const ENTRY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['entries'],
  properties: {
    entries: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'item_key', 'item_name', 'qty', 'unit', 'amount', 'confidence', 'uncertain_fields'],
        properties: {
          type: { type: 'string', enum: ['expense', 'sale'] },
          item_key: { type: 'string' },
          item_name: { type: 'string' },
          qty: nullable('number'),
          unit: nullable('string'),
          amount: nullable('number'),
          confidence: { type: 'number' },
          uncertain_fields: { type: 'array', items: { type: 'string', enum: ['item', 'qty', 'unit', 'amount', 'type'] } },
        },
      },
    },
  },
};

const SYSTEM = `You turn what an Indian street-food vendor says (Hindi, Hinglish or English, often loose and spoken) into bookkeeping entries.

Rules:
- One entry per purchase or sale mentioned. Ignore chit-chat.
- type: "expense" for buying or paying (kharida, liya, diya, mandi), "sale" for selling (becha, bikri, plates sold, total sales).
- item_key: one of the ingredient keys, overhead keys or menu keys listed below; "total_sales" for a day's total sales with no item; "other" if nothing fits.
- item_name: a short English display name.
- qty and unit: the quantity as spoken, unit one of: ${Object.keys(UNIT_ALIASES).join(', ')}. null when not said.
- amount: rupees as a number. Convert number words ("nabbe" = 90, "dedh sau" = 150, "dhai hazaar" = 2500). null when not said; never compute it from prices.
- confidence: 0 to 1 for the whole entry. uncertain_fields: the fields you guessed.`;

function catalogPrompt(menu) {
  const ingredients = Object.entries(INGREDIENTS).map(([k, v]) => `${k} (${v.hi})`).join(', ');
  const overheads = Object.entries(OVERHEADS).map(([k, v]) => `${k} (${v.hi})`).join(', ');
  const menuList = menu.map((m) => `${m.templateKey || m.name} = ${m.name} at ₹${m.price}`).join('; ') || 'none';
  return `Ingredient keys: ${ingredients}\nOverhead keys: ${overheads}\nThis vendor's menu keys: ${menuList}`;
}

/** Returns parsed entries in the same shape as the rule parser, or null on failure. */
export async function parseWithClaude(text, menu) {
  const c = getClient();
  if (!c) return null;
  try {
    const response = await c.beta.messages.create({
      model: config.claudeModel,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ENTRY_SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: `${catalogPrompt(menu)}\n\nVendor said: """${text}"""` }],
    });
    if (response.stop_reason === 'refusal') return null;
    const block = response.content.find((b) => b.type === 'text');
    if (!block) return null;
    const data = JSON.parse(block.text);
    return data.entries.map((e) => normaliseEntry(e, menu, text)).filter((e) => e.amount !== null || e.qty !== null);
  } catch (err) {
    if (err instanceof Anthropic.APIError) console.warn(`[llm] ${err.status ?? ''} ${err.message}`);
    else console.warn('[llm] parse failed:', err.message);
    return null;
  }
}

// Map the model's answer onto known catalog keys; the code, not the model,
// decides category and derived values.
function normaliseEntry(e, menu, raw) {
  const menuItem = menu.find((m) => (m.templateKey || m.name) === e.item_key || m.name.toLowerCase() === e.item_name.toLowerCase());
  let category = 'other';
  let itemKey = e.item_key;
  let item = e.item_name;
  if (menuItem) {
    category = 'menu';
    itemKey = menuItem.templateKey || menuItem.name;
    item = menuItem.name;
  } else if (INGREDIENTS[e.item_key]) {
    category = 'ingredient';
    item = INGREDIENTS[e.item_key].name;
  } else if (OVERHEADS[e.item_key]) {
    category = 'overhead';
    item = OVERHEADS[e.item_key].name;
  } else if (e.item_key === 'total_sales') {
    category = 'sales';
    item = 'Total sales';
  } else {
    itemKey = 'other';
  }
  const unit = e.unit && UNIT_ALIASES[e.unit] ? e.unit : null;
  let amount = e.amount;
  const fieldConfidence = { item: 0.95, qty: 0.95, unit: 0.95, amount: 0.95, type: 0.95 };
  for (const f of e.uncertain_fields) fieldConfidence[f] = 0.6;
  if (category === 'menu' && amount === null && e.qty) {
    amount = Math.round(e.qty * menuItem.price);
    fieldConfidence.amount = 0.7;
  }
  if (amount === null) fieldConfidence.amount = 0;
  const confidence = Math.min(e.confidence, ...Object.values(fieldConfidence));
  return {
    type: e.type,
    category,
    itemKey,
    item,
    menuItemId: menuItem?._id ? String(menuItem._id) : undefined,
    qty: e.qty,
    unit: e.qty === null ? null : unit,
    amount,
    confidence: Math.round(confidence * 100) / 100,
    lowConfidence: Object.entries(fieldConfidence).filter(([, v]) => v < 0.8).map(([k]) => k),
    fieldConfidence,
    raw,
  };
}
