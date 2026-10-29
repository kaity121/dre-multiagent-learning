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

import express from 'express';
import cors from 'cors';
import { config } from './src/config.js';
import { listMisconceptionIds } from './src/contentLibrary.js';
import { startSession, submitAnswer, submitRebuttal } from './src/orchestrator.js';
import { chatJSON } from './src/openaiClient.js';
import { saveRun, getRun, listRuns, streamReplayEvents, sanitizeRunId } from './src/services/runRecorder.js';

function sanitizeVideoId(videoId) {
  if (!videoId || typeof videoId !== 'string') return 'VID_DEFAULT';
  return videoId.trim().replace(/[^a-zA-Z0-9_-]/g, '') || 'VID_DEFAULT';
}

const app = express();
app.use(cors());
app.use(express.json());

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

// POST /api/roundtable/run & /api/roundtable/generate — OpenMAIC Issue #302: Buồng họp A2A Scriptwriting Roundtable
app.post(['/api/roundtable/run', '/api/roundtable/generate'], async (req, res) => {
  try {
    const { videoId = 'VID_VECTO_12_TIEN', partNumber, misconceptionId, cognitiveStream: customStream, useLLM = false } = req.body || {};

    // 1. Nếu yêu cầu chạy theo misconceptionId đơn lẻ (tương thích backward)
    if (misconceptionId && !partNumber && !customStream) {
      const { runRoundtable } = await import('./src/services/roundtable.js');
      const draft = await runRoundtable(misconceptionId, { useLLM });
      return res.json({ ok: true, draft });
    }

    // 2. Chạy Roundtable Orchestrator toàn diện cho Video / Part theo CognitiveEventStream (#302)
    const { runRoundtableForPart, runFullLessonRoundtable, partitionTimelineIntoParts } = await import('./src/services/roundtableOrchestrator.js');

    let stream = customStream;
    if (!stream) {
      const fs = await import('fs');
      const path = await import('path');
      const fixturePath = path.resolve(process.cwd(), 'mock/mock_cognitive_stream_vecto12.json');
      if (fs.existsSync(fixturePath)) {
        stream = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      } else {
        stream = {
          videoId,
          videoTitle: 'Bài 1.1: Vectơ Trong Không Gian - Thầy Nguyễn Phan Tiến',
          teacherName: 'Thầy Nguyễn Phan Tiến',
          durationSeconds: 3480,
          segments: [],
        };
      }
    }

    if (partNumber) {
      const parts = partitionTimelineIntoParts(stream);
      const targetPart = parts.find(p => p.partNumber === Number(partNumber)) || parts[0];
      const partResult = await runRoundtableForPart(targetPart, { useLLM });
      return res.json({ ok: true, mode: 'part', part: partResult });
    }

    const fullDraft = await runFullLessonRoundtable(stream, { useLLM });
    res.json({
      ok: true,
      mode: 'full_lesson',
      draft: fullDraft,
      stats: {
        totalParts: fullDraft.parts.length,
        totalCheckpoints: fullDraft.checkpoints.length,
        crossCheckLogsCount: fullDraft.crossCheckLogs.length,
        totalReasoningEvents: fullDraft.allReasoningEvents.length,
      },
    });
  } catch (err) {
    console.error('[API Roundtable] Lỗi thực thi Roundtable:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET & POST /api/roundtable/stream — Real-time Server-Sent Events (SSE) Stream for War Room Demo (< 30-60s) (#302)
const handleRoundtableStream = async (req, res) => {
  const isPost = req.method === 'POST';
  const params = isPost ? (req.body || {}) : (req.query || {});
  const {
    videoId = 'VID_VECTO_12_TIEN',
    partNumber,
    streamDelayMs = 20,
    useLLM = false,
    cognitiveStream: customStream,
    mode = 'live',
    runId,
    speed = 1,
    fixture = false,
  } = params;

  // Thiết lập SSE Headers chuẩn
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

  const isReplayMode = String(fixture) === 'true' || fixture === true || mode === 'replay' || (runId && (runId === 'fixture' || runId === 'mock'));

  try {
    // -------------------------------------------------------------------------
    // CHẾ ĐỘ REPLAY STREAM (Nạp từ run recorder hoặc fixture)
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // CHẾ ĐỘ LIVE STREAM (Tự động biên kịch và lưu vào run recorder)
    // -------------------------------------------------------------------------
    const activeRunId = runId || `run_${Date.now()}`;
    const recordedEvents = [];

    // Chuẩn bị cognitiveStream
    const { runRoundtableForPart, runFullLessonRoundtable, partitionTimelineIntoParts } =
      await import('./src/services/roundtableOrchestrator.js');

    let stream = customStream;
    if (!stream) {
      const fs = await import('fs');
      const path = await import('path');
      const fixturePath = path.resolve(process.cwd(), 'mock/mock_cognitive_stream_vecto12.json');
      if (fs.existsSync(fixturePath)) {
        stream = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      } else {
        stream = {
          videoId,
          videoTitle: 'Bài 1.1: Vectơ Trong Không Gian - Thầy Nguyễn Phan Tiến',
          teacherName: 'Thầy Nguyễn Phan Tiến',
          durationSeconds: 3480,
          segments: [],
        };
      }
    }

    sendSSE('session_start', {
      runId: activeRunId,
      mode: 'live',
      videoId,
      partNumber: partNumber ? Number(partNumber) : 'all',
      timestamp: new Date().toISOString(),
    });

    const onEvent = async (event) => {
      if (isAborted) return;
      recordedEvents.push(event);

      // Phát đầy đủ các định dạng SSE event
      sendSSE('reasoning', event);
      sendSSE('reasoning_event', event);
      if (event.eventType) {
        sendSSE(event.eventType, event);
      }
      sendSSE('message', event);
    };

    if (partNumber) {
      const parts = partitionTimelineIntoParts(stream);
      const targetPart = parts.find(p => p.partNumber === Number(partNumber)) || parts[0];
      const partResult = await runRoundtableForPart(targetPart, {
        useLLM: String(useLLM) === 'true',
        onEvent,
        streamDelayMs: Number(streamDelayMs) || 0,
        isAborted: () => isAborted,
      });

      if (isAborted) return res.end();

      // Tự động record live run vào run recorder
      const lessonDraftPayload = {
        lessonId: videoId,
        title: stream.videoTitle || 'Bài 1.1: Vectơ Trong Không Gian',
        videoUrl: stream.videoUrl || 'https://www.youtube.com/watch?v=sample_vecto12',
        durationSeconds: stream.durationSeconds || 3480,
        checkpoints: partResult.checkpoints || (partResult.checkpoint ? [partResult.checkpoint] : []),
        timelineComments: partResult.timelineComments || (partResult.scriptScenario ? partResult.scriptScenario.map((sc, idx) => ({
          id: `cmt_${partResult.checkpointSecond}_${sc.actor}_${idx}`,
          second: (partResult.checkpointSecond || 0) + idx,
          author: sc.actor === 'colam' ? 'Cô Lam' : sc.actor === 'bo' ? 'Bo' : sc.actor === 'tri' ? 'Trí' : sc.actor === 'linhchi' ? 'Linh Chi' : 'Minh Khang',
          role: sc.actor === 'colam' ? 'teacher' : 'classmate',
          avatarId: sc.actor,
          text: sc.speech,
          isPinned: sc.actor === 'colam' || sc.actor === 'tri',
        })) : []),
        pedagogicalSummary: {
          totalTrapsIdentified: (partResult.checkpoints?.length || (partResult.checkpoint ? 1 : 0)),
          bloomMasteryTarget: 'Analyze',
          approvedByTeacher: true,
          approvalTimestamp: new Date().toISOString(),
        },
      };

      try {
        saveRun({
          runId: activeRunId,
          videoId,
          videoTitle: stream.videoTitle,
          partNumber: Number(partNumber),
          createdAt: new Date().toISOString(),
          stats: {
            totalEvents: recordedEvents.length,
            crossCheckCorrectionOccurred: Boolean(partResult?.crossCheckCorrectionOccurred),
            bloomLevel: 'Analyze',
            partTitle: targetPart.title,
          },
          reasoning_events: recordedEvents,
          lessonDraft: lessonDraftPayload,
        });
      } catch (recErr) {
        console.warn('[Roundtable] Run recording warning:', recErr);
      }

      sendSSE('done', {
        runId: activeRunId,
        mode: 'live',
        totalEvents: recordedEvents.length,
        lesson: lessonDraftPayload,
        lessonDraft: lessonDraftPayload,
        timestamp: new Date().toISOString(),
      });

      sendSSE('complete', {
        ok: true,
        mode: 'part',
        runId: activeRunId,
        part: partResult,
        draft: lessonDraftPayload,
        lesson: lessonDraftPayload,
        timestamp: new Date().toISOString(),
      });
      return res.end();
    }

    const fullDraft = await runFullLessonRoundtable(stream, {
      useLLM: String(useLLM) === 'true',
      onEvent,
      streamDelayMs: Number(streamDelayMs) || 0,
      isAborted: () => isAborted,
    });

    if (isAborted) return res.end();

    // Tự động record full lesson run vào run recorder
    try {
      saveRun({
        runId: activeRunId,
        videoId,
        videoTitle: stream.videoTitle,
        partNumber: 'all',
        createdAt: new Date().toISOString(),
        stats: {
          totalEvents: recordedEvents.length,
          crossCheckCorrectionOccurred: Boolean(fullDraft.crossCheckLogs?.length > 0),
          bloomLevel: 'Analyze',
        },
        reasoning_events: recordedEvents,
        lessonDraft: fullDraft,
      });
    } catch (recErr) {
      console.warn('[Roundtable] Run recording warning:', recErr);
    }

    sendSSE('done', {
      runId: activeRunId,
      mode: 'live',
      totalEvents: recordedEvents.length,
      lesson: fullDraft,
      lessonDraft: fullDraft,
      timestamp: new Date().toISOString(),
    });

    sendSSE('complete', {
      ok: true,
      mode: 'full_lesson',
      runId: activeRunId,
      draft: fullDraft,
      lesson: fullDraft,
      timestamp: new Date().toISOString(),
    });
    res.end();
  } catch (err) {
    console.error('[SSE Roundtable] Lỗi stream:', err);
    const activeRunId = params.runId || 'unknown';
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: err.message, runId: activeRunId });
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
app.get('/api/roundtable/drafts/:videoId', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const safeVideoId = sanitizeVideoId(req.params.videoId);
    const draftsBase = path.resolve(process.cwd(), 'backend/src/data/drafts');
    const draftPath = path.resolve(draftsBase, `lesson_draft_${safeVideoId}.json`);

    // Path containment check
    const rel = path.relative(draftsBase, draftPath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return res.status(400).json({ ok: false, error: 'videoId không hợp lệ' });
    }

    if (!fs.existsSync(draftPath)) {
      return res.status(404).json({ ok: false, error: `Không tìm thấy draft cho videoId: ${safeVideoId}` });
    }

    const content = JSON.parse(fs.readFileSync(draftPath, 'utf-8'));
    res.json({ ok: true, draft: content });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/roundtable/drafts — Danh sách tất cả các draft đã sinh
app.get('/api/roundtable/drafts', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const draftsDir = path.resolve(process.cwd(), 'backend/src/data/drafts');

    if (!fs.existsSync(draftsDir)) {
      return res.json({ ok: true, drafts: [] });
    }

    const files = fs.readdirSync(draftsDir).filter(f => f.endsWith('.json'));
    const drafts = files.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(draftsDir, f), 'utf-8'));
        return {
          filename: f,
          lessonId: data.lessonId,
          title: data.title,
          totalParts: data.parts?.length || 0,
          totalCheckpoints: data.checkpoints?.length || 0,
          generatedAt: data.pedagogicalSummary?.generatedAt,
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

// POST /api/chat/classroom — OpenMAIC: Khung chat lớp học tích hợp RAG Knowledge Base & 4 AI Peers
app.post('/api/chat/classroom', async (req, res) => {
  try {
    const { message, currentTime = 0, recipient = 'all', lessonTitle = 'Toán 12 — Vectơ trong không gian' } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Thiếu message' });
    }

    // 0. Khởi tạo & chuẩn hóa chuỗi ngay từ đầu (TRÁNH TDZ CRASH)
    const lower = String(message).toLowerCase().trim();

    // Xác định mốc thời gian bài giảng: ưu tiên tiền tố tường minh ^\[(?:Tại\s+)?(\d{1,2}):(\d{2})\] hoặc trung thực theo currentTime
    const timePrefixMatch = String(message).trim().match(/^\[(?:Tại\s+)?(\d{1,2}):(\d{2})\]/i);
    let effectiveTime = Number(currentTime);
    if (timePrefixMatch) {
      effectiveTime = parseInt(timePrefixMatch[1], 10) * 60 + parseInt(timePrefixMatch[2], 10);
    } else if (isNaN(effectiveTime) || effectiveTime < 0) {
      effectiveTime = 0;
    }

    const { search, getById } = await import('./src/services/knowledgeBase.js');
    const { chatJSON } = await import('./src/openaiClient.js');

    // 1. RAG Search trên Knowledge Base DRE — chỉ thực hiện khi câu hỏi liên quan kiến thức toán
    let kbMatch = null;
    if (isMathKnowledgeQuery(message)) {
      const searchHits = search(message, 1);
      if (searchHits && searchHits.length > 0 && searchHits[0].score >= 2) {
        kbMatch = searchHits[0];
      } else if (effectiveTime >= 2100 && effectiveTime <= 2400 && 
                (lower.includes('2a') || lower.includes('bc') || lower.includes('dd') || lower.includes('1+1') || lower.includes('bẫy') || lower.includes('độ dài') || lower.includes('do dai'))) {
        kbMatch = getById('MISC_VEC_005');
      }
    }

    // 2. Xác định vai trả lời (Routing)
    let targetPeer = recipient;
    if (targetPeer === 'all') {
      if (lower.includes('@bo') || lower.includes(' bo ') || lower.endsWith(' bo') || lower.startsWith('bo ')) {
        targetPeer = 'bo';
      } else if (lower.includes('@linhchi') || lower.includes('linh chi') || lower.includes('công thức') || lower.includes('quy tắc')) {
        targetPeer = 'linhchi';
      } else if (lower.includes('@minhkhang') || lower.includes('minh khang') || lower.includes('đời sống') || lower.includes('hình dung')) {
        targetPeer = 'minhkhang';
      } else if (lower.includes('@colam') || lower.includes('cô lam') || lower.includes('thưa cô')) {
        targetPeer = 'colam';
      } else {
        targetPeer = 'tri'; // Default deep thinker
      }
    }

    // 3. Thực thi Deterministic Tools TRƯỚC KHI gọi model để model có số liệu thực tế
    const { executeTool } = await import('./src/tools/index.js');
    const toolCalls = [];

    // 3.1 Tool RAG Knowledge Base Retrieval
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

    // 3.2 Tool kiểm chứng đại số hình học: Dynamic parser trích xuất expr và claim từ câu hỏi
    const { extractVectorExpr, extractClaimFromText } = await import('./src/tools/tool_verify_vector_algebra.js');
    let vectorAlgebraTool = null;
    
    // Tự động phân tích biểu thức vectơ từ câu hỏi học sinh (hoặc fallback về |BC + DD'| nếu đang ở checkpoint 37:13)
    let parsedExpr = extractVectorExpr(message);
    if (!parsedExpr && effectiveTime >= 2100 && effectiveTime <= 2400 && (lower.includes('bc') || lower.includes('dd') || lower.includes('độ dài') || lower.includes('do dai'))) {
      parsedExpr = "|BC + DD'|";
    }

    if (parsedExpr) {
      // Trích xuất claim thực tế từ câu hỏi học sinh
      // Nếu câu hỏi có tính chất phản biện / nghi vấn về phát biểu của Bo (vd: "Bo nói ... sai đúng không?"),
      // không coi đó là claim khẳng định của học sinh!
      const isQuestioningBo = /(?:bo\s+nói|bo\s+bảo|có\s+phải|sai\s+đúng\s+không|đúng\s+không\s*\?)/i.test(message);
      const parsedClaim = isQuestioningBo ? null : extractClaimFromText(message);

      // Trích xuất độ dài cạnh linh hoạt: "cạnh 2", "cạnh bằng 2", "cạnh = 2", "cạnh là 2"
      const sideMatch = lower.match(/(?:cạnh|side)\s*(?:bằng|=|là)?\s*(\d+(?:\.\d+)?)/i);
      const detectedSide = sideMatch ? sideMatch[1] : (lower.includes('cạnh 2') ? '2' : 'a');

      vectorAlgebraTool = executeTool('tool_verify_vector_algebra', {
        shape: 'cube',
        side: detectedSide,
        expr: parsedExpr,
        claim: parsedClaim,
      });

      let badgeText = '';
      if (vectorAlgebraTool.isValid === true) {
        badgeText = `Đã kiểm chứng hình học: Khớp chuẩn (${vectorAlgebraTool.output.correct})`;
      } else if (vectorAlgebraTool.isValid === false) {
        badgeText = `Đã kiểm chứng hình học: Sai lệch (${vectorAlgebraTool.input.claim} ≠ ${vectorAlgebraTool.output.correct})`;
      } else {
        // Học sinh chỉ hỏi tính toán, không đưa claim sai -> không phán sai lệch!
        badgeText = `Đã tính toán hình học: ${vectorAlgebraTool.input.expr} = ${vectorAlgebraTool.output.correct}`;
      }

      toolCalls.push({
        toolName: vectorAlgebraTool.toolName,
        status: 'completed',
        label: 'Trí đang kiểm chứng hình học...',
        badgeText,
        category: 'math_verify',
        input: vectorAlgebraTool.input,
        output: vectorAlgebraTool.output,
        isValid: vectorAlgebraTool.isValid,
        timestampMs: vectorAlgebraTool.timestampMs,
      });
    }

    // 3.3 Tool thẩm định Bloom (Cô Lam)
    let bloomTool = null;
    if (targetPeer === 'colam') {
      bloomTool = executeTool('tool_evaluate_bloom_level', {
        question: message,
        expected_points: kbMatch?.misconception?.resolution_criteria || [],
      });
      toolCalls.push({
        toolName: 'tool_evaluate_bloom_level',
        status: 'completed',
        label: 'Cô Lam đang thẩm định chuẩn Bloom...',
        badgeText: `Chuẩn Bloom: ${bloomTool.output.level} (${bloomTool.output.score}/6)`,
        category: 'bloom',
        input: bloomTool.input,
        output: bloomTool.output,
        isValid: bloomTool.isValid,
        timestampMs: bloomTool.timestampMs,
      });
    }

    const m = Math.floor(effectiveTime / 60);
    const s = Math.floor(effectiveTime % 60);
    const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

    const systemPrompt = `Bạn là bạn học "${targetPeer.toUpperCase()}" trong lớp học thông minh DRE Toán 12 (Bài giảng Thầy Nguyễn Phan Tiến).
Thời điểm video hiện tại: [${timeStr}].
Chủ đề: ${lessonTitle}.
${kbMatch ? `
Tri thức nền tảng (KB RAG):
- Ngộ nhận liên quan: ${kbMatch.misconception.title} (${kbMatch.misconception.incorrect_claim})
- Kiến thức đúng: ${kbMatch.misconception.correction}
- Phản ví dụ: ${kbMatch.misconception.counterexample?.setup} -> ${kbMatch.misconception.counterexample?.result}
- Gợi ý phân tầng: 
  + Mức 1: ${kbMatch.misconception.scaffolding[0]?.question || ''}
  + Mức 2: ${kbMatch.misconception.scaffolding[1]?.question || ''}
` : ''}
${vectorAlgebraTool ? `
Dữ liệu kiểm chứng từ Deterministic Tool (Toạ độ 3D):
- Biểu thức: ${vectorAlgebraTool.input.expr}
- Phát biểu kiểm tra: ${vectorAlgebraTool.input.claim}
- Kết quả kiểm chứng (isValid): ${vectorAlgebraTool.isValid}
- Giá trị đúng chuẩn: ${vectorAlgebraTool.output.correct}
- Căn cứ hình học: ${vectorAlgebraTool.output.reason}
` : ''}

Quy tắc ứng xử:
1. Giữ đúng persona của ${targetPeer} (Bo: lém lỉnh; Trí: trầm tĩnh, đào sâu bản chất; Linh Chi: cẩn thận, tóm tắt công thức; Minh Khang: ví dụ trực quan đời thực; Cô Lam: ấm áp, dẫn dắt Socratic "nudges, not answers").
2. Khi học sinh hỏi về bẫy tổng 1+1=2 hoặc cộng độ dài: Trí giải thích bản chất bất đẳng thức tam giác và Pytago ra a√2, không bằng 2a.
3. Không xả ngay đáp án chi tiết nếu học sinh đang hỏi gợi ý; gợi ý từng nấc nhẹ nhàng (1-2 câu).
4. QUY TẮC BẢO VỆ PHẠM VI (SCOPE & OUT-OF-DOMAIN GUARDRAIL):
- Bạn đang tham gia lớp học Toán 12 bài "${lessonTitle}".
- Khi học sinh hỏi câu hỏi ngoài lề, lạc đề, câu hỏi đời sống không thuộc môn Toán (ví dụ: con chó có mấy chân, thời tiết, chơi game...):
  + Phải phản hồi ngắn gọn, hóm hỉnh đúng phong cách bạn học/cô giáo, NHƯNG BẮT BUỘC phải khéo léo bẻ lái / nhắc bạn học quay trở lại bài toán vectơ trong không gian của thầy Tiến đang học (ví dụ: "Con chó thường có 4 chân nhé 🐶! Cơ mà nhắc tới số 4, tụi mình quay lại bài vectơ của thầy Tiến thôi: cậu đã nắm được quy tắc hình hộp 8 đỉnh 4 đường chéo chưa?")!
5. Luôn trả về JSON:
{
  "author": "${targetPeer === 'bo' ? 'Bo' : targetPeer === 'tri' ? 'Trí' : targetPeer === 'linhchi' ? 'Linh Chi' : targetPeer === 'minhkhang' ? 'Minh Khang' : 'Cô Lam'}",
  "text": "Câu trả lời của bạn",
  "followUpBoText": "Nếu câu hỏi liên quan đến bẫy của Bo mà Trí trả lời, Bo nói thêm 1 câu đồng tình/sáng tỏ (hoặc rỗng nếu không cần)"
}`;

    const modelToUse = targetPeer === 'colam' 
      ? config.models.coLam 
      : targetPeer === 'tri' 
        ? (config.models.tri || config.models.bo)
        : config.models.bo;

    const reply = await chatJSON({
      model: modelToUse,
      systemPrompt,
      userPayload: {
        student_question: message,
        currentTime: timeStr,
      },
    });

    res.json({
      ok: true,
      author: reply.author,
      text: reply.text,
      followUpBoText: reply.followUpBoText || null,
      peerId: targetPeer,
      kbMatchedId: kbMatch?.misconception?.id || null,
      toolCall: toolCalls[0] || null,
      toolCalls,
      timeStr,
      second: effectiveTime,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export { app };
export default app;

const isMainModule = Boolean(process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server')));
if (isMainModule) {
  app.listen(config.port, () => {
    console.log(`DRE backend đang chạy ở http://localhost:${config.port}`);
  });
}
