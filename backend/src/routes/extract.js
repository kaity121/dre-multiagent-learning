import fs from 'node:fs';
import { Router } from 'express';
import { extractClip, listClips, resolveClip, STAGES } from '../services/clipExtractor.js';

export const extractRouter = Router();

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Express 4 does not forward rejected promises from async handlers, so route them to next().
const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// Optional sidecar `<clip>.json` next to the mp4 describes where the clip was cut from.
function clipMeta(clipPath) {
  const sidecar = clipPath.replace(/\.mp4$/i, '.json');
  if (!fs.existsSync(sidecar)) return {};
  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
  } catch (err) {
    throw new HttpError(500, `Clip metadata is unreadable: ${err.message}`);
  }
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new HttpError(500, 'Clip metadata must be a JSON object');
  }
  return meta;
}

function findClip(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new HttpError(400, 'Field "clip" must be a non-empty clip file name', { clips: listClips() });
  }
  const clipPath = resolveClip(name);
  if (!clipPath) throw new HttpError(404, `Clip "${name}" not found`, { clips: listClips() });
  return clipPath;
}

// GET /api/extract/clips — demo clips available on the server, plus the named stages
extractRouter.get('/clips', (req, res) => {
  res.json({ ok: true, clips: listClips(), stages: STAGES });
});

// POST /api/extract/clip { clip, refresh? } — run extraction and return the CognitiveEventStream
extractRouter.post(
  '/clip',
  asyncRoute(async (req, res) => {
    const clipPath = findClip(req.body?.clip);
    const meta = clipMeta(clipPath);
    const stages = [];
    const stream = await extractClip(clipPath, {
      meta,
      useCache: !req.body?.refresh,
      onStage: (e) => stages.push(e),
    });
    res.json({ ok: true, stream, stages });
  }),
);

// GET /api/extract/clip/:name/stream?refresh=1 — Server-Sent Events: `stage` events, then `done`
extractRouter.get(
  '/clip/:name/stream',
  asyncRoute(async (req, res) => {
    // Validate before the event stream opens so bad requests still get a status code.
    const clipPath = findClip(req.params.name);
    const meta = clipMeta(clipPath);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const send = (event, data) => {
      if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send('stages', STAGES);
    const stream = await extractClip(clipPath, {
      meta,
      useCache: req.query.refresh !== '1',
      onStage: (e) => send('stage', e),
    });
    send('done', { stream });
    res.end();
  }),
);

// Controlled errors for this router: JSON before a response starts, an `error` event once SSE is open.
extractRouter.use((err, req, res, next) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : 'Clip extraction failed';
  if (status >= 500) console.error('[extract]', err);
  if (res.headersSent) {
    if (!res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify({ ok: false, error: message })}\n\n`);
      res.end();
    }
    return;
  }
  res.status(status).json({ ok: false, error: message, ...(err.extra ?? {}) });
});
