import React from 'react';
import { ReasoningEvent, ToolResultPayload } from '../../types/reasoning';
import { AgentAvatar } from './AgentAvatar';
import { ToolCallCard } from './ToolCallCard';
import { Scale, Brain, MessageSquare, CheckCircle2, Wrench } from 'lucide-react';

interface EventRowProps {
  event: ReasoningEvent;
  isLast?: boolean;
  baseTimestamp?: number;
  index?: number;
  matchedToolResult?: ToolResultPayload;
  isDone?: boolean;
}

export const EventRow: React.FC<EventRowProps> = ({
  event,
  isLast = false,
  baseTimestamp,
  index,
  matchedToolResult,
  isDone = false,
}) => {
  // Hiển thị thời gian delta chuẩn dạng +mm:ss so với event đầu tiên (+00:00, +00:02, +00:05...)
  let relSec = 0;
  if (baseTimestamp && event.timestamp) {
    const baseMs = typeof baseTimestamp === 'number' ? baseTimestamp : new Date(baseTimestamp).getTime();
    const evtMs = typeof event.timestamp === 'number' ? event.timestamp : new Date(event.timestamp).getTime();
    if (!isNaN(baseMs) && !isNaN(evtMs)) {
      relSec = Math.max(0, Math.round((evtMs - baseMs) / 1000));
    }
  } else if (index !== undefined) {
    relSec = index * 2;
  }
  const m = Math.floor(relSec / 60);
  const s = relSec % 60;
  const timeFormatted = `+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const renderTimelineNode = (icon: React.ReactNode, ringColor: string = 'bg-white border-2 border-stone-300') => (
    <div className="relative flex flex-col items-center mr-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xs z-10 ${ringColor}`}>
        {icon}
      </div>
      {!isLast && <div className="w-0.5 grow bg-stone-200 -my-1" />}
    </div>
  );

  switch (event.eventType) {
    case 'cross_check_verdict': {
      const cc = event.crossCheck;
      let isAgree = false;
      let isDisagree = false;
      if (cc?.verdict) {
        isAgree = cc.verdict === 'agree';
        isDisagree = cc.verdict === 'disagree';
      } else {
        // No structured crossCheck: use an explicit metadata verdict, then a
        // leading verdict phrase. Anything else stays "unknown" (neutral badge)
        // instead of being inferred as agreement or rejection.
        const metaVerdict = (event.metadata?.verdict as string) || '';
        const text = (event.content || '').trim();
        if (metaVerdict === 'agree' || /^(chấp nhận|đồng ý|đồng thuận)/i.test(text)) {
          isAgree = true;
        } else if (
          metaVerdict === 'disagree' ||
          /^(bác|từ chối|không đồng ý|chưa đồng thuận)/i.test(text)
        ) {
          isDisagree = true;
        }
      }
      return (
        <div className="flex items-stretch my-3">
          {renderTimelineNode(
            <Scale className="w-4 h-4 text-[#EA580C]" />,
            'bg-[#FFF7ED] border-2 border-[#FED7AA]'
          )}
          <div className="flex-1 bg-white border-2 border-[#EA580C] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs uppercase tracking-wider text-[#9A3412]">
                  Phán quyết phản biện chéo (Cross-check)
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-wide border-2 shadow-xs ${
                    isDisagree
                      ? 'bg-[#991B1B] text-white border-[#7F1D1D]'
                      : isAgree
                        ? 'bg-[#065F46] text-white border-[#064E3B]'
                        : 'bg-stone-800 text-white border-stone-900'
                  }`}
                >
                  {isDisagree ? 'Bác bỏ / Chưa đồng thuận' : isAgree ? 'Đồng thuận' : 'Phán quyết phản biện'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-stone-700">{timeFormatted}</span>
            </div>

            <div className="flex items-start gap-3">
              <AgentAvatar name={event.agent} state="speaking" size="sm" showLabel={false} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-extrabold text-[#121712]">{event.agent}</span>
                  <span className="text-stone-600 font-medium">phản biện ý kiến của</span>
                  <span className="font-extrabold text-[#121712]">{cc?.targetAgent || '—'}</span>
                  {cc?.confidence && (
                    <span className="text-stone-700 font-mono font-bold ml-auto bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                      Độ tin cậy: {(cc.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FED7AA] text-sm text-stone-950 font-bold leading-relaxed font-sans shadow-2xs">
                  "{cc?.critique || event.content}"
                </div>

                {cc?.counterProposal && (
                  <div className="text-xs text-stone-900 bg-[#F8FAF4] p-3 rounded-xl border border-[#E2EAD2]">
                    <span className="font-bold text-[#121712]">Đề xuất phương án:</span>{' '}
                    {cc.counterProposal}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'tool_call':
      return (
        <div className="flex items-stretch my-2.5">
          {renderTimelineNode(
            <Wrench className="w-4 h-4 text-stone-700" />,
            'bg-stone-100 border-2 border-stone-300'
          )}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <AgentAvatar name={event.agent} state="tool_calling" size="sm" showLabel={false} />
              <span className="text-xs font-bold text-[#121712]">
                {event.agent} <span className="font-normal text-stone-600">kích hoạt công cụ:</span>
              </span>
              <span className="text-xs text-stone-500 font-mono ml-auto">{timeFormatted}</span>
            </div>
            <ToolCallCard
              toolCall={event.toolCall}
              toolResult={matchedToolResult || event.toolResult}
              isCompleted={Boolean(matchedToolResult || isDone)}
            />
          </div>
        </div>
      );

    case 'tool_result':
      return (
        <div className="flex items-stretch my-2.5">
          {renderTimelineNode(
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
            'bg-emerald-50 border-2 border-emerald-200'
          )}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <AgentAvatar name={event.agent} state="tool_calling" size="sm" showLabel={false} />
              <span className="text-xs font-semibold text-stone-700">
                Kết quả trả về cho tác tử <strong className="text-[#121712]">{event.agent}</strong>:
              </span>
              <span className="text-xs text-stone-500 font-mono ml-auto">{timeFormatted}</span>
            </div>
            <ToolCallCard toolCall={event.toolCall} toolResult={event.toolResult} />
          </div>
        </div>
      );

    case 'thinking':
      return (
        <div className="flex items-stretch my-2.5">
          {renderTimelineNode(
            <Brain className="w-4 h-4 text-stone-600" />,
            'bg-stone-50 border-2 border-stone-300'
          )}
          <div className="flex-1 p-3.5 rounded-2xl bg-[#FBFBFA] border border-stone-200 text-xs shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2">
              <AgentAvatar name={event.agent} state="thinking" size="sm" showLabel={false} />
              <span className="font-bold text-[#121712]">{event.agent}</span>
              <span className="text-stone-500 italic">đang suy luận nội tâm...</span>
              <span className="text-xs text-stone-500 font-mono ml-auto">{timeFormatted}</span>
            </div>
            <p className="text-stone-700 italic pl-9 whitespace-pre-wrap leading-relaxed font-sans text-sm">
              "{event.content}"
            </p>
          </div>
        </div>
      );

    case 'speaking':
      return (
        <div className="flex items-stretch my-2.5">
          {renderTimelineNode(
            <MessageSquare className="w-4 h-4 text-[#121712]" />,
            'bg-[#F3F8E8] border-2 border-[#E2EAD2]'
          )}
          <div className="flex-1 p-4 rounded-2xl bg-white border border-[#E2EAD2] shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <AgentAvatar name={event.agent} state="speaking" size="sm" showLabel={false} />
              <span className="font-bold text-sm text-[#121712]">{event.agent}</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F3F8E8] text-[#121712] font-semibold border border-[#E2EAD2]">
                Phát biểu
              </span>
              <span className="text-xs text-stone-500 font-mono ml-auto">{timeFormatted}</span>
            </div>
            <p className="text-stone-900 text-sm leading-relaxed pl-9 whitespace-pre-wrap font-sans font-medium">
              {event.content}
            </p>
          </div>
        </div>
      );

    case 'done':
      return (
        <div className="flex items-stretch my-3">
          {renderTimelineNode(
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
            'bg-emerald-100 border-2 border-emerald-300'
          )}
          <div className="flex-1 p-4 rounded-2xl bg-[#F3F8E8] border border-[#E2EAD2] flex items-center justify-between text-[#121712] shadow-2xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#121712]">
                  Hoàn thành phiên suy luận đa tác tử
                </div>
                <div className="text-xs text-stone-600">
                  Tất cả các tác tử đã đạt được đồng thuận sư phạm và xếp hạng Tháp Bloom
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-stone-700 bg-white px-2.5 py-1 rounded-full border border-stone-200">
              {timeFormatted}
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
};
