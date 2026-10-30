import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitVectorNorms } from './MathVector';

const tex = String.raw;

test('vector lengths in plain text become KaTeX with arrows', () => {
  const t = splitVectorNorms("Tách: |BC| + |DD'| = 1 + 1 = 2");
  assert.deepEqual(t.map((x) => x.type), ['text', 'inline', 'text', 'inline', 'text']);
  assert.equal(t[1].content, tex`\left|\overrightarrow{BC}\right|`);
  assert.equal(t[3].content, tex`\left|\overrightarrow{DD'}\right|`);
});

test('sums and named vectors are covered', () => {
  const [sum] = splitVectorNorms("|BC + DD'|");
  assert.equal(sum.content, tex`\left|\overrightarrow{BC} + \overrightarrow{DD'}\right|`);
  const named = splitVectorNorms('|a + b| = |a| + |b|');
  assert.equal(named[0].content, tex`\left|\vec{a} + \vec{b}\right|`);
});

test('algebra and prose are left as text', () => {
  assert.deepEqual(splitVectorNorms('|x − 3| = 0'), [{ type: 'text', content: '|x − 3| = 0' }]);
  assert.deepEqual(splitVectorNorms('Bước 1 | Bước 2'), [{ type: 'text', content: 'Bước 1 | Bước 2' }]);
});
