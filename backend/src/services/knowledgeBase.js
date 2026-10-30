import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSubjectPack } from "./subjectPackLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findKbFile() {
  const candidates = [
    path.join(__dirname, "../../../data/subject-packs/math/vector-12.json"),
    path.join(__dirname, "../data/dre_vector_kb.json"),
    path.join(process.cwd(), "data/subject-packs/math/vector-12.json"),
    path.join(process.cwd(), "backend/src/data/dre_vector_kb.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

const kbPath = findKbFile();
let kb = {};
try {
  kb = JSON.parse(fs.readFileSync(kbPath, "utf8"));
} catch (_) {
  kb = { misconceptions: [], knowledge: [], exercises: [], roundtable_policy: {} };
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function hasDiacritics(str) {
  return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(str);
}

const STOPWORDS = new Set([
  'em', 'thay', 'co', 'chua', 'cho', 'nay', 'a', 'oi', 'giup', 'voi', 'bai', 'day',
  'va', 'la', 'thi', 'o', 'cua', 'cac', 'nhung', 'gi', 'sao', 'nao', 'the', 'nhu',
  'minh', 'ban', 'xin', 'hoi', 'lam'
]);

const ALIASES = kb.aliases || {
  'cong do dai vecto': ['length_addition'],
  'cong do dai': ['length_addition'],
  'vi du 3': ['example_3', 'cube'],
  'hinh hop': ['box_rule'],
  'trong tam': ['triangle_centroid', 'tetrahedron_centroid'],
  'vecto doi': ['opposite_vectors'],
  'vecto 0': ['zero_vector'],
  'do dai vecto': ['vector_length'],
  'toa do': ['coordinates'],
  'tich vo huong': ['dot_product']
};

function getAliasTags(query) {
  const qLower = String(query ?? "").toLowerCase();
  const qNorm = normalize(query);
  const tags = new Set();

  for (const [key, tList] of Object.entries(ALIASES)) {
    if (qNorm.includes(key)) {
      tList.forEach(t => tags.add(t));
    }
  }

  // Diacritic-aware boundary checks:
  if (/\bgóc\b/i.test(qLower) && !/\bgốc\b/i.test(qLower)) {
    tags.add('angle');
  }
  if (/\bgốc\b/i.test(qLower)) {
    tags.add('common_origin');
  }

  return tags;
}

function buildContext(item) {
  return {
    misconception: item,
    knowledge: (kb.knowledge || []).filter(k =>
      (item.knowledge_ids || []).includes(k.id)
    ),
    exercises: (kb.exercises || []).filter(e =>
      (item.exercise_ids || []).includes(e.id)
    ),
    roundtable_policy: kb.roundtable_policy || {},
  };
}

export function getById(id) {
  if (!id) return null;
  const item = (kb.misconceptions || []).find(m => m.id === id);
  return item ? buildContext(item) : null;
}

export function search(query, limit = 3) {
  if (!query || typeof query !== 'string' || !query.trim()) return [];

  const rawTokens = String(query ?? "").toLowerCase().match(/[a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ0-9_]+/gu) || [];
  if (!rawTokens.length) return [];

  const aliasTags = getAliasTags(query);
  const isAccented = hasDiacritics(query);
  const queryNormalized = normalize(query);

  const queryTerms = rawTokens
    .map(t => normalize(t))
    .filter(t => t.length > 1 && !STOPWORDS.has(t));

  if (!queryTerms.length && aliasTags.size === 0) return [];

  const scored = (kb.misconceptions || []).map(item => {
    let score = 0;
    const nameNorm = normalize(item.name || "");
    const claimNorm = normalize(item.incorrect_claim || "");
    const tags = (item.tags || []).map(t => normalize(t));
    const rawText = `${nameNorm} ${claimNorm} ${tags.join(" ")}`;

    // 1. Tag matching
    for (const tag of tags) {
      if (aliasTags.has(tag)) score += 8.0;
    }

    // 2. Exact phrase matching
    if (nameNorm.includes(queryNormalized) || claimNorm.includes(queryNormalized)) {
      score += 10.0;
    }

    // 3. Term overlap
    for (const term of queryTerms) {
      if (nameNorm.includes(term)) score += 3.0;
      if (claimNorm.includes(term)) score += 2.0;
      if (tags.some(t => t.includes(term))) score += 2.5;
    }

    // 4. Accent matching boost
    if (isAccented && (item.incorrect_claim || "").toLowerCase().includes(query.toLowerCase())) {
      score += 5.0;
    }

    return { item, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => buildContext(s.item));
}

export { kb };
export default { getById, search, kb };
