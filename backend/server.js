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

// POST /api/roundtable/run  { misconceptionId } — OpenMAIC Issue #302: Buồng họp A2A Scriptwriting
app.post('/api/roundtable/run', async (req, res) => {
  try {
    const { runRoundtable } = await import('./src/services/roundtable.js');
    const { misconceptionId = 'MISC_VEC_005' } = req.body || {};
    const draft = await runRoundtable(misconceptionId);
    res.json({ ok: true, draft });
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

// POST /api/runtime/dispatch — OpenMAIC Issue #401: Runtime Intent Classifier & Dynamic Routing Dispatcher
app.post('/api/runtime/dispatch', async (req, res) => {
  try {
    const { message, currentTime = 2233, lessonTitle = 'Toán 12 — Vectơ trong không gian', sessionId = null, recipient = 'all', useLLM = true } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Thiếu message' });
    }

    const { dispatchMessage } = await import('./src/services/dispatcher.js');
    const result = await dispatchMessage({
      message,
      currentTime,
      lessonTitle,
      sessionId,
      recipient,
      useLLM,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/chat/classroom — OpenMAIC: Khung chat lớp học tích hợp Dispatcher, RAG & Multi-Agent Chaining
app.post('/api/chat/classroom', async (req, res) => {
  try {
    const { message, currentTime = 2233, recipient = 'all', lessonTitle = 'Toán 12 — Vectơ trong không gian', useLLM = true } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Thiếu message' });
    }

    const lower = String(message).toLowerCase().trim();
    const { search, getById } = await import('./src/services/knowledgeBase.js');
    const { executeTool } = await import('./src/tools/index.js');
    const toolCalls = [];

    // 1. RAG Search trên Knowledge Base DRE
    let kbMatch = null;
    if (isMathKnowledgeQuery(message)) {
      const searchHits = search(message, 1);
      if (searchHits && searchHits.length > 0 && searchHits[0].score >= 2) {
        kbMatch = searchHits[0];
      } else if (currentTime >= 2100 && currentTime <= 2400 && 
                (lower.includes('2a') || lower.includes('bc') || lower.includes('dd') || lower.includes('1+1') || lower.includes('bẫy') || lower.includes('độ dài') || lower.includes('do dai'))) {
        kbMatch = getById('MISC_VEC_005');
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

    // 2. Vector Algebra Tool
    const hasAlgebraClaim = lower.includes('bc') || lower.includes('dd') || lower.includes('2a') ||
      lower.includes('a√2') || lower.includes('√2') || lower.includes('căn 2') || lower.includes('1+1') ||
      (kbMatch?.misconception?.id === 'MISC_VEC_005' && (lower.includes('độ dài') || lower.includes('do dai')));

    if (hasAlgebraClaim) {
      let detectedClaim = '2a';
      if (lower.includes('a√2') || lower.includes('√2') || lower.includes('căn 2')) {
        detectedClaim = 'a√2';
      } else if (lower.includes("bc'")) {
        detectedClaim = "BC'";
      } else if (lower.includes('2a')) {
        detectedClaim = '2a';
      } else if (lower.includes('1+1')) {
        detectedClaim = '2';
      }

      const vectorAlgebraTool = executeTool('tool_verify_vector_algebra', {
        shape: 'cube',
        side: 'a',
        expr: "|BC + DD'|",
        claim: detectedClaim,
      });

      const badgeText = vectorAlgebraTool.isValid === true
        ? `Đã kiểm chứng hình học: Khớp chuẩn (${vectorAlgebraTool.output.correct || 'a√2'})`
        : vectorAlgebraTool.isValid === false
          ? `Đã kiểm chứng hình học: Sai lệch (${vectorAlgebraTool.input.claim} ≠ ${vectorAlgebraTool.output.correct || 'a√2'})`
          : `Đã kiểm chứng hình học: ${vectorAlgebraTool.output.correct || 'a√2'}`;

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

    // 3. Dispatch qua Dynamic Dispatcher (Issue #401)
    const { dispatchMessage } = await import('./src/services/dispatcher.js');
    const dispatchResult = await dispatchMessage({
      message,
      currentTime,
      lessonTitle,
      recipient,
      useLLM,
    });

    res.json({
      ok: true,
      author: dispatchResult.primaryResponse.author,
      text: dispatchResult.primaryResponse.text,
      avatarId: dispatchResult.primaryResponse.avatarId,
      followUpBoText: dispatchResult.followUpResponse?.text || null,
      followUpResponse: dispatchResult.followUpResponse || null,
      peerId: dispatchResult.verdict.dispatchedAgent,
      verdict: dispatchResult.verdict,
      kbMatchedId: dispatchResult.ragContextUsed?.misconceptionId || kbMatch?.misconception?.id || null,
      toolCall: toolCalls[0] || null,
      toolCalls,
      timeStr: dispatchResult.currentTimeStr,
      latencyMs: dispatchResult.latencyMs,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`DRE backend đang chạy ở http://localhost:${config.port}`);
});
