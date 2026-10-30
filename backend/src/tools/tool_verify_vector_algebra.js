/**
 * tool_verify_vector_algebra.js
 *
 * Deterministic Tool: Kiểm tra tính đúng đắn của phép toán & độ dài vectơ
 * trong không gian (Hình lập phương, hình hộp chữ nhật).
 *
 * Cải tiến theo Issue #29 (DoD):
 * 1. Hỗ trợ hệ số vectơ: "2AB + AD", "3BC - DD'" được phân tích chính xác hệ số số học.
 * 2. Chặn lỗi sai-không-báo với cuboid:
 *    - Nếu shape === 'cuboid' và có kích thước cụ thể dx, dy, dz (hoặc dimensions = [1, 2, 3]):
 *      Tính toán chính xác theo kích thước thực tế (ví dụ: đường chéo sqrt(1^2 + 2^2 + 3^2) = sqrt(14)).
 *    - Nếu shape === 'cuboid' nhưng không có kích thước cụ thể:
 *      Trả về isValid: null + unsupported_expression thay vì tự ý ép tính theo hình lập phương rồi chấm sai.
 */

// Hàm sinh toạ độ đỉnh theo kích thước [dx, dy, dz]
export function buildBoxVertices(dx = 1, dy = 1, dz = 1) {
  return {
    A:    [0, 0, 0],
    B:    [dx, 0, 0],
    C:    [dx, dy, 0],
    D:    [0, dy, 0],
    "A'": [0, 0, dz],
    "B'": [dx, 0, dz],
    "C'": [dx, dy, dz],
    "D'": [0, dy, dz],
    A1:   [0, 0, dz],
    B1:   [dx, 0, dz],
    C1:   [dx, dy, dz],
    D1:   [0, dy, dz],
  };
}

