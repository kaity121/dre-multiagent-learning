import fs from 'node:fs';
import { Router } from 'express';
import { extractClip, listClips, resolveClip, STAGES } from '../services/clipExtractor.js';

export const extractRouter = Router();

// Optional sidecar `<clip>.json` next to the mp4 describes where the clip was cut from.
function clipMeta(clipPath) {
  const sidecar = clipPath.replace(/\.mp4$/, '.json');
  return fs.existsSync(sidecar) ? JSON.parse(fs.readFileSync(sidecar, 'utf8')) : {};
}

function findClip(req, res) {
  const name = req.params.name ?? req.body?.clip;
  const clipPath = name && resolveClip(name);
  if (!clipPath) {
    res.status(404).json({ ok: false, error: `Clip "${name}" not found`, clips: listClips() });
    return null;
  }
  return clipPath;
}

// GET /api/extract/clips — demo clips available on the server, plus the named stages
extractRouter.get('/clips', (req, res) => {
  res.json({ ok: true, clips: listClips(), stages: STAGES });
});

// POST /api/extract/clip { clip, refresh? } — run extraction and return the CognitiveEventStream
extractRouter.post('/clip', async (req, res) => {
  const clipPath = findClip(req, res);
  if (!clipPath) return;
  const stages = [];
  const stream = await extractClip(clipPath, {
    meta: clipMeta(clipPath),
    useCache: !req.body?.refresh,
    onStage: (e) => stages.push(e),
  });
  res.json({ ok: true, stream, stages });
});

// GET /api/extract/clip/:name/stream?refresh=1 — Server-Sent Events: `stage` events, then `done`
extractRouter.get('/clip/:name/stream', async (req, res) => {
  const clipPath = findClip(req, res);
  if (!clipPath) return;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  send('stages', STAGES);
  const stream = await extractClip(clipPath, {
    meta: clipMeta(clipPath),
    useCache: req.query.refresh !== '1',
    onStage: (e) => send('stage', e),
  });
  send('done', { stream });
  res.end();
});
