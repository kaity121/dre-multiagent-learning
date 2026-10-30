---
name: DRE
description: Biến ngộ nhận toán học thành bước đột phá tư duy. A learner classroom drawn as one journey line.
colors:
  lime-now: "#C8F169"
  lime-now-hover: "#BDE85A"
  lime-wash: "#F4FAE6"
  lime-tag: "#EAF6CF"
  evidence-border: "#B7DB6A"
  evidence-wash: "#F7FBEF"
  evidence-hover: "#EDF6DA"
  evidence-ink: "#1F4D12"
  check-green: "#2F7A3B"
  passed-green: "#1F5E3A"
  connector-lime: "#9CCB3B"
  ink: "#121712"
  ink-secondary: "#3D4739"
  ink-muted: "#4A5546"
  ink-faint: "#5B6657"
  separator-dot: "#8C9A80"
  ground: "#F3F8E8"
  mist: "#F7FAF0"
  card: "#FFFFFF"
  step-pill: "#E9F2D8"
  hairline: "#E2EAD2"
  control-border: "#D5DFC4"
  hollow-stop: "#C9D4B6"
  future-line: "#DCE5CB"
  wrong-red: "#C2412D"
  wrong-wash: "#FDF3F1"
  wrong-border: "#F2C9C4"
  wrong-ink: "#5A1F17"
  hint-wash: "#FFF8E8"
  hint-border: "#F0D9A8"
  hint-ink: "#5C4210"
  math-given: "#0284C7"
  math-target: "#DC2626"
  math-correct: "#16A34A"
typography:
  display:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
  headline:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.375
  title:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.25
  meta:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.25
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.lime-now}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.lime-now-hover}"
  button-primary-disabled:
    backgroundColor: "#E3EDCF"
    textColor: "#6B7766"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.ground}"
  button-toolbar:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "40px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
    height: "40px"
  chip-evidence:
    backgroundColor: "{colors.evidence-wash}"
    textColor: "{colors.evidence-ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  chip-evidence-hover:
    backgroundColor: "{colors.evidence-hover}"
  tag-role:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "1px 8px"
  card-task:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  option-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  option-row-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
  journey-stop-current:
    backgroundColor: "{colors.lime-now}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "40px"
  journey-stop-done:
    backgroundColor: "{colors.passed-green}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
    size: "40px"
  journey-stop-future:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.full}"
    size: "40px"
  map-block:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px"
  menu-popover:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.xl}"
    padding: "8px"
---

# Design System: DRE

## Overview

**Creative North Star: "The Metro Line Classroom"**

The lesson is drawn as one transit line through a pale lime room. Every surface answers two questions at a glance: which station am I at, and what do I do now. The ground is a quiet spring-green paper (`ground`), work happens on white cards fenced by soft green hairlines, and the single saturated lime (`lime-now`) marks only the present: the current stop, the primary action, the panel where it is the learner's turn. Everything else stays ink on white.

Density is projector-first. Functional text never drops below 11px, body copy sits at 15px, and controls are 40 to 44px tall so a jury reads them from the back of a room. Shapes are soft and round (pill buttons, 24px cards, circular stations, round cartoon agent avatars) to keep a grade-12 student unafraid of being wrong; the type stays bold and plain Vietnamese so the softness never turns childish.

Transparency is visual, not decorative. Every AI claim carries one outlined evidence chip that opens the Agent Map, where the same turn is laid out as four lanes on a faint grid, joined by lime connector lines. Maths is always typeset with KaTeX, never approximated in body text.

**Key Characteristics:**
- One saturated accent, reserved for "now".
- Ink-on-white cards with green hairlines; depth by tone first, soft shadow second.
- Round geometry: pills, circles, 24px cards.
- Be Vietnam Pro throughout; JetBrains Mono only for real tool names and timestamps.
- Plain-Vietnamese learner copy; English only for real product names (Agent Map) and tool identifiers.

## Colors

A pale spring-green world with one acid lime for the present moment, deep forest green for the past, and a single brick red reserved for a wrong step.

