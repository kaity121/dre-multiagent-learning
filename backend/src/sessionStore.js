import { randomUUID } from 'node:crypto';

/**
 * In-memory store — đủ dùng cho pilot test/demo, KHÔNG sống sót qua restart server
 * và KHÔNG chia sẻ giữa nhiều instance. Khi cần nhiều buổi/nhiều học viên thật,
 * thay Map này bằng bảng DB (VD: Postgres) giữ đúng shape của object session bên dưới —
 * phần orchestrator.js không cần đổi gì khi thay storage.
 */
const sessions = new Map();

export function createSession({ misconceptionId }) {
  const id = randomUUID();
  const session = {
    id,
    misconceptionId,
    hintLevel: 0, // 0 = chưa dùng gợi ý, 1 = đã dùng gợi ý cấp 1, 2 = đã dùng cấp 2
    cauTraLoiGoc: null,
    danhGiaGoc: null, // "dung" | "sai"
    loaiBay: null,
    done: false,
    createdAt: Date.now(),
  };
  sessions.set(id, session);
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
