/**
 * backend/src/services/runRecorder.js
 *
 * Manages run persistence, replay streaming and inspection of Multi-Agent Roundtable sessions.
 * Supports:
 * - Local filesystem storage in backend/src/data/runs/<runId>.json
 * - Built-in fixture loading ('fixture' or 'mock') from mock/mock_reasoning_events.json
 * - Simulated SSE Replay streaming with configurable speed factor (1x, 2x, 5x...)
 * - Auto-recording of live roundtable streams
 */

import fs from 'fs';
import path from 'path';

const RUNS_DIR = path.resolve(process.cwd(), 'backend/src/data/runs');
const FIXTURE_PATH = path.resolve(process.cwd(), 'mock/mock_reasoning_events.json');

/**
 * Sanitize runId to prevent Path Traversal attacks (e.g. '../../etc')
 * Only allows alphanumeric characters, underscores, and hyphens.
 * @param {string} runId
 * @returns {string} Safe runId
 */
export function sanitizeRunId(runId) {
  if (!runId || typeof runId !== 'string') return '';
  // Strip out directory separators and illegal characters
  return runId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Validates that a resolved path is strictly within the allowed directory
 * @param {string} filePath
 * @param {string} baseDir
 * @returns {boolean}
 */
function isPathContained(filePath, baseDir) {
  const rel = path.relative(baseDir, filePath);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Ensure the runs storage directory exists
 */
function ensureRunsDir() {
  if (!fs.existsSync(RUNS_DIR)) {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
  }
}

/**
 * Save a roundtable run session to disk
 * @param {Object} runData
 * @returns {{ success: boolean, runId: string, filePath: string }}
 */
export function saveRun(runData) {
  ensureRunsDir();

  const rawRunId = runData.runId || `run_${Date.now()}`;
  const safeRunId = sanitizeRunId(rawRunId) || `run_${Date.now()}`;
  const filePath = path.resolve(RUNS_DIR, `${safeRunId}.json`);

  if (!isPathContained(filePath, RUNS_DIR)) {
    throw new Error(`[Security] Invalid runId path traversal attempt: ${rawRunId}`);
  }

  const payload = {
    ...runData,
    runId: safeRunId,
    savedAt: runData.savedAt || new Date().toISOString(),
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

  return {
    success: true,
    runId: safeRunId,
    filePath,
  };
}

/**
 * Retrieve a saved run or load mock fixture
 * @param {string} runId - Run identifier or 'fixture' / 'mock'
 * @returns {Object|null}
 */
export function getRun(runId) {
  if (!runId) return null;

  const rawId = String(runId).trim();
  if (rawId === 'fixture' || rawId === 'mock' || rawId === 'run_vecto12_part3_wow_moment') {
    if (fs.existsSync(FIXTURE_PATH)) {
      try {
        return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));
      } catch (err) {
        console.error('[RunRecorder] Error reading fixture file:', err);
        return null;
      }
    }
  }

  const safeRunId = sanitizeRunId(rawId);
  if (!safeRunId) return null;

  ensureRunsDir();
  const filePath = path.resolve(RUNS_DIR, `${safeRunId}.json`);

  if (!isPathContained(filePath, RUNS_DIR)) {
    console.warn(`[Security] Path containment check failed for runId: ${rawId}`);
    return null;
  }

  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error(`[RunRecorder] Error reading run file ${filePath}:`, err);
      return null;
    }
  }

  return null;
}

/**
 * List all saved runs with summary metadata
 * @returns {Array<Object>}
 */
