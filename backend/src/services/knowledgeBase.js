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

const ALIASES = {
  'cong do dai vecto': ['length_addition', 'norm_sum'],
  'cong do dai': ['length_addition', 'norm_sum'],
  'do dai tong': ['length_addition', 'norm_sum'],
  'tong do dai': ['length_addition', 'norm_sum'],
  '1+1': ['length_addition', 'norm_sum'],
  '1 + 1': ['length_addition', 'norm_sum'],
  '1+1=2': ['length_addition', 'norm_sum'],
  'tach do dai': ['length_addition', 'norm_sum'],
  'cong dai so': ['length_addition', 'norm_sum'],
  'vi du 3': ['example_3', 'cube'],
  'hinh hop': ['box_rule'],
  'trong tam': ['triangle_centroid', 'tetrahedron_centroid'],
  'vecto khong co goc': ['zero_vector', 'angle_convention'],
  'goc voi vecto khong': ['zero_vector', 'angle_convention'],
  'tich vo huong am': ['negative_dot'],
  'tich vo huong goc tu': ['negative_dot'],
  'tich vo huong goc 120': ['negative_dot'],
  'tich vo huong': ['dot_product', 'scalar_result'],
  'goc 120': ['angle'],
  'goc tu': ['angle'],
  'goc giua hai vecto': ['angle'],
  'goc giua': ['angle'],
  'goc cua hai vecto': ['angle'],
  'goc vecto': ['angle', 'angle_convention'],
  'chung goc': ['common_origin'],
  'cung goc': ['common_origin'],
  'hieu do dai': ['length_subtraction'],
  'do dai hieu': ['length_subtraction'],
  'hieu hai vecto': ['subtraction_order', 'common_origin'],
  'phep tru': ['subtraction_order', 'common_origin'],
  'tru vecto': ['subtraction_order', 'common_origin'],
  'tru hai vecto': ['subtraction_order', 'common_origin'],
  'quy tac tru': ['subtraction_order', 'common_origin'],
  'he so am': ['negative_scale'],
  'binh phuong tong': ['cross_term'],
  'so hang cheo': ['cross_term'],
  'cung phuong': ['parallel', 'opposite'],
  'vecto doi': ['negative_length', 'reverse', 'opposite'],
  'quy tac ba diem': ['triangle_rule', 'endpoint_order'],
  'trong tam tu dien': ['tetrahedron_centroid', 'sign', 'protege'],
  'ab ba': ['equal_length', 'direction', 'opposite'],
  'ba ab': ['equal_length', 'direction', 'opposite'],
  'vecto ab': ['equal_length', 'direction'],
  'vecto ba': ['equal_length', 'direction', 'opposite'],
  'vector ab': ['equal_length', 'direction'],
  'vector ba': ['equal_length', 'direction', 'opposite'],
  'ab bang ba': ['equal_length', 'direction'],
  'doan thang ab': ['equal_length', 'direction'],
  'giong het nhau': ['equal_length'],
  'vecto bang nhau': ['equal_length', 'direction'],
  'vector bang nhau': ['equal_length', 'direction'],
  'cung do dai': ['equal_length'],
  'quang duong': ['equal_length', 'direction'],
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
