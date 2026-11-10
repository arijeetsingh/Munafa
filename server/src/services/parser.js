// Rule-based Hindi / Hinglish / English entry parser.
//
// Turns a spoken or typed sentence such as "teen kilo pyaaz 90 rupaye, 2 litre
// tel 280" into structured entries: { type, itemKey, qty, unit, amount }.
// Used on its own when no LLM is configured, and as the fallback when the LLM
// call fails. Every field carries a confidence so the confirm screen can
// highlight what the vendor should check.

import { INGREDIENTS, OVERHEADS, UNIT_ALIASES, MENU_TEMPLATES } from '../data/catalog.js';

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

const NUMBER_WORDS = {
  // Hinglish
  ek: 1, ik: 1, do: 2, teen: 3, tin: 3, char: 4, chaar: 4, paanch: 5, panch: 5, paach: 5,
  chhe: 6, chhah: 6, chheh: 6, che: 6, cheh: 6, saat: 7, aath: 8, ath: 8, nau: 9,
  das: 10, dus: 10, gyarah: 11, gyara: 11, barah: 12, bara: 12, terah: 13, tera: 13, chaudah: 14,
  chauda: 14, pandrah: 15, pandra: 15, solah: 16, sola: 16, satrah: 17, satra: 17, atharah: 18,
  athara: 18, unnis: 19, bees: 20, bis: 20, pachchis: 25, pachis: 25, pachees: 25, tees: 30,
  tis: 30, paintis: 35, paintees: 35, chalis: 40, chaalis: 40, chaalees: 40, pachas: 50,
  pachaas: 50, pachaas: 50, saath: 60, sattar: 70, assi: 80, nabbe: 90, nabbe: 90, nabe: 90,
  // English
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  // Devanagari
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'छः': 6, 'सात': 7,
  'आठ': 8, 'नौ': 9, 'दस': 10, 'बारह': 12, 'पंद्रह': 15, 'बीस': 20, 'पच्चीस': 25, 'तीस': 30,
  'चालीस': 40, 'पचास': 50, 'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90,
};
// Hindi number words 21–99 (romanised as commonly typed or transcribed).
const TENS_WORDS = 'ikkis bais teis chaubis pachchis chhabbis sattais atthais untis tees ikattis battis taintis chauntis paintis chhattis saintis adtis untalis chalis iktalis bayalis taintalis chavalis paintalis chhiyalis saintalis adtalis unchas pachas ikyavan bavan tirpan chauvan pachpan chhappan sattavan atthavan unsath saath iksath basath tirsath chausath painsath chhiyasath sarsath arsath unhattar sattar ikhattar bahattar tihattar chauhattar pachattar chhihattar sathattar athattar unasi assi ikyasi bayasi tirasi chaurasi pachasi chhiyasi sattasi athasi navasi nabbe ikyanve banve tiranve chauranve pachanve chhiyanve sattanve atthanve ninyanve'.split(' ');
TENS_WORDS.forEach((w, i) => { NUMBER_WORDS[w] ??= 21 + i; });

const FRACTIONS = { dedh: 1.5, dhai: 2.5, dhaai: 2.5, adha: 0.5, aadha: 0.5, aadhi: 0.5, half: 0.5, 'डेढ़': 1.5, 'ढाई': 2.5, 'आधा': 0.5 };
const MULTIPLIERS = { sau: 100, hundred: 100, 'सौ': 100, hazaar: 1000, hazar: 1000, hajar: 1000, thousand: 1000, 'हज़ार': 1000, 'हजार': 1000 };
const MODIFIERS = { sava: 0.25, savaa: 0.25, sawa: 0.25, saadhe: 0.5, sadhe: 0.5, 'सवा': 0.25, 'साढ़े': 0.5 };

const MONEY_WORDS = new Set(['rs', 'rs.', 'rupaye', 'rupaya', 'rupay', 'rupee', 'rupees', 'rupe', 'rupya', 'rupiye', 'rupiya', 'inr', '₹', 'रुपये', 'रुपए', 'रुपया', 'rupaiya', 'rupaiye', '/-']);
const MONEY_POSTFIX = new Set(['ka', 'ke', 'ki', 'mein', 'me', 'main', 'में', 'का', 'के', 'की']);

