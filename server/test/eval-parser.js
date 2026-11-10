// Scores the rule-based parser on the 100-phrase test set.
// Run: npm run parser:eval

import { parseText } from '../src/services/parser.js';
import { MENU, PHRASES } from './phrases.js';

export function formatEntry(e) {
  const f = (v) => (v === null || v === undefined ? '-' : String(v));
  return `${e.type} ${e.itemKey} ${f(e.qty)} ${f(e.unit)} ${f(e.amount)}`;
}

export function scoreParser() {
  const failures = [];
  let correct = 0;
  for (const [text, expected, note] of PHRASES) {
    const got = parseText(text, MENU).map(formatEntry);
    const ok = got.length === expected.length && got.every((g, i) => g === expected[i]);
    if (ok) correct += 1;
    else failures.push({ text, expected, got, note });
  }
  return { total: PHRASES.length, correct, accuracy: correct / PHRASES.length, failures };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const { total, correct, accuracy, failures } = scoreParser();
  for (const f of failures) {
    console.log(`✗ "${f.text}"${f.note ? `  (${f.note})` : ''}\n    expected ${f.expected.join(' | ')}\n    got      ${f.got.join(' | ') || '(nothing)'}`);
  }
  console.log(`\nParser accuracy: ${correct}/${total} = ${(accuracy * 100).toFixed(1)}% (target 85%)`);
}