export function buildCubeVertices(s = 1) {
  return buildBoxVertices(s, s, s);
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
 * Tính tổng/hiệu biểu thức vectơ có hỗ trợ hệ số: "2AB + AD", "BC - 2DD'", "|BC + DD'|"
 */
export function evaluateVectorExpression(expr, vertices = CUBE_VERTICES) {
  const isMagnitude = expr.includes('|') || expr.toLowerCase().includes('abs');
  const sanitized = expr.replace(/[|()]/g, '').trim();

  // Regex hỗ trợ hệ số: ví dụ "+ 2AB", "- 1.5AD", "BC"
  const regex = /([+-]?\s*(?:\d+(?:\.\d+)?)?\s*[A-D][1'′]?[A-D][1'′]?)/g;
  const matches = sanitized.match(regex);

  if (!matches) {
    throw new Error(`Không thể phân tích biểu thức vectơ: "${expr}"`);
  }

  let totalVector = [0, 0, 0];
  const parsedTerms = [];

  for (const rawTerm of matches) {
    const term = rawTerm.replace(/\s+/g, '');
    let sign = 1;
    let cleanTerm = term;
    if (term.startsWith('-')) {
      sign = -1;
      cleanTerm = term.slice(1);
    } else if (term.startsWith('+')) {
      sign = 1;
      cleanTerm = term.slice(1);
    }

    // Tách hệ số số học và tên vector: ví dụ "2AB" -> coeff=2, vecName="AB"
    const coeffMatch = cleanTerm.match(/^(\d+(?:\.\d+)?)([A-D].*)$/);
    let coeff = 1;
    let vecStr = cleanTerm;
    if (coeffMatch) {
      coeff = parseFloat(coeffMatch[1]);
      vecStr = coeffMatch[2];
    }

    const points = parseVectorName(vecStr);
    if (!points) {
      throw new Error(`Ký hiệu vectơ không đúng định dạng: "${vecStr}"`);
    }

    const coords = getVectorCoords(points[0], points[1], vertices);
    const scaledSign = sign * coeff;
    totalVector[0] += scaledSign * coords[0];
    totalVector[1] += scaledSign * coords[1];
    totalVector[2] += scaledSign * coords[2];

    parsedTerms.push({ sign: sign === 1 ? '+' : '-', coeff, name: vecStr, points, coords });
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
  const rawRatio = lengthSquared / (s ** 2);
  const ratio = Math.round(rawRatio * 1000) / 1000;

  const sqrtVal = Math.sqrt(ratio);
  const isIntegerSqrt = Number.isInteger(sqrtVal);

  if (isIntegerSqrt) {
    if (sqrtVal === 0) return '0';
    if (sqrtVal === 1) return isNumericSide ? `${s}` : 'a';
    return isNumericSide ? `${sqrtVal * s}` : `${sqrtVal}a`;
  }

  // Rút gọn căn bậc hai: ratio = factor^2 * remainder
  let bestFactor = 1;
  let remainder = Math.round(ratio);
  for (let i = 1; i * i <= remainder; i++) {
    if (remainder % (i * i) === 0) {
      bestFactor = i;
    }
  }
  const redBase = remainder / (bestFactor * bestFactor);

  if (isNumericSide) {
    const finalFactor = bestFactor * s;
    return finalFactor === 1 ? `\\sqrt{${redBase}}` : `${finalFactor}\\sqrt{${redBase}}`;
  } else {
    return bestFactor === 1 ? `a\\sqrt{${redBase}}` : `${bestFactor}a\\sqrt{${redBase}}`;
  }
}

/**
 * Trích xuất biểu thức vectơ từ chuỗi câu hỏi / chat của học sinh
 */
export function extractVectorExpr(text) {
  if (!text) return null;
  const normalized = String(text)
    .replace(/\b(?:vectơ|vecto|vector|vec)\s+/gi, '')
    .replace(/\s+cộng\s+/gi, ' + ')
    .replace(/\s+trừ\s+/gi, ' - ');
  const match = normalized.match(/((?:\|?\s*)?[A-D][1'′]?[A-D][1'′]?(?:\s*[+\-]\s*[A-D][1'′]?[A-D][1'′]?)+(?:\s*\|)?)/i);
  if (match) {
    const cleanExpr = match[1].trim().toUpperCase().replace(/1/g, "'").replace(/′/g, "'");
    return cleanExpr.includes('|') ? cleanExpr : `|${cleanExpr}|`;
  }
  return null;
}

/**
 * Trích xuất độ dài cạnh nếu người dùng có nêu trong câu
 */
export function extractSideFromText(text) {
  if (!text) return 'a';
  const m = String(text).match(/\b(?:cạnh|canh|side)\s*(?:bằng|=|la|là)?\s*(\d+(?:\.\d+)?)/i);
  if (m) {
    const val = parseFloat(m[1]);
    if (!isNaN(val) && val > 0) return val;
  }
  return 'a';
}

/**
 * Trích xuất phát biểu claim (đáp án) nếu người dùng có nêu ra trong câu
 */
export function extractClaimFromText(text) {
  if (!text) return null;
  if (/(?:^|\s)(?:bo|bạn ấy|cậu ấy|bạn)\s+(?:nói|bảo|ghi|viết|cho rằng)\b/i.test(text)) return null;

  let cleanText = String(text)
    .replace(/\b(?:cạnh|canh|side)\s*(?:bằng|=|la|là)?\s*\d+(?:\.\d+)?\b/gi, ' ')
    .replace(/\b(?:bằng|la|là)\s*bao\s*nhiêu\b/gi, ' ')
    .replace(/\b(?:bằng|la|là)\s*mấy\b/gi, ' ');

  const lower = cleanText.toLowerCase();

  const mSquare = lower.match(/(?:bằng|=|\blà\b)?\s*([0-9]*\.?[0-9]*\s*(?:a\s*)?(?:√|căn|\\sqrt)\s*\{?\d+\}?(?:\s*a\b)?)/i);
  if (mSquare && mSquare[1] && (mSquare[1].includes('√') || mSquare[1].includes('căn') || mSquare[1].includes('sqrt'))) {
    return mSquare[1].replace(/\s+/g, '');
  }

  const mVec = cleanText.match(/(?:bằng|=|là)\s*([A-D][1'′]?[A-D][1'′]?)(?![A-Za-zÀ-ỹ])/);
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
 * @param {number[]} [input.dimensions] - Kích thước 3 cạnh [dx, dy, dz] nếu là cuboid
 * @param {string} input.expr - Biểu thức vectơ (vd: "|BC + DD'|", "|2AB + AD|")
 * @param {string} [input.claim] - Phát biểu cần kiểm chứng
 * @returns {Object} { isValid, correct, calculatedValue, claimValue, reason, steps }
 */
export function verifyVectorAlgebra({ shape = 'cube', side = 'a', dimensions, expr, claim } = {}) {
  if (!expr) {
    throw new Error('Cần cung cấp expr (biểu thức vectơ) để tính toán.');
  }

  // CHẶN LỖI SAI-KHÔNG-BÁO: Xử lý hình hộp chữ nhật (cuboid)
  if (shape === 'cuboid') {
    if (!dimensions || !Array.isArray(dimensions) || dimensions.length < 3) {
      return {
        isValid: null,
        correct: null,
        calculatedValue: null,
        claimValue: null,
        reason: 'unsupported_expression: Hình hộp chữ nhật (cuboid) cần được khai báo kích thước 3 chiều cụ thể [dx, dy, dz] để tính toán chính xác, tránh phán đoán sai.',
        steps: ['Hệ thống chặn lỗi sai-không-báo: Chưa hỗ trợ tính hình hộp chữ nhật khi thiếu tham số kích thước 3 cạnh.'],
      };
    }
  }

  let vertices = CUBE_VERTICES;
  const isNumericSide = typeof side === 'number' || (!isNaN(parseFloat(side)) && !String(side).includes('a'));
  const sideNum = isNumericSide ? parseFloat(side) : 1;

  if (shape === 'cuboid' && Array.isArray(dimensions) && dimensions.length >= 3) {
    vertices = buildBoxVertices(dimensions[0], dimensions[1], dimensions[2]);
  } else {
    vertices = buildCubeVertices(sideNum);
  }

  let evalResult;
  try {
    evalResult = evaluateVectorExpression(expr, vertices);
  } catch (err) {
    return {
      isValid: null,
      correct: null,
      calculatedValue: null,
      claimValue: null,
      reason: `unsupported_expression: ${err.message}`,
      steps: [err.message],
    };
  }

  // Format Latex result
  let correctLatex = '';
  if (shape === 'cuboid' && Array.isArray(dimensions)) {
    correctLatex = formatLatexResult(evalResult.lengthSquared, evalResult.isMagnitude, 1);
  } else {
    correctLatex = formatLatexResult(evalResult.lengthSquared, evalResult.isMagnitude, side);
  }
  const calculatedVal = Math.round(evalResult.length * 1000) / 1000;

  // TRƯỜNG HỢP 1: Không có claim (chỉ tính giá trị)
  if (claim === undefined || claim === null || String(claim).trim() === '') {
    return {
      isValid: null,
      correct: correctLatex,
      calculatedValue: calculatedVal,
      claimValue: null,
      reason: `Biểu thức ${expr} có giá trị độ dài chính xác là ${correctLatex}.`,
      steps: [
        `Dựng vectơ tổng của biểu thức ${expr} trong hình ${shape}.`,
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
      reason = `unparseable_claim: Ký hiệu vectơ '${claim}' không thuộc cấu trúc hình học đang xét.`;
      steps.push(`Không thể xác định tọa độ các điểm trong tên vectơ '${claim}'.`);
    }
  }
  // 2.2 Claim phân tích được thành giá trị số hoặc căn số
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
