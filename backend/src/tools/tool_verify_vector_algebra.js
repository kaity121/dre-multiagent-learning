/**
 * tool_verify_vector_algebra.js
 *
 * Deterministic Tool: Kiểm tra tính đúng đắn của phép toán & độ dài vectơ
 * trong không gian (Hình lập phương, hình hộp chữ nhật).
 *
 * Sử dụng phương pháp Toạ độ số 3D (Coordinate Geometry):
 * - Đặt hình lập phương cạnh a (chuẩn hóa a = 1) vào hệ tọa độ Oxyz.
 * - Tính toán giá trị vectơ chính xác và độ dài thực tế.
 * - So sánh với phát biểu/claim của học sinh (như Bo gài bẫy).
 */

// Định nghĩa toạ độ chuẩn của hình lập phương ABCD.A'B'C'D' cạnh a = 1
// Trục Ox theo AB, Oy theo AD, Oz theo AA' (A là gốc O)
const CUBE_VERTICES = {
  A:  [0, 0, 0],
  B:  [1, 0, 0],
  C:  [1, 1, 0],
  D:  [0, 1, 0],
  "A'": [0, 0, 1],
  "B'": [1, 0, 1],
  "C'": [1, 1, 1],
  "D'": [0, 1, 1],
  // Hỗ trợ ký hiệu không dấu phẩy trên: A1, B1, C1, D1
  A1: [0, 0, 1],
  B1: [1, 0, 1],
  C1: [1, 1, 1],
  D1: [0, 1, 1],
};

/**
 * Phân tích tên vectơ (ví dụ: "BC", "DD'", "A'C", "B1C1") thành [điểm đầu, điểm cuối]
 */
function parseVectorName(raw) {
  const clean = raw.trim().replace(/^\\vec\{|\}$/g, '').replace(/[\\ ]/g, '');
  // Kiểm tra điểm có dấu '
  const match = clean.match(/^([A-D][1']?)([A-D][1']?)$/);
  if (match) {
    return [match[1], match[2]];
  }
  return null;
}

/**
 * Lấy tọa độ vector XY = Y - X
 */
function getVectorCoords(startPoint, endPoint, vertices = CUBE_VERTICES) {
  const p1 = vertices[startPoint];
  const p2 = vertices[endPoint];
  if (!p1 || !p2) {
    throw new Error(`Điểm không hợp lệ trong hình: ${startPoint} hoặc ${endPoint}`);
  }
  return [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
}

/**
 * Tính tổng/hiệu biểu thức vectơ
 * Hỗ trợ các dạng: "BC + DD'", "AB + AD + AA'", "BC - DD'", "|BC + DD'|"
 */
function evaluateVectorExpression(expr, vertices = CUBE_VERTICES) {
  const isMagnitude = expr.includes('|') || expr.toLowerCase().includes('abs');
  const sanitized = expr.replace(/[|()]/g, '').trim();

  // Tách các token dựa vào dấu + hoặc -
  // Dùng regex phân tách có giữ lại toán tử
  const regex = /([+-]?\s*[A-D][1']?[A-D][1']?)/g;
  const matches = sanitized.match(regex);

  if (!matches) {
    throw new Error(`Không thể phân tích biểu thức vectơ: "${expr}"`);
  }

  let totalVector = [0, 0, 0];
  const parsedTerms = [];

  for (const rawTerm of matches) {
    const term = rawTerm.replace(/\s+/g, '');
    let sign = 1;
    let vecStr = term;

    if (term.startsWith('-')) {
      sign = -1;
      vecStr = term.slice(1);
    } else if (term.startsWith('+')) {
      sign = 1;
      vecStr = term.slice(1);
    }

    const points = parseVectorName(vecStr);
    if (!points) {
      throw new Error(`Ký hiệu vectơ không đúng định dạng: "${vecStr}"`);
    }

    const coords = getVectorCoords(points[0], points[1], vertices);
    totalVector[0] += sign * coords[0];
    totalVector[1] += sign * coords[1];
    totalVector[2] += sign * coords[2];

    parsedTerms.push({ sign: sign === 1 ? '+' : '-', name: vecStr, points, coords });
  }

  const lengthSquared = totalVector[0] ** 2 + totalVector[1] ** 2 + totalVector[2] ** 2;
  const length = Math.sqrt(lengthSquared);

  return {
    vector: totalVector,
    length,
    lengthSquared,
    isMagnitude,
    parsedTerms,
  };
}

/**
 * Phân tích giá trị claim của học sinh thành giá trị số tương ứng (với a = 1)
 */
function parseClaimValue(claim) {
  if (typeof claim === 'number') return claim;
  const str = String(claim).trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\\sqrt/g, 'sqrt')
    .replace(/\\cdot|\*/g, '');

  if (str === '2a' || str === '2') return 2;
  if (str === 'a' || str === '1') return 1;
  if (str === '0' || str === '0a') return 0;
  if (str === 'asqrt{2}' || str === 'asqrt(2)' || str === 'sqrt{2}a' || str === 'sqrt(2)' || str === 'sqrt{2}') {
    return Math.SQRT2;
  }
  if (str === 'asqrt{3}' || str === 'asqrt(3)' || str === 'sqrt{3}a' || str === 'sqrt(3)' || str === 'sqrt{3}') {
    return Math.sqrt(3);
  }
  if (str === '3a' || str === '3') return 3;

  // Thử parse số thực nếu học sinh đưa số thập phân
  const num = parseFloat(str);
  if (!isNaN(num)) return num;

  return null;
}