const SALE_CUES = ['becha', 'beche', 'bechi', 'bech', 'beche', 'bika', 'bike', 'biki', 'bikri', 'bikree', 'sale', 'sales', 'sold', 'kamai', 'kamaya', 'kamaye', 'galla', 'dhanda', 'dhandha', 'collection', 'बिक्री', 'बेचा', 'बिके', 'कमाई'];
const EXPENSE_CUES = ['kharida', 'kharide', 'kharidi', 'kharid', 'liya', 'liye', 'li', 'laya', 'laye', 'kharcha', 'kharch', 'diya', 'diye', 'bhara', 'bought', 'paid', 'spent', 'buy', 'purchase', 'mandi', 'खरीदा', 'खर्चा', 'लिया', 'दिया'];
const TOTAL_CUES = ['total', 'kul', 'poora', 'pura', 'aaj', 'din', 'कुल'];

const SEGMENT_SPLIT = /\s*(?:[,;\n।]|\s(?:aur|and|phir|fir|plus|तथा|और)\s)\s*/i;

// ---------- lookup tables ----------

function buildAliasIndex() {
  const rows = [];
  for (const [key, ing] of Object.entries(INGREDIENTS)) {
    for (const alias of ing.aliases) rows.push({ alias: normalise(alias), key, category: 'ingredient' });
  }
  for (const [key, oh] of Object.entries(OVERHEADS)) {
    for (const alias of oh.aliases) rows.push({ alias: normalise(alias), key, category: 'overhead' });
  }
  return rows;
}

const UNIT_INDEX = Object.fromEntries(
  Object.entries(UNIT_ALIASES).flatMap(([unit, aliases]) => aliases.map((a) => [a.toLowerCase(), unit])),
);

let ALIAS_INDEX;

