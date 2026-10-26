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
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const aliases = {
    'cong do dai vecto': ['length_addition'],
    'vi du 3': ['example_3'],
    'hinh hop': ['box_rule'],
    'trong tam': ['centroid'],
    'vecto khong': ['zero_vector', 'zero_angle'],
    'tich vo huong': ['dot_product', 'negative_dot', 'scalar_result'],
    'goc 120': ['angle', 'negative_dot'],
    '120': ['angle', 'negative_dot'],
    'goc': ['angle', 'angle_convention'],
    'hieu': ['subtraction_order', 'common_origin'],
    'he so am': ['negative_scalar', 'collinear_negative'],
    'binh phuong tong': ['cross_term'],
    'so hang cheo': ['cross_term'],
  };

  const q = normalize(query);
  const aliasTags = Object.entries(aliases)
    .filter(([key]) => q.includes(key))
    .flatMap(([, tags]) => tags);

  const eById = Object.fromEntries((kb.exercises || []).map(e => [e.id, e]));

  return kb.misconceptions
    .map(item => {
      const ce = item.counterexample || {};
      const exTexts = (item.exercise_ids || [])
        .map(eid => eById[eid] ? `${eById[eid].problem} ${eById[eid].expected_answer}` : '')
        .filter(Boolean);

      const searchable = normalize([
        item.title,
        item.topic,
        item.incorrect_claim,
        item.correction,
        ce.setup || '',
        ce.result || '',
        ce.verification || '',
        ...exTexts,
        ...item.tags,
      ].join(" "));

      let score = terms.filter(term => searchable.includes(term)).length;
      const tagMatchCount = aliasTags.filter(tag => item.tags.includes(tag)).length;
      score += 12 * tagMatchCount;

      return { item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => ({
      score: result.score,
      ...buildContext(result.item),
    }));
}

export { kb };
export default { getById, search, kb };