/**
 * Chuyển đổi giá trị số sang biểu thức LaTeX đẹp
 */
function formatLatexResult(lengthSquared, isMagnitude) {
  if (!isMagnitude) return null;
  const roundedSq = Math.round(lengthSquared * 1000) / 1000;
  if (roundedSq === 1) return 'a';
  if (roundedSq === 2) return 'a\\sqrt{2}';
  if (roundedSq === 3) return 'a\\sqrt{3}';
  if (roundedSq === 4) return '2a';
  if (roundedSq === 0) return '0';
  return `a\\sqrt{${roundedSq}}`;
}

/**
 * Hàm thực thi Tool: tool_verify_vector_algebra
 *
 * @param {Object} input
 * @param {string} [input.shape="cube"] - Loại hình học (cube, cuboid)
 * @param {string|number} [input.side="a"] - Cạnh hình lập phương
 * @param {string} input.expr - Biểu thức vectơ (vd: "|BC + DD'|")
 * @param {string} input.claim - Phát biểu cần kiểm chứng (vd: "2a")
 * @returns {Object} { isValid, correct, calculatedValue, claimValue, reason, steps }
 */
export function verifyVectorAlgebra({ shape = 'cube', side = 'a', expr, claim }) {
  if (!expr || claim === undefined) {
    throw new Error('Cần cung cấp đầy đủ expr và claim để kiểm tra.');
  }

  const evalResult = evaluateVectorExpression(expr);
  const claimNum = parseClaimValue(claim);
  const correctLatex = formatLatexResult(evalResult.lengthSquared, evalResult.isMagnitude);

  const epsilon = 0.001;
  const isValid = claimNum !== null && Math.abs(evalResult.length - claimNum) < epsilon;

  let reason = '';
  const steps = [];

  // Tạo lời giải thích chi tiết và gợi ý nhận diện ngộ nhận
  if (!isValid) {
    if (claim === '2a' && expr.includes('BC') && expr.includes("DD'")) {
      reason = "BC + DD' = BC + CC' = BC' (đường chéo mặt bên), độ dài là a\\sqrt{2}, không thể cộng trực tiếp độ dài 1a + 1a = 2a";
      steps.push("1. Vectơ DD' bằng vectơ CC' (hai cạnh bên cùng hướng trong hình lập phương).");
      steps.push("2. Thay thế: \\vec{BC} + \\vec{DD'} = \\vec{BC} + \\vec{CC'} = \\vec{BC'}.");
      steps.push("3. Tam giác BCC' vuông tại C nên |\\vec{BC'}| = \\sqrt{BC^2 + CC'^2} = \\sqrt{a^2 + a^2} = a\\sqrt{2}.");
      steps.push("4. Sai lầm mắc phải: cộng trực tiếp độ dài hai vectơ vuông góc |\\vec{u} + \\vec{v}| = |\\vec{u}| + |\\vec{v}| là sai.");
    } else {
      reason = `Độ dài đúng của biểu thức ${expr} là ${correctLatex || evalResult.length.toFixed(2)}, trong khi phát biểu cho rằng là ${claim}.`;
      steps.push(`Tính toán tọa độ: vectơ tổng = [${evalResult.vector.join(', ')}].`);
      steps.push(`Độ dài chính xác = ${evalResult.length.toFixed(4)}.`);
    }
  } else {
    reason = `Phát biểu hoàn toàn chính xác. Giá trị ${claim} khớp với kết quả hình học ${correctLatex}.`;
    steps.push(`Độ dài biểu thức ${expr} bằng ${correctLatex}.`);
  }

  return {
    isValid,
    correct: correctLatex,
    calculatedValue: Math.round(evalResult.length * 1000) / 1000,
    claimValue: claimNum,
    reason,
    steps,
  };
}

export default verifyVectorAlgebra;
