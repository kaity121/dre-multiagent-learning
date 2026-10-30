# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary audience for this phase:** the jury at the hackathon finals. They watch the product on a laptop driving a projector (1440–1920px), while the team plays a Vietnamese grade-12 student. Desktop comes first; mobile only has to stay usable and not break.
- **Learner the story is told for:** a grade-12 student learning "Vectơ trong không gian" from a recorded lecture by thầy Nguyễn Phan Tiến.
- **Secondary audience:** a teacher who prepares the lesson before class (Phase 1: War Room, Timeline Editor, approval).

## Product Purpose

DRE (Diagnose → Repair → Explain) turns a math misconception into a thinking breakthrough. It addresses three problems:

- Students fall into the "illusion of understanding" after passively watching a video.
- Chatbots hand out answers.
- Students are afraid of being wrong in front of the class.

Success means the student repairs a misconception themselves, by diagnosing and rebutting an AI classmate's mistake. Being handed the answer does not count.

## Positioning

**"Nudges, not answers."** A class of AI agents learns alongside the student:

- **Bo** is deliberately wrong first.
- **The student** becomes the one who corrects Bo.
- **Cô Lam** locks in the golden rule.

Behind every step are role-specialised agents with isolated context. Deterministic tools judge the maths, not the LLM. **AI transparency is a co-equal value:** the student can open an Agent Map that shows which agent answered, why, and what was checked. This is what separates DRE from MOOCs and from 1-1 AI tutors.

## Operating Context

### Phase 1: teacher, before class

1. The lecture video is ingested: Whisper transcribes the speech and a vision model reads the board.
2. An A2A roundtable over SSE drafts the lesson in four passes: extract, RAG, a tool audit of up to 3 rounds, then pacing and Bloom.
3. The teacher reviews the draft in the Timeline Editor (pacing collisions under 20s) and approves it.

### Phase 2: student, in class

- **Branch A, free questions.** The Intent Dispatcher picks exactly one agent per message:
  - Linh Chi: formulas and mnemonics.
  - Trí: concepts, using tools.
  - Bo: wrong shortcuts.
  - Trợ giảng An: scaffolding hints.
  - Minh Khang: encouragement.
  - Messages outside the lesson source get `not_in_source`.
- **Branch B, the checkpoint FSM at 37:13** (8 steps):
  1. Cô Lam opens the checkpoint.
  2. The student answers.
  3. The Assessor grades the answer.
  4. Bo's trap is chosen.
  5. Bo challenges the student.
  6. The student rebuts.
  7. The Assessor grades the rebuttal.
  8. Bo concedes and Cô Lam closes, with hints at level 1, then level 2.

The product UI keeps four stations: 1 · Video, 2 · Sổ tay, 3 · Đoán (POE), 4 · Dạy kèm (protégé).

## Capabilities and Constraints

- **Stack:** React 19, TypeScript, Vite 8, Tailwind 4, KaTeX. The backend is Node and Express on port 3001, calling the OpenAI API.
- **Agents:** Bo, Trí, Linh Chi, Minh Khang, Cô Lam, Trợ giảng An, Assessor, plus the Dispatcher.
- **Deterministic tools (6):**
  - `verify_vector_algebra`
  - `calculate_dot_product`
  - `query_misconception_kb`
  - `check_source_grounding`
  - `timeline_collision_checker`
  - `evaluate_bloom_level`
- **Evaluator:** Hesitation Index; mastery requires Bloom L4–L6; action layer `create_learning_record`, `update_mastery_state`, `create_review_task`. Stations use the backend evaluator and fall back to bundled demo data when it is unreachable.
- **Offline/demo fallback must keep working with no network or API key.** It carries no visible "mock / simulation" label, because the UI should read as production.
- **Product decision:** the student may open the Agent Map.
- **UI language:** Vietnamese, with short English technical keywords where they are the real names.

## Brand Commitments

- Name: DRE.
- Tagline: "Biến ngộ nhận toán học thành bước đột phá tư duy".
- The Lime Soft palette is binding:
  - background `#F3F8E8`
  - border `#E2EAD2`
  - accent `#C8F169`
  - ink `#121712`
- Font: Be Vietnam Pro, with JetBrains Mono for code.
- The existing agent avatars and the seven agent names and roles stay. Always use "Minh Khang", never the old names Nam or Mai.

## Evidence on Hand

- Pitch deck: Google Slides, "DRE – Chung kết". It has 23 slides covering agents, FSM, roundtable and tools.
- Lesson data: `VID_VECTO_12_TIEN`, with the checkpoint at 37:13.
- Knowledge base: 20 misconceptions, 20 exercises and 24 knowledge units in `data/subject-packs/math/vector-12.json`.
- Second subject pack: `VID_AI_INTRO_01`.
- Tests: `node --test`.
- There is no learner survey and no measured learning gain. Do not show percentages, testimonials or outcome claims.

## Product Principles

1. **Nudges, not answers.** The UI never hands the student the solution before they have tried. It always shows the next small step.
2. **The student is the corrector.** Every screen should make it obvious whose mistake is being fixed and what the student should do next.
3. **Transparent by default.** Any AI claim can be traced to the agent, the tool and the lecture second behind it.
4. **One story, many stations.** The four stations are chapters of a single Diagnose → Repair → Explain journey, not separate apps.
5. **Honest state.** Never show a fake success, a fake save or a stuck spinner. When something is waiting or failing, say so in plain Vietnamese.

## Accessibility & Inclusion

- The display is a projector, so text must stay legible at distance: functional text at least 11px, with high contrast.
- Keyboard: Space pauses, Esc closes.
- The UI should be usable by a grade-12 student with no technical vocabulary.
