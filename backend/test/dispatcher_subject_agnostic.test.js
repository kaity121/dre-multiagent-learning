import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { dispatchMessage } from '../src/services/dispatcher.js';

describe('Subject-Agnostic Core & Source Grounding (#30)', () => {
  const VECTOR_FORBIDDEN_WORDS = [
    /\bvecto\b/i,
    /\bvector\b/i,
    /\bhinh lap phuong\b/i,
    /\bduong cheo\b/i,
    /\bbc'\b/i,
    /\bdd'\b/i,
    /\bpytago\b/i,
    /\bbat dang thuc tam giac\b/i,
    /\bdo dai tong\b/i,
  ];

  function assertNoVectorTerms(text, label = '') {
    for (const regex of VECTOR_FORBIDDEN_WORDS) {
      assert.ok(
        !regex.test(text),
        `[${label}] Câu trả lời cho bài học không phải Toán chứa thuật ngữ vectơ cấm: ${regex} trong "${text}"`
      );
    }
  }

  test('Non-math lesson (AI): in-domain question produces grounded response with timestamps and zero vector terms', async () => {
    const res = await dispatchMessage({
      message: 'Học có giám sát Supervised Learning bắt buộc phải có nhãn ground truth đúng không?',
      currentTime: 120,
      lessonTitle: 'Trí tuệ nhân tạo: Nhập môn Học máy (Machine Learning)',
      videoId: 'VID_AI_INTRO_01',
      recipient: 'all',
      useLLM: false,
    });

    assert.ok(res.ok);
    assert.ok(res.primaryResponse?.text);
    assert.ok(res.citations && res.citations.length >= 1, 'Phải có ít nhất 1 trích dẫn bám nguồn');
    assert.equal(res.citations[0].timeFormatted, '02:00');
    assert.match(res.primaryResponse.text, /chính xác|đúng|bài học/i);

    assertNoVectorTerms(res.primaryResponse.text, 'AI In-domain Primary');
    if (res.followUpResponse?.text) {
      assertNoVectorTerms(res.followUpResponse.text, 'AI In-domain FollowUp');
    }
  });

  test('Non-math lesson (AI): out-of-domain question notifies learner it is outside lesson with zero vector terms', async () => {
    const res = await dispatchMessage({
      message: 'Thời tiết ngày mai ở Sa Pa thế nào bạn ơi?',
      currentTime: 120,
      lessonTitle: 'Trí tuệ nhân tạo: Nhập môn Học máy (Machine Learning)',
      videoId: 'VID_AI_INTRO_01',
      recipient: 'all',
      useLLM: false,
    });

    assert.ok(res.ok);
    assert.ok(res.primaryResponse?.text);
    assert.match(res.primaryResponse.text, /ngoài nội dung bài giảng|tập trung vào bài học/i);

    assertNoVectorTerms(res.primaryResponse.text, 'AI Out-of-domain Primary');
    if (res.followUpResponse?.text) {
      assertNoVectorTerms(res.followUpResponse.text, 'AI Out-of-domain FollowUp');
    }
  });

  test('Non-math lesson (AI): misconception claim is refuted based on lesson source with zero vector terms', async () => {
    const res = await dispatchMessage({
      message: 'Dữ liệu chưa cần nhãn vẫn học được Supervised Learning mà',
      currentTime: 120,
      lessonTitle: 'Trí tuệ nhân tạo: Nhập môn Học máy (Machine Learning)',
      videoId: 'VID_AI_INTRO_01',
      recipient: 'all',
      useLLM: false,
    });

    assert.ok(res.ok);
    assert.ok(res.primaryResponse?.text);
    assert.match(res.primaryResponse.text, /chưa chính xác|mâu thuẫn|cảnh báo sai lầm/i);
    assert.ok(res.citations && res.citations.length >= 1);

    assertNoVectorTerms(res.primaryResponse.text, 'AI Misconception Primary');
    if (res.followUpResponse?.text) {
      assertNoVectorTerms(res.followUpResponse.text, 'AI Misconception FollowUp');
    }
  });

  test('Math lesson (Toán 12): sharp rebuttal at 37:13 still makes Bo concede and Cô Lam summarize', async () => {
    const res = await dispatchMessage({
      message: 'Bo sai rồi, theo bất đẳng thức tam giác độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng thôi!',
      currentTime: 2233,
      lessonTitle: 'Toán 12 — Vectơ trong không gian',
      videoId: 'VID_VECTO_12_TIEN',
      recipient: 'all',
      useLLM: false,
    });

    assert.ok(res.ok);
    assert.equal(res.primaryResponse.author, 'Bo');
    assert.match(res.primaryResponse.text, /cậu nói đúng rồi|quên mất điều kiện cùng hướng/i);
    assert.equal(res.followUpResponse.author, 'Cô Lam');
    assert.match(res.followUpResponse.text, /quy tắc vàng|bất đẳng thức tam giác/i);
  });
});
