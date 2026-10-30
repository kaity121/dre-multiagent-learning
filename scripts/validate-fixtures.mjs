// Validates every mock/ fixture against the TypeScript contracts in src/types/pipeline.ts,
// plus the lesson pacing rules that the types alone cannot express.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator } from 'ts-json-schema-generator';
import Ajv from 'ajv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const FIXTURES = [
  { file: 'mock/mock_cognitive_stream_vecto12.json', type: 'CognitiveEventStream' },
  { file: 'mock/mock_short_clip_sample.json', type: 'CognitiveEventStream' },
  { file: 'backend/src/data/lesson-index/VID_VECTO_12_TIEN.json', type: 'CognitiveEventStream' },
  { file: 'mock/lesson.json', type: 'DRELessonSchema' },
  { file: 'mock/session_001.json', type: 'DRESessionSchema' },
  { file: 'mock/mock_reasoning_events.json', type: 'AgentReasoningEvent', isArray: true },
  // Roundtable output (#9/#10): the generated lesson must stay a DRELessonSchema draft.
  { file: 'mock/mock_roundtable_run_fixture.json', pick: 'lesson', type: 'DRELessonSchema' },
  { file: 'mock/mock_roundtable_run_fixture.json', pick: 'reasoning_events', type: 'AgentReasoningEvent', isArray: true },
  { file: 'backend/src/data/drafts/lesson_draft_VID_VECTO_12_TIEN.json', pick: 'lesson', type: 'DRELessonSchema', pacing: true },
  { file: 'backend/src/data/drafts/lesson_draft_CLIP_DEMO_60S_TIEN_EX3.json', pick: 'lesson', type: 'DRELessonSchema' },
  { file: 'backend/src/data/drafts/lesson_draft_VID_SHORT_60S.json', pick: 'lesson', type: 'DRELessonSchema' },
];

// Pacing rules agreed for the classroom (PRODUCT.md, issue #9).
const PART_OPENING_S = 60;
const MIN_PASSIVE_GAP_S = 20;
// A Bo debate fired right after a checkpoint belongs to the same pause.
const CHAINED_PAUSE_WINDOW_S = 5;

const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

const generator = createGenerator({
  path: path.join(root, 'src/types/pipeline.ts'),
  tsconfig: path.join(root, 'tsconfig.json'),
  type: '*',
  skipTypeCheck: true,
});
const schema = generator.createSchema('*');
const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addSchema(schema, 'pipeline');

for (const { file, pick, type, isArray } of FIXTURES) {
  const label = pick ? `${file}#${pick}` : file;
  const data = pick ? readJson(file)[pick] : readJson(file);
  const ref = { $ref: `pipeline#/definitions/${type}` };
  const validate = ajv.compile(isArray ? { type: 'array', items: ref } : ref);
  if (!validate(data)) {
    for (const err of validate.errors) fail(label, `${err.instancePath || '/'} ${err.message}`);
  }
  // A roundtable draft is produced for teacher review and must never arrive pre-approved.
  if (type === 'DRELessonSchema' && pick && data?.status !== 'draft') fail(label, `status is ${data?.status}, expected draft`);
}

function checkLesson(file, lesson) {
  const ids = new Set();
  for (const part of lesson.parts) {
    const items = [
      ...part.pause_questions.map((q) => ({ id: q.question_id, at: q.at_s, pauses: true, passive: false })),
      ...part.scenarios.map((s) => ({
        id: s.scenario_id,
        at: s.at_s,
        pauses: s.pause_video,
        passive: s.interaction_type === 'passive_comment',
      })),
    ].sort((a, b) => a.at - b.at);

    for (const item of items) {
      if (ids.has(item.id)) fail(file, `duplicate id ${item.id}`);
      ids.add(item.id);
      if (item.at < part.start_s || item.at > part.end_s) fail(file, `${item.id} at ${item.at}s is outside ${part.part_id}`);
      if (item.at < part.start_s + PART_OPENING_S) fail(file, `${item.id} interrupts the opening of ${part.part_id}`);
      if (item.passive && item.pauses) fail(file, `${item.id} is a passive comment but pauses the video`);
    }

    const pauses = items.filter((i) => i.pauses);
    const separatePauses = pauses.filter((p, i) => i === 0 || p.at - pauses[i - 1].at > CHAINED_PAUSE_WINDOW_S);
    if (separatePauses.length > 1) fail(file, `${part.part_id} pauses the video ${separatePauses.length} times (max 1)`);

    const passives = items.filter((i) => i.passive);
    passives.forEach((p, i) => {
      if (i > 0 && p.at - passives[i - 1].at < MIN_PASSIVE_GAP_S) {
        fail(file, `${p.id} is less than ${MIN_PASSIVE_GAP_S}s after ${passives[i - 1].id}`);
      }
    });
  }

  const sourceIds = new Set(lesson.sources.map((s) => s.source_id));
  for (const part of lesson.parts) {
    for (const ref of part.source_refs) if (!sourceIds.has(ref)) fail(file, `${part.part_id} references unknown source ${ref}`);
  }
}

function checkSession(file, session, lesson) {
  const eventIds = new Set(session.activity_log.map((e) => e.event_id));
  const partIds = new Set(lesson.parts.map((p) => p.part_id));
  const goalIds = new Set(lesson.parts.flatMap((p) => p.goals.map((g) => g.goal_id)));

  for (const e of session.activity_log) {
    if (!partIds.has(e.part_id)) fail(file, `${e.event_id} references unknown part ${e.part_id}`);
  }
  const evidenceLists = [
    ...session.assessment.goals.map((g) => [g.goal_id, g.evidence_event_ids]),
    ...session.part_reviews.map((r) => [r.part_id, r.evidence_event_ids]),
  ];
  for (const [owner, evidence] of evidenceLists) {
    for (const id of evidence) if (!eventIds.has(id)) fail(file, `${owner} cites missing event ${id}`);
  }
  for (const g of session.assessment.goals) {
    if (!goalIds.has(g.goal_id)) fail(file, `assessment references unknown goal ${g.goal_id}`);
    // A goal backed only by multiple-choice answers cannot be mastered.
    const evidence = session.activity_log.filter((e) => g.evidence_event_ids.includes(e.event_id));
    if (g.result === 'mastered' && evidence.every((e) => e.type === 'pause_question_answer')) {
      fail(file, `${g.goal_id} is mastered with only multiple-choice evidence (must be attempted)`);
    }
  }
}

function checkReasoning(file, events) {
  for (const e of events) {
    if ((e.eventType === 'tool_call' || e.eventType === 'tool_result') && !e.toolCall) {
      fail(file, `${e.id} is a ${e.eventType} without toolCall`);
    }
  }
}

const lesson = readJson('mock/lesson.json');
checkLesson('mock/lesson.json', lesson);
checkSession('mock/session_001.json', readJson('mock/session_001.json'), lesson);
checkReasoning('mock/mock_reasoning_events.json', readJson('mock/mock_reasoning_events.json'));
checkReasoning('mock/mock_roundtable_run_fixture.json#reasoning_events', readJson('mock/mock_roundtable_run_fixture.json').reasoning_events);
for (const { file, pick } of FIXTURES.filter((f) => f.pacing)) {
  checkLesson(`${file}#${pick}`, readJson(file)[pick]);
}

if (errors.length) {
  console.error(`Fixture validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`All ${FIXTURES.length} fixtures match src/types/pipeline.ts and the lesson pacing rules.`);
