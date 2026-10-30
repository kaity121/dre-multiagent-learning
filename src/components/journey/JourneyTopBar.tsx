// Learner top bar: brand, lesson identity, station switcher, Agent Map entry and one overflow menu
// that holds every secondary action (sound, lesson, pause, level, peer notebook, demo, teacher tools).
import React from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Activity,
  Eye,
  Layers,
  Link2,
  MoreHorizontal,
  NotebookPen,
  Pause,
  RefreshCw,
  UserRound,
  Volume2,
  VolumeX,
  Workflow,
  Zap,
} from 'lucide-react';
import type { LearningMode } from '../../types/dre';
import { STATIONS, stationFor, type StationStatus } from './journeyModel';
import { useMenuButton } from './useMenuButton';

export interface JourneyMenuActions {
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onChangeLesson: () => void;
  onPause: () => void;
  levelLabel: string;
  onOpenLevel: () => void;
  onChangeVideoLink: () => void;
  onOpenPeerNotebook: () => void;
  isDemoRunning: boolean;
  onToggleDemo: () => void;
  onOpenTimelineEditor: () => void;
  onOpenWarRoom: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  onOpenContextSnapshot: () => void;
}

export interface JourneyTopBarProps {
  logoSrc: string;
  lessonTitle: string;
  teacherName?: string;
  currentMode: LearningMode;
  stationStatus: Record<LearningMode, StationStatus>;
  onSelectStation: (mode: LearningMode) => void;
  onOpenAgentMap: () => void;
  /** Teacher views replace the learner controls with a way back to class. */
  studioView: 'classroom' | 'warroom' | 'editor';
  onBackToClassroom: () => void;
  onLogoClick: () => void;
  menu: JourneyMenuActions;
}

const STATUS_LABEL: Record<StationStatus, string> = {
  done: 'Hoàn thành',
  current: 'Đang học',
  open: 'Chưa học',
};

export const JourneyTopBar: React.FC<JourneyTopBarProps> = ({
  logoSrc,
  lessonTitle,
  teacherName,
  currentMode,
  stationStatus,
  onSelectStation,
  onOpenAgentMap,
  studioView,
  onBackToClassroom,
  onLogoClick,
  menu,
}) => {
  const station = stationFor(currentMode);
  const inClassroom = studioView === 'classroom';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2EAD2] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-[1920px] items-center gap-3 px-3 sm:gap-5 sm:px-6">
        <button
          type="button"
          onClick={onLogoClick}
          className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712]"
          aria-label="DRE, về lớp học"
        >
          <img src={logoSrc} alt="" className="h-7 w-auto sm:h-9" />
        </button>

        <span aria-hidden="true" className="hidden h-8 w-px bg-[#E2EAD2] sm:block" />

        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="truncate text-[15px] font-bold leading-tight text-[#121712] lg:text-[17px]" title={lessonTitle}>
            {lessonTitle}
          </p>
          {teacherName && <p className="truncate text-[13px] leading-tight text-[#4A5546]">{teacherName}</p>}
        </div>
        <div className="flex-1 sm:hidden" />

        {inClassroom ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <StationSwitcher
              currentMode={currentMode}
              stationStatus={stationStatus}
              onSelectStation={onSelectStation}
            />
            <span className="hidden whitespace-nowrap text-[14px] font-semibold text-[#121712] lg:inline">
              Trạm {station.number}: {station.name}
            </span>
            <button
              type="button"
              onClick={onOpenAgentMap}
              className="inline-flex h-10 items-center gap-2 rounded-xl border-2 border-[#C8F169] bg-[#F7FBEF] px-2.5 text-[14px] font-bold text-[#121712] transition-colors hover:bg-[#EDF6DA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712] sm:px-3.5"
              aria-label="Mở Agent Map: xem tác nhân nào trả lời và đã kiểm chứng gì"
              title="Agent Map: xem tác nhân nào trả lời, vì sao, và đã kiểm chứng gì"
            >
              <Workflow className="h-[18px] w-[18px]" aria-hidden="true" />
              <span className="hidden sm:inline">Agent Map</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onBackToClassroom}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#121712] px-4 text-[14px] font-bold text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8F169]"
          >
            <ArrowLeft className="h-4 w-4 text-[#C8F169]" aria-hidden="true" />
            Quay lại lớp học
          </button>
        )}

        <OverflowMenu menu={menu} />
      </div>
    </header>
  );
};

