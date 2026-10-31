function isMathKnowledgeQuery(text = '') {
  const lower = text.toLowerCase();
  const keywords = [
    'vecto', 'vectơ', 'độ dài', 'do dai', 'tổng', 'tong', 'hiệu', 'hieu',
    'cộng', 'cong', 'trừ', 'tru', 'hình lập phương', 'hinh lap phuong', 'hình hộp', 'hinh hop',
    'quy tắc', 'quy tac', 'bẫy', 'bay', 'sai ở đâu', 'tại sao', 'tai sao',
    'bc', 'dd', 'tích vô hướng', 'tich vo huong', 'góc', 'goc', 'công thức', 'cong thuc',
    '1+1', '2a', 'căn 2', 'can 2', 'đường chéo', 'duong cheo'
  ];
  return keywords.some(k => lower.includes(k));
}

import fs from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { config } from './src/config.js';
import { listMisconceptionIds } from './src/contentLibrary.js';
import { startSession, submitAnswer, submitRebuttal } from './src/orchestrator.js';
import { chatJSON } from './src/openaiClient.js';
import { lessonsRouter } from './src/routes/lessons.js';
import { extractRouter } from './src/routes/extract.js';
import { saveRun, getRun, listRuns, streamReplayEvents, sanitizeRunId } from './src/services/runRecorder.js';
import {
  runRoundtableForPart,
  runFullLessonRoundtable,
  partitionTimelineIntoParts,
  buildLessonDraft,
  assertSafeVideoId,
  resolveDraftPath,
  getDraftsDir,
} from './src/services/roundtableOrchestrator.js';

const SERVER_DIR = nodePath.dirname(fileURLToPath(import.meta.url));
const DEFAULT_COGNITIVE_STREAM_PATH = nodePath.resolve(SERVER_DIR, '../mock/mock_cognitive_stream_vecto12.json');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/lessons', lessonsRouter);
app.use('/api/extract', extractRouter);

