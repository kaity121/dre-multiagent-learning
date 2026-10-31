import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { extractClip, listClips, resolveClip, STAGES, CLIPS_DIR } from '../services/clipExtractor.js';
import { saveUploadedClip, UploadError, MAX_UPLOAD_BYTES } from '../services/clipUpload.js';

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
  const sidecar = `${clipPath.slice(0, -path.extname(clipPath).length)}.json`;
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

// Display details for the clip picker; a broken sidecar only loses the title, never the listing.
function clipDetails(name) {
  const file = path.join(CLIPS_DIR, name);
  let title = name;
  let uploadedAt = null;
  try {
    const meta = clipMeta(file);
    if (typeof meta.videoTitle === 'string' && meta.videoTitle.trim()) title = meta.videoTitle.trim();
    if (typeof meta.uploadedAt === 'string') uploadedAt = meta.uploadedAt;
  } catch {
    // unreadable sidecar: keep the file name as the title
  }
  let sizeBytes = null;
  try {
    sizeBytes = fs.statSync(file).size;
  } catch {
    // removed between listing and stat
  }
  return { name, title, sizeBytes, uploadedAt };
}

// GET /api/extract/clips — clips available on the server, plus the named stages
extractRouter.get('/clips', (req, res) => {
  const clips = listClips();
  res.json({ ok: true, clips, items: clips.map(clipDetails), stages: STAGES, maxUploadBytes: MAX_UPLOAD_BYTES });
});

// POST /api/extract/upload?name=<file name> — raw video bytes as the body (Content-Type video/*).
// Responds 201 with the saved clip name, which gets a -2, -3 suffix rather than replacing a clip.
extractRouter.post(
  '/upload',
  asyncRoute(async (req, res) => {
    const saved = await saveUploadedClip(req, {
      rawName: req.query.name,
      contentType: req.get('content-type'),
      contentLength: req.get('content-length'),
    });
    res.status(201).json({ ok: true, ...saved, item: clipDetails(saved.clip), clips: listClips() });
  }),
);

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
  const known = err instanceof HttpError || err instanceof UploadError;
  const status = known ? err.status : 500;
  const message = known ? err.message : 'Clip extraction failed';
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
