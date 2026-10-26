import express from 'express';
import cors from 'cors';
import { config } from './src/config.js';
import { listMisconceptionIds } from './src/contentLibrary.js';
import { startSession, submitAnswer, submitRebuttal } from './src/orchestrator.js';
import { chatJSON } from './src/openaiClient.js';
import { lessonsRouter } from './src/routes/lessons.js';
import { extractRouter } from './src/routes/extract.js';

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

    if (peerId === 'tri') {
      const { triDeepThink } = await import('./src/agents/tri.js');
      result = await triDeepThink({ baiToan: mathProblem, chuDe: topic, cauHoiHocVien: message });
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

    res.json({ ok: true, peerId, result });
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

// POST /api/chat/classroom — OpenMAIC: Khung chat lớp học tích hợp RAG Knowledge Base & 4 AI Peers
app.post('/api/chat/classroom', async (req, res) => {
  try {
    const { message, currentTime = 2233, recipient = 'all', lessonTitle = 'Toán 12 — Vectơ trong không gian' } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Thiếu message' });
    }

    const { search, getById } = await import('./src/services/knowledgeBase.js');
    const { chatJSON } = await import('./src/openaiClient.js');

    // 1. RAG Search trên Knowledge Base DRE
    let kbMatch = null;
    const searchHits = search(message, 1);
    if (searchHits && searchHits.length > 0) {
      kbMatch = searchHits[0];
    } else if (currentTime >= 2100 && currentTime <= 2400) {
      kbMatch = getById('MISC_VEC_005');
    }

    // 2. Xác định vai trả lời (Routing)
    const lower = message.toLowerCase();
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

    const m = Math.floor(currentTime / 60);
    const s = Math.floor(currentTime % 60);
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

Quy tắc ứng xử:
1. Giữ đúng persona của ${targetPeer} (Bo: lém lỉnh; Trí: trầm tĩnh, đào sâu bản chất; Linh Chi: cẩn thận, tóm tắt công thức; Minh Khang: ví dụ trực quan đời thực; Cô Lam: ấm áp, dẫn dắt).
2. Khi học sinh hỏi về bẫy tổng 1+1=2 hoặc cộng độ dài: Trí giải thích bản chất bất đẳng thức tam giác và Pytago ra √2, không bằng 2.
3. Không xả ngay đáp án chi tiết nếu học sinh đang hỏi gợi ý; gợi ý từng nấc nhẹ nhàng (1-2 câu).
4. Luôn trả về JSON:
{
  "author": "${targetPeer === 'bo' ? 'Bo' : targetPeer === 'tri' ? 'Trí' : targetPeer === 'linhchi' ? 'Linh Chi' : targetPeer === 'minhkhang' ? 'Minh Khang' : 'Cô Lam'}",
  "text": "Câu trả lời của bạn",
  "followUpBoText": "Nếu câu hỏi liên quan đến bẫy của Bo mà Trí trả lời, Bo nói thêm 1 câu đồng tình/sáng tỏ (hoặc rỗng nếu không cần)"
}`;

    const reply = await chatJSON({
      model: targetPeer === 'colam' ? config.models.coLam : config.models.bo,
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
      timeStr,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`DRE backend đang chạy ở http://localhost:${config.port}`);
});
