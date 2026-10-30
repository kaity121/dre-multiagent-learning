// Turns an InspectorTurn (replayed or live) into the four lanes of the Agent Map.
// Only fields that exist on the turn are shown: no invented timings, tokens or verdicts.
// Context hidden from an agent is counted, never displayed, so the map cannot leak answers.
import type { InspectorTurn, TurnCitation } from '../../types/reasoning';

export type LaneId = 'understand' | 'context' | 'verify' | 'answer';

export const LANES: { id: LaneId; title: string }[] = [
  { id: 'understand', title: 'Hiểu câu hỏi' },
  { id: 'context', title: 'Lấy ngữ cảnh' },
  { id: 'verify', title: 'Kiểm chứng' },
  { id: 'answer', title: 'Trả lời' },
];

export interface DetailField {
  label: string;
  value: string;
  /** Render as code (tool names, ids). */
  mono?: boolean;
}

export interface MapBlock {
  id: string;
  lane: LaneId;
  kind: 'dispatcher' | 'context' | 'tool' | 'assessor' | 'agent';
  title: string;
  subtitle?: string;
  metric?: string;
  tone?: 'ok' | 'warn';
  input: DetailField[];
  output: DetailField[];
}

export interface ToolView {
  name: string;
  friendlyName: string;
  verdict?: 'ok' | 'mismatch';
  summary?: string;
}

export interface AgentMapTurn {
  key: string;
  number?: number;
  timeLabel?: string;
  question?: string;
  agent: string;
  agentRole: string;
  latencyMs?: number;
  answer?: string;
  lanes: Record<LaneId, MapBlock[]>;
  tools: ToolView[];
  contextItems: string[];
  hiddenContextCount: number;
  citations: TurnCitation[];
}

const AGENT_ROLES: Record<string, string> = {
  bo: 'Bạn học AI · cố tình sai trước để bạn sửa',
  tri: 'Bạn học AI · giải thích khái niệm, dùng công cụ kiểm chứng',
  linhchi: 'Bạn học AI · công thức và mẹo nhớ',
  minhkhang: 'Bạn học AI · động viên, ví dụ đời sống',
  colam: 'Giáo viên AI · chốt quy tắc cho cả lớp',
  an: 'Trợ giảng AI · gợi ý từng bước',
  assessor: 'Chấm điểm câu trả lời',
  dispatcher: 'Chọn đúng một tác nhân cho mỗi tin nhắn',
};

const TOOL_NAMES: Record<string, string> = {
  verify_vector_algebra: 'Kiểm tra phép tính vectơ',
  calculate_dot_product: 'Tính tích vô hướng',
  query_misconception_kb: 'Tra kho ngộ nhận',
  check_source_grounding: 'Đối chiếu với bài giảng',
  timeline_collision_checker: 'Kiểm tra trùng mốc thời gian',
  evaluate_bloom_level: 'Đánh giá mức độ hiểu (Bloom)',
};

export function agentKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('dispatcher')) return 'dispatcher';
  if (n.includes('assessor')) return 'assessor';
  if (n.includes('lam')) return 'colam';
  if (n.includes('trợ giảng') || n.trim() === 'an') return 'an';
  if (n.includes('linh') || n.includes('chi')) return 'linhchi';
  if (n.includes('khang')) return 'minhkhang';
  if (n.includes('trí') || n.includes('tri')) return 'tri';
  if (n.includes('bo')) return 'bo';
  return n;
}

export function agentRole(name: string): string {
  return AGENT_ROLES[agentKey(name)] ?? 'Tác nhân AI';
}

export function friendlyToolName(toolName: string): string {
  const bare = toolName.replace(/^tool_/, '');
  return TOOL_NAMES[bare] ?? bare.replace(/_/g, ' ');
}

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

// Replay data sometimes records only that a transcript exists ("Đã chép lời"), not the words.
const TRANSCRIPT_PLACEHOLDER = /^(đã chép lời|không dùng)$/i;
const isPlaceholder = (v: string) => TRANSCRIPT_PLACEHOLDER.test(v.trim());

function stringify(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string') return str(v);
  try {
    const json = JSON.stringify(v);
    return json && json !== '{}' && json !== '[]' ? json : undefined;
  } catch {
    return undefined;
  }
}

function fields(...pairs: Array<[string, string | undefined, boolean?]>): DetailField[] {
  return pairs.filter(([, v]) => Boolean(v)).map(([label, value, mono]) => ({ label, value: value as string, mono }));
}

function questionOf(turn: InspectorTurn): string | undefined {
  if (str(turn.question)) return turn.question;
  const first = turn.contextView?.visibleContext?.find((c) => /^Tin nhắn học sinh:/i.test(c));
  return first ? first.replace(/^Tin nhắn học sinh:\s*/i, '').replace(/^"|"$/g, '') : undefined;
}

