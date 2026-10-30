import React from 'react';
import { ToolCallPayload, ToolResultPayload } from '../../types/reasoning';
import { Wrench, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ToolCallCardProps {
  toolCall?: ToolCallPayload;
  toolResult?: ToolResultPayload;
  compact?: boolean;
  isCompleted?: boolean;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({
  toolCall,
  toolResult,
  compact = false,
  isCompleted = false,
}) => {
  const toolName = toolCall?.toolName || toolResult?.toolName || 'tool_verify_vector_algebra';
  const hasResult = Boolean(toolResult) || (toolCall as any)?.output !== undefined || (toolCall as any)?.isValid !== undefined;
  const rawValid = (toolResult as any)?.isValid !== undefined 
    ? (toolResult as any).isValid 
    : (toolCall as any)?.isValid;
  const isValid: boolean | undefined = rawValid === null || rawValid === undefined ? undefined : Boolean(rawValid);
  const isSuccess = isValid === true || toolResult?.status === 'success';

  const cleanLatex = (str: string) => {
    return str
      .replace(/[\u000b\x0B]ec/g, '\\vec')
      .replace(/[\u000b\x0B]/g, '\\vec')
      .replace(/\\Bec/g, '\\vec')
      .replace(/Bec\{/g, '\\vec{');
  };

  const renderArgs = () => {
    if (!toolCall?.args) return null;
    const entries = Object.entries(toolCall.args);
    if (entries.length === 0) return <span className="text-stone-400 italic">Không có tham số</span>;

    return entries.map(([key, val]) => {
      const rawStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      const displayStr = cleanLatex(rawStr);
      return (
        <span
          key={key}
          className="inline-block bg-stone-100 text-stone-800 text-[11px] px-2 py-0.5 rounded-md border border-stone-200 mr-1.5 mb-1 font-mono"
        >
          <span className="font-semibold text-stone-900">{key}:</span> {displayStr}
        </span>
      );
    });
  };

  return (
    <div
      className={`rounded-2xl border bg-white shadow-2xs transition-all ${
        compact ? 'p-2.5 text-xs' : 'p-3.5 text-sm'
      } ${
        hasResult
          ? isSuccess
            ? 'border-[#E2EAD2]'
            : 'border-rose-200 bg-rose-50/30'
          : isCompleted
            ? 'border-[#E2EAD2]'
            : 'border-stone-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 font-semibold text-[#121712] font-mono text-xs">
          <Wrench className="w-4 h-4 text-stone-700" />
          <span>{toolName}</span>
        </div>

        {hasResult ? (
          isValid === true ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hợp lệ (isValid: true)</span>
            </span>
          ) : isValid === false ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Bác bỏ (isValid: false)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
              <span>Chưa xác định</span>
            </span>
          )
        ) : isCompleted ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã hoàn tất</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>Đang gọi công cụ...</span>
          </span>
        )}
      </div>

      {toolCall?.args && (
        <div className="mt-2 pt-2 border-t border-stone-100">
          <div className="text-xs text-stone-600 font-medium mb-1">Tham số đầu vào:</div>
          <div className="flex flex-wrap">{renderArgs()}</div>
        </div>
      )}

      {toolResult?.error && (
        <div className="mt-2 p-2 rounded-xl bg-rose-50 text-rose-800 text-xs font-mono border border-rose-200">
          <strong>Lỗi:</strong> {toolResult.error}
        </div>
      )}

      {Boolean(toolResult?.result) && !compact && toolResult && (
        <div className="mt-2 p-2.5 rounded-xl bg-[#F8FAF4] text-stone-800 text-xs font-mono max-h-32 overflow-y-auto border border-[#E2EAD2]">
          {cleanLatex(
            typeof toolResult.result === 'object'
              ? JSON.stringify(toolResult.result, null, 2)
              : String(toolResult.result)
          )}
        </div>
      )}
    </div>
  );
};
