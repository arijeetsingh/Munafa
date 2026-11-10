import { config } from '../config.js';

const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone, year: 'numeric', month: '2-digit', day: '2-digit' });

// Calendar day in India, as YYYY-MM-DD.
export function dayKey(date = new Date()) {
  return fmt.format(date);
}

export function addDays(key, n) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dayRange(endKey, days) {
  return Array.from({ length: days }, (_, i) => addDays(endKey, i - days + 1));
}
