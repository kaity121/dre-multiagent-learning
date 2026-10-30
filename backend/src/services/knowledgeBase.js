import { getSubjectPack } from "./subjectPackLoader.js";

// Tri thức môn học nạp từ Subject Pack (data/subject-packs/math/vector-12.json, fallback KB cũ).
const EMPTY_KB = { misconceptions: [], knowledge: [], exercises: [], roundtable_policy: {} };
const kb = getSubjectPack("math", "vector-12") || EMPTY_KB;
if (kb === EMPTY_KB) {
  console.error("[KnowledgeBase] Không nạp được Subject Pack math/vector-12; KB rỗng.");
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

// Từ đồng nghĩa -> tags thuộc về Subject Pack; KB cũ không có aliases thì chỉ khớp theo từ.
const ALIASES = kb.aliases || {};

function getAliasTags(query) {
  const qLower = String(query ?? "").toLowerCase();
  const qNorm = normalize(query);
  const tags = new Set();

  for (const [key, tList] of Object.entries(ALIASES)) {
    if (qNorm.includes(key)) {
      tList.forEach(t => tags.add(t));
    }
  }

  // Khớp zero_vector an toàn: không nhận diện khi sau đó là từ phủ định vị ngữ (không bằng, không phải...)
  if (/\bvect[oơ]\s+khong\b(?!\s+(?:bang|phai|the|duoc|ra|dung|sai|tach))\b/i.test(qNorm) ||
      /\bvect[oơ]\s+0\b/i.test(qNorm)) {
    tags.add('zero_vector');
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
