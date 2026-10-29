/**
 * tool_verify_vector_algebra.js
 *
 * Deterministic Tool: Kiểm tra tính đúng đắn của phép toán & độ dài vectơ
 * trong không gian (Hình lập phương, hình hộp chữ nhật).
 *
 * Sử dụng phương pháp Toạ độ số 3D (Coordinate Geometry):
 * - Hỗ trợ cả cạnh tham số 'a' lẫn cạnh số cụ thể (side = 2, side = 1, etc.).
 * - Tính toán giá trị vectơ chính xác và độ dài thực tế.
 * - So sánh với phát biểu/claim của học sinh (nếu có claim).
 * - Hỗ trợ chế độ chỉ tính giá trị (claim = undefined / null) mà không phán đúng sai.
 */

// Hàm sinh toạ độ đỉnh theo cạnh s
export function buildCubeVertices(s = 1) {
  return {
    A:  [0, 0, 0],
    B:  [s, 0, 0],
    C:  [s, s, 0],
    D:  [0, s, 0],
    "A'": [0, 0, s],
    "B'": [s, 0, s],
    "C'": [s, s, s],
    "D'": [0, s, s],
    A1: [0, 0, s],
    B1: [s, 0, s],
    C1: [s, s, s],
    D1: [0, s, s],
  };
}

const CUBE_VERTICES = buildCubeVertices(1);

/**
 * Phân tích tên vectơ (ví dụ: "BC", "DD'", "A'C", "B1C1") thành [điểm đầu, điểm cuối]
 */
export function parseVectorName(raw) {
  const clean = String(raw ?? '').trim().replace(/^\\?vec\{?|\}?$/g, '').replace(/[\\ ]/g, '');
  const match = clean.match(/^([A-D][1'′]?)([A-D][1'′]?)$/);
  if (match) {
    return [match[1].replace(/′/g, "'"), match[2].replace(/′/g, "'")];
  }
  return null;
}

/**
 * Lấy tọa độ vector XY = Y - X
 */