### Primary
- **Acid Lime** (`lime-now`): the present tense. Current journey stop (with a 6px lime halo at 35%), the primary pill button, the station switcher's ring, the active "Lượt của bạn" panel border, the 37:13 checkpoint diamond, the Agent Map title badge. Hover deepens to `lime-now-hover`.
- **Lime Wash** (`lime-wash`, `lime-tag`): tinted fill behind the current stop's status line and Cô Lam's locked rule box.

### Secondary
- **Forest Passed** (`passed-green`): the travelled past. Filled done-stops with a white check and the filled rail segment between two travelled stops.
- **Evidence Green** (`evidence-border`, `evidence-wash`, `evidence-ink`, `check-green`): the voice of verification. Outlined evidence chips, source chips, role tag for Cô Lam, inline text links ("Xem thêm", "3 nguồn"). Deliberately a deeper, quieter green than Acid Lime so evidence never reads as "now".
- **Connector Lime** (`connector-lime`): the 2px elbow lines joining Agent Map lanes.

### Tertiary
- **Brick Wrong** (`wrong-red`, `wrong-wash`, `wrong-border`, `wrong-ink`): only for the step Bo got wrong. A struck step, its X disc and his tinted conclusion.
- **Hint Amber** (`hint-wash`, `hint-border`, `hint-ink`): a live hint from Trợ giảng An inside the rebuttal panel.
- **Maths Semiotics** (`math-given`, `math-target`, `math-correct`): inside rendered maths only; reference vector, the vector being found, a verified equality.

