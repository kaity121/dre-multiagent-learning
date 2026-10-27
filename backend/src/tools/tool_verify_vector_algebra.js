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
function buildCubeVertices(s = 1) {
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
export function evaluateVectorExpression(expr, vertices = CUBE_VERTICES) {
  const isMagnitude = expr.includes('|') || expr.toLowerCase().includes('abs');
  const sanitized = expr.replace(/[|()]/g, '').trim();

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
function formatLatexResult(lengthSquared, isMagnitude, side = 'a') {
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
 * Trích xuất biểu thức vectơ từ văn bản câu hỏi tự do (VD: "BC + DD' dài bao nhiêu ạ?")
 * Hỗ trợ cả ký hiệu viết tắt (BC + DD') lẫn biểu thức chữ ("vectơ BC cộng vectơ DD'")
 */
export function extractVectorExpr(text) {
  if (!text) return null;

  // Chuẩn hoá biểu thức chữ: "vectơ BC cộng vectơ DD'" -> "BC + DD'"
  let normalized = text
    .replace(/vect[oơ]\s+/gi, '')
    .replace(/\s+cộng\s+/gi, ' + ')
    .replace(/\s+trừ\s+/gi, ' - ');

  // Tìm mẫu vectơ cộng/trừ: BC + DD', AB + AD + AA', BC - DD'
  const match = normalized.match(/((?:\|?\s*)?[A-D][1'′]?[A-D][1'′]?(?:\s*[+\-]\s*[A-D][1'′]?[A-D][1'′]?)+(?:\s*\|)?)/i);
  if (match) {
    const cleanExpr = match[1].trim().toUpperCase().replace(/1/g, "'");
    return cleanExpr.includes('|') ? cleanExpr : `|${cleanExpr}|`;
  }
  return null;
}

/**
 * Trích xuất phát biểu claim (đáp án) nếu người dùng có nêu ra trong câu
 */
export function extractClaimFromText(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  
  // 1. Khớp các đáp số căn/độ dài: 2a, a√2, 2√2, căn 2, 2\sqrt{2}, v.v.
  const mSquare = lower.match(/(?:bằng|=| là\b)?\s*([0-9]*\.?[0-9]*\s*(?:a\s*)?(?:√|căn|\\sqrt)\s*\{?\d+\}?a?)/i);
  if (mSquare) return mSquare[1].replace(/\s+/g, '');

  // 2. Khớp tên vectơ viết hoa (A-D): Bắt buộc so khớp trên text GỐC (chữ hoa),
  // và lookahead (?![A-Za-zÀ-ỹ0-9_]) để tránh nuốt chữ "bao" trong "bằng bao nhiêu"
  const mVec = text.match(/(?:bằng|=|là|\bđược\b|\bra\b)\s*([A-D][1'′]?[A-D][1'′]?)(?![A-Za-zÀ-ỹ0-9_])/);
  if (mVec) return mVec[1].toUpperCase().replace(/1/g, "'");

  // 3. Khớp tham số a (như 2a, 3a)
  const mA = lower.match(/(?:bằng|=| là\b)?\s*(\d+(?:\.\d+)?a)\b/i);
  if (mA) return mA[1].toLowerCase();

  // 4. Khớp số nguyên/thực thuần tuý
  // Không nhận các từ hỏi như "bao nhiêu", "mấy"
  if (!lower.includes('bao nhiêu') && !lower.includes('bao nhieu') && !lower.includes('mấy') && !lower.includes('may')) {
    const mPureNum = lower.match(/(?:bằng|=| là\b)\s*(\d+(?:\.\d+)?)\b/);
    if (mPureNum) return mPureNum[1];
  }

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

  // TRƯỜNG HỢP 2: Có claim đưa ra
  const parsedClaim = parseClaimValue(claim, sideNum);

  // Kiểm tra trường hợp claim là tên vectơ tương đương (ví dụ: claim là "BC'")
  const cleanClaim = String(claim).trim().toUpperCase().replace(/1/g, "'");
  let isEquivalentVector = false;
  let isVectorFormat = false;
  if (/^[A-D][1']?[A-D][1']?$/.test(cleanClaim)) {
    try {
      const claimCoords = getVectorCoords(cleanClaim[0], cleanClaim.slice(1), vertices);
      isVectorFormat = true;
      if (
        claimCoords[0] === evalResult.vector[0] &&
        claimCoords[1] === evalResult.vector[1] &&
        claimCoords[2] === evalResult.vector[2]
      ) {
        isEquivalentVector = true;
      }
    } catch (_) {
      // Bỏ qua nếu claim không khớp đỉnh
    }
  }

  let isValid = false;
  let reason = '';

  if (isVectorFormat) {
    if (isEquivalentVector) {
      isValid = true;
      reason = `Chính xác! Vectơ tổng tương đương với vectơ ${cleanClaim}, có độ dài chính xác là ${correctLatex}.`;
    } else {
      isValid = false;
      reason = `Sai lệch: Vectơ tổng không tương đương với vectơ ${cleanClaim}. Kết quả chính xác phải là ${correctLatex}.`;
    }
  } else if (parsedClaim !== null) {
    // So khớp độ dài với ngưỡng dung sai số học (epsilon = 0.05)
    const isClose = Math.abs(parsedClaim - evalResult.length) < 0.05;
    isValid = isClose;

    if (isValid) {
      reason = `Chính xác! Biểu thức ${expr} có độ dài chính xác là ${correctLatex}.`;
    } else {
      // Phân tích bẫy ngộ nhận cụ thể (VD: cộng độ dài |BC| + |DD'| = 2a)
      const sanitized = expr.replace(/[|()]/g, '').trim();
      if (sanitized === "BC + DD'" || sanitized === "BC+DD'") {
        reason = `Sai lầm ngộ nhận cộng trực tiếp độ dài: |BC| + |DD'| = ${isNumericSide ? `${2*sideNum}` : '2a'} là SAI! Vì DD' = CC', nên BC + DD' = BC + CC' = BC'. Do đó độ dài là đường chéo hình vuông BC' = ${correctLatex}.`;
      } else {
        reason = `Sai lệch: Giá trị tính toán chuẩn là ${correctLatex} (xấp xỉ ${calculatedVal}), trong khi phát biểu đưa ra là ${claim}.`;
      }
    }
  } else {
    // Không phân tích được biểu thức toán học hoặc phát biểu chung chung
    isValid = null;
    reason = `Không phân tích được giá trị cụ thể từ phát biểu "${claim}" (unparseable_claim). Biểu thức chuẩn là ${correctLatex}.`;
  }

  return {
    isValid,
    correct: correctLatex,
    calculatedValue: calculatedVal,
    claimValue: parsedClaim,
    reason,
    steps: [
      `1. Dựng vectơ: ${evalResult.parsedTerms.map(t => `${t.sign} ${t.name}`).join(' ')}`,
      `2. Toạ độ vectơ tổng: (${evalResult.vector.join(', ')})`,
      `3. Độ dài tính toán: ${calculatedVal} ~ ${correctLatex}`,
      `4. Kết luận kiểm chứng: ${isValid === true ? 'ĐÚNG' : isValid === false ? 'SAI' : 'CHƯA XÁC ĐỊNH'}`,
    ],
  };
}

export default verifyVectorAlgebra;
