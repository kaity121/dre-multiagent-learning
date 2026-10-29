import { randomUUID } from 'node:crypto';

/**
 * In-memory store — đủ dùng cho pilot test/demo, KHÔNG sống sót qua restart server
 * và KHÔNG chia sẻ giữa nhiều instance. Khi cần nhiều buổi/nhiều học viên thật,
 * thay Map này bằng bảng DB (VD: Postgres) giữ đúng shape của object session bên dưới —
 * phần orchestrator.js không cần đổi gì khi thay storage.
 */
const sessions = new Map();

export function createSession({ misconceptionId = 'MISC_VEC_005', id = null } = {}) {
  const sessionId = id || randomUUID();
  const session = {
    id: sessionId,
    misconceptionId,
    hintLevel: 0, // 0 = chưa dùng gợi ý, 1 = đã dùng gợi ý cấp 1, 2 = đã dùng cấp 2
    cauTraLoiGoc: null,
    danhGiaGoc: null, // "dung" | "sai"
    loaiBay: null,
    done: false,
    activity_log: [], // Issue #11 & PR #21 Activity Log Events
    createdAt: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

export function getSession(id) {
  const session = sessions.get(id);
  if (!session) {
    throw new Error(`Không tìm thấy session "${id}" — có thể đã hết hạn hoặc server vừa restart.`);
  }
  return session;
}

export function updateSession(id, patch) {
  const session = getSession(id);
  Object.assign(session, patch);
  sessions.set(id, session);
  return session;
}

export function getOrCreateSession(id, defaultProps = {}) {
  if (id && sessions.has(id)) {
    return sessions.get(id);
  }
  return createSession({ ...defaultProps, id: id || undefined });
}

/**
 * Ghi nhận sự kiện ActivityLogEvent vào session (Issue #11 & PR #21)
 *
 * @param {string} sessionId
 * @param {Object} event
 * @param {string} event.type - 'intent_routed' | 'learner_answer' | 'bo_conceded' | 'scaffolding_hint' | etc.
 * @param {Object} [event.payload]
 * @returns {Object} event entry vừa ghi nhận
 */
export function logActivityEvent(sessionId, event) {
  const session = getOrCreateSession(sessionId);
  if (!Array.isArray(session.activity_log)) {
    session.activity_log = [];
  }
  const entry = {
    id: event.id || randomUUID(),
    timestamp: event.timestamp || Date.now(),
    type: event.type || 'activity_event',
    ...event,
  };
  session.activity_log.push(entry);
  return entry;
}

export default {
  createSession,
  getSession,
  updateSession,
  getOrCreateSession,
  logActivityEvent,
};