export function listRuns() {
  ensureRunsDir();

  const results = [];

  // Always include standard fixture run if present
  if (fs.existsSync(FIXTURE_PATH)) {
    try {
      const fixtureData = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));
      results.push({
        runId: fixtureData.runId || 'fixture',
        isFixture: true,
        title: fixtureData.videoTitle || 'Bài 1.1: Vectơ Trong Không Gian (Fixture)',
        partNumber: fixtureData.partNumber || 3,
        videoId: fixtureData.videoId || 'VID_VECTO_12_TIEN',
        createdAt: fixtureData.createdAt || '2026-10-29T16:00:00.000Z',
        totalEvents: (fixtureData.reasoning_events || []).length,
        crossCheckCorrectionOccurred: Boolean(fixtureData.stats?.crossCheckCorrectionOccurred),
        bloomLevel: fixtureData.stats?.bloomLevel || 'Analyze',
      });
    } catch (_) {}
  }

  // Scan local saved runs
  try {
    const files = fs.readdirSync(RUNS_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const runId = file.replace(/\.json$/, '');
      if (runId === 'run_vecto12_part3_wow_moment') continue; // Avoid duplicate with fixture

      try {
        const fullPath = path.join(RUNS_DIR, file);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        results.push({
          runId,
          isFixture: false,
          title: data.videoTitle || data.title || 'Bài giảng Vectơ',
          partNumber: data.partNumber || 'all',
          videoId: data.videoId,
          createdAt: data.createdAt || data.savedAt,
          totalEvents: (data.reasoning_events || data.events || []).length,
          crossCheckCorrectionOccurred: Boolean(data.stats?.crossCheckCorrectionOccurred || data.crossCheckCorrectionOccurred),
          bloomLevel: data.stats?.bloomLevel || 'Analyze',
        });
      } catch (_) {}
    }
  } catch (err) {
    console.error('[RunRecorder] Error listing runs:', err);
  }

  return results;
}

/**
 * Replay reasoning events over SSE with simulated timing and multi-event emission
 * @param {Object} runData - Run payload containing reasoning_events
 * @param {Object} options
 * @param {number} [options.speed=1] - Playback speed multiplier (e.g. 1, 2, 5)
 * @param {number} [options.streamDelayMs=40] - Base delay between events in milliseconds
 * @param {Function} options.sendSSE - Function (eventName, data) to send SSE message
 * @param {Function} [options.isAborted] - Predicate returning true if client disconnected
 */
export async function streamReplayEvents(runData, {
  speed = 1,
  streamDelayMs = 40,
  sendSSE,
  isAborted = () => false,
} = {}) {
  const events = runData.reasoning_events || runData.events || [];
  const safeSpeed = Math.max(0.25, Number(speed) || 1);
  const safeBaseDelay = Math.max(0, Number(streamDelayMs) || 40);
  const delay = Math.max(5, Math.floor(safeBaseDelay / safeSpeed));

  // Send session_start
  sendSSE('session_start', {
    runId: runData.runId || 'replay_run',
    mode: 'replay',
    speed: safeSpeed,
    videoId: runData.videoId,
    partNumber: runData.partNumber,
    totalEvents: events.length,
    timestamp: new Date().toISOString(),
  });

  for (let i = 0; i < events.length; i++) {
    if (isAborted()) break;

    const event = events[i];

    // Emit event: reasoning
    sendSSE('reasoning', event);

    // Emit event: reasoning_event (backwards compatibility for existing tests/clients)
    sendSSE('reasoning_event', event);

    // Emit event: <eventType> (e.g. 'thought', 'tool_call', 'debate_turn', 'cross_check_verdict'...)
    if (event.eventType) {
      sendSSE(event.eventType, event);
    }

    // Emit generic message event
    sendSSE('message', event);

    if (delay > 0 && i < events.length - 1) {
      if (isAborted()) break;
      await new Promise(resolve => {
        const timer = setTimeout(resolve, delay);
        if (typeof isAborted === 'function') {
          // If aborted during delay, wake up early
          const checkInterval = setInterval(() => {
            if (isAborted()) {
              clearTimeout(timer);
              clearInterval(checkInterval);
              resolve();
            }
          }, Math.min(delay, 25));
          setTimeout(() => clearInterval(checkInterval), delay + 10);
        }
      });
    }
  }

  if (isAborted()) return;

  // Emit event: done
  sendSSE('done', {
    runId: runData.runId,
    mode: 'replay',
    totalEvents: events.length,
    lesson: runData.lessonDraft || runData.draft || null,
    lessonDraft: runData.lessonDraft || runData.draft || null,
    timestamp: new Date().toISOString(),
  });

  // Emit event: complete
  sendSSE('complete', {
    ok: true,
    mode: 'replay',
    runId: runData.runId,
    draft: runData.lessonDraft || runData.draft || null,
    stats: runData.stats || {
      totalEvents: events.length,
      crossCheckCorrectionOccurred: Boolean(runData.stats?.crossCheckCorrectionOccurred),
    },
    timestamp: new Date().toISOString(),
  });
}