const StationSwitcher: React.FC<{
  currentMode: LearningMode;
  stationStatus: Record<LearningMode, StationStatus>;
  onSelectStation: (mode: LearningMode) => void;
}> = ({ currentMode, stationStatus, onSelectStation }) => {
  const { open, setOpen, close, triggerRef, menuRef, onMenuKeyDown, onTriggerKeyDown } = useMenuButton();
  const station = stationFor(currentMode);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="station-switcher-menu"
        aria-label={`Đổi trạm. Đang ở Trạm ${station.number}: ${station.name}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={`flex h-11 items-center gap-1.5 rounded-full border-2 bg-white py-1 pl-1 pr-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712] ${
          open ? 'border-[#121712]' : 'border-[#C8F169] hover:border-[#A9D94A]'
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#121712] text-[15px] font-bold tabular-nums text-white">
          {station.number}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#121712] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id="station-switcher-menu"
          role="menu"
          aria-label="Bốn trạm của bài học"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(92vw,360px)] origin-top-right rounded-2xl border border-[#E2EAD2] bg-white p-2 shadow-[0_12px_32px_-8px_rgba(18,23,18,0.22)]"
        >
          {STATIONS.map((s) => {
            const status = s.id === currentMode ? 'current' : stationStatus[s.id];
            const isCurrent = s.id === currentMode;
            return (
              <button
                key={s.id}
                type="button"
                role="menuitemradio"
                aria-checked={isCurrent}
                onClick={() => {
                  close();
                  if (!isCurrent) onSelectStation(s.id);
                }}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#121712] ${
                  isCurrent ? 'bg-[#F3F8E8]' : 'hover:bg-[#F7FAF0]'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold tabular-nums ${
                    isCurrent
                      ? 'bg-[#C8F169] text-[#121712] ring-4 ring-[#C8F169]/30'
                      : status === 'done'
                        ? 'bg-[#1F5E3A] text-white'
                        : 'border-2 border-[#C9D4B6] bg-white text-[#4A5546]'
                  }`}
                >
                  {status === 'done' && !isCurrent ? <Check className="h-4 w-4" aria-hidden="true" /> : s.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-bold text-[#121712]">
                      Trạm {s.number} · {s.name}
                    </span>
                    <span className={`shrink-0 text-[12px] font-semibold ${status === 'done' ? 'text-[#1F5E3A]' : 'text-[#5B6657]'}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-[#4A5546]">{s.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const menuItemClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-[#121712] transition-colors hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#121712]';

const OverflowMenu: React.FC<{ menu: JourneyMenuActions }> = ({ menu }) => {
  const { open, setOpen, close, triggerRef, menuRef, onMenuKeyDown, onTriggerKeyDown } = useMenuButton();
  const run = (fn: () => void) => () => {
    close(false);
    fn();
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="journey-overflow-menu"
        aria-label="Thêm tuỳ chọn"
        title="Thêm tuỳ chọn"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712] ${
          open ? 'border-[#121712] bg-[#121712] text-white' : 'border-[#E2EAD2] bg-white text-[#121712] hover:bg-[#F3F8E8]'
        }`}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id="journey-overflow-menu"
          role="menu"
          aria-label="Tuỳ chọn lớp học"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[calc(100vh-88px)] w-[min(92vw,300px)] origin-top-right overflow-y-auto rounded-2xl border border-[#E2EAD2] bg-white p-2 shadow-[0_12px_32px_-8px_rgba(18,23,18,0.22)]"
        >
          <div role="group" aria-labelledby="menu-group-class">
            <p id="menu-group-class" className="px-3 pb-1 pt-1.5 text-[12px] font-semibold text-[#5B6657]">
              Lớp học
            </p>
            <button type="button" role="menuitemcheckbox" aria-checked={menu.isSoundEnabled} onClick={run(menu.onToggleSound)} className={menuItemClass}>
              {menu.isSoundEnabled ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
              <span className="flex-1">Âm thanh</span>
              <span className="text-[12px] text-[#5B6657]">{menu.isSoundEnabled ? 'Đang bật' : 'Đang tắt'}</span>
            </button>
            <button type="button" role="menuitem" onClick={run(menu.onOpenPeerNotebook)} className={menuItemClass}>
              <NotebookPen className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">Sổ tay &amp; Hỏi riêng 4 bạn</span>
            </button>
            <button type="button" role="menuitem" onClick={run(menu.onChangeLesson)} className={menuItemClass}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">Đổi bài</span>
            </button>
            <button type="button" role="menuitem" onClick={run(menu.onChangeVideoLink)} className={menuItemClass}>
              <Link2 className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">Đổi link video</span>
            </button>
            <button type="button" role="menuitem" onClick={run(menu.onOpenLevel)} className={menuItemClass}>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">Trình độ của bạn</span>
              <span className="text-[12px] text-[#5B6657]">{menu.levelLabel}</span>
            </button>
            <button type="button" role="menuitem" onClick={run(menu.onPause)} className={menuItemClass}>
              <Pause className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">Tạm dừng phiên học</span>
            </button>
            <button type="button" role="menuitem" onClick={run(menu.onToggleDemo)} className={menuItemClass}>
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{menu.isDemoRunning ? 'Dừng Demo 1-Click' : 'Demo 1-Click'}</span>
              <kbd className="rounded-md border border-[#E2EAD2] px-1.5 text-[12px] font-semibold text-[#4A5546]">F2</kbd>
            </button>
          </div>

          <div role="separator" className="mx-2 my-1.5 h-px bg-[#E2EAD2]" />

          <div role="group" aria-labelledby="menu-group-teacher">
            <p id="menu-group-teacher" className="px-3 pb-1 pt-1 text-[12px] font-semibold text-[#5B6657]">
              Công cụ giáo viên
            </p>
            <button type="button" role="menuitem" onClick={run(menu.onOpenTimelineEditor)} className={menuItemClass}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">Timeline Editor</span>
            </button>
            <button type="button" role="menuitem" onClick={run(menu.onOpenWarRoom)} className={menuItemClass}>
              <Activity className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">War Room</span>
            </button>
            <button type="button" role="menuitemcheckbox" aria-checked={menu.isInspectorOpen} onClick={run(menu.onToggleInspector)} className={menuItemClass}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">Inspector</span>
              <kbd className="rounded-md border border-[#E2EAD2] px-1.5 text-[12px] font-semibold text-[#4A5546]">Alt+I</kbd>
            </button>
            <button type="button" role="menuitem" onClick={run(menu.onOpenContextSnapshot)} className={menuItemClass}>
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">Context Snapshot</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