// GET /api/health-llm — test kết nối trực tiếp tới OpenAI
app.get('/api/health-llm', async (req, res) => {
  try {
    const t0 = Date.now();
    const result = await chatJSON({
      model: config.models.assessor,
      systemPrompt: 'Bạn là agent kiểm tra sức khỏe LLM. Trả về đúng JSON: {"status": "ok", "message": "Multi-agent LLM sẵn sàng"}',
      userPayload: { ping: true },
      temperature: 0.1,
    });
    const latencyMs = Date.now() - t0;
    res.json({ ok: true, latencyMs, model: config.models.assessor, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/misconceptions — danh sách bài mẫu có sẵn (để frontend hiển thị lựa chọn)
app.get('/api/misconceptions', (req, res) => {
  res.json({ ids: listMisconceptionIds() });
});

// POST /api/session/start  { misconceptionId }
app.post('/api/session/start', async (req, res) => {
  try {
    const { misconceptionId } = req.body;
    if (!misconceptionId) {
      return res.status(400).json({ error: 'Thiếu misconceptionId' });
    }
    const result = await startSession({ misconceptionId });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/session/:id/answer  { cauTraLoi }
app.post('/api/session/:id/answer', async (req, res) => {
  try {
    const { cauTraLoi } = req.body;
    if (!cauTraLoi) {
      return res.status(400).json({ error: 'Thiếu cauTraLoi' });
    }
    const result = await submitAnswer({ sessionId: req.params.id, cauTraLoi });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/session/:id/rebuttal  { phanBien }
app.post('/api/session/:id/rebuttal', async (req, res) => {
  try {
    const { phanBien } = req.body;
    if (!phanBien) {
      return res.status(400).json({ error: 'Thiếu phanBien' });
    }
    const result = await submitRebuttal({ sessionId: req.params.id, phanBien });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/ta/pinned/:id — OpenMAIC: TA agent sinh lưu ý/định nghĩa ghim cho bài học
app.get('/api/ta/pinned/:id', async (req, res) => {
  try {
    const { generateTAPinnedNote } = await import('./src/agents/ta.js');
    const { getMisconception } = await import('./src/contentLibrary.js');
    const misc = getMisconception(req.params.id);
    const result = await generateTAPinnedNote({
      baiToan: misc.baiToan,
      chuDe: misc.chuDe,
      goiY: misc.goiY1
    });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/peer/:peerId/chat — OpenMAIC: Nhắn tin trực tiếp với Trí, Linh Chi, Minh Khang hoặc Bo qua GPT-6
app.post('/api/peer/:peerId/chat', async (req, res) => {
  try {
    const { peerId } = req.params;
    const { message, topic = 'Toán học THCS', mathProblem = '' } = req.body;
    let result;

    const { executeTool } = await import('./src/tools/index.js');
    const { search, getById } = await import('./src/services/knowledgeBase.js');
    
    // Chỉ RAG khi câu hỏi của học sinh thực sự chứa từ khóa toán học/ngộ nhận
    let kbMatch = null;
    const peerToolCalls = [];

    if (isMathKnowledgeQuery(message)) {
      const hits = search(message, 1);
      if (hits && hits.length > 0 && hits[0].score >= 2) {
        kbMatch = hits[0];
      }
    }

    if (kbMatch) {
      peerToolCalls.push({
        toolName: 'tool_query_misconception_kb',
        status: 'completed',
        label: 'Đang truy xuất kho tri thức RAG...',
        badgeText: `RAG: ${kbMatch.misconception.id} (${kbMatch.misconception.title})`,
        category: 'rag',
        output: { id: kbMatch.misconception.id, title: kbMatch.misconception.title },
      });
    }

    if (peerId === 'tri') {
      const { triDeepThink } = await import('./src/agents/tri.js');
      result = await triDeepThink({ baiToan: mathProblem, chuDe: topic, cauHoiHocVien: message });
      if (result.toolCall) {
        peerToolCalls.push(result.toolCall);
      }
    } else if (peerId === 'colam') {
      const { coLamConsult } = await import('./src/agents/colam.js');
      result = await coLamConsult({ baiToan: mathProblem, chuDe: topic, cauHoiHocVien: message });
      if (result.toolCalls) {
        peerToolCalls.push(...result.toolCalls);
      }
    } else if (peerId === 'linhchi') {
      const { linhChiTakeNotes } = await import('./src/agents/linhchi.js');
      result = await linhChiTakeNotes({ baiToan: mathProblem, chuDe: topic, cauHoiHocVien: message });
    } else if (peerId === 'minhkhang') {
      const { minhKhangAnalogy } = await import('./src/agents/minhkhang.js');
      result = await minhKhangAnalogy({ baiToan: mathProblem, chuDe: topic, cauHoiHocVien: message });
    } else {
      // Default to Bo
      const { boChallenge } = await import('./src/agents/bo.js');
      result = await boChallenge({ baiToan: mathProblem || topic, cauTraLoiHocVien: message, danhGia: 'dung', loaiBay: 'shortcut_fallacy' });
    }

    // Gắn mảng toolCalls vào kết quả
    if (result) {
      result.toolCalls = peerToolCalls;
      if (!result.toolCall && peerToolCalls.length > 0) {
        result.toolCall = peerToolCalls[0];
      }
    }

    res.json({ ok: true, peerId, result, toolCalls: peerToolCalls });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const toBool = (value) => value === true || value === 'true';

/** Default lecture used when a request does not carry its own CognitiveEventStream. */
function loadDefaultCognitiveStream() {
  if (fs.existsSync(DEFAULT_COGNITIVE_STREAM_PATH)) {
    return JSON.parse(fs.readFileSync(DEFAULT_COGNITIVE_STREAM_PATH, 'utf-8'));
  }
  throw new Error(`Không tìm thấy CognitiveEventStream mặc định tại ${DEFAULT_COGNITIVE_STREAM_PATH}`);
}

/**
 * Validates the identifiers and the optional custom stream of a roundtable request.
 * Returns { stream } or { error } so callers can answer 400 before doing any work.
 */
function resolveRoundtableInput({ customStream, partNumber }) {
  if (customStream !== undefined && customStream !== null) {
    if (typeof customStream !== 'object' || Array.isArray(customStream)) {
      return { error: 'cognitiveStream phải là một object CognitiveEventStream' };
    }
    if (customStream.segments !== undefined && !Array.isArray(customStream.segments)) {
      return { error: 'cognitiveStream.segments phải là một mảng' };
    }
  }
  const stream = customStream || loadDefaultCognitiveStream();
  try {
    assertSafeVideoId(stream.videoId || 'VECTO12');
  } catch (err) {
    return { error: err.message };
  }
  if (partNumber !== undefined && partNumber !== null && partNumber !== '') {
    const n = Number(partNumber);
    if (!Number.isInteger(n) || n < 1) return { error: 'partNumber phải là số nguyên >= 1' };
  }
  return { stream };
}

function findPart(stream, partNumber) {
  const parts = partitionTimelineIntoParts(stream);
  const part = parts.find(p => p.partNumber === Number(partNumber));
  if (!part) {
    const error = new Error(`Không có Part ${partNumber}; CognitiveEventStream này chỉ có ${parts.length} part.`);
    error.statusCode = 400;
    throw error;
  }
  return part;
}

// POST /api/roundtable/run & /api/roundtable/generate — OpenMAIC Issue #302: Buồng họp A2A Scriptwriting Roundtable
app.post(['/api/roundtable/run', '/api/roundtable/generate'], async (req, res) => {
  try {
    const { partNumber, misconceptionId, cognitiveStream: customStream } = req.body || {};
    const useLLM = toBool(req.body?.useLLM);

    // 1. Nếu yêu cầu chạy theo misconceptionId đơn lẻ (tương thích backward)
    if (misconceptionId && !partNumber && !customStream) {
      const { runRoundtable } = await import('./src/services/roundtable.js');
      const draft = await runRoundtable(misconceptionId, { useLLM });
      return res.json({ ok: true, draft });
    }

    // 2. Chạy Roundtable Orchestrator toàn diện cho Video / Part theo CognitiveEventStream (#302)
    const input = resolveRoundtableInput({ customStream, partNumber });
    if (input.error) return res.status(400).json({ ok: false, error: input.error });

    if (partNumber) {
      const partResult = await runRoundtableForPart(findPart(input.stream, partNumber), { useLLM });
      return res.json({
        ok: true,
        mode: 'part',
        part: partResult,
        lesson: buildLessonDraft(input.stream, [partResult]),
        generation: partResult.generation,
      });
    }

    const fullDraft = await runFullLessonRoundtable(input.stream, { useLLM });
    res.json({
      ok: true,
      mode: 'full_lesson',
      draft: fullDraft,
      lesson: fullDraft.lesson,
      generation: fullDraft.generation,
      stats: {
        totalParts: fullDraft.parts.length,
        totalCheckpoints: fullDraft.checkpoints.length,
        crossCheckLogsCount: fullDraft.crossCheckLogs.length,
        totalReasoningEvents: fullDraft.allReasoningEvents.length,
      },
    });
  } catch (err) {
    console.error('[API Roundtable] Lỗi thực thi Roundtable:', err);
    res.status(err.statusCode || 500).json({ ok: false, error: err.message });
  }
});

// GET & POST /api/roundtable/stream — Server-Sent Events cho War Room (#302, #303)
// Live runs are recorded; replays come from the recorder or the bundled fixture and say so via `provenance`.
const handleRoundtableStream = async (req, res) => {
  const isPost = req.method === 'POST';
  const params = isPost ? (req.body || {}) : (req.query || {});
  const {
    partNumber,
    streamDelayMs = 20,
    cognitiveStream: customStream,
    mode = 'live',
    runId,
    speed = 1,
    fixture = false,
  } = params;
  const useLLM = toBool(params.useLLM);
  const isReplayMode = toBool(fixture) || mode === 'replay' || runId === 'fixture' || runId === 'mock';

  // Validate before switching to SSE so bad input gets a normal 400 response.
  if (runId !== undefined && runId !== '' && sanitizeRunId(String(runId)) !== String(runId)) {
    return res.status(400).json({ ok: false, error: 'runId không hợp lệ (chỉ chấp nhận A-Z, a-z, 0-9, "_" và "-")' });
  }
  let liveInput = null;
  if (!isReplayMode) {
    liveInput = resolveRoundtableInput({ customStream, partNumber });
    if (liveInput.error) return res.status(400).json({ ok: false, error: liveInput.error });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  let isAborted = false;
  req.on('aborted', () => {
    isAborted = true;
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      isAborted = true;
    }
  });

  const sendSSE = (eventName, data) => {
    if (isAborted || res.writableEnded) return;
    try {
      if (eventName && eventName !== 'message') {
        res.write(`event: ${eventName}\n`);
      }
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') {
        res.flush();
      }
    } catch (sseErr) {
      console.warn('[SSE Roundtable] Write error or serialization error:', sseErr);
    }
  };

  const activeRunId = runId || `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    if (isReplayMode) {
      const targetRunId = runId || 'fixture';
      const runData = getRun(targetRunId);
      if (!runData) {
        sendSSE('error', { error: `Không tìm thấy runId: ${targetRunId}`, runId: targetRunId });
        return res.end();
      }
      await streamReplayEvents(runData, {
        speed: Number(speed) || 1,
        streamDelayMs: Number(streamDelayMs) || 40,
        sendSSE,
        isAborted: () => isAborted,
      });
      return res.end();
    }

    const stream = liveInput.stream;
    const recordedEvents = [];
    const delayMs = Math.max(0, Number(streamDelayMs) || 0);

    sendSSE('session_start', {
      runId: activeRunId,
      mode: 'live',
      provenance: 'live',
      isFallback: false,
      requestedGeneration: useLLM ? 'llm' : 'deterministic',
      videoId: stream.videoId,
      partNumber: partNumber ? Number(partNumber) : 'all',
      timestamp: new Date().toISOString(),
    });

    // `reasoning_event` is the canonical name; the other names are emitted for older listeners.
    const onEvent = async (event) => {
      if (isAborted) return;
      const tagged = { ...event, runId: activeRunId };
      recordedEvents.push(tagged);
      sendSSE('reasoning', tagged);
      sendSSE('reasoning_event', tagged);
      if (tagged.eventType) {
        sendSSE(tagged.eventType, tagged);
      }
      sendSSE('message', tagged);
    };

    let lesson;
    let generation;
    let partResult = null;
    let crossCheckCorrectionOccurred;

    if (partNumber) {
      partResult = await runRoundtableForPart(findPart(stream, partNumber), {
        useLLM,
        onEvent,
        streamDelayMs: delayMs,
        isAborted: () => isAborted,
      });
      if (isAborted || !partResult) return res.end();
      lesson = buildLessonDraft(stream, [partResult]);
      generation = partResult.generation;
      crossCheckCorrectionOccurred = partResult.crossCheckCorrectionOccurred;
    } else {
      const fullDraft = await runFullLessonRoundtable(stream, {
        useLLM,
        onEvent,
        streamDelayMs: delayMs,
        isAborted: () => isAborted,
      });
      if (isAborted || !fullDraft) return res.end();
      lesson = fullDraft.lesson;
      generation = fullDraft.generation;
      crossCheckCorrectionOccurred = fullDraft.crossCheckLogs.length > 0;
    }

    const approval = { status: lesson.status, approvedByTeacher: false, reviewedBy: null, approvedAt: null };
    const stats = {
      totalEvents: recordedEvents.length,
      crossCheckCorrectionOccurred,
      bloomLevel: partResult?.bloomLevel || 'Analyze',
      partTitle: partResult?.title,
    };

    try {
      saveRun({
        runId: activeRunId,
        provenance: 'live',
        videoId: stream.videoId,
        videoTitle: stream.videoTitle,
        partNumber: partNumber ? Number(partNumber) : 'all',
        createdAt: new Date().toISOString(),
        generation,
        stats,
        reasoning_events: recordedEvents,
        lesson,
      });
    } catch (recErr) {
      console.warn('[Roundtable] Run recording warning:', recErr);
    }

    const completion = {
      runId: activeRunId,
      mode: 'live',
      provenance: 'live',
      isFallback: false,
      totalEvents: recordedEvents.length,
      lesson,
      approval,
      generation,
      stats,
      timestamp: new Date().toISOString(),
    };
    sendSSE('done', completion);
    sendSSE('complete', { ok: true, scope: partResult ? 'part' : 'full_lesson', part: partResult || undefined, ...completion });
    res.end();
  } catch (err) {
    console.error('[SSE Roundtable] Lỗi stream:', err);
    if (!res.headersSent) {
      res.status(err.statusCode || 500).json({ ok: false, error: err.message, runId: activeRunId });
    } else {
      sendSSE('error', { error: err.message, runId: activeRunId });
      res.end();
    }
  }
};

// GET /api/roundtable/runs — Danh sách tất cả các run đã lưu
app.get('/api/roundtable/runs', (req, res) => {
  try {
    const runs = listRuns();
    res.json({ ok: true, runs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/roundtable/runs/:runId — Chi tiết một run cụ thể
app.get('/api/roundtable/runs/:runId', (req, res) => {
  try {
    const safeRunId = sanitizeRunId(req.params.runId);
    if (!safeRunId && req.params.runId !== 'fixture' && req.params.runId !== 'mock') {
      return res.status(400).json({ ok: false, error: 'runId không hợp lệ' });
    }
    const run = getRun(req.params.runId);
    if (!run) {
      return res.status(404).json({ ok: false, error: `Run không tồn tại: ${req.params.runId}` });
    }
    res.json({ ok: true, run });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/roundtable/runs — Lưu thủ công một run
app.post('/api/roundtable/runs', (req, res) => {
  try {
    const result = saveRun(req.body);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// GET /api/roundtable/:runId/stream — Replay hoặc Live stream theo runId cụ thể
app.get('/api/roundtable/:runId/stream', (req, res) => {
  const safeRunId = sanitizeRunId(req.params.runId);
  const runId = safeRunId || req.params.runId;
  const existingRun = getRun(runId);
  const defaultMode = (existingRun || runId === 'fixture' || runId === 'mock') ? 'replay' : 'live';
  req.query = { ...req.query, runId, mode: req.query?.mode || defaultMode };
  return handleRoundtableStream(req, res);
});

app.get('/api/roundtable/stream', handleRoundtableStream);
app.post('/api/roundtable/stream', handleRoundtableStream);

// GET /api/roundtable/drafts/:videoId — Lấy kịch bản draft cho Teacher Studio Timeline (#15)
app.get('/api/roundtable/drafts/:videoId', (req, res) => {
  let draftPath;
  try {
    draftPath = resolveDraftPath(req.params.videoId);
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
  try {
    if (!fs.existsSync(draftPath)) {
      return res.status(404).json({ ok: false, error: `Không tìm thấy draft cho videoId: ${req.params.videoId}` });
    }
    res.json({ ok: true, draft: JSON.parse(fs.readFileSync(draftPath, 'utf-8')) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/roundtable/drafts — Danh sách tất cả các draft đã sinh
app.get('/api/roundtable/drafts', (req, res) => {
  try {
    const draftsDir = getDraftsDir();
    if (!fs.existsSync(draftsDir)) {
      return res.json({ ok: true, drafts: [] });
    }
    const drafts = fs.readdirSync(draftsDir).filter(f => f.endsWith('.json')).map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(nodePath.join(draftsDir, f), 'utf-8'));
        return {
          filename: f,
          lessonId: data.lessonId,
          title: data.title,
          status: data.lesson?.status || data.status,
          totalParts: data.parts?.length || 0,
          totalCheckpoints: data.checkpoints?.length || 0,
          generatedAt: data.pedagogicalSummary?.generatedAt,
          generationMode: data.generation?.mode,
        };
      } catch (_) {
        return { filename: f };
      }
    });
    res.json({ ok: true, drafts });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/tools — Danh sách & JSON Schema của Deterministic Tools (#8)
app.get('/api/tools', async (req, res) => {
  try {
    const { OPENAI_TOOL_DEFINITIONS } = await import('./src/tools/index.js');
    res.json({ ok: true, tools: OPENAI_TOOL_DEFINITIONS });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


// POST /api/tools/execute — Gọi thực thi trực tiếp Deterministic Tool (#8 -> #10 -> #14)
app.post('/api/tools/execute', async (req, res) => {
  try {
    const { executeTool } = await import('./src/tools/index.js');
    const { toolName, inputArgs = {} } = req.body || {};
    if (!toolName) {
      return res.status(400).json({ ok: false, error: 'Thiếu toolName' });
    }
    const result = executeTool(toolName, inputArgs);
    res.json({ ok: true, toolCall: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Handler function for runtime dispatcher (#401 & backwards-compatible alias)
export async function handleRuntimeDispatch(req, res) {
  try {
    const { message, currentTime = 2233, lessonTitle = 'Toán 12 — Vectơ trong không gian', sessionId, recipient = 'all', useLLM = true } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Thiếu message' });
    }

    const { dispatchMessage } = await import('./src/services/dispatcher.js');
    const result = await dispatchMessage({
      message,
      currentTime,
      lessonTitle,
      sessionId: sessionId || undefined,
      recipient,
      useLLM,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

// POST /api/runtime/dispatch — OpenMAIC Issue #401: Runtime Intent Classifier & Dynamic Routing Dispatcher
app.post('/api/runtime/dispatch', handleRuntimeDispatch);

// POST /api/dispatcher/evaluate — Direct endpoint alias to evaluate learner queries against the runtime dispatcher
app.post('/api/dispatcher/evaluate', handleRuntimeDispatch);


// GET /api/runtime/context-snapshot — AISDLC Issue #402: Lấy Context Isolation Snapshot bám sát bảng phấn
app.get('/api/runtime/context-snapshot', async (req, res) => {
  try {
    const { agentId = 'tri', second = 2233, sessionId = 'session_001', videoId = 'VID_VECTO_12_TIEN' } = req.query;
    const { buildRuntimeContext } = await import('./src/services/contextSnapshot.js');
    const snapshot = buildRuntimeContext({
      agentId: String(agentId),
      second: Number(second),
      sessionId: String(sessionId),
      videoId: String(videoId),
    });
    res.json({ ok: true, snapshot });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/runtime/context-snapshot — AISDLC Issue #402: Đóng gói Context Isolation Snapshot theo yêu cầu
app.post('/api/runtime/context-snapshot', async (req, res) => {
  try {
    const {
      agentId = 'tri',
      second = 2233,
      sessionId = 'session_001',
      videoId = 'VID_VECTO_12_TIEN',
      userMessage = '',
      chatHistory = [],
    } = req.body || {};
    const { buildRuntimeContext } = await import('./src/services/contextSnapshot.js');
    const snapshot = buildRuntimeContext({
      agentId: String(agentId),
      second: Number(second),
      sessionId: String(sessionId),
      videoId: String(videoId),
      userMessage: String(userMessage),
      chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
    });
    res.json({ ok: true, snapshot });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/chat/classroom — OpenMAIC: Khung chat lớp học tích hợp Dispatcher, RAG & Multi-Agent Chaining
app.post('/api/chat/classroom', async (req, res) => {
  try {
    const { message, currentTime = 2233, recipient = 'all', lessonTitle = 'Toán 12 — Vectơ trong không gian', videoId: reqVideoId, useLLM = true, sessionId = null, replyTo = null, chatHistory = [], threadRoot = null } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Thiếu message' });
    }

    const lower = String(message).toLowerCase().trim();
    const { resolveLessonSubject } = await import('./src/services/contextSnapshot.js');
    const { videoId, isMathLesson } = resolveLessonSubject({ videoId: reqVideoId, lessonTitle });

    const { search, getById } = await import('./src/services/knowledgeBase.js');
    const { executeTool } = await import('./src/tools/index.js');
    const { extractVectorExpr, extractClaimFromText, extractSideFromText } = await import('./src/tools/tool_verify_vector_algebra.js');
    const toolCalls = [];

    // 1. RAG Search trên Knowledge Base DRE (Chỉ áp dụng khi bài giảng là môn Toán có KB)
    let kbMatch = null;
    if (isMathLesson && isMathKnowledgeQuery(message)) {
      const searchHits = search(message, 1);
      if (searchHits && searchHits.length > 0 && searchHits[0].score >= 2) {
        kbMatch = searchHits[0];
      }
    }

    if (kbMatch) {
      const ragTool = executeTool('tool_query_misconception_kb', {
        misconceptionId: kbMatch.misconception.id,
      });
      toolCalls.push({
        toolName: 'tool_query_misconception_kb',
        status: 'completed',
        label: 'Đang truy xuất kho tri thức RAG...',
        badgeText: `RAG: ${kbMatch.misconception.id} (${kbMatch.misconception.title})`,
        category: 'rag',
        input: ragTool.input,
        output: ragTool.output,
        isValid: ragTool.isValid,
        timestampMs: ragTool.timestampMs,
      });
    }

    // 2. Vector Algebra Tool (Chỉ gọi khi bài giảng là môn Toán và có biểu thức đại số vectơ)
    let vectorAlgebraTool = null;
    const detectedExpr = extractVectorExpr(message);
    const detectedClaim = extractClaimFromText(message);
    const detectedSide = extractSideFromText(message);
    const normalizedMessage = (message || '').normalize('NFC');
    const isQuestioningBo =
      /(?:^|\s)(?:bo|bạn ấy|ban ay|cậu ấy|cau ay|bạn|ban)\s+(?:nói|noi|bảo|bao|ghi|viết|viet|cho rằng|cho rang|phán|phan)(?![A-Za-zÀ-ỹ0-9_])/i.test(normalizedMessage) ||
      /(?:^|\s)theo\s+bo(?![A-Za-zÀ-ỹ0-9_])/i.test(normalizedMessage);
    const hasAlgebraClaim = detectedExpr || (isMathLesson && (lower.includes('bc') || lower.includes('dd') || lower.includes('2a') ||
      lower.includes('a√2') || lower.includes('√2') || lower.includes('căn 2') || lower.includes('1+1') ||
      (kbMatch?.misconception?.id === 'MISC_VEC_005' && (lower.includes('độ dài') || lower.includes('do dai')))));

    if (isMathLesson && hasAlgebraClaim) {
      const exprToVerify = detectedExpr || "|BC + DD'|";
      let finalClaim = detectedClaim;
      if (!isQuestioningBo && !finalClaim) {
        if (lower.includes('a√2') || lower.includes('√2') || lower.includes('căn 2')) {
          finalClaim = detectedSide !== 'a' ? `${detectedSide}√2` : 'a√2';
        } else if (lower.includes("bc'")) {
          finalClaim = "BC'";
        } else if (lower.includes('2a')) {
          finalClaim = '2a';
        } else if (lower.includes('1+1')) {
          finalClaim = '2';
        }
      }

      vectorAlgebraTool = executeTool('tool_verify_vector_algebra', {
        shape: 'cube',
        side: detectedSide,
        expr: exprToVerify,
        claim: finalClaim,
      });

      const isCalcOnly = vectorAlgebraTool.isValid === null || vectorAlgebraTool.output?.isValid === null;
      const badgeText = isCalcOnly
        ? `Đã tính toán hình học: ${vectorAlgebraTool.input.expr} = ${vectorAlgebraTool.output?.correct || ''}`
        : (vectorAlgebraTool.isValid === true
            ? `Đã kiểm chứng hình học: Khớp chuẩn (${vectorAlgebraTool.output?.correct || 'a√2'})`
            : vectorAlgebraTool.isValid === false
              ? `Đã kiểm chứng hình học: Sai lệch (${vectorAlgebraTool.input.claim} ≠ ${vectorAlgebraTool.output?.correct || 'a√2'})`
              : `Đã kiểm chứng hình học: ${vectorAlgebraTool.output?.correct || 'a√2'}`);

      toolCalls.push({
        toolName: vectorAlgebraTool.toolName,
        status: 'completed',
        label: isCalcOnly ? 'Trí đang tính toán độ dài vectơ...' : 'Trí đang kiểm chứng hình học...',
        badgeText,
        category: isCalcOnly ? 'math_calc' : 'math_verify',
        input: vectorAlgebraTool.input,
        output: vectorAlgebraTool.output,
        isValid: vectorAlgebraTool.isValid,
        timestampMs: vectorAlgebraTool.timestampMs,
      });
    }

    // 3. Trọng tài sự thật kiểm chứng bám nguồn bài giảng (Issue #27 & #30 - dùng cho mọi môn)
    const groundingTool = executeTool('tool_check_source_grounding', {
      claim: message,
      lessonId: videoId,
      aroundSecond: currentTime,
    });
    if (groundingTool.output?.verdict !== 'not_in_source' && groundingTool.output?.citations?.length > 0) {
      toolCalls.push({
        toolName: 'tool_check_source_grounding',
        status: 'completed',
        label: 'Đang kiểm chứng đối chiếu nguồn bài giảng...',
        badgeText: groundingTool.output.verdict === 'supported' ? 'Bám nguồn: Khớp bài giảng' : 'Bám nguồn: Cảnh báo sai lệch',
        category: 'grounding',
        input: groundingTool.input,
        output: groundingTool.output,
        isValid: groundingTool.isValid,
        timestampMs: groundingTool.timestampMs,
      });
    }

    // 4. Dispatch qua Dynamic Dispatcher (Issue #401 & #30)
    const { dispatchMessage } = await import('./src/services/dispatcher.js');
    const activeSessionId = sessionId || `classroom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const dispatchResult = await dispatchMessage({
      message,
      currentTime,
      lessonTitle,
      videoId,
      sessionId: activeSessionId,
      recipient,
      useLLM,
      toolCalls,
      vectorAlgebraTool,
      groundingTool,
      kbMatch,
      replyTo,
      chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
      threadRoot: threadRoot && typeof threadRoot === 'object' ? threadRoot : null,
    });
    // Trò chuyện xã giao không trích nguồn, nên cũng không khoe bước đối chiếu nguồn.
    const isSmallTalk = dispatchResult.verdict.detectedIntent === 'general_classroom_chitchat' && !kbMatch
      && (groundingTool.output?.verdict || 'not_in_source') === 'not_in_source';
    const visibleToolCalls = isSmallTalk
      ? toolCalls.filter((call) => call.toolName !== 'tool_check_source_grounding')
      : toolCalls;

    res.json({
      ok: true,
      author: dispatchResult.primaryResponse.author,
      text: dispatchResult.primaryResponse.text,
      avatarId: dispatchResult.primaryResponse.avatarId,
      thought: dispatchResult.primaryResponse.thought || null,
      followUpBoText: dispatchResult.followUpResponse?.text || null,
      followUpResponse: dispatchResult.followUpResponse || null,
      peerId: dispatchResult.verdict.dispatchedAgent,
      verdict: dispatchResult.verdict,
      sessionId: activeSessionId,
      sessionState: dispatchResult.sessionState || null,
      kbMatchedId: dispatchResult.ragContextUsed?.misconceptionId || kbMatch?.misconception?.id || null,
      toolCall: visibleToolCalls[0] || null,
      toolCalls: visibleToolCalls,
      citations: dispatchResult.citations || (dispatchResult.primaryResponse?.citations) || null,
      contextSnapshot: dispatchResult.contextSnapshot || null,
      timeStr: dispatchResult.currentTimeStr,
      latencyMs: dispatchResult.latencyMs,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================================
// AISDLC EPIC 4 - Issue #403: Cognitive Metrics & Bloom Certification Endpoints
// ============================================================================

// POST /api/evaluator/assess — Tính toán Hesitation Index & chấm chất lượng phản biện
app.post('/api/evaluator/assess', async (req, res) => {
  try {
    const {
      answer = '',
      expectedPoints = [],
      currentTime = 2233,
      misconceptionId = null,
      deltaSeconds = 0,
      characterCount = 10,
      backspaceCount = 0,
    } = req.body || {};

    const { calculateHesitationIndex, evaluateRebuttalQuality } = await import('./src/services/evaluator.js');
    const hesitation = calculateHesitationIndex({ deltaSeconds, characterCount, backspaceCount });
    const assessment = evaluateRebuttalQuality({
      answer,
      expectedPoints,
      currentTime,
      misconceptionId,
    });

    res.json({
      ok: true,
      hesitation,
      assessment,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/evaluator/action — Thực thi 3 Action sư phạm: create_learning_record, update_mastery_state, create_review_task
app.post('/api/evaluator/action', async (req, res) => {
  try {
    const { sessionId = 'session_001', action, payload = {} } = req.body || {};
    const evaluator = await import('./src/services/evaluator.js');

    let result;
    if (action === 'create_learning_record') {
      result = evaluator.createLearningRecord(sessionId, payload);
    } else if (action === 'update_mastery_state') {
      result = evaluator.updateMasteryState(sessionId, payload);
    } else if (action === 'create_review_task') {
      result = evaluator.createReviewTask(sessionId, payload);
    } else {
      return res.status(400).json({ ok: false, error: `Action '${action}' không hợp lệ` });
    }

    res.json({ ok: true, action, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/evaluator/certify-station4 — Thẩm định chứng nhận Tháp Bloom ở Trạm 4
app.post('/api/evaluator/certify-station4', async (req, res) => {
  try {
    const { sessionId = 'session_001', teachingAnswer = '', createdProblem = null, videoTimeS = 2300 } = req.body || {};
    const { certifyBloomStation4 } = await import('./src/services/evaluator.js');

    const result = certifyBloomStation4(sessionId, {
      teachingAnswer,
      createdProblem,
      videoTimeS,
    });

    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/session/:id/export — Xuất toàn bộ session document chuẩn DRESessionSchema
app.get('/api/session/:id/export', async (req, res) => {
  try {
    const { exportSessionDocument } = await import('./src/services/evaluator.js');
    const sessionDoc = exportSessionDocument(req.params.id);
    res.json({ ok: true, session: sessionDoc });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Error handling middleware (bắt lỗi cú pháp JSON payload từ body-parser và lỗi hệ thống)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('[Backend] Bỏ qua lỗi cú pháp JSON payload:', err.message);
    return res.status(400).json({ ok: false, error: 'Malformed JSON payload' });
  }
  console.error('[Backend Server Error]:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ ok: false, error: err.message || 'Internal Server Error' });
});

// Only listen when executed directly (`node server.js`), not when imported by tests or other tooling.
const normalizeEntryPath = (p) => {
  const resolved = nodePath.resolve(p);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
};
const isMainModule = Boolean(process.argv[1])
  && normalizeEntryPath(process.argv[1]) === normalizeEntryPath(fileURLToPath(import.meta.url));
if (isMainModule && process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`DRE backend đang chạy ở http://localhost:${config.port}`);
  });
}

export { app };
export default app;
