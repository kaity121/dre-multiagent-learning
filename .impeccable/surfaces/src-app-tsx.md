---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/components/VideoDebateSheet.tsx"]
---

# Surface brief: learner classroom (Station shell + Station 1)

## Scope

- **Surface:** the learner app shell in `src/App.tsx` (header, journey rail, station switcher) and Station 1 (video, task card, class chat), plus the Agent Map popup.
- **Mode:** Operate.
- **Audience and display:** jury watching the finals demo on a 1440–1920px projector; the presenter role-plays a grade-12 student.
- **Task:** watch the lecture → at 37:13 diagnose Bo's mistake → rebut Bo → Cô Lam locks in the rule → continue to Sổ tay, Đoán, Dạy kèm. The student may open the Agent Map at any time.

## Constraints

- **Business rules stay as they are:** FSM, dispatcher, stations.
- **Lime Soft brand is binding:** palette, Be Vietnam Pro, existing avatars.
- **Data source:** use the backend evaluator, falling back to demo data silently. Fallbacks carry no "mock" labels.
- **Jargon:** no internal terms in learner copy.
- **Mobile:** must stay usable.

## Approved composition

- **Chosen comp (decision round, structure "Tuyến hành trình dọc"):** `.impeccable/mocks/decision/story-spine.png`. It is the critique reference for this code-led build.
- **Agent Map popup reference:** `.impeccable/mocks/decision/split-agent-map.png`, right panel.
- **"Bác Bo" beat reference:** `.impeccable/mocks/decision/checkpoint-faceoff.png`, the three-panel stage.

## Direction contract

**THESIS**
The lesson is one journey line: Diagnose → Repair → Explain, drawn as a vertical metro line. The student always sees which station they are at and what to do next. This replaces the incumbent arrangement: an 8-button header, four disconnected stations and chat-as-everything.

**OWN-WORLD**
- Colour: pale lime ground `#F3F8E8`, white cards with `#E2EAD2` hairlines, ink `#121712`, and lime `#C8F169` reserved for "now" (the current station, the primary action, the active switcher).
- Agents: round cartoon avatars.
- Type: Be Vietnam Pro throughout. KaTeX for maths.
- Evidence: shown as small outlined chips with a check glyph.

**STORY**
1. The student lands and immediately reads: lesson title, "Trạm 1 · Xem bài", the journey rail with 6 stations, and a task card saying what to do now.
2. At 37:13 the rail advances to "Bo sai ở 37:13". The task card becomes the diagnose/rebut step. Bo, Trí and Cô Lam speak in chat with evidence chips.
3. Clicking a chip or "Agent Map" opens a popup with lanes (Hiểu câu hỏi → Lấy ngữ cảnh → Kiểm chứng → Trả lời). Each block shows agent, tool, citation, ms and tokens where the backend provides them.

**FIRST VIEWPORT (1440×900)**
- **Top bar, about 64px:** DRE logo; lesson title with the teacher's name under it; at right, a circular station button ("1" plus chevron) whose dropdown lists the 4 stations with status, then "Trạm 1: Xem bài", then a lime-outlined "Agent Map" button.
- **Left rail, about 150px:** vertical line with 6 round stations, each with a label and a status line (Hoàn thành / Đang thực hiện / Chưa mở). Passed stations are filled dark green with a check. The current one is lime with a halo. Future ones are hollow.
- **Centre, about 55%:** video with a 37:13 marker. Directly under it, the "Việc của bạn bây giờ" task card holds the step instruction, an input when needed, and actions (Gợi ý định hướng · Xem lại 30 giây · primary lime "Gửi phản biện").
- **Right, about 25%:** "Lớp học 4 bạn AI + Cô Lam" chat with role tags and evidence chips. Composer pinned at the bottom.

**FORM**
Structure 5 of my ordered list, "story spine", dealt lead. Donation from the transit-diagram challenger: stations are clickable circles, the passed segment is filled, and 37:13 is marked as an interchange.
seed: roll ran before the direction was chosen (dealt indices 5, 2, 3; lead = story spine); its SEED REFERENCE line was not captured at roll time, so no reference is recorded

**FINISH**
unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Mobile arrangement of the rail. Proposal: a horizontal compact rail under the header.
- Whether the dispatcher returns a per-step `trace[]` (ms, tokens). Until it does, the Agent Map shows only the fields the backend actually returns.

## Approved merge (user, 2026-10-31)
User approved structure 1 (story-spine.png) as the shell, with:
- **Agent Map popup:** composed after split-agent-map.png (right panel).
  - Header line: turn, question, total time, tokens.
  - 4 lane columns: Hiểu câu hỏi / Lấy ngữ cảnh / Kiểm chứng / Trả lời.
  - Blocks joined by connector lines on a faint grid.
  - Side detail panel: agent info, tools used, context used, citations.
- **"Bác Bo" beat:** the task card expands into the three-panel face-off from checkpoint-faceoff.png.
  - Bo nói, with the wrong step struck.
  - Lượt của bạn: editor, 2-step hint ladder, Gửi phản biện.
  - Cô Lam chốt: locked until Bo is refuted.
