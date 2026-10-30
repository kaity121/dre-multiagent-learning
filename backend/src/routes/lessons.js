import { Router } from 'express';
import { listLessons, getLessonIndex, getBoardStateAt } from '../services/lessonIndex.js';

export const lessonsRouter = Router();

// GET /api/lessons — pre-indexed lessons available offline
lessonsRouter.get('/', (req, res) => {
  res.json({ ok: true, lessons: listLessons() });
});

// GET /api/lessons/:videoId/index — full CognitiveEventStream
lessonsRouter.get('/:videoId/index', (req, res) => {
  const stream = getLessonIndex(req.params.videoId);
  if (!stream) return res.status(404).json({ ok: false, error: `Lesson "${req.params.videoId}" is not indexed` });
  res.json({ ok: true, stream });
});

// GET /api/lessons/:videoId/board?t=2233&window=30 — board state and recent speech at second t
lessonsRouter.get('/:videoId/board', (req, res) => {
  const second = Number(req.query.t);
  const windowS = req.query.window === undefined ? 30 : Number(req.query.window);
  if (!Number.isFinite(second) || second < 0 || !Number.isFinite(windowS) || windowS < 0) {
    return res.status(400).json({ ok: false, error: 'Query t (and optional window) must be non-negative numbers' });
  }
  const state = getBoardStateAt(req.params.videoId, second, windowS);
  if (!state) return res.status(404).json({ ok: false, error: `Lesson "${req.params.videoId}" is not indexed` });
  res.json({ ok: true, ...state });
});