export function buildAgentMapTurn(turn: InspectorTurn): AgentMapTurn {
  const question = questionOf(turn);
  const answer = str(turn.dialogue) ?? str(turn.speech);
  const lanes: Record<LaneId, MapBlock[]> = { understand: [], context: [], verify: [], answer: [] };

  const d = turn.dispatcher;
  if (d) {
    const confidence = typeof d.confidence === 'number' ? d.confidence.toFixed(2) : undefined;
    lanes.understand.push({
      id: `${turn.turnId}-dispatcher`,
      lane: 'understand',
      kind: 'dispatcher',
      title: 'Dispatcher',
      subtitle: str(d.intent) ? `Ý định: ${d.intent}` : undefined,
      metric: [confidence && `độ tin cậy ${confidence}`, typeof turn.latencyMs === 'number' && `${Math.round(turn.latencyMs)} ms`]
        .filter(Boolean)
        .join(' · ') || undefined,
      input: fields(['Tin nhắn', question]),
      output: fields(['Ý định', str(d.intent)], ['Chọn tác nhân', str(d.selectedAgent)], ['Độ tin cậy', confidence], ['Lý do', str(d.reason)]),
    });
  }

  const cv = turn.contextView;
  const contextItems: string[] = [];
  if (cv) {
    const board = str(cv.boardSnippet);
    const rawSpeech = str(cv.teacherSpeech);
    const speech = rawSpeech && !isPlaceholder(rawSpeech) ? rawSpeech : undefined;
    const rag = str(cv.ragKnowledge);
    if (board) {
      lanes.context.push({
        id: `${turn.turnId}-board`,
        lane: 'context',
        kind: 'context',
        title: turn.timestampStr ? `Bảng phấn ${turn.timestampStr}` : 'Bảng phấn',
        subtitle: board,
        input: fields(['Mốc bài giảng', turn.timestampStr]),
        output: fields(['Nội dung bảng', board, true]),
      });
    }
    if (speech) {
      lanes.context.push({
        id: `${turn.turnId}-speech`,
        lane: 'context',
        kind: 'context',
        title: 'Lời thầy giảng',
        subtitle: speech,
        input: fields(['Mốc bài giảng', turn.timestampStr]),
        output: fields(['Lời thầy', speech]),
      });
    }
    if (rag && !/^không dùng$/i.test(rag)) {
      lanes.context.push({
        id: `${turn.turnId}-rag`,
        lane: 'context',
        kind: 'context',
        title: 'Kho tri thức',
        subtitle: rag,
        input: fields(['Câu hỏi tra cứu', question]),
        output: fields(['Kết quả tra cứu', rag]),
      });
    }
    for (const c of cv.visibleContext ?? []) {
      const value = str(c);
      if (!value) continue;
      const tail = value.includes(':') ? value.slice(value.lastIndexOf(':') + 1) : '';
      if (tail && isPlaceholder(tail)) continue;
      contextItems.push(value);
    }
    if (lanes.context.length === 0 && contextItems.length > 0) {
      lanes.context.push({
        id: `${turn.turnId}-visible`,
        lane: 'context',
        kind: 'context',
        title: 'Ngữ cảnh được xem',
        subtitle: `${contextItems.length} mục`,
        input: [],
        output: contextItems.map((v, i) => ({ label: `Mục ${i + 1}`, value: v })),
      });
    }
  }

  const tools: ToolView[] = [];
  (turn.toolCalls ?? []).forEach((raw, i) => {
    const t = raw as unknown as Record<string, unknown>;
    const name = str(t.toolName);
    if (!name) return;
    const isValid = t.isValid;
    const verdict: ToolView['verdict'] = isValid === true ? 'ok' : isValid === false ? 'mismatch' : undefined;
    const summary = str(t.badgeText) ?? str(t.label);
    tools.push({ name, friendlyName: friendlyToolName(name), verdict, summary });
    lanes.verify.push({
      id: `${turn.turnId}-tool-${i}`,
      lane: 'verify',
      kind: 'tool',
      title: name,
      subtitle: friendlyToolName(name),
      metric: verdict === 'ok' ? 'kết quả khớp' : verdict === 'mismatch' ? 'kết quả không khớp' : undefined,
      tone: verdict === 'mismatch' ? 'warn' : verdict === 'ok' ? 'ok' : undefined,
      input: fields(['Tham số', stringify(t.input ?? t.args ?? t.params), true]),
      output: fields(['Kết quả', stringify(t.output ?? t.result), true], ['Tóm tắt', summary]),
    });
  });

  const a = turn.assessor;
  if (a) {
    const summary = str(a.matchedSummary) ?? str(a.verdictLabel);
    lanes.verify.push({
      id: `${turn.turnId}-assessor`,
      lane: 'verify',
      kind: 'assessor',
      title: 'Assessor',
      subtitle: summary,
      input: fields(['Câu trả lời được chấm', question]),
      output: [
        ...fields(['Kết luận', str(a.verdictLabel)]),
        ...a.matchedPoints.filter(Boolean).map((p) => ({ label: 'Đạt', value: p })),
        ...a.missingPoints.filter(Boolean).map((p) => ({ label: 'Còn thiếu', value: p })),
      ],
    });
  }

  const citations = (turn.citations ?? []).filter((c) => str(c.label));
  lanes.answer.push({
    id: `${turn.turnId}-agent`,
    lane: 'answer',
    kind: 'agent',
    title: turn.agent,
    subtitle: agentRole(turn.agent),
    metric: citations.length > 0 ? `${citations.length} trích dẫn` : undefined,
    input: fields(['Câu hỏi', question], ['Hướng suy nghĩ', str(turn.thought)]),
    output: fields(['Câu trả lời', answer]),
  });

  return {
    key: turn.turnId,
    number: turn.turnNumber,
    timeLabel: turn.timestampStr,
    question,
    agent: turn.agent,
    agentRole: agentRole(turn.agent),
    latencyMs: turn.latencyMs,
    answer,
    lanes,
    tools,
    contextItems,
    hiddenContextCount: cv?.hiddenContext?.filter((h) => str(h)).length ?? 0,
    citations,
  };
}
