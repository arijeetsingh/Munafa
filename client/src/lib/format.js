const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** ₹ with Indian digit grouping: 120000 → ₹1,20,000; negatives as −₹1,322. */
export function money(n, { decimals = false, sign = false } = {}) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const f = decimals ? inr2 : inr;
  const abs = f.format(Math.abs(n));
  if (n < 0) return `−₹${abs}`;
  return `${sign && n > 0 ? '+' : ''}₹${abs}`;
}

export const num = (n) => inr2.format(n);

const UNIT_LABEL = { kg: 'kg', g: 'g', L: 'L', ml: 'ml', pc: 'pc', dozen: 'dozen', packet: 'pkt', plate: 'plate', cup: 'cup', glass: 'glass', bundle: 'bundle', crate: 'crate', sack: 'sack', cylinder: 'cyl' };
export function qty(q, unit) {
  if (q === null || q === undefined) return '';
  return `${num(q)} ${UNIT_LABEL[unit] || unit || ''}`.trim();
}

/** Today in India as YYYY-MM-DD (matches the server's day boundary). */
export function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export function shiftDay(key, n) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dayLabel(key, lang, { short = false } = {}) {
  const d = new Date(`${key}T12:00:00Z`);
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.DateTimeFormat(locale, short ? { weekday: 'short', timeZone: 'UTC' } : { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
}

export function timeLabel(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
}
