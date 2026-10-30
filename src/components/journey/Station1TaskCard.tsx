// "Việc của bạn bây giờ": the one instruction card under the video. Its content follows the
// checkpoint beat (watch → diagnose → rebut Bo → Cô Lam's rule → next station). At the rebut
// beat it expands into the three-panel face-off. All answers go through the existing App
// handlers; this card only decides how each beat is presented.
import React, { useEffect, useId, useState } from 'react';
import { ArrowRight, Lightbulb, Lock, Play, RotateCcw, Send, SkipForward, Target, X } from 'lucide-react';
import type { VideoLessonItem } from '../../types/dre';
import { SPLIT_LENGTH_TRAP_OPTION_ID } from '../../types/showcase';
import { AgentAvatar } from '../AgentAvatar';
import { FormattedMathText } from '../MathVector';
import { formatClock, type TaskBeat } from './journeyModel';

const MAX_REBUTTAL = 1000;

const cleanText = (str?: string | null) => (str ? str.replace(/⃗/g, '') : '');
const joinDialogue = (d?: string | string[] | null) => (Array.isArray(d) ? d.join(' ') : d || '');

export interface Station1TaskCardProps {
  beat: TaskBeat;
  lesson: VideoLessonItem;
  checkpointTimestamp: number | null;
  isLoadingAi: boolean;
  liveBoDialogue: string | null;
  liveCoLamDialogue: string | string[] | null;
  liveHintDialogue: string | null;
  onJumpToCheckpoint: () => void;
  onReplayBeforeCheckpoint: () => void;
  onAnswer: (optionLabel: string, optionId: string) => void;
  onSkip: () => void;
  onRebut: (text: string, isEffective: boolean) => void;
  onResumeLecture: () => void;
  onNextStation: () => void;
}

const secondaryBtn =
  'inline-flex h-11 items-center gap-2 rounded-full border border-[#D5DFC4] bg-white px-4 text-[14px] font-semibold text-[#121712] transition-colors hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712] disabled:cursor-not-allowed disabled:opacity-50';
const primaryBtn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#C8F169] px-5 text-[15px] font-bold text-[#121712] shadow-[0_2px_8px_-2px_rgba(80,110,20,0.45)] transition-colors hover:bg-[#BDE85A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712] disabled:cursor-not-allowed disabled:bg-[#E3EDCF] disabled:text-[#6B7766] disabled:shadow-none';

const CardHeading: React.FC<{ title: string; children?: React.ReactNode; id?: string }> = ({ title, children, id }) => (
  <div className="flex items-start gap-3">
    <Target className="mt-0.5 h-7 w-7 shrink-0 text-[#2F7A3B]" aria-hidden="true" />
    <div className="min-w-0">
      <h2 id={id} className="text-[18px] font-bold leading-snug text-[#121712] text-balance lg:text-[19px]">
        {title}
      </h2>
      {children && <div className="mt-1 max-w-[70ch] text-[15px] leading-relaxed text-[#3D4739]">{children}</div>}
    </div>
  </div>
);

