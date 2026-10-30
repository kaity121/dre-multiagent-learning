// File: src/components/RoundtableStreamConsole.tsx
/**
 * RoundtableStreamConsole.tsx
 *
 * Real-time Observability & War Room Console for Multi-Agent Roundtable Stream (#302)
 * Visualizes:
 * - Live SSE Agent Reasoning Stream (System 1 vs System 2 Debate)
 * - Deterministic Tool execution badges (Vector Algebra, Misconception KB, Bloom Evaluator)
 * - Highlighted Cross-Check WOW Moment (Trí rejects Bo's flawed proposal -> Bo corrects -> Consensus)
 * - Approved Lesson Package / Checkpoint Preview
 * - Playback Speed Controls (1x, 2x, 5x, 10x) and Saved Runs Selector
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRoundtableStream } from '../hooks/useRoundtableStream';
import { AgentReasoningEvent, AgentRole } from '../types/pipeline';

interface Props {
  className?: string;
  onClose?: () => void;
}

const AGENT_CONFIG: Record<
  AgentRole,
  { name: string; title: string; color: string; bg: string; border: string; icon: string }
> = {
  bo: {
    name: 'Bo',
    title: 'Hệ 1 - Trực giác',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    icon: '⚡',
  },
  tri: {
    name: 'Trí',
    title: 'Hệ 2 - Logic',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    icon: '🧠',
  },
  linhchi: {
    name: 'Linh Chi',
    title: 'Thư ký sư phạm',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-300',
    icon: '📒',
  },
  minhkhang: {
    name: 'Minh Khang',
    title: 'Trực quan đời sống',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    icon: '🧭',
  },
  colam: {
    name: 'Cô Lam',
    title: 'Director',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-300',
    icon: '👩‍🏫',
  },
  an: {
    name: 'An (TA)',
    title: 'Trợ giảng',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    icon: '🎓',
  },
  assessor: {
    name: 'Assessor',
    title: 'Thẩm định',
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    icon: '⚖️',
  },
};

const EVENT_TYPE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  thought: { label: 'Suy nghĩ ngầm', bg: 'bg-gray-100', text: 'text-gray-700' },
  debate_turn: { label: 'Đối thoại bàn tròn', bg: 'bg-amber-100', text: 'text-amber-800' },
  tool_call: { label: 'Kích hoạt Tool', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  tool_result: { label: 'Kết quả Tool', bg: 'bg-cyan-100', text: 'text-cyan-800' },
  cross_check_verdict: { label: 'Phán quyết Rà soát chéo', bg: 'bg-purple-100', text: 'text-purple-800' },
  checkpoint_created: { label: 'Phê duyệt Checkpoint', bg: 'bg-emerald-100', text: 'text-emerald-800' },
};

const PROVENANCE_LABEL: Record<string, string> = {
  live: 'LIVE',
  replay: 'REPLAY',
  fallback_fixture: 'OFFLINE FIXTURE (không phải LIVE)',
  pending_live: 'LIVE · đang kết nối',
  pending_replay: 'REPLAY · đang kết nối',
};

const GENERATION_LABEL: Record<string, string> = {
  llm: 'Sinh bằng model',
  mixed: 'Model + dự phòng tất định',
  deterministic: 'Kịch bản tất định',
  deterministic_fallback: 'Dự phòng tất định (không gọi được model)',
};

const APPROVAL_LABEL: Record<string, string> = {
  draft: 'Bản nháp — chờ giáo viên duyệt',
  under_review: 'Đang được giáo viên xem xét',
  approved: 'Giáo viên đã duyệt',
};

const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

export const RoundtableStreamConsole: React.FC<Props> = ({ className = '', onClose }) => {
  const [selectedRunId, setSelectedRunId] = useState<string>('fixture');
  const [activeTab, setActiveTab] = useState<'stream' | 'lesson'>('stream');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const {
    events,
    currentEvent,
    lesson,
    approval,
    generation,
    status,
    error,
    mode,
    provenance,
    runId,
    speed,
    runs,
    crossCheckCorrectionOccurred,
    stats,
    startStream,
    stopStream,
    reset,
    setSpeed,
    refreshRuns,
  } = useRoundtableStream({
    defaultSpeed: 1,
    defaultPartNumber: 3,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const handleStartReplay = () => {
    startStream({
      mode: 'replay',
      runId: selectedRunId,
      fixture: selectedRunId === 'fixture',
      speed,
    });
  };

  const handleStartLive = () => {
    startStream({
      mode: 'live',
      partNumber: 3,
      streamDelayMs: 25,
      speed,
    });
  };

  return (
    <div
      className={`flex flex-col bg-[#FAF7F0] border border-[#DDD3C4] rounded-2xl shadow-xl overflow-hidden font-sans ${className}`}
      style={{ maxHeight: '90vh' }}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-b border-[#E8DEC8] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shadow-xs">
            📡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">Roundtable Stream Console</h2>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                  status === 'streaming'
                    ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                    : status === 'connecting'
                    ? 'bg-amber-100 text-amber-800'
                    : status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : status === 'error'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {status === 'streaming'
                  ? 'Đang phát sóng'
                  : status === 'connecting'
                  ? 'Đang kết nối'
                  : status === 'completed'
                  ? 'Hoàn thành'
                  : status === 'error'
                  ? 'Lỗi'
                  : 'Sẵn sàng'}
              </span>
              <span
                className={`text-xs font-mono ${provenance === 'fallback_fixture' ? 'text-rose-700 font-semibold' : 'text-slate-500'}`}
                title={provenance ? `Yêu cầu: ${mode.toUpperCase()} · Nguồn thực tế: ${provenance}` : `Yêu cầu: ${mode.toUpperCase()}`}
              >
                [{PROVENANCE_LABEL[provenance ?? (mode === 'live' ? 'pending_live' : 'pending_replay')]}{runId ? `: ${runId}` : ''}]
              </span>
              {generation && (
                <span className="text-xs font-mono text-slate-500" title={generation.fallbackReason || undefined}>
                  [{GENERATION_LABEL[generation.mode]}]
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Quan sát dòng suy nghĩ & rà soát chéo giữa các AI Peers trong phòng họp bàn tròn
            </p>
          </div>
        </div>

        {/* Speed & Actions Controls */}
        <div className="flex items-center gap-2">
          {/* Speed selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  speed === s
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Run source picker */}
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            disabled={status === 'streaming'}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 max-w-[200px] truncate"
          >
            <option value="fixture">⭐ Mock Fixture (Part 3 WOW)</option>
            {runs
              .filter((r) => r.runId !== 'fixture')
              .map((r) => (
                <option key={r.runId} value={r.runId}>
                  {r.title} ({r.totalEvents} evts)
                </option>
              ))}
          </select>

          {/* Action buttons */}
          {status === 'streaming' ? (
            <button
              onClick={stopStream}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>⏹</span> Dừng
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleStartReplay}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>▶</span> Replay Run
              </button>
              <button
                onClick={handleStartLive}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>⚡</span> Chạy Live
              </button>
            </div>
          )}

          <button
            onClick={reset}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            title="Đặt lại"
          >
            🔄
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-lg leading-none transition-all ml-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI / Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 bg-[#F4EFE6] border-b border-[#E8DEC8]">
        <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-[#DDD3C4]/70">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Tổng sự kiện (Events)
          </div>
          <div className="text-xl font-bold text-slate-800">{stats.totalEvents}</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-[#DDD3C4]/70">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Deterministic Tools
          </div>
          <div className="text-xl font-bold text-indigo-700">{stats.toolCallsCount} lượt gọi</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-[#DDD3C4]/70">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Chuẩn nhận thức Bloom
          </div>
          <div className="text-xl font-bold text-teal-700">{stats.bloomLevel}</div>
        </div>

        <div
          className={`p-2.5 rounded-xl border transition-all ${
            crossCheckCorrectionOccurred
              ? 'bg-amber-100/90 border-amber-300 text-amber-900 shadow-2xs'
              : 'bg-white/80 border-[#DDD3C4]/70 text-slate-400'
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wide flex items-center gap-1">
            <span>✨</span> Cross-Check WOW
          </div>
          <div className="text-sm font-bold truncate">
            {crossCheckCorrectionOccurred ? 'Đã kích hoạt & Sửa sai' : 'Chưa diễn ra'}
          </div>
        </div>
      </div>

      {/* 3. Cross-Check WOW Moment Alert Banner */}
      {crossCheckCorrectionOccurred && (
        <div className="mx-6 mt-3 p-3 bg-amber-500/10 border border-amber-400/50 rounded-xl flex items-start gap-3">
          <div className="text-2xl">⚡</div>
          <div className="text-xs text-amber-900">
            <span className="font-bold uppercase tracking-wider block mb-0.5">
              Khoảnh khắc Cross-Check WOW (Trí Hệ 2 rà soát Bo Hệ 1):
            </span>
            Trí đã sử dụng tool toạ độ không gian <code>tool_verify_vector_algebra</code> phát hiện đề xuất sai phi thực tế
            của Bo (claim 'AB'), bác bỏ kịp thời. Sau đó Bo tự chỉnh sửa lại thành bẫy tự nhiên '2a' và được Trí đồng thuận!
          </div>
        </div>
      )}

      {/* 4. Tab Selector */}
      <div className="flex items-center px-6 pt-3 border-b border-[#E8DEC8] gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('stream')}
          className={`pb-2 transition-all relative ${
            activeTab === 'stream'
              ? 'text-amber-700 font-bold border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Dòng suy nghĩ Reasoning Stream ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('lesson')}
          className={`pb-2 transition-all relative ${
            activeTab === 'lesson'
              ? 'text-amber-700 font-bold border-b-2 border-amber-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Kịch bản Checkpoint được duyệt {lesson ? '✅' : ''}
        </button>

        <div className="ml-auto flex items-center gap-2 pb-2">
          <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded-xs text-amber-600 focus:ring-0"
            />
            Tự động cuộn
          </label>
        </div>
      </div>

      {/* 5. Main Content Area */}
      <div className="flex-1 overflow-hidden p-6">
        {activeTab === 'stream' ? (
          <div
            ref={scrollRef}
            className="h-[460px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-amber-300"
          >
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <div className="text-4xl opacity-50">💬</div>
                <p className="text-sm font-medium">Chưa có sự kiện nào. Hãy nhấn "Replay Run" hoặc "Chạy Live" để bắt đầu.</p>
              </div>
            ) : (
              events.map((evt) => {
                const agent = AGENT_CONFIG[evt.agentId] || AGENT_CONFIG.bo;
                const badge = EVENT_TYPE_BADGES[evt.eventType] || {
                  label: evt.eventType,
                  bg: 'bg-slate-100',
                  text: 'text-slate-700',
                };
                const isWowVerdict = evt.eventType === 'cross_check_verdict';

                return (
                  <div
                    key={evt.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isWowVerdict
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
                        : `${agent.bg} ${agent.border}`
                    }`}
                  >
                    {/* Top Row: Avatar icon + Name + Badge + Timestamp */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{agent.icon}</span>
                        <div>
                          <span className={`text-xs font-bold ${agent.color}`}>
                            {evt.agentDisplayName || agent.name}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                            ({agent.title})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        {evt.secondTarget !== undefined && (
                          <span className="text-[10px] font-mono bg-white/70 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                            {Math.floor(evt.secondTarget / 60)}:
                            {(evt.secondTarget % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content text */}
                    <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap pl-6">
                      {evt.content}
                    </div>

                    {/* Tool Call Box */}
                    {evt.toolCall && (
                      <div className="mt-2.5 ml-6 p-2.5 bg-white/90 rounded-lg border border-slate-200 text-[11px] font-mono space-y-1">
                        <div className="flex items-center justify-between text-indigo-700 font-bold">
                          <span>🔧 {evt.toolCall.toolName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              evt.toolCall.isValid === true
                                ? 'bg-emerald-100 text-emerald-800'
                                : evt.toolCall.isValid === false
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {evt.toolCall.isValid === true
                              ? 'VALID ✓'
                              : evt.toolCall.isValid === false
                              ? 'REJECTED ✗'
                              : 'EXECUTED'}
                          </span>
                        </div>
                        {evt.toolCall.input && (
                          <div className="text-slate-600 truncate">
                            <span className="text-slate-400">Input:</span> {JSON.stringify(evt.toolCall.input)}
                          </div>
                        )}
                        {evt.toolCall.output && (
                          <div className="text-slate-700 truncate">
                            <span className="text-slate-400">Output:</span> {JSON.stringify(evt.toolCall.output)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Checkpoint Preview Tab */
          <div className="h-[460px] overflow-y-auto space-y-4 pr-2">
            {!lesson ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <div className="text-4xl opacity-50">📋</div>
                <p className="text-sm">Chưa có bản nháp kịch bản. Hãy chạy stream hoàn tất.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      {APPROVAL_LABEL[lesson.status] || lesson.status}
                      {approval && !approval.approvedByTeacher ? ' · chưa phê duyệt' : ''}
                    </span>
                    <span className="text-xs font-mono bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      {lesson.lesson_id} · v{lesson.version}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{lesson.title}</h3>
                </div>

                {lesson.parts.map((part) => (
                  <div key={part.part_id} className="space-y-3">
                    <div className="text-xs font-bold text-slate-600">
                      {part.concept} ({formatClock(part.start_s)} – {formatClock(part.end_s)})
                    </div>

                    {part.pause_questions.map((q) => (
                      <div key={q.question_id} className="p-4 bg-white rounded-xl border border-[#DDD3C4] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Checkpoint{q.misconception_id ? ` · ${q.misconception_id}` : ''}
                          </span>
                          <span className="text-xs font-mono text-slate-500">Tại {formatClock(q.at_s)}</span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800">{q.question}</div>

                        {q.blackboard_formula && (
                          <div className="p-2 bg-slate-900 text-amber-300 font-mono text-xs rounded-md">
                            Công thức bảng: {q.blackboard_formula}
                          </div>
                        )}

                        <div className="space-y-1.5 pt-1">
                          {q.options.map((opt) => (
                            <div
                              key={opt.option_id}
                              className={`p-2.5 rounded-lg border text-xs ${
                                opt.is_correct
                                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{opt.text}</span>
                                {opt.is_correct && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    ĐÁP ÁN ĐÚNG
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <p className="text-[11px] text-slate-500 pl-2 border-l-2 border-slate-300">{q.explanation}</p>
                        )}
                      </div>
                    ))}

                    {part.scenarios
                      .filter((sc) => sc.interaction_type === 'bo_trap_bait' || sc.interaction_type === 'scaffold_hint')
                      .map((sc) => (
                        <div
                          key={sc.scenario_id}
                          className={`p-2.5 rounded-lg text-xs border ${
                            sc.actor_id === 'bo'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-pink-50/80 border-pink-200 text-pink-950'
                          }`}
                        >
                          <span className="font-bold">{sc.actor_id === 'bo' ? 'Bo thách đố:' : 'Linh Chi gợi ý:'}</span> {sc.question}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Footer status bar */}
      <div className="px-6 py-2.5 bg-[#F4EFE6] border-t border-[#E8DEC8] flex items-center justify-between text-xs text-slate-500">
        <div>
          {status === 'streaming' && currentEvent ? (
            <span className="truncate max-w-md block">
              <span className="font-bold text-amber-700">{currentEvent.agentDisplayName}:</span>{' '}
              {currentEvent.content}
            </span>
          ) : status === 'completed' ? (
            <span className="text-emerald-700 font-medium">
              Đã hoàn tất phiên họp bàn tròn Roundtable. Bản nháp kịch bản đang chờ giáo viên duyệt.
            </span>
          ) : error ? (
            <span className="text-rose-700 font-medium">Lỗi: {error}</span>
          ) : (
            <span>Sẵn sàng kết nối.</span>
          )}
        </div>

        <div className="font-mono text-[11px]">
          DRE AISDLC Pipeline Contract: <code>src/types/pipeline.ts</code>
        </div>
      </div>
    </div>
  );
};

export default RoundtableStreamConsole;
