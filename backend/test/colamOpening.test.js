import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shapeOpening, finalAnswerOf } from '../src/agents/colam.js';

const baiToan = "Ví dụ 3 (37:13): Cho hình lập phương ABCD.A'B'C'D' cạnh bằng 1. Tính độ dài |BC + DD'|.";

test('a long opening that briefs other agents is cut to what the student needs', () => {
  const wall = [
    'Cô mời các em khởi động nhé!',
    'Em hãy tự chọn cách tính độ dài trước khi xem lời giải.',
    'Trí hãy phát huy tinh thần phản biện bằng cách kiểm tra hướng.',
    'Bo cứ mạnh dạn nêu điều mình còn băn khoăn nhé.',
    'Tiêu chí hoàn thành: xác định đúng vectơ tổng.',
  ].join(' ');
  const out = shapeOpening(wall, { baiToan, answer: '√2' });
  assert.equal(out, 'Cô mời các em khởi động nhé! Em hãy tự chọn cách tính độ dài trước khi xem lời giải.');
});

test('sentences that give the answer or elide a formula are dropped', () => {
  const out = shapeOpening("Ở đây đầu |…| cần chú ý. Kết quả là √2 đó. Em nghĩ hai vectơ có cùng hướng không?", { baiToan, answer: '√2' });
  assert.equal(out, 'Em nghĩ hai vectơ có cùng hướng không?');
});

test('nothing usable falls back to a plain invitation, never an empty line', () => {
  const out = shapeOpening('Trí ơi giải đi. Đáp số √2.', { baiToan, answer: '√2' });
  assert.match(out, /Em hãy tự chọn cách tính/);
  assert.match(shapeOpening('', {}), /Em hãy tự nghĩ/);
});

test('the opening never exceeds the length budget', () => {
  const long = `Em hãy ${'suy nghĩ thật kỹ '.repeat(40)}.`;
  assert.ok(shapeOpening(long, { baiToan }).length <= 221);
});

test('finalAnswerOf reads the value the worked solution ends on', () => {
  assert.equal(finalAnswerOf("… tam giác BCC' vuông cân cạnh 1 nên |BC'| = √2."), '√2');
  assert.equal(finalAnswerOf('Không có dấu bằng'), null);
});
