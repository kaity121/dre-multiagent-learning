import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const PACKS_DIR = path.resolve(REPO_ROOT, 'data/subject-packs');

// KB vectơ cũ chỉ là phương án dự phòng cho đúng gói math/vector-12, không cho môn khác.
const LEGACY_FALLBACKS = {
  'math/vector-12': path.resolve(__dirname, '../data/dre_vector_kb.json'),
};

const SAFE_SEGMENT = /^[a-z0-9][a-z0-9_-]*$/i;
const packsCache = new Map();

/**
 * Tải một Subject Pack theo môn và tên gói.
 * @param {string} [subject='math'] ví dụ: 'math', 'ai', 'literature'
 * @param {string} [packName='vector-12']
 * @returns {object|null} null nếu không tồn tại hoặc không đọc được
 */
export function getSubjectPack(subject = 'math', packName = 'vector-12') {
  if (!SAFE_SEGMENT.test(String(subject)) || !SAFE_SEGMENT.test(String(packName))) return null;

  const key = `${subject}/${packName}`;
  if (packsCache.has(key)) return packsCache.get(key);

  const candidatePaths = [path.join(PACKS_DIR, subject, `${packName}.json`)];
  if (LEGACY_FALLBACKS[key]) candidatePaths.push(LEGACY_FALLBACKS[key]);

  for (const p of candidatePaths) {
    if (!fs.existsSync(p)) continue;
    try {
      const pack = JSON.parse(fs.readFileSync(p, 'utf8'));
      packsCache.set(key, pack);
      return pack;
    } catch (err) {
      console.warn(`[SubjectPackLoader] Lỗi đọc gói môn ${p}:`, err.message);
    }
  }

  return null;
}

export function listAvailablePacks() {
  if (!fs.existsSync(PACKS_DIR)) return [];
  const result = [];
  for (const s of fs.readdirSync(PACKS_DIR)) {
    const sDir = path.join(PACKS_DIR, s);
    if (!fs.statSync(sDir).isDirectory()) continue;
    for (const f of fs.readdirSync(sDir).filter((name) => name.endsWith('.json'))) {
      result.push({ subject: s, packName: f.replace(/\.json$/, '') });
    }
  }
  return result;
}

export default { getSubjectPack, listAvailablePacks };