### Neutral
- **Spring Ground** (`ground`): page background; also the selected-row and hover fill in menus and secondary buttons.
- **Mist** (`mist`): inner wells inside cards (Bo's unstruck steps, revealed hints, context items, the Agent Map dialog body).
- **Card White** (`card`): every working surface.
- **Hairline** (`hairline`): card borders, header rule, dividers, lane separators.
- **Control Border** (`control-border`): outline of secondary buttons, role tags, editor field; one step firmer than a hairline so controls read as pressable.
- **Hollow Stop / Future Line** (`hollow-stop`, `future-line`): untravelled stations and rail segments.
- **Ink ladder** (`ink`, `ink-secondary`, `ink-muted`, `ink-faint`, `separator-dot`): headings and primary text, body support, metadata, status captions, and the middle-dot separator.

### Agent Identity
Each recipient in the chat's recipient picker and roster carries one identity colour, used only as a small dot or label tint beside that agent's name, never as a fill for chrome:
- Cả lớp `#0e7490`, Bo `#b45309`, Trí `#1d4ed8`, Linh Chi `#059669`, Minh Khang `#7c3aed`, Trợ giảng An `#0f766e`.
- Cô Lam uses the ink-secondary tone `#3D4739`. As the presiding teacher she reads as neutral authority, and red stays reserved by the One Red Rule.

### Named Rules
**The Now Rule.** Acid Lime is filled only on what is happening now: the current stop, the one primary action, the active panel. A screen with two lime-filled primaries is wrong.

**The Quiet Evidence Rule.** Evidence is outlined in Evidence Green with a small filled check disc, never filled with Acid Lime. Proof supports the answer; it does not compete with the next step.

**The One Red Rule.** Red marks the wrong step in Bo's working and nothing else in the UI chrome.

## Typography

**Display Font:** Be Vietnam Pro (with system-ui, sans-serif)
**Body Font:** Be Vietnam Pro (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace), for tool names and video timestamps only
**Maths:** KaTeX_Main / KaTeX_Math; operators inherit text colour.

**Character:** A single humanist sans with complete Vietnamese diacritics carries every role; hierarchy comes from weight (700 vs 400) and a tight size ladder, not from a second display face.

### Hierarchy
- **Display** (700, 22px): dialog titles (Agent Map). The ceiling of the in-app scale.
- **Headline** (700, 18px, 19px at lg+, 1.375): task card heading "Việc của bạn bây giờ…" and face-off panel titles; balanced wrapping.
- **Title** (700, 15px; 17px for the lesson title at lg+): journey stop labels, lane headers, primary button text, agent names.
- **Body** (400, 15px, 1.625): task instructions, Bo's quote and steps, the rebuttal editor, Agent Map answer. Capped at 70 to 75ch.
- **Body small** (400, 13px, 1.375): status lines, menu descriptions, detail-panel copy, chat message body.
- **Label** (600, 14px): secondary buttons, menu items, station names in the switcher.
- **Meta** (600, 12px): evidence chips, role tags, counters, verdicts ("Khớp" / "Không khớp"); 11px is the floor, used only for chat role tags and timestamp chips.
- **Mono** (600, 13px): tool identifiers such as `verify_vector_algebra`; 11px for timestamp chips in chat.

### Named Rules
**The Tabular Clock Rule.** Every time, count and metric (37:13, 2/6, ms, 0/1000) uses tabular numerals.

**The Real-Name Mono Rule.** Mono type marks a real identifier the learner could look up; it never styles ordinary labels.

## Layout

The classroom is a three-column shell inside a 1920px max container. A 64px sticky white header (95% opacity, light blur) sits over the Spring Ground. At lg (1024px) and up, the page locks to the viewport height: a 200px journey rail on the left with a hairline right edge, a centre column that scrolls on its own (video, then the task card, then the video toolbar), and a resizable chat column (300 to 640px) whose composer stays pinned. Column gap is 24px; card internal padding is 16px, 20px from sm. Spacing is on a 4px grid; intra-card gaps are 8, 10 or 12px.

Below lg the shell stacks: the rail collapses into a horizontal strip of 28px stops inside a white rounded card, followed by "Bước n/6 · label · status" in one line; video, task card, toolbar and chat follow in order, chat at 72vh. Secondary toolbar actions fold behind "Thêm" below sm.

At the rebuttal beat the video collapses to a slim strip (pause disc, title, progress bar with a lime diamond at the checkpoint, "Hiện video và lớp học"), and the task card becomes three face-off panels side by side from xl (1280px), stacked below.

The Agent Map is a centred modal up to 1500px wide and min(92vh, 900px) tall from sm, full-screen on phones. Lanes run left to right with a 380px detail panel on the right at lg; they stack vertically with no connectors below lg.

## Elevation & Depth

Mostly flat and tonal. Surfaces separate by white-on-ground and green hairlines; shadow appears only on things that float (menus, dialogs), on the primary action, and on the active turn panel. Shadows are always tinted with the ink or lime hue, never neutral grey, and always negative-spread so they read as soft lift, never as a hard offset.

### Shadow Vocabulary
- **Popover** (`box-shadow: 0 12px 32px -8px rgba(18,23,18,0.22)`): station switcher, overflow menu, mobile "Thêm" menu.
- **Dialog** (`box-shadow: 0 24px 64px -16px rgba(18,23,18,0.45)`): Agent Map, over an ink scrim at 45%.
- **Primary lift** (`box-shadow: 0 2px 8px -2px rgba(80,110,20,0.45)`): the lime primary button; removed when disabled.
- **Your-turn glow** (`box-shadow: 0 6px 20px -10px rgba(110,150,30,0.55)`): the active "Lượt của bạn" panel only.
- **Block rest** (`box-shadow: 0 2px 6px -2px rgba(18,23,18,0.12)`): Agent Map blocks sitting on the grid.

### Named Rules
**The Float-Only Rule.** Cards at rest have no shadow. If it does not float, glow for "now", or sit on the map grid, it is flat.

## Shapes

Round and soft. Buttons that move the story are full pills (44px tall); toolbar and header buttons are 40px with 12px corners; cards and face-off panels use 24px; menus, lane canvas and slim strips 16px; inner rows, options and blocks 12px; chips and hint rows 8px. Stations, avatars, step numbers and icon buttons are perfect circles. Borders are 1px hairlines, rising to 2px for the station switcher, the Agent Map entry and the active turn panel, and 3px for hollow journey stops. Dashed borders mean "not yet": locked Cô Lam panel, unopened hints, empty lanes. The checkpoint marker is the one square form, a 12px diamond (rotated, 2px corners) in lime with an ink border.

## Components

### Buttons
- **Shape:** full pill (9999px) for story actions; 12px corners for toolbar and header controls; circles (40px) for icon-only controls.
- **Primary:** Acid Lime fill, ink text, 15px bold, 44px tall, 20px side padding, primary-lift shadow; trailing arrow when it advances the journey ("Sang Trạm 2 · Sổ tay"). Disabled: pale lime-grey fill, muted text, no shadow.
- **Secondary:** white fill, control-border outline, 14px semibold, 44px tall, leading 16px stroke icon; hover fills Spring Ground.
- **Toolbar:** white, hairline outline, 12px corners, 40px, 13px semibold. Pressed state inverts to ink fill with white text.
- **Dark:** ink fill, white text (close button, "Quay lại lớp học" with a lime arrow).
- **Focus:** every control shows a 2px ink outline at 2px offset; on ink controls the outline is lime.

### Chips
- **Evidence chip:** one per AI message. Evidence-wash fill, 1px evidence-border outline, 8px corners, 12px semibold evidence-ink text, a 16px check-green disc with a white check; label is the verification summary plus the lecture second. Opens the Agent Map for that turn. A plain underlined "n nguồn" link beside it reveals source chips on demand.
- **Source chip:** white with the same evidence outline and an inline check; seeks the video when it has a timestamp.
- **Role tag:** outlined pill, 11 to 12px semibold ("Bạn học AI", "Giáo viên AI", "Trợ giảng AI"); Cô Lam's tag uses the evidence green outline.
- **Timestamp chip:** Spring Ground fill, hairline outline, 6px corners, 11px mono; seeks the video.

### Cards / Containers
- **Corner Style:** 24px for the task card and face-off panels.
- **Background:** white on Spring Ground; inner wells in Mist.
- **Shadow Strategy:** none at rest (see Elevation).
- **Border:** 1px hairline; the active turn panel uses 2px Acid Lime plus the your-turn glow.
- **Internal Padding:** 16px, 20px from sm; 12px between stacked children.

### Inputs / Fields
- **Style:** the rebuttal editor is a 12px-corner frame with a control-border outline, transparent textarea at 15px/1.625, muted placeholder with a worked example, and a tabular 0/1000 counter bottom right.
- **Focus:** the frame border turns ink (focus-within); no glow.
- **Disabled:** controls drop to 50% opacity with a not-allowed cursor; grading shows a status row instead of a spinner.

### Navigation
- **Top bar:** 64px, logo, hairline divider, lesson title (15/17px bold) over teacher name (13px muted); right cluster of station switcher, "Trạm n: name" (lg+), the lime-outlined Agent Map button, and a circular overflow menu.
- **Station switcher:** 44px pill with a 2px lime ring and an ink number disc; opens a 360px menu of four stations, each with a 32px status disc (lime with halo for current, forest green with check for done, hollow for open), name, status word and one-line description. The ring turns ink while open.
- **Overflow menu:** grouped items ("Lớp học", then "Công cụ giáo viên") at 14px with 16px icons and right-aligned state or kbd hints.

### Journey Rail (signature)
A vertical metro line of six 40px stops joined by 4px rounded segments. Current: Acid Lime disc with a 6px halo at 35% and an ink centre dot, status line on a lime tag. Done: forest green disc with a white check. Waiting: white disc with a 3px ink ring and ink dot. Future: white disc with a 3px hollow-stop ring. The interchange stop (Bo's 37:13 mistake) swaps the dot for a two-way arrow. A segment fills forest green only when both ends are travelled. Each stop is a button; unavailable stops stay focusable with `aria-disabled` and a reason in the title. Clickable stops nudge 2px right on hover. Below lg it becomes a horizontal strip of 28px stops.

### Task Card "Việc của bạn bây giờ" (signature)
One card under the video whose content follows the lesson beat: watch, diagnose, rebut, closure, continue. Heading has a 28px forest target icon and a balanced 18 to 19px title, instruction capped at 70ch. Diagnose shows lettered option rows (12px corners, A/B/C squares in Spring Ground; selected row inverts to ink with a lime letter square) and a right-aligned primary "Xác nhận đáp án". Grading shows a hairline status row with a lime ShieldCheck disc and a sentence naming who is working.

### Face-off (signature)
Three panels: "Bo nói", "Lượt của bạn", "Cô Lam chốt", each with a 56px round avatar, 18px title and an outlined role tag. Bo's steps are numbered Mist rows; the wrong step becomes a brick-washed row with a red X disc and a 2px red strike that also crosses KaTeX. The learner panel is the only lime-framed one and holds the editor, a two-step hint ladder (dashed rows that unlock in order), a collapsible set of ready-made arguments, and a full-width primary "Gửi phản biện". Cô Lam's panel is a dashed locked well with a lock disc until Bo is refuted, then a lime-bordered rule box and "Tiếp tục bài giảng" / "Sang Trạm 2".

### Agent Map (signature)
Modal on a Mist body. White header row: lime-badge title, one-line turn summary separated by middle dots (turn number, question, lecture time, latency), previous/next turn circles with an n/N counter, ink close circle. The lane canvas is a white 16px card with a 24px faint grid; four lanes with icon headers (Hiểu câu hỏi, Lấy ngữ cảnh, Kiểm chứng, Trả lời), blocks staggered 52px per filled lane so the line reads left to right, joined by 2px Connector Lime elbows with ink end dots. Empty lanes shrink to 150px with a dashed "Không dùng". Blocks are 12px-corner buttons with an avatar or a lime-tinted icon square, bold title (mono for tools), two-line subtitle, and a metric coloured green (ok) or rust (warn); selected adds an ink border and a 2px lime ring. The 380px detail panel lists agent, selected block inputs/outputs, tools with verdicts, context used (with a count of context hidden from the agent), and numbered citations that seek the video.

### Chat Message
Avatar, bold author, role tag, timestamp chip; body in a white 16px bubble with a hairline. Messages longer than the threshold clamp to three lines with an underlined "Xem thêm" / "Thu gọn" toggle. A pinned Trợ giảng An note sits as a one-line bar above the stream with an outlined "Ghim" tag and a "Xem" toggle, never floating over messages.

## Do's and Don'ts

### Do:
- **Do** keep exactly one Acid Lime-filled primary action per view, and fill lime only on what is current.
- **Do** give every AI message at most one outlined evidence chip with a check disc, and hide the source list behind an "n nguồn" toggle.
- **Do** mark past in forest green (#1F5E3A), present in lime, future as hollow rings, everywhere a sequence is shown (rail, switcher).
- **Do** say what is happening while waiting ("Đang chấm lập luận của bạn…") inside a status row, never a bare spinner.
- **Do** typeset all maths with KaTeX, and strike wrong maths with the red background line so the strike crosses KaTeX boxes.
- **Do** keep functional text at 11px or larger, body at 15px, and controls at 40 to 44px for projector legibility.
- **Do** give every interactive element a 2px ink focus outline at 2px offset; keep unavailable steps focusable with a stated reason.
- **Do** write learner copy in plain Vietnamese; keep English only for real names (Agent Map) and tool identifiers in mono.

### Don't:
- **Don't** fill evidence, tags or decoration with Acid Lime; evidence uses the deeper Evidence Green outline.
- **Don't** show "mock", "demo data" or "simulation" labels in learner surfaces; fallback data looks and reads like production.
- **Don't** put internal jargon (FSM, dispatcher, trace, payload, beat) in learner copy.
- **Don't** use red anywhere in the chrome except Bo's wrong step.
- **Don't** add shadows to resting cards, or use hard offset shadows; elevation is soft, negative-spread and tinted.
- **Don't** introduce a second display face, slate/teal/stone neutrals, or a second accent hue; the ink ladder and hairline greens are the whole neutral set.
- **Don't** float notes or pinned messages over the chat stream; pin them as a bar above it.
- **Don't** add uppercase tracked micro-labels above headings or rows.
