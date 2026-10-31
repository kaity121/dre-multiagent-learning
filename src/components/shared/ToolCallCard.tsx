import React, { useId, useState } from 'react';
import { ReasoningEvent } from '../../types/reasoning';
import { Wrench, Check, X, ChevronDown } from 'lucide-react';
import { formatDuration, summarizeArgs, summarizeResult } from '../warroom/reasoningLogModel';

interface ToolCallCardProps {
  /** The tool_call event; null when only a result arrived. */
  call: ReasoningEvent | null;
  /** The tool_result event answering the call, once it arrived. */
  result: ReasoningEvent | null;
  /** True while the run is still going and no result has arrived. */
  pending: boolean;
}

/** Compact tool call: name, input summary, result line and duration; raw JSON on demand. */
export const ToolCallCard: React.FC<ToolCallCardProps> = ({ call, result, pending }) => {
  const [open, setOpen] = useState(false);
  const rawId = useId();
  const toolName = call?.toolCall?.toolName || result?.toolResult?.toolName || result?.toolCall?.toolName || 'unknown_tool';
  const args = call?.toolCall?.args ?? result?.toolCall?.args;
  const input = summarizeArgs(args);
  const output = summarizeResult(result);
  const isValid = result?.toolResult?.isValid;
  const failed = result?.toolResult?.status === 'failure' && isValid !== false;
  const duration = call && result ? formatDuration(result.timestamp - call.timestamp) : '';
  const purpose = call?.content?.trim();

  const raw = {
    toolName,
    input: args ?? null,
    output: result?.toolResult?.result ?? null,
    ...(isValid !== undefined && isValid !== null ? { isValid } : {}),
    ...(result?.toolResult?.error ? { error: result.toolResult.error } : {}),
  };

  let status: React.ReactNode;
  if (!result) {
    status = pending ? (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A5546]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4A5546] motion-safe:animate-pulse" aria-hidden="true" />
        Đang chạy
      </span>
    ) : (
      <span className="text-xs font-semibold text-[#5B6657]">Không có kết quả</span>
    );
  } else if (isValid === true) {
    status = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border border-[#B7DB6A] bg-[#F7FBEF] text-[#1F4D12]">
        <Check className="w-3 h-3" aria-hidden="true" /> Hợp lệ
      </span>
    );
  } else if (isValid === false) {
    status = (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#121712] text-white">
        <X className="w-3 h-3" aria-hidden="true" /> Không hợp lệ
      </span>
    );
  } else if (failed) {
    status = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3D4739]">
        <X className="w-3 h-3" aria-hidden="true" /> Lỗi
      </span>
    );
  } else {
    status = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F7A3B]">
        <Check className="w-3 h-3" aria-hidden="true" /> Xong
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-[#E2EAD2] bg-white">
      <div className="px-3 py-2.5 space-y-1">
        <div className="flex items-center gap-2 min-w-0">
          <Wrench className="w-3.5 h-3.5 text-[#4A5546] shrink-0" aria-hidden="true" />
          <span className="font-mono text-[13px] font-semibold text-[#121712] truncate">{toolName}</span>
          <span className="ml-auto flex items-center gap-2 shrink-0">
            {status}
            {duration && <span className="font-mono text-[11px] text-[#5B6657] tabular-nums">{duration}</span>}
          </span>
        </div>
        {purpose && <p className="text-[13px] leading-snug text-[#3D4739]">{purpose}</p>}
        {input && (
          <p className="text-xs text-[#4A5546] truncate" title={input}>
            <span className="font-semibold">Vào</span> <span className="font-mono">{input}</span>
          </p>
        )}
        {output && (
          <p className="text-[13px] leading-snug text-[#121712]">
            <span className="text-xs font-semibold text-[#4A5546]">Ra</span> {output}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={rawId}
        className="w-full flex items-center gap-1 px-3 py-1.5 border-t border-[#E2EAD2] text-xs font-semibold text-[#4A5546] hover:bg-[#F7FAF0] hover:text-[#121712] rounded-b-xl cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#121712] focus-visible:-outline-offset-2"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        {open ? 'Ẩn JSON gốc' : 'Xem JSON gốc'}
      </button>
      {open && (
        <pre
          id={rawId}
          className="mx-3 mb-3 p-2.5 rounded-lg bg-[#F7FAF0] border border-[#E2EAD2] text-[11px] leading-relaxed text-[#3D4739] font-mono max-h-64 overflow-auto whitespace-pre-wrap break-words"
        >
          {JSON.stringify(raw, null, 2)}
        </pre>
      )}
    </div>
  );
};
