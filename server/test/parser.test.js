import test from 'node:test';
import assert from 'node:assert/strict';
import { parseText } from '../src/services/parser.js';
import { scoreParser } from './eval-parser.js';
import { MENU } from './phrases.js';

test('meets the PRD accuracy bar on the 100-phrase set', () => {
  const { accuracy, failures } = scoreParser();
  assert.ok(accuracy >= 0.85, `accuracy ${accuracy}; failures: ${JSON.stringify(failures, null, 1)}`);
});

test('splits a spoken purchase list into separate entries', () => {
  const out = parseText('5 kilo aloo 150, 2 litre tel 280', MENU);
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((e) => [e.itemKey, e.qty, e.unit, e.amount]), [['potato', 5, 'kg', 150], ['oil', 2, 'L', 280]]);
});

test('flags a sale amount derived from the menu price as low confidence', () => {
  const [e] = parseText('40 plate pani puri', MENU);
  assert.equal(e.amount, 1200);
  assert.ok(e.lowConfidence.includes('amount'));
});

test('keeps an unknown expense with its spoken label', () => {
  const [e] = parseText('jhaadu 40 rupaye', MENU);
  assert.equal(e.type, 'expense');
  assert.equal(e.itemKey, 'other');
  assert.equal(e.item, 'Jhaadu');
  assert.equal(e.amount, 40);
  assert.ok(e.lowConfidence.includes('item'));
});

test('returns nothing for text without numbers', () => {
  assert.deepEqual(parseText('namaste bhaiya', MENU), []);
  assert.deepEqual(parseText('', MENU), []);
});
