import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentLibrary, getMisconception, listMisconceptionIds } from '../src/contentLibrary.js';

const REQUIRED = ['id', 'monHoc', 'chuDe', 'baiToan', 'baiGiai', 'viTriLoiChuan', 'moTaLoi', 'giaiThichChuan', 'goiY1'];

test('every misconception carries the fields the orchestrator reads', () => {
  for (const id of listMisconceptionIds()) {
    const m = contentLibrary[id];
    assert.equal(m.id, id, `${id}: id field matches its key`);
    for (const field of REQUIRED) assert.ok(m[field], `${id}: missing ${field}`);
    assert.ok(Array.isArray(m.baiGiai) && m.baiGiai.length > 0, `${id}: baiGiai is a non-empty list`);
  }
});

test('the 37:13 checkpoint has its own entry about |BC + DD\'| and the length-splitting error', () => {
  const m = getMisconception('MISC_VECTO_12_CP3713');
  assert.match(m.baiToan, /\|BC \+ DD'\|/);
  assert.match(m.giaiThichChuan, /√2/);
  assert.match(m.moTaLoi, /\|BC\| \+ \|DD'\|/);
  assert.ok(m.goiY1 && m.goiY2, 'two hint levels for the rebuttal loop');
});

test('the Station 2 vector entry is unchanged', () => {
  const m = getMisconception('MISC_VECTO_12');
  assert.match(m.baiToan, /B'C/);
  assert.equal(m.viTriLoiChuan, 'Bước 2');
});
