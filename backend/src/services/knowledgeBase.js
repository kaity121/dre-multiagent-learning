import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findKbFile() {
  const candidates = [
    path.join(__dirname, "../data/dre_vector_kb.json"),
    path.join(__dirname, "../../data/dre_vector_kb.json"),
    path.join(process.cwd(), "src/data/dre_vector_kb.json"),
    path.join(process.cwd(), "backend/src/data/dre_vector_kb.json"),
    path.join(process.cwd(), "data/dre_vector_kb.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

const kbPath = findKbFile();
const kb = JSON.parse(fs.readFileSync(kbPath, "utf8"));

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
  'cong do dai vecto': ['length_addition'],
  'cong do dai': ['length_addition'],
  'vi du 3': ['example_3', 'cube'],
  'hinh hop': ['box_rule'],
  'trong tam': ['triangle_centroid', 'tetrahedron_centroid'],
  'vecto khong co goc': ['zero_vector', 'angle_convention'],
  'goc voi vecto khong': ['zero_vector', 'angle_convention'],
  'vecto khong': ['zero_vector'],
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
  'vecto doi': ['negative_length', 'reverse'],
  'quy tac ba diem': ['triangle_rule', 'endpoint_order'],
  'trong tam tu dien': ['tetrahedron_centroid', 'sign', 'protege'],
};

function getAliasTags(query) {
  const qNorm = normalize(query);
  const qLower = String(query ?? "").toLowerCase();
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
    knowledge: kb.knowledge.filter(k =>
      item.knowledge_ids.includes(k.id)
    ),
    exercises: kb.exercises.filter(e =>
      item.exercise_ids.includes(e.id)
    ),
    roundtable_policy: kb.roundtable_policy,
  };
}

export function getById(id) {
  const item = kb.misconceptions.find(m => m.id === id);
  return item ? buildContext(item) : null;
}

export function search(query, limit = 3) {
  const rawTokens = String(query ?? "").toLowerCase().match(/[a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ0-9_]+/gu) || [];
  if (!rawTokens.length) return [];

  const aliasTags = getAliasTags(query);
  const isAccented = hasDiacritics(query);
  const eById = Object.fromEntries((kb.exercises || []).map(e => [e.id, e]));

  const meaningfulTokens = rawTokens.filter(t => !STOPWORDS.has(normalize(t)));
  const searchTerms = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

  return kb.misconceptions
    .map(item => {
      const ce = item.counterexample || {};
      const exTexts = (item.exercise_ids || [])
        .map(eid => eById[eid] ? `${eById[eid].problem} ${eById[eid].expected_answer}` : '')
        .filter(Boolean);

      const rawBody = [
        item.title,
        item.topic,
        item.incorrect_claim,
        item.correction,
        ce.setup || '',
        ce.result || '',
        ce.verification || '',
        ...exTexts,
        ...item.tags,
      ].join(" ").toLowerCase();

      const rawSet = new Set(rawBody.match(/[a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ0-9_]+/gu) || []);
      const normSet = new Set(normalize(rawBody).match(/[a-z0-9_]+/g) || []);

      let tokenMatches = 0;
      for (const t of searchTerms) {
        if (STOPWORDS.has(normalize(t))) continue;
        if (isAccented) {
          if (rawSet.has(t)) tokenMatches++;
        } else {
          if (normSet.has(normalize(t))) tokenMatches++;
        }
      }

      const tagMatchCount = [...aliasTags].filter(tag => item.tags.includes(tag)).length;
      const score = tokenMatches + 12 * tagMatchCount;

      return { item, score, tagMatchCount, tokenMatches };
    })
    .filter(result => result.score > 0 && (result.tagMatchCount > 0 || result.tokenMatches >= 2))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => ({
      score: result.score,
      ...buildContext(result.item),
    }));
}

export { kb };
export default { getById, search, kb };