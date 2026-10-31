// The lesson as one metro line: seven stops from "Xem bài" to "Dạy lại Bo".
// Vertical rail on desktop, compact horizontal strip on small screens.
import React from 'react';
import { ArrowLeftRight, Check } from 'lucide-react';
import type { JourneyStop, JourneyStopId, JourneySubStation } from './journeyModel';

export interface JourneyRailProps {
  stops: JourneyStop[];
  /** Stops with an entry here are clickable; everything else is shown disabled with a reason. */
  actions: Partial<Record<JourneyStopId, { run: () => void; hint: string }>>;
}

const PASSED_LINE = 'bg-[#1F5E3A]';
const FUTURE_LINE = 'bg-[#DCE5CB]';

function disabledReason(stop: JourneyStop): string {
  if (stop.status === 'current') return 'Bạn đang ở bước này';
  if (stop.status === 'done') return 'Bước này đã xong';
  if (stop.status === 'waiting') return 'Câu hỏi đang chờ bạn trong khung chat';
  if (stop.status === 'open') return stop.subStations ? 'Bạn chưa làm xong bước này' : 'Bước này ở Trạm 1, bạn chưa làm';
  return 'Mở khi bạn đi tới bước này';
}

const subStationLabel = (s: JourneySubStation) => `Trạm ${s.number} ${s.name}: ${s.statusText}`;

/** Small dots under a grouped stop, one per station it covers. */
const SubStationDots: React.FC<{ subStations: JourneySubStation[] }> = ({ subStations }) => (
  <ul aria-label="Các trạm trong bước này" className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[52px]">
    {subStations.map((s) => (
      <li key={s.id} className="flex items-center gap-1.5 text-[12px] leading-tight text-[#4A5546]" title={subStationLabel(s)}>
        <span
          aria-hidden="true"
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
            s.status === 'done'
              ? 'bg-[#1F5E3A] text-white'
              : s.status === 'current'
                ? 'bg-[#C8F169] ring-[3px] ring-[#C8F169]/40'
                : 'border-2 border-[#C9D4B6] bg-white'
          }`}
        >
          {s.status === 'done' && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
          {s.status === 'current' && <span className="h-1.5 w-1.5 rounded-full bg-[#121712]" />}
        </span>
        <span aria-hidden="true" className={s.status === 'current' ? 'font-semibold text-[#121712]' : undefined}>
          Trạm {s.number}
        </span>
        <span className="sr-only">{subStationLabel(s)}</span>
      </li>
    ))}
  </ul>
);

const StopDot: React.FC<{ stop: JourneyStop; compact?: boolean }> = ({ stop, compact }) => {
  const size = compact ? 'h-7 w-7' : 'h-10 w-10';
  const icon = compact ? 'h-3.5 w-3.5' : 'h-5 w-5';
  if (stop.status === 'current') {
    return (
      <span className={`relative flex ${size} shrink-0 items-center justify-center rounded-full bg-[#C8F169] ring-[6px] ring-[#C8F169]/35`}>
        {stop.isInterchange ? (
          <ArrowLeftRight className={`${icon} text-[#121712]`} aria-hidden="true" />
        ) : (
          <span className={`${compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} rounded-full bg-[#121712]`} />
        )}
      </span>
    );
  }
  if (stop.status === 'done') {
    return (
      <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-[#1F5E3A] text-white`}>
        {stop.isInterchange ? <ArrowLeftRight className={icon} aria-hidden="true" /> : <Check className={icon} strokeWidth={3} aria-hidden="true" />}
      </span>
    );
  }
  if (stop.status === 'waiting') {
    return (
      <span className={`flex ${size} shrink-0 items-center justify-center rounded-full border-[3px] border-[#121712] bg-white`}>
        <span className="h-2 w-2 rounded-full bg-[#121712]" />
      </span>
    );
  }
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full border-[3px] border-[#C9D4B6] bg-white`}>
      {stop.isInterchange && <ArrowLeftRight className={`${icon} text-[#8C9A80]`} aria-hidden="true" />}
    </span>
  );
};

export const JourneyRail: React.FC<JourneyRailProps> = ({ stops, actions }) => {
  const currentIndex = stops.findIndex((s) => s.status === 'current');
  const current = stops[currentIndex] ?? stops.find((s) => s.status === 'waiting');
  // A segment is filled only when both of its ends have been travelled.
  const segmentPassed = (i: number) =>
    stops[i].status === 'done' && (stops[i + 1].status === 'done' || stops[i + 1].status === 'current');

  const renderStop = (stop: JourneyStop, compact: boolean) => {
    const action = actions[stop.id];
    const enabled = Boolean(action) && stop.status !== 'current';
    const title = enabled ? action!.hint : disabledReason(stop);
    const subText = stop.subStations?.length ? ` (${stop.subStations.map(subStationLabel).join('; ')})` : '';
    const label = `${stop.label}: ${stop.statusText}${subText}`;

    const content = compact ? (
      <StopDot stop={stop} compact />
    ) : (
      <>
        <StopDot stop={stop} />
        <span className="min-w-0 pt-0.5">
          <span className="block text-[15px] font-bold leading-tight text-[#121712]">{stop.label}</span>
          <span
            className={`mt-1 inline-block whitespace-nowrap text-[13px] leading-tight ${
              stop.status === 'current'
                ? 'rounded-md bg-[#EAF6CF] px-1.5 py-0.5 font-semibold text-[#1F4D12]'
                : stop.status === 'done'
                  ? 'text-[#3F5A3C]'
                  : 'text-[#5B6657]'
            }`}
          >
            {stop.statusText}
          </span>
        </span>
      </>
    );

    const shared = compact
      ? 'relative z-10 flex items-center justify-center rounded-full'
      : 'relative z-10 flex w-full items-start gap-3 rounded-xl py-1 pr-1 text-left';

    return enabled ? (
      <button
        type="button"
        onClick={action!.run}
        title={title}
        aria-label={`${label}. ${action!.hint}`}
        aria-current={stop.status === 'current' ? 'step' : undefined}
        className={`${shared} cursor-pointer transition-transform hover:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]`}
      >
        {content}
      </button>
    ) : (
      // aria-disabled (not disabled) keeps the reason reachable by keyboard and hover.
      <button
        type="button"
        aria-disabled="true"
        title={title}
        aria-label={`${label}. ${title}`}
        aria-current={stop.status === 'current' ? 'step' : undefined}
        className={`${shared} cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]`}
      >
        {content}
      </button>
    );
  };

  return (
    <nav aria-label="Hành trình bài học" className="w-full">
      {/* Desktop: vertical metro line */}
      <ol className="hidden lg:flex lg:flex-col">
        {stops.map((stop, i) => (
          <li key={stop.id} className="relative pb-9 last:pb-0">
            {i < stops.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-[18px] top-10 h-[calc(100%-40px)] w-1 rounded-full ${segmentPassed(i) ? PASSED_LINE : FUTURE_LINE}`}
              />
            )}
            {renderStop(stop, false)}
            {stop.subStations && <SubStationDots subStations={stop.subStations} />}
          </li>
        ))}
      </ol>

      {/* Small screens: horizontal strip plus the current step spelled out */}
      <div className="lg:hidden">
        <ol className="relative flex items-center justify-between px-1">
          <span aria-hidden="true" className={`absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full ${FUTURE_LINE}`} />
          {currentIndex > 0 && stops[0].status === 'done' && (
            <span
              aria-hidden="true"
              className={`absolute left-4 top-1/2 h-1 -translate-y-1/2 rounded-full ${PASSED_LINE}`}
              style={{ width: `calc((100% - 2rem) * ${currentIndex / (stops.length - 1)})` }}
            />
          )}
          {stops.map((stop) => (
            <li key={stop.id} className="relative">
              {renderStop(stop, true)}
            </li>
          ))}
        </ol>
        {current && (
          <p className="mt-2 text-center text-[13px] leading-tight text-[#121712]" aria-live="polite">
            <span className="font-semibold tabular-nums">Bước {stops.indexOf(current) + 1}/{stops.length}</span>
            <span className="mx-1.5 text-[#8C9A80]" aria-hidden="true">·</span>
            <span className="font-bold">{current.label}</span>
            <span className="mx-1.5 text-[#8C9A80]" aria-hidden="true">·</span>
            <span className="text-[#4A5546]">{current.statusText}</span>
          </p>
        )}
      </div>
    </nav>
  );
};
