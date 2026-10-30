import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backendMisconceptionId } from './backendMisconception';

test('vector lessons use the 37:13 checkpoint misconception, whatever id the editor gave them', () => {
  assert.equal(backendMisconceptionId({ id: 'VID_VECTO_12' }), 'MISC_VECTO_12_CP3713');
  assert.equal(backendMisconceptionId({ id: 'lesson_dre_vector_12' }), 'MISC_VECTO_12_CP3713');
  assert.equal(backendMisconceptionId({ id: 'draft_42', title: 'Toán 12 · Vectơ trong không gian' }), 'MISC_VECTO_12_CP3713');
});

test('other lessons keep their explicit mapping', () => {
  assert.equal(backendMisconceptionId({ id: 'VID_002', title: 'Bất phương trình' }), 'MISC_002');
  assert.equal(backendMisconceptionId({ id: 'VID_003', title: 'Phân số' }), 'MISC_008');
  assert.equal(backendMisconceptionId({ id: 'VID_001', title: 'Phương trình bậc nhất' }), 'MISC_001');
});
