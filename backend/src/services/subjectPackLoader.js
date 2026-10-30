import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../');
const PACKS_DIR = path.resolve(REPO_ROOT, 'data/subject-packs');

const packsCache = new Map();

/**
 * Tải một Subject Pack dựa trên subject và packName
 * @param {string} subject ví dụ: 'math', 'ai', 'literature'
 * @param {string} [packName='vector-12']
 * @returns {object|null}
 */
export function getSubjectPack(subject = 'math', packName = 'vector-12') {
  const key = `${subject}/${packName}`;
  if (packsCache.has(key)) return packsCache.get(key);

  const candidatePaths = [
    path.join(PACKS_DIR, subject, `${packName}.json`),
    path.join(process.cwd(), `data/subject-packs/${subject}/${packName}.json`),
    path.join(process.cwd(), `backend/src/data/dre_vector_kb.json`), // fallback legacy
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        const pack = JSON.parse(raw);
        packsCache.set(key, pack);
        return pack;
      } catch (err) {
        console.warn(`[SubjectPackLoader] Lỗi đọc gói môn ${p}:`, err);
      }
    }
  }

  return null;
}

export function listAvailablePacks() {
  if (!fs.existsSync(PACKS_DIR)) return [];
  const subjects = fs.readdirSync(PACKS_DIR);
  const result = [];
  for (const s of subjects) {
    const sDir = path.join(PACKS_DIR, s);
    if (fs.statSync(sDir).isDirectory()) {
      const files = fs.readdirSync(sDir).filter(f => f.endsWith('.json'));
      for (const f of files) {
        result.push({ subject: s, packName: f.replace('.json', '') });
      }
    }
  }
  return result;
}

export default { getSubjectPack, listAvailablePacks };
