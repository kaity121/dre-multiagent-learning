import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SseParser, checkUploadFile, explainExtractionError, formatBytes } from './clipExtractionText';

test('SseParser returns frames only once they are complete, across chunk boundaries', () => {
  const p = new SseParser();
  assert.deepEqual(p.push('event: stage\ndata: {"stage":"split'), []);
  assert.deepEqual(p.push('_audio"}\n\nevent: done\r\ndata: {}\r\n\r\n'), [
    { event: 'stage', data: '{"stage":"split_audio"}' },
    { event: 'done', data: '{}' },
  ]);
});

test('checkUploadFile mirrors the server limits', () => {
  assert.equal(checkUploadFile({ name: 'a.MP4', size: 10 }), null);
  assert.match(checkUploadFile({ name: 'a.mkv', size: 10 }) ?? '', /không phải video/);
  assert.match(checkUploadFile({ name: 'a.mp4', size: 0 }) ?? '', /rỗng/);
  assert.match(checkUploadFile({ name: 'a.mp4', size: 300 * 1024 * 1024 }) ?? '', /vượt giới hạn 200 MB/);
  assert.equal(formatBytes(2.9 * 1024 * 1024), '2,9 MB');
});

test('explainExtractionError names the cause the teacher can act on', () => {
  assert.match(explainExtractionError('spawn ffmpeg ENOENT'), /chưa cài ffmpeg/);
  assert.match(explainExtractionError('OPENAI_API_KEY is not set'), /khoá OpenAI/);
  assert.match(explainExtractionError('429 You exceeded your current quota'), /hạn mức/);
  assert.match(explainExtractionError('something odd', 'Hợp nhất timeline'), /Bước "Hợp nhất timeline" gặp lỗi/);
});
