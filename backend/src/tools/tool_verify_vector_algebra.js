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
  const clean = String(raw ?? '').trim().replace(/^\\?vec\{?|\}?$/g, '').replace(/[\\ ]/g, '');
  // Kiểm tra điểm có dấu ' hoặc 1
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
  let str = String(claim ?? '').trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\\cdot|\*/g, '')
    .replace(/căn/g, 'sqrt')
    .replace(/√/g, 'sqrt')
    .replace(/\\sqrt/g, 'sqrt');

  str = str.replace(/sqrt\{(\d+(?:\.\d+)?)\}/g, 'sqrt($1)');

  // Các mẫu căn: asqrt(2), sqrt(2)a, asqrt2, sqrt2a, 2sqrt(2), sqrt2, etc.
  const sqrtMatch = str.match(/^([0-9]*\.?[0-9]*)?a?sqrt\(?(\d+(?:\.\d+)?)\)?a?$/);
  if (sqrtMatch) {
    const coeff = sqrtMatch[1] ? parseFloat(sqrtMatch[1]) : 1;
    const base = parseFloat(sqrtMatch[2]);
    return coeff * Math.sqrt(base);
  }

  // Mẫu a hoặc số: 2a, a, 3a, 1.5a
  const aMatch = str.match(/^([0-9]*\.?[0-9]*)?a$/);
  if (aMatch) {
    return aMatch[1] ? parseFloat(aMatch[1]) : 1;
  }

  // Thử parse số thực nếu học sinh đưa số thập phân hoặc số nguyên đơn thuần
  const num = parseFloat(str);
  if (!isNaN(num) && !str.includes('sqrt')) return num;

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
 * @param {string} input.claim - Phát biểu cần kiểm chứng (vd: "2a", "a\\sqrt{2}", "BC'")
 * @returns {Object} { isValid, correct, calculatedValue, claimValue, reason, steps }
 */
export function verifyVectorAlgebra({ shape = 'cube', side = 'a', expr, claim }) {
  if (!expr || claim === undefined) {
    throw new Error('Cần cung cấp đầy đủ expr và claim để kiểm tra.');
  }

  const evalResult = evaluateVectorExpression(expr);
  const claimNum = parseClaimValue(claim);
  const vectorPoints = parseVectorName(String(claim));
  const correctLatex = formatLatexResult(evalResult.lengthSquared, evalResult.isMagnitude);
  const epsilon = 0.001;

  let isValid = null;
  let reason = '';
  const steps = [];

  // 1. Nếu claim là tên một vectơ (ví dụ: "BC'", "\vec{BC'}", "AD'")
  if (vectorPoints) {
    try {
      const vCoords = getVectorCoords(vectorPoints[0], vectorPoints[1]);
      const vLenSquared = vCoords[0] ** 2 + vCoords[1] ** 2 + vCoords[2] ** 2;
      const vLen = Math.sqrt(vLenSquared);

      const coordsMatch = vCoords[0] === evalResult.vector[0] &&
                          vCoords[1] === evalResult.vector[1] &&
                          vCoords[2] === evalResult.vector[2];
      const lenMatch = Math.abs(vLen - evalResult.length) < epsilon;

      if (coordsMatch || lenMatch) {
        isValid = true;
        reason = `Phát biểu hoàn toàn chính xác. Biểu thức ${expr} có vectơ tổng tương đương vectơ ${claim}, với độ dài ${correctLatex}.`;
        steps.push(`Vectơ tương đương: \\vec{${vectorPoints[0]}${vectorPoints[1]}} có tọa độ [${vCoords.join(', ')}].`);
        steps.push(`Độ dài tương ứng: |\\vec{${vectorPoints[0]}${vectorPoints[1]}}| = ${correctLatex}.`);
      } else {
        isValid = false;
        reason = `Vectơ ${claim} có tọa độ [${vCoords.join(', ')}] (độ dài ${vLen.toFixed(2)}), không khớp với vectơ tổng của ${expr} (độ dài ${correctLatex}).`;
        steps.push(`Tính toán tọa độ biểu thức: [${evalResult.vector.join(', ')}].`);
        steps.push(`Tọa độ vectơ được nêu: [${vCoords.join(', ')}].`);
      }
    } catch {
      isValid = null;
      reason = `unparseable_claim: Ký hiệu vectơ '${claim}' không thuộc cấu trúc hình lập phương đang xét.`;
      steps.push(`Không thể xác định tọa độ các điểm trong tên vectơ '${claim}'.`);
    }
  }
  // 2. Nếu claim phân tích được thành giá trị số hoặc căn số
  else if (claimNum !== null) {
    if (Math.abs(evalResult.length - claimNum) < epsilon) {
      isValid = true;
      reason = `Phát biểu hoàn toàn chính xác. Giá trị ${claim} khớp với kết quả hình học ${correctLatex}.`;
      steps.push(`Độ dài biểu thức ${expr} bằng ${correctLatex}.`);
    } else {
      isValid = false;
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
    }
  }
  // 3. Nếu claim là phát biểu tổng quát hoặc không thể parse thành số/vectơ cụ thể
  else {
    isValid = null;
    reason = `unparseable_claim: Không thể phân tích giá trị số hoặc ký hiệu từ phát biểu '${claim}' để kiểm chứng tự động.`;
    steps.push(`Phát biểu mang tính định tính hoặc công thức tổng quát, không thể kiểm chứng trực tiếp bằng tọa độ số.`);
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
