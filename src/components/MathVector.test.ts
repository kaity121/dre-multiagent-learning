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

test('bare vector equations and square roots become KaTeX', () => {
  const t = splitVectorNorms("Thay DD' = CC' để nối tiếp: √(1² + 1²) = √2");
  assert.deepEqual(
    t.map((x) => [x.type, x.content]),
    [
      ['text', 'Thay '],
      ['inline', tex`\overrightarrow{DD'} = \overrightarrow{CC'}`],
      ['text', ' để nối tiếp: '],
      ['inline', tex`\sqrt{1^{2} + 1^{2}}`],
      ['text', ' = '],
      ['inline', tex`\sqrt{2}`],
    ],
  );
  const [chain] = splitVectorNorms("BC + CC' = BC'");
  assert.equal(chain.content, tex`\overrightarrow{BC} + \overrightarrow{CC'} = \overrightarrow{BC'}`);
});

test('capital pairs in ordinary Vietnamese text are not vectors', () => {
  for (const s of [
    'Lớp học 4 bạn AI + Cô Lam',
    'SGK Toán 12 KNTT',
    'Trạm 2 · Sổ tay',
    'Vectơ BC dài 1',
    'Đáp án A hoặc B',
    'TC_01 và OK',
  ]) {
    assert.deepEqual(splitVectorNorms(s), [{ type: 'text', content: s }], s);
  }
});

test('algebra and prose are left as text', () => {
  assert.deepEqual(splitVectorNorms('|x − 3| = 0'), [{ type: 'text', content: '|x − 3| = 0' }]);
  assert.deepEqual(splitVectorNorms('Bước 1 | Bước 2'), [{ type: 'text', content: 'Bước 1 | Bước 2' }]);
});