export function getVectorCoords(startPoint, endPoint, vertices = CUBE_VERTICES) {
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
export function evaluateVectorExpression(expr, vertices = CUBE_VERTICES) {
  const isMagnitude = expr.includes('|') || expr.toLowerCase().includes('abs');
  const sanitized = expr.replace(/[|()]/g, '').trim();

  const regex = /([+-]?\s*[A-D][1'′]?[A-D][1'′]?)/g;
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
 * Phân tích giá trị claim của học sinh thành giá trị số tương ứng theo cạnh sideNum
 */
export function parseClaimValue(claim, sideNum = 1) {
  if (claim === undefined || claim === null || claim === '') return null;
  if (typeof claim === 'number') return claim;
  let str = String(claim).trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\\cdot|\*/g, '')
    .replace(/căn/g, 'sqrt')
    .replace(/√/g, 'sqrt')
    .replace(/\\sqrt/g, 'sqrt');

  str = str.replace(/sqrt\{(\d+(?:\.\d+)?)\}/g, 'sqrt($1)');

  // Các mẫu căn: asqrt(2), sqrt(2)a, asqrt2, sqrt2a, 2sqrt(2), 2sqrt2, sqrt2, etc.
  const sqrtMatch = str.match(/^([0-9]*\.?[0-9]*)?a?sqrt\(?(\d+(?:\.\d+)?)\)?a?$/);
  if (sqrtMatch) {
    const rawCoeff = sqrtMatch[1] ? parseFloat(sqrtMatch[1]) : 1;
    const base = parseFloat(sqrtMatch[2]);
    const hasA = str.includes('a');
    // Nếu có chữ a thì nhân sideNum; nếu không có a và sideNum !== 1, rawCoeff đã là hệ số số học
    const coeff = hasA ? rawCoeff * sideNum : rawCoeff;
    return coeff * Math.sqrt(base);
  }

  // Mẫu a hoặc số: 2a, a, 3a, 1.5a
  const aMatch = str.match(/^([0-9]*\.?[0-9]*)?a$/);
  if (aMatch) {
    const coeff = aMatch[1] ? parseFloat(aMatch[1]) : 1;
    return coeff * sideNum;
  }

  // Thử parse số thực nếu học sinh đưa số thập phân hoặc số nguyên đơn thuần
  const num = parseFloat(str);
  if (!isNaN(num) && !str.includes('sqrt')) return num;

  return null;
}

/**
 * Chuyển đổi giá trị số sang biểu thức LaTeX đẹp có tính đến tham số side
 */
export function formatLatexResult(lengthSquared, isMagnitude, side = 'a') {
  if (!isMagnitude) return null;
  const isNumericSide = typeof side === 'number' || (!isNaN(parseFloat(side)) && !String(side).includes('a'));
  const s = isNumericSide ? parseFloat(side) : 1;

  // Tỉ lệ chuẩn hóa so với s^2
  const ratio = Math.round((lengthSquared / (s * s)) * 1000) / 1000;

  if (isNumericSide) {
    if (ratio === 1) return `${s}`;
    if (ratio === 2) return s === 1 ? '\\sqrt{2}' : `${s}\\sqrt{2}`;
    if (ratio === 3) return s === 1 ? '\\sqrt{3}' : `${s}\\sqrt{3}`;
    if (ratio === 4) return `${2 * s}`;
    if (ratio === 0) return '0';
    return `${s}\\sqrt{${ratio}}`;
  } else {
    if (ratio === 1) return 'a';
    if (ratio === 2) return 'a\\sqrt{2}';
    if (ratio === 3) return 'a\\sqrt{3}';
    if (ratio === 4) return '2a';
    if (ratio === 0) return '0';
    return `a\\sqrt{${ratio}}`;
  }
}

/**
 * Trích xuất biểu thức vectơ từ chuỗi câu hỏi / chat của học sinh
 */
export function extractVectorExpr(text) {
  if (!text) return null;
  // "vectơ BC cộng vectơ DD'" → "BC + DD'"
  const normalized = String(text)
    .replace(/\b(?:vectơ|vecto|vector|vec)\s+/gi, '')
    .replace(/\s+cộng\s+/gi, ' + ')
    .replace(/\s+trừ\s+/gi, ' - ');
  // Tìm mẫu vectơ cộng/trừ: BC + DD', AB + AD + AA', BC - DD'
  // Regex bao phủ toàn bộ chuỗi nối tiếp các vectơ qua dấu + hoặc -
  const match = normalized.match(/((?:\|?\s*)?[A-D][1'′]?[A-D][1'′]?(?:\s*[+\-]\s*[A-D][1'′]?[A-D][1'′]?)+(?:\s*\|)?)/i);
  if (match) {
    const cleanExpr = match[1].trim().toUpperCase().replace(/1/g, "'").replace(/′/g, "'");
    return cleanExpr.includes('|') ? cleanExpr : `|${cleanExpr}|`;
  }
  return null;
}

/**
 * Trích xuất phát biểu claim (đáp án) nếu người dùng có nêu ra trong câu
 */
export function extractClaimFromText(text) {
  if (!text) return null;
  // A value someone else said ("Bo nói ... bằng 2a") is being questioned, not claimed by the learner.
  if (/(?:^|\s)(?:bo|bạn ấy|cậu ấy|bạn)\s+(?:nói|bảo|ghi|viết|cho rằng)\b/i.test(text)) return null;

  const lower = text.toLowerCase();

  // Khớp các đáp số: 2a, a√2, 2√2, căn 2, căn 3 a, 2\sqrt{2}
  const mSquare = lower.match(/(?:bằng|=|\blà\b)?\s*([0-9]*\.?[0-9]*\s*(?:a\s*)?(?:√|căn|\\sqrt)\s*\{?\d+\}?(?:\s*a\b)?)/i);
  if (mSquare) return mSquare[1].replace(/\s+/g, '');

  // Vector names are always uppercase; matching case-sensitively on the original text keeps
  // "bằng bao nhiêu" from being read as the vector BA.
  const mVec = text.match(/(?:bằng|=|là)\s*([A-D][1'′]?[A-D][1'′]?)(?![A-Za-zÀ-ỹ])/);
  if (mVec) return mVec[1].replace(/′/g, "'");

  const mA = lower.match(/(?:bằng|=|\blà\b)?\s*(\d+(?:\.\d+)?a)\b/i);
  if (mA) return mA[1].toLowerCase();

  const mPureNum = lower.match(/(?:bằng|=|\blà\b)\s*(\d+(?:\.\d+)?)\b/);
  if (mPureNum) return mPureNum[1];

  return null;
}

/**
 * Hàm thực thi Tool: tool_verify_vector_algebra
 *
 * @param {Object} input
 * @param {string} [input.shape="cube"] - Loại hình học (cube, cuboid)
 * @param {string|number} [input.side="a"] - Cạnh hình lập phương
 * @param {string} input.expr - Biểu thức vectơ (vd: "|BC + DD'|")
 * @param {string} [input.claim] - Phát biểu cần kiểm chứng (nếu không có claim, chỉ tính toán không phán sai)
 * @returns {Object} { isValid, correct, calculatedValue, claimValue, reason, steps }
 */
export function verifyVectorAlgebra({ shape = 'cube', side = 'a', expr, claim }) {
  if (!expr) {
    throw new Error('Cần cung cấp expr (biểu thức vectơ) để tính toán.');
  }

  const isNumericSide = typeof side === 'number' || (!isNaN(parseFloat(side)) && !String(side).includes('a'));
  const sideNum = isNumericSide ? parseFloat(side) : 1;
  const vertices = buildCubeVertices(sideNum);

  const evalResult = evaluateVectorExpression(expr, vertices);
  const correctLatex = formatLatexResult(evalResult.lengthSquared, evalResult.isMagnitude, side);
  const calculatedVal = Math.round(evalResult.length * 1000) / 1000;

  // TRƯỜNG HỢP 1: Không có claim (Học sinh chỉ hỏi giá trị, không khẳng định đáp án)
  if (claim === undefined || claim === null || String(claim).trim() === '') {
    return {
      isValid: null,
      correct: correctLatex,
      calculatedValue: calculatedVal,
      claimValue: null,
      reason: `Biểu thức ${expr} có giá trị độ dài chính xác là ${correctLatex}.`,
      steps: [
        `Dựng vectơ tổng của biểu thức ${expr} trong hình lập phương cạnh ${side}.`,
        `Độ dài chính xác thu được: |${expr.replace(/[|]/g, '')}| = ${correctLatex}.`,
      ],
    };
  }

  // TRƯỜNG HỢP 2: Có claim cần kiểm chứng
  const claimNum = parseClaimValue(claim, sideNum);
  const vectorPoints = parseVectorName(String(claim));
  const epsilon = 0.005;

  let isValid = null;
  let reason = '';
  const steps = [];

  // 2.1 Claim là tên một vectơ tương đương (ví dụ: "BC'", "AD'")
  if (vectorPoints) {
    try {
      const vCoords = getVectorCoords(vectorPoints[0], vectorPoints[1], vertices);
      const vLenSquared = vCoords[0] ** 2 + vCoords[1] ** 2 + vCoords[2] ** 2;
      const vLen = Math.sqrt(vLenSquared);

      const coordsMatch = Math.abs(vCoords[0] - evalResult.vector[0]) < epsilon &&
                          Math.abs(vCoords[1] - evalResult.vector[1]) < epsilon &&
                          Math.abs(vCoords[2] - evalResult.vector[2]) < epsilon;
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
  // 2.2 Claim phân tích được thành giá trị số hoặc căn số (hỗ trợ cả 2√2 lẫn a√2)
  else if (claimNum !== null) {
    if (Math.abs(evalResult.length - claimNum) < epsilon) {
      isValid = true;
      reason = `Phát biểu hoàn toàn chính xác. Giá trị ${claim} khớp với kết quả hình học ${correctLatex}.`;
      steps.push(`Độ dài biểu thức ${expr} bằng ${correctLatex}.`);
    } else {
      isValid = false;
      const cleanExprStr = expr.replace(/[|()]/g, '');
      if ((claim === '2a' || claimNum === 2 * sideNum) && cleanExprStr.includes('BC') && cleanExprStr.includes("DD'")) {
        const doubleSideStr = isNumericSide ? `${2 * sideNum}` : '2a';
        reason = `BC + DD' = BC + CC' = BC' (đường chéo mặt bên), độ dài là ${correctLatex}, không thể cộng trực tiếp độ dài ${side} + ${side} = ${doubleSideStr}.`;
        steps.push("1. Vectơ DD' bằng vectơ CC' (hai cạnh bên cùng hướng trong hình lập phương).");
        steps.push("2. Thay thế: \\vec{BC} + \\vec{DD'} = \\vec{BC} + \\vec{CC'} = \\vec{BC'}.");
        steps.push(`3. Tam giác BCC' vuông tại C nên |\\vec{BC'}| = \\sqrt{BC^2 + CC'^2} = ${correctLatex}.`);
        steps.push("4. Sai lầm mắc phải: cộng trực tiếp độ dài hai vectơ vuông góc |\\vec{u} + \\vec{v}| = |\\vec{u}| + |\\vec{v}| là sai.");
      } else {
        reason = `Độ dài đúng của biểu thức ${expr} là ${correctLatex}, trong khi phát biểu cho rằng là ${claim}.`;
        steps.push(`Tính toán tọa độ: vectơ tổng = [${evalResult.vector.join(', ')}].`);
        steps.push(`Độ dài chính xác = ${evalResult.length.toFixed(4)}.`);
      }
    }
  }
  // 2.3 Claim là định tính hoặc không parse được
  else {
    isValid = null;
    reason = `unparseable_claim: Không thể phân tích giá trị số hoặc ký hiệu từ phát biểu '${claim}' để kiểm chứng tự động.`;
    steps.push(`Phát biểu mang tính định tính hoặc công thức tổng quát, không thể kiểm chứng trực tiếp bằng tọa độ số.`);
  }

  return {
    isValid,
    correct: correctLatex,
    calculatedValue: calculatedVal,
    claimValue: claimNum,
    reason,
    steps,
  };
}

export default verifyVectorAlgebra;