export const Station1TaskCard: React.FC<Station1TaskCardProps> = (props) => {
  const { beat, checkpointTimestamp } = props;
  const headingId = useId();
  const cp = checkpointTimestamp !== null ? formatClock(checkpointTimestamp) : null;
  const isFaceOff = beat === 'rebut' || beat === 'closure';

  return (
    <section
      aria-labelledby={headingId}
      // The face-off panels are the cards themselves; no outer card around them.
      className={isFaceOff ? '' : 'rounded-3xl border border-[#E2EAD2] bg-white p-4 sm:p-5'}
    >
      {beat === 'watch' && (
        <>
          <CardHeading id={headingId} title={cp ? `Việc của bạn bây giờ: xem bài đến ${cp}` : 'Việc của bạn bây giờ: xem bài giảng'}>
            {cp
              ? `Thầy Tiến sắp giải Ví dụ 3. Đến ${cp} lớp sẽ dừng lại: Bo đưa ra một cách tính, còn bạn là người kiểm tra xem Bo đúng hay sai.`
              : 'Bấm phát video và theo dõi cùng cả lớp. Có gì chưa rõ, hãy hỏi trong khung chat bên cạnh.'}
          </CardHeading>
          {cp && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button type="button" onClick={props.onJumpToCheckpoint} className={secondaryBtn}>
                <SkipForward className="h-4 w-4" aria-hidden="true" />
                Tới điểm dừng {cp}
              </button>
            </div>
          )}
        </>
      )}

      {beat === 'waiting' && (
        <>
          <CardHeading id={headingId} title={`Câu hỏi ${cp} vẫn đang chờ bạn`}>
            Bạn đã bỏ qua câu hỏi ở điểm dừng. Bo vẫn đang đợi người chỉ ra chỗ sai, quay lại khi bạn sẵn sàng.
          </CardHeading>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button type="button" onClick={props.onJumpToCheckpoint} className={primaryBtn}>
              Mở lại câu hỏi
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {beat === 'diagnose' && <DiagnoseBeat {...props} headingId={headingId} />}
      {isFaceOff && <FaceOff {...props} headingId={headingId} resolved={beat === 'closure'} />}

      {beat === 'continue' && (
        <>
          <CardHeading id={headingId} title="Bạn đã bác được Bo. Việc tiếp theo: Trạm 2 · Sổ tay">
            <span className="font-semibold text-[#121712]">Quy tắc Cô Lam chốt: </span>
            <FormattedMathText text={cleanText(joinDialogue(props.liveCoLamDialogue) || props.lesson.teacherClosure?.goldenRule)} />
          </CardHeading>
          <div className="mt-4 flex flex-wrap justify-end gap-2.5">
            <button type="button" onClick={props.onNextStation} className={primaryBtn}>
              Sang Trạm 2 · Sổ tay
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </section>
  );
};

const DiagnoseBeat: React.FC<Station1TaskCardProps & { headingId: string }> = ({
  lesson,
  checkpointTimestamp,
  isLoadingAi,
  onAnswer,
  onSkip,
  onReplayBeforeCheckpoint,
  headingId,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const options = lesson.checkpointQuestion?.options ?? [];
  const chosen = options.find((o) => o.id === selected);
  const cp = checkpointTimestamp !== null ? formatClock(checkpointTimestamp) : '';

  return (
    <>
      <CardHeading id={headingId} title={`Việc của bạn bây giờ: chọn cách tính đúng ở ${cp}`}>
        <FormattedMathText text={cleanText(lesson.checkpointQuestion?.prompt)} />
      </CardHeading>

      <fieldset className="mt-4">
        <legend className="sr-only">Các cách tính</legend>
        <div role="radiogroup" aria-label="Các cách tính" className="grid gap-2">
          {options.map((opt, idx) => {
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(opt.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-[15px] leading-snug transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121712] ${
                  isSelected ? 'border-[#121712] bg-[#121712] text-white' : 'border-[#E2EAD2] bg-white text-[#121712] hover:border-[#B9C6A3]'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[14px] font-bold ${
                    isSelected ? 'bg-[#C8F169] text-[#121712]' : 'bg-[#F3F8E8] text-[#121712]'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">
                  <FormattedMathText text={cleanText(opt.label)} />
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button type="button" onClick={onReplayBeforeCheckpoint} className={secondaryBtn}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Xem lại 30 giây
        </button>
        <button type="button" onClick={onSkip} className={secondaryBtn}>
          Bỏ qua
        </button>
        <button
          type="button"
          disabled={!chosen || isLoadingAi}
          onClick={() => chosen && onAnswer(cleanText(chosen.label), chosen.id)}
          className={`${primaryBtn} ml-auto`}
        >
          {isLoadingAi ? 'Đang gửi…' : 'Xác nhận đáp án'}
        </button>
      </div>
    </>
  );
};

const PanelHeader: React.FC<{ role: string; title: string; subtitle: string; tag: string; tagIcon?: React.ReactNode }> = ({
  role,
  title,
  subtitle,
  tag,
  tagIcon,
}) => (
  <div className="flex items-start gap-3">
    <AgentAvatar role={role} size="w-14 h-14 shrink-0" />
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[18px] font-bold text-[#121712]">{title}</h3>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#D5DFC4] px-2 py-0.5 text-[12px] font-semibold text-[#3D4739]">
          {tagIcon}
          {tag}
        </span>
      </div>
      <p className="mt-0.5 text-[13px] leading-snug text-[#4A5546]">{subtitle}</p>
    </div>
  </div>
);

const FaceOff: React.FC<Station1TaskCardProps & { headingId: string; resolved: boolean }> = ({
  lesson,
  isLoadingAi,
  liveBoDialogue,
  liveCoLamDialogue,
  liveHintDialogue,
  onRebut,
  onResumeLecture,
  onNextStation,
  headingId,
  resolved,
}) => {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const editorId = useId();

  const options = lesson.checkpointQuestion?.options ?? [];
  const trap = options.find((o) => o.id === SPLIT_LENGTH_TRAP_OPTION_ID) ?? options.find((o) => !o.isStandardBest);
  const boSpeech = cleanText(resolved ? liveBoDialogue || lesson.boConcession?.speech : liveBoDialogue || lesson.boArgument?.speech);
  const hints = [trap?.feedback, lesson.freezeNote].map((h) => cleanText(h)).filter(Boolean);
  const rule = cleanText(joinDialogue(liveCoLamDialogue) || lesson.teacherClosure?.goldenRule);

  // A rebuttal that Bo did not accept comes back as a hint; let the learner edit and resend.
  useEffect(() => {
    if (liveHintDialogue) setSubmitted(null);
  }, [liveHintDialogue]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || isLoadingAi) return;
    // Same grading as the video overlay: a prepared argument keeps its own verdict,
    // free text is forwarded as a rebuttal to the existing handler.
    const sticker = lesson.rebuttalStickers?.find((s) => cleanText(s.text).trim() === value);
    setSubmitted(value);
    onRebut(value, sticker ? sticker.isEffective : true);
  };

  return (
    <>
      <h2 id={headingId} className="sr-only">
        {resolved ? 'Cô Lam chốt quy tắc' : 'Việc của bạn bây giờ: bác lại cách làm của Bo'}
      </h2>
      <div className="grid gap-3 xl:grid-cols-3">
        {/* Bo nói */}
        <article className="flex flex-col gap-3 rounded-3xl border border-[#E2EAD2] bg-white p-4 sm:p-5">
          <PanelHeader role="bo" title="Bo nói" subtitle={resolved ? 'Bo đã nhận ra chỗ sai.' : 'Đây là cách Bo làm, theo Bo thì đúng.'} tag="Bạn học AI" />
          <blockquote className="text-[15px] leading-relaxed text-[#121712]">
            “<FormattedMathText text={boSpeech} />”
          </blockquote>
          {trap && (
            <div className="mt-auto rounded-xl border border-[#F2C9C4] bg-[#FDF3F1] p-3">
              <p className="mb-1.5 text-[12px] font-semibold text-[#8A2A1F]">Bước Bo làm sai</p>
              <div className="flex items-start gap-2.5">
                <X className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-[#C2412D] p-0.5 text-white" strokeWidth={3} aria-hidden="true" />
                <s className="text-[15px] leading-snug text-[#5A1F17] decoration-[#C2412D] decoration-2">
                  <FormattedMathText text={cleanText(trap.label)} />
                </s>
              </div>
            </div>
          )}
        </article>

        {/* Lượt của bạn */}
        <article
          className={`flex flex-col gap-3 rounded-3xl border-2 p-4 sm:p-5 ${resolved ? 'border-[#E2EAD2] bg-white' : 'border-[#C8F169] bg-white shadow-[0_6px_20px_-10px_rgba(110,150,30,0.55)]'}`}
        >
          <PanelHeader role="classmate" title="Lượt của bạn" subtitle="Bác lại cách làm của Bo bằng lập luận của bạn." tag="Bạn" />
          {resolved ? (
            <div className="rounded-xl bg-[#F3F8E8] p-3 text-[15px] leading-relaxed text-[#121712]">
              <p className="mb-1 text-[12px] font-semibold text-[#3D4739]">Phản biện bạn đã gửi</p>
              <FormattedMathText text={submitted || 'Bạn đã chọn một lập luận để bác Bo.'} />
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-1 flex-col gap-3">
              <label htmlFor={editorId} className="sr-only">
                Phản biện của bạn
              </label>
              <div className="rounded-xl border border-[#D5DFC4] focus-within:border-[#121712]">
                <textarea
                  id={editorId}
                  value={text}
                  maxLength={MAX_REBUTTAL}
                  rows={4}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Viết phản biện của bạn… (ví dụ: “Bo sai ở bước tách độ dài, vì …”)"
                  className="block w-full resize-none rounded-xl bg-transparent px-3.5 py-3 text-[15px] leading-relaxed text-[#121712] placeholder:text-[#6B7766] focus:outline-none"
                />
                <p className="px-3.5 pb-2 text-right text-[12px] tabular-nums text-[#5B6657]">
                  {text.length}/{MAX_REBUTTAL}
                </p>
              </div>

              {liveHintDialogue && !isLoadingAi && (
                <p role="status" className="rounded-xl border border-[#F0D9A8] bg-[#FFF8E8] p-3 text-[14px] leading-snug text-[#5C4210]">
                  <FormattedMathText text={cleanText(liveHintDialogue)} />
                </p>
              )}

              {hints.length > 0 && (
                <div className="rounded-xl border border-[#E2EAD2] p-3">
                  <p className="flex items-center gap-1.5 text-[14px] font-bold text-[#121712]">
                    <Lightbulb className="h-4 w-4 text-[#B7791F]" aria-hidden="true" />
                    Gợi ý từng bước (nếu cần)
                  </p>
                  <ol className="mt-2 grid gap-2">
                    {hints.slice(0, 2).map((hint, i) => (
                      <li key={i}>
                        {i < hintsShown ? (
                          <p className="flex gap-2.5 rounded-lg bg-[#F7FAF0] p-2.5 text-[14px] leading-snug text-[#121712]">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E9F2D8] text-[12px] font-bold">{i + 1}</span>
                            <span>
                              <FormattedMathText text={hint} />
                            </span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            disabled={i !== hintsShown}
                            onClick={() => setHintsShown(i + 1)}
                            className="flex w-full items-center gap-2.5 rounded-lg border border-dashed border-[#C9D4B6] p-2.5 text-left text-[14px] font-semibold text-[#121712] transition-colors hover:bg-[#F7FAF0] focus-visible:outline-2 focus-visible:outline-[#121712] disabled:cursor-not-allowed disabled:text-[#6B7766] disabled:hover:bg-transparent"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E9F2D8] text-[12px] font-bold">{i + 1}</span>
                            {i === 0 ? 'Mở gợi ý 1' : 'Mở gợi ý 2 (sau gợi ý 1)'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {lesson.rebuttalStickers?.length > 0 && (
                <details className="group rounded-xl border border-[#E2EAD2] px-3 py-2">
                  <summary className="cursor-pointer text-[14px] font-semibold text-[#121712] marker:text-[#8C9A80]">Dùng một lập luận có sẵn</summary>
                  <div className="mt-2 grid gap-1.5">
                    {lesson.rebuttalStickers.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setText(cleanText(s.text))}
                        className="rounded-lg px-2.5 py-2 text-left text-[14px] leading-snug text-[#121712] transition-colors hover:bg-[#F3F8E8] focus-visible:outline-2 focus-visible:outline-[#121712]"
                      >
                        <FormattedMathText text={cleanText(s.text)} />
                      </button>
                    ))}
                  </div>
                </details>
              )}

              <button type="submit" disabled={!text.trim() || isLoadingAi} className={`${primaryBtn} mt-auto w-full`}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {isLoadingAi ? 'Đang gửi phản biện…' : 'Gửi phản biện'}
              </button>
            </form>
          )}
        </article>

        {/* Cô Lam chốt */}
        <article className="flex flex-col gap-3 rounded-3xl border border-[#E2EAD2] bg-white p-4 sm:p-5">
          <PanelHeader
            role="colam"
            title="Cô Lam chốt"
            subtitle="Cô kết luận đúng sai và chốt quy tắc sau khi bạn bác được Bo."
            tag="Giáo viên AI"
            tagIcon={resolved ? undefined : <Lock className="h-3 w-3" aria-hidden="true" />}
          />
          {resolved ? (
            <>
              <div className="rounded-xl border border-[#C8F169] bg-[#F4FAE6] p-3.5 text-[15px] font-medium leading-relaxed text-[#121712]">
                <FormattedMathText text={rule} />
              </div>
              <div className="mt-auto flex flex-wrap gap-2.5 pt-1">
                <button type="button" onClick={onResumeLecture} className={secondaryBtn}>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Tiếp tục bài giảng
                </button>
                <button type="button" onClick={onNextStation} className={primaryBtn}>
                  Sang Trạm 2
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#D5DFC4] px-4 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3E4]">
                <Lock className="h-6 w-6 text-[#5B6657]" aria-hidden="true" />
              </span>
              <p className="text-[16px] font-bold text-[#121712]">Mở khi bạn bác được Bo</p>
              <p className="max-w-[34ch] text-[14px] leading-snug text-[#4A5546]">
                Đưa ra lập luận thuyết phục để bác cách làm của Bo. Khi đó Cô Lam sẽ chốt quy tắc cho cả lớp.
              </p>
            </div>
          )}
        </article>
      </div>
    </>
  );
};