function normalise(text) {
  return String(text)
    .toLowerCase()
    .replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))
    .replace(/(\d),(\d{2,3})\b/g, '$1$2') // 4,200 → 4200 (also Indian 1,20,000)
    .replace(/(\d),(\d{2,3})\b/g, '$1$2')
    .replace(/₹\s*/g, ' ₹ ')
    .replace(/\/-/g, ' /- ')
    .replace(/(\d)(?=[a-zऀ-ॿ])/g, '$1 ') // 3kg → 3 kg, 90rs → 90 rs
    .replace(/([a-zऀ-ॿ])(?=\d)/g, '$1 ') // rs90 → rs 90
    .replace(/[^\p{L}\p{M}\d.₹/\- ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- numbers ----------

// Collapse spoken number words into numeric tokens: "do sau pachas" → 250,
// "dedh sau" → 150, "dhai hazaar" → 2500, "saadhe teen" → 3.5.
function collapseNumbers(tokens) {
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    const start = i;
    let total = 0;
    let current = null;
    let modifier = 0;
    let consumed = false;
    while (i < tokens.length) {
      const t = tokens[i];
      const next = tokens[i + 1];
      if (/^\d+(\.\d+)?$/.test(t)) {
        current = (current ?? 0) + Number(t);
      } else if (t in MODIFIERS && next && (next in NUMBER_WORDS || /^\d/.test(next))) {
        modifier = MODIFIERS[t];
      } else if (t in MODIFIERS && next && UNIT_INDEX[next] && current === null) {
        current = 1 + MODIFIERS[t]; // "sava kilo" = 1.25 kg
      } else if (t in FRACTIONS) {
        current = (current ?? 0) + FRACTIONS[t];
      } else if (t in NUMBER_WORDS && !(t === 'do' && current !== null)) {
        // "do" right after a number is the verb ("100 do"), not 2.
        current = (current ?? 0) + NUMBER_WORDS[t];
      } else if (t in MULTIPLIERS) {
        // A bare "sau" / "hazaar" means one hundred / one thousand.
        const m = MULTIPLIERS[t];
        const base = (current ?? 1) + modifier;
        modifier = 0;
        if (m >= 1000) {
          total += base * m;
          current = null;
        } else {
          current = base * m;
        }
      } else if (t === 'paav' || t === 'pav' || t === 'pao') {
        // "paav kilo" = quarter kilo; otherwise it's bread.
        if ((next === 'kilo' || next === 'kg' || next === 'litre') && current === null) current = 0.25;
        else break;
      } else {
        break;
      }
      consumed = true;
      i += 1;
    }
    if (consumed) {
      const value = total + (current ?? 0) + modifier;
      out.push({ num: Math.round(value * 1000) / 1000, raw: tokens.slice(start, i).join(' ') });
    } else {
      out.push(tokens[i]);
      i += 1;
    }
  }
  return out;
}

// ---------- items ----------

function findItem(text, menu) {
  ALIAS_INDEX ??= buildAliasIndex();
  const padded = ` ${text} `;
  let best = null;

  // Menu items (vendor's own names first, then template aliases).
  for (const m of menu) {
    const tpl = MENU_TEMPLATES.find((t) => t.key === m.templateKey);
    const aliases = [m.name, ...(tpl ? tpl.aliases : [])].map(normalise);
    for (const alias of aliases) {
      if (alias && padded.includes(` ${alias} `) && (!best || alias.length > best.alias.length)) {
        best = { alias, key: m.templateKey || m.name, menuItemId: m._id ? String(m._id) : undefined, name: m.name, price: m.price, category: 'menu' };
      }
    }
  }
  for (const row of ALIAS_INDEX) {
    if (padded.includes(` ${row.alias} `) && (!best || row.alias.length > best.alias.length)) {
      const src = row.category === 'ingredient' ? INGREDIENTS[row.key] : OVERHEADS[row.key];
      best = { alias: row.alias, key: row.key, name: src.name, category: row.category };
    }
  }
  return best;
}

function hasCue(tokens, cues) {
  return tokens.some((t) => typeof t === 'string' && cues.some((c) => t === c || (c.length > 4 && t.startsWith(c))));
}

// ---------- segment parsing ----------

function parseSegment(segment, menu) {
  const text = normalise(segment);
  if (!text) return null;
  const rawTokens = text.split(' ');
  const tokens = collapseNumbers(rawTokens);
  const numbers = tokens.map((t, idx) => ({ t, idx })).filter((x) => typeof x.t === 'object');
  if (numbers.length === 0) return null;

  const words = tokens.filter((t) => typeof t === 'string');
  const item = findItem(words.join(' '), menu);
  const conf = { item: 0.95, qty: 0.95, unit: 0.95, amount: 0.95, type: 0.95 };

  let qty = null;
  let unit = null;
  let amount = null;
  let amountMarked = false;
  const used = new Set();

  for (const { t, idx } of numbers) {
    const prev = tokens[idx - 1];
    const next = tokens[idx + 1];
    const next2 = tokens[idx + 2];
    if (typeof next === 'string' && UNIT_INDEX[next] && qty === null) {
      qty = t.num;
      unit = UNIT_INDEX[next];
      used.add(idx);
    } else if ((typeof prev === 'string' && MONEY_WORDS.has(prev)) || (typeof next === 'string' && MONEY_WORDS.has(next))) {
      amount = t.num;
      amountMarked = true;
      used.add(idx);
    } else if (typeof next === 'string' && MONEY_POSTFIX.has(next) && amount === null && !(typeof next2 === 'string' && UNIT_INDEX[next2])) {
      amount = t.num;
      amountMarked = true;
      conf.amount = 0.85;
      used.add(idx);
    }
  }

  // Unmarked numbers: the last one is usually the amount, an earlier one the quantity.
  const free = numbers.filter((n) => !used.has(n.idx));
  if (amount === null && free.length) {
    amount = free[free.length - 1].t.num;
    // "5 kilo aloo 150": with the quantity already pinned by its unit, a single
    // remaining number is almost always the price.
    conf.amount = (qty !== null && free.length === 1) || numbers.length === 1 ? 0.88 : 0.75;
    free.pop();
  }
  if (qty === null && free.length) {
    qty = free[0].t.num;
    conf.qty = 0.7;
  }

  // Transaction type.
  const saleCue = hasCue(words, SALE_CUES);
  const expenseCue = hasCue(words, EXPENSE_CUES);
  let type;
  if (saleCue && !expenseCue) type = 'sale';
  else if (expenseCue && !saleCue) type = 'expense';
  else if (item?.category === 'menu') { type = 'sale'; conf.type = 0.85; }
  else if (item?.category === 'ingredient' || item?.category === 'overhead') { type = 'expense'; conf.type = 0.85; }
  else if (unit === 'plate') { type = 'sale'; conf.type = 0.8; }
  else { type = 'expense'; conf.type = 0.5; }

  // An ingredient with a sale cue ("aloo becha") is still a sale; keep it.
  let entry;
  if (type === 'sale') {
    const isMenu = item?.category === 'menu';
    const isTotal = !isMenu && (hasCue(words, TOTAL_CUES) || !item);
    entry = {
      type: 'sale',
      category: isMenu ? 'menu' : 'sales',
      itemKey: isMenu ? item.key : isTotal ? 'total_sales' : item.key,
      item: isMenu ? item.name : isTotal ? 'Total sales' : item.name,
      menuItemId: isMenu ? item.menuItemId : undefined,
    };
    if (!item) conf.item = isTotal && saleCue ? 0.9 : 0.6;
    if (isMenu) {
      if (unit === null && qty !== null) unit = 'plate';
      // "40 plate pani puri" with no amount → price × qty.
      if (qty === null && amount !== null && !amountMarked && item.price && numbers.length === 1) {
        qty = amount;
        unit = 'plate';
        amount = Math.round(qty * item.price);
        conf.qty = 0.85;
        conf.amount = 0.7;
      } else if (amount === null && qty !== null && item.price) {
        amount = Math.round(qty * item.price);
        conf.amount = 0.7;
      } else if (amount !== null && qty !== null && item.price) {
        // Both spoken: trust them when they agree with the menu price.
        const ratio = amount / (qty * item.price);
        if (ratio > 0.7 && ratio < 1.3) { conf.amount = 0.92; conf.qty = Math.max(conf.qty, 0.9); }
      }
    }
  } else {
    if (item) {
      entry = { type: 'expense', category: item.category === 'menu' ? 'other' : item.category, itemKey: item.key, item: item.name };
    } else {
      // Unknown item: keep the leftover words as the label.
      const leftovers = words.filter((w) => !MONEY_WORDS.has(w) && !UNIT_INDEX[w] && !MONEY_POSTFIX.has(w) && !EXPENSE_CUES.includes(w));
      const label = leftovers.join(' ').trim();
      entry = { type: 'expense', category: 'other', itemKey: 'other', item: label ? label.charAt(0).toUpperCase() + label.slice(1) : 'Other expense' };
      conf.item = 0.5;
    }
    if (item?.category === 'ingredient' && qty !== null && unit === null) {
      unit = INGREDIENTS[item.key].unit;
      conf.unit = 0.7;
    }
  }

  if (qty === null) { conf.qty = 1; conf.unit = 1; }
  if (amount === null) conf.amount = 0;

  const confidence = Math.min(...Object.values(conf));
  const lowConfidence = Object.entries(conf).filter(([, v]) => v < 0.8).map(([k]) => k);

  return { ...entry, qty, unit, amount, confidence: Math.round(confidence * 100) / 100, lowConfidence, fieldConfidence: conf, raw: segment.trim() };
}

/**
 * Parse free text into zero or more entries.
 * @param {string} text  what the vendor said or typed
 * @param {Array<{_id?, name, templateKey?, price}>} menu  vendor's menu items
 */
export function parseText(text, menu = []) {
  if (!text || !text.trim()) return [];
  // Join digit groups first so "4,200" isn't split at the comma.
  const cleaned = String(text).replace(/(\d),(?=\d{2,3}\b)/g, '$1').replace(/(\d),(?=\d{2,3}\b)/g, '$1');
  const segments = cleaned.split(SEGMENT_SPLIT).filter(Boolean);

  // A segment with no number ("pyaaz") is a label for the next one.
  const joined = [];
  let carry = '';
  for (const seg of segments) {
    const norm = normalise(seg);
    const hasNum = /\d/.test(norm) || norm.split(' ').some((w) => w in NUMBER_WORDS || w in FRACTIONS);
    if (!hasNum) { carry = `${carry} ${seg}`; continue; }
    joined.push(`${carry} ${seg}`.trim());
    carry = '';
  }
  if (carry && joined.length) joined[joined.length - 1] += ` ${carry}`;

  // A bare amount ("nabbe rupaye") completes the previous entry when that one
  // has a quantity but no amount: "teen kilo pyaaz, nabbe rupaye".
  const out = [];
  for (const seg of joined) {
    const e = parseSegment(seg, menu);
    if (!e) continue;
    const prev = out[out.length - 1];
    const bareAmount = e.qty === null && e.amount !== null && (e.itemKey === 'other' || (e.itemKey === 'total_sales' && e.fieldConfidence.type < 0.9));
    if (prev && prev.amount === null && bareAmount) {
      prev.amount = e.amount;
      prev.fieldConfidence.amount = 0.85;
      prev.raw = `${prev.raw}, ${e.raw}`;
      finalise(prev);
      continue;
    }
    out.push(e);
  }
  return out.filter((e) => e.amount !== null || e.qty !== null);
}

function finalise(e) {
  e.confidence = Math.round(Math.min(...Object.values(e.fieldConfidence)) * 100) / 100;
  e.lowConfidence = Object.entries(e.fieldConfidence).filter(([, v]) => v < 0.8).map(([k]) => k);
}

export const _internal = { normalise, collapseNumbers };
