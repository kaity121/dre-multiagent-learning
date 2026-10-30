/**
 * backend/test/roundtable_stream.test.js
 *
 * Automated Test Suite for Roundtable Orchestrator with Streaming & SSE (#302)
 * Designed for `node:test` runner.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURE_PATH = path.join(__dirname, '../../mock/mock_cognitive_stream_vecto12.json');

import {
  runRoundtableForPart,
  runFullLessonRoundtable,
  partitionTimelineIntoParts,
} from '../src/services/roundtableOrchestrator.js';
import { app } from '../server.js';

describe('Roundtable Orchestrator Streaming & Pedagogical Verification Suite (#302)', () => {
  const cognitiveStream = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));
  let testServer;
  let serverPort;

  before(async () => {
    process.env.NODE_ENV = 'test';
    testServer = http.createServer(app);
    await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
    serverPort = testServer.address().port;
  });

  after(async () => {
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
  });

  it('Test 1: Roundtable per Part supports real-time callback streaming', async () => {
    const parts = partitionTimelineIntoParts(cognitiveStream);
    assert.strictEqual(parts.length, 3);

    for (const part of parts) {
      const eventsCollected = [];
      const res = await runRoundtableForPart(part, {
        useLLM: false,
        onEvent: (evt) => eventsCollected.push(evt),
      });

      assert.strictEqual(res.partNumber, part.partNumber);
      assert.ok(eventsCollected.length >= 7, 'Phải stream >= 7 events mỗi part');
      assert.strictEqual(eventsCollected.length, res.reasoning_events.length);
    }
  });

  it('Test 1.1: GET /api/roundtable/stream delivers SSE events with session_start, reasoning_event, complete', async () => {
    const receivedEvents = await new Promise((resolve, reject) => {
      const events = [];
      const req = http.get(
        {
          hostname: '127.0.0.1',
          port: serverPort,
          path: '/api/roundtable/stream?partNumber=3&streamDelayMs=0',
          headers: { Accept: 'text/event-stream' },
        },
        (res) => {
          assert.strictEqual(res.statusCode, 200);
          let buffer = '';
          res.on('data', (chunk) => {
            buffer += chunk.toString('utf-8');
            const lines = buffer.split('\n\n');
            buffer = lines.pop();

            for (const block of lines) {
              const blockLines = block.split('\n');
              let eventName = 'message';
              let dataStr = '';
              for (const line of blockLines) {
                if (line.startsWith('event: ')) eventName = line.slice(7).trim();
                else if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
              }
              if (dataStr) {
                try {
                  events.push({ eventName, data: JSON.parse(dataStr) });
                } catch (_) {
                  events.push({ eventName, raw: dataStr });
                }
              }
            }
          });
          res.on('end', () => resolve(events));
        }
      );
      req.on('error', reject);
      req.setTimeout(8000, () => req.destroy(new Error('Timeout')));
    });

    const eventNames = receivedEvents.map((e) => e.eventName);
    assert.ok(eventNames.includes('session_start'), 'Phải có session_start event');
    assert.ok(eventNames.includes('reasoning_event'), 'Phải có reasoning_event event');
    assert.ok(eventNames.includes('complete'), 'Phải có complete event');

    const completeEvt = receivedEvents.find((e) => e.eventName === 'complete');
    assert.strictEqual(completeEvt.data?.part?.partNumber, 3);
  });

  it('Test 2: Cross-check WOW moment: Trí rejects Bo invalid proposal (isValid: false) and Bo corrects', async () => {
    const part3 = partitionTimelineIntoParts(cognitiveStream)[2];
    const result = await runRoundtableForPart(part3, { useLLM: false });

    assert.strictEqual(result.crossCheckCorrectionOccurred, true);

    const verdicts = result.reasoning_events.filter((e) => e.eventType === 'cross_check_verdict');
    assert.ok(verdicts.length >= 2, 'Phải có ít nhất 2 verdicts (bác bỏ và đồng thuận)');

    // Lượt 1: Bác bỏ
    const v1 = verdicts[0];
    assert.strictEqual(v1.agentId, 'tri');
    assert.strictEqual(v1.toolCall?.isValid, false);
    assert.strictEqual(v1.toolCall?.input?.claim, 'AB');
    assert.ok(v1.content.includes('nhầm') || v1.content.includes('bác bỏ'));

    // Lượt 2: Đồng thuận bẫy tự nhiên 2a
    const v2 = verdicts[1];
    assert.ok(v2.content.includes('tự nhiên') || v2.content.includes('đồng ý'));
    assert.ok(result.checkpoint.boInitialChallenge.includes('2a'));
  });

  it('Test 3: AgentReasoningEvent emits valid sequence and strictly pairs tool_call with tool_result', async () => {
    const part1 = partitionTimelineIntoParts(cognitiveStream)[0];
    const result = await runRoundtableForPart(part1, { useLLM: false });

    const events = result.reasoning_events;
    const allowedTypes = new Set([
      'thought',
      'tool_call',
      'tool_result',
      'debate_turn',
      'cross_check_verdict',
      'checkpoint_created',
    ]);
    const allowedAgents = new Set(['colam', 'bo', 'tri', 'linhchi', 'minhkhang']);

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      assert.ok(e.id, 'Event phải có id');
      assert.ok(allowedTypes.has(e.eventType), `Loại event ${e.eventType} phải hợp lệ`);
      assert.ok(allowedAgents.has(e.agentId), `AgentId ${e.agentId} phải hợp lệ`);
      assert.ok(e.timestamp, 'Event phải có timestamp');

      if (e.eventType === 'tool_call') {
        const next = events[i + 1];
        assert.ok(next, 'tool_call phải có event tiếp theo');
        assert.strictEqual(next.eventType, 'tool_result', 'tool_call phải được theo sau bởi tool_result');
        assert.strictEqual(next.toolCall?.toolName, e.toolCall?.toolName);
      }
    }

    const lastEvent = events[events.length - 1];
    assert.strictEqual(lastEvent.eventType, 'checkpoint_created');
    assert.strictEqual(lastEvent.agentId, 'colam');
  });

  it('Test 4: Pedagogical invariants (Max 1 checkpoint/part, warmup protection, Bloom >= Apply/Analyze, Socratic)', async () => {
    const fullDraft = await runFullLessonRoundtable(cognitiveStream, { useLLM: false });

    // 4.1 Max 1 checkpoint per part
    assert.strictEqual(fullDraft.parts.length, 3);
    assert.strictEqual(fullDraft.checkpoints.length, 3);

    // 4.2 Warmup protection
    for (const p of fullDraft.parts) {
      const minWarmup = p.startSecond === 0 ? 30 : p.startSecond + 15;
      assert.ok(
        p.checkpointSecond >= minWarmup,
        `Checkpoint Part ${p.partNumber} (${p.checkpointSecond}s) phải >= ${minWarmup}s`
      );
    }

    // 4.3 Bloom level >= Apply/Analyze (Score >= 3)
    const bloomTools = fullDraft.parts
      .flatMap((p) => p.deterministic_tool_calls || [])
      .filter((t) => t.toolName === 'tool_evaluate_bloom_level');

    assert.ok(bloomTools.length >= 3);
    for (const bt of bloomTools) {
      assert.ok(
        bt.output.score >= 3,
        `Bloom score phải >= 3 (thực tế: ${bt.output.score}, level: ${bt.output.level})`
      );
      assert.ok(['Apply', 'Analyze', 'Evaluate', 'Create'].includes(bt.output.level));
    }

    // 4.4 Socratic structure
    for (const chk of fullDraft.checkpoints) {
      assert.ok(chk.options.length >= 3);
      assert.ok(chk.options.every((o) => o.feedbackNote && o.feedbackNote.length > 5));
      assert.ok(chk.boInitialChallenge && chk.boInitialChallenge.length > 0);
    }
  });

  it('Test 5: Execution time benchmark (< 30s for demo readiness)', async () => {
    const t0 = Date.now();
    await runRoundtableForPart(cognitiveStream.segments ? partitionTimelineIntoParts(cognitiveStream)[2] : {}, { useLLM: false });
    const partElapsed = Date.now() - t0;

    const t1 = Date.now();
    await runFullLessonRoundtable(cognitiveStream, { useLLM: false });
    const lessonElapsed = Date.now() - t1;

    assert.ok(partElapsed < 1000, `Part chạy trong ${partElapsed}ms << 30s`);
    assert.ok(lessonElapsed < 5000, `Full lesson chạy trong ${lessonElapsed}ms << 60s`);
  });
});
