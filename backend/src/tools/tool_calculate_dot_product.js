/**
 * tool_calculate_dot_product.js
 *
 * Deterministic Tool: Tính toán tích vô hướng chính xác u . v = |u||v|cos(theta)
 * và góc giữa hai vectơ theta = arccos((u . v) / (|u||v|)).
 *
 * Phục vụ kiểm chứng các bẫy ngộ nhận:
 * - MISC_VEC_017: Đảo một vectơ không đổi góc (góc bù: angle(-u, v) = 180° - theta)
 * - MISC_VEC_018: Gán góc cố định cho vectơ không (mẫu số bằng 0, không xác định)
 * - MISC_VEC_019: Tích vô hướng luôn không âm hoặc là vectơ (thực tế có thể âm khi góc tù, kết quả là số thực)
 * - MISC_VEC_020: Bình phương tổng bỏ số hạng chéo (|u+v|^2 = |u|^2 + |v|^2 + 2u.v)
 */

export function calculateDotProduct({
  uMag,
  vMag,
  angleDeg,
  claimValue,
  claimType = 'dot_product', // 'dot_product' | 'angle' | 'reverse_angle' | 'norm_sum_squared'
  isReversed = false,
  reverseU = false,
}) {
  const u = typeof uMag === 'string' ? parseFloat(uMag) : uMag;
  const v = typeof vMag === 'string' ? parseFloat(vMag) : vMag;
  const baseTheta = typeof angleDeg === 'string' ? parseFloat(angleDeg) : angleDeg;
  const hasTheta = baseTheta !== undefined && baseTheta !== null && !isNaN(baseTheta);
  const effectiveIsReversed = Boolean(reverseU || isReversed || claimType === 'reverse_angle');
  const theta = hasTheta && effectiveIsReversed ? 180 - baseTheta : baseTheta;
  const reversedAngleVal = hasTheta ? 180 - baseTheta : null;

  // 1. Kiểm tra trường hợp với vectơ không (MISC_VEC_018)
  if (u === 0 || v === 0) {
    let zeroValid = null;
    let zeroReason = 'Vectơ không có độ dài bằng 0 nên tích vô hướng bằng 0, còn góc với vectơ khác không xác định (mẫu số |u||v| = 0 trong công thức cos).';

    if (claimValue !== undefined && claimValue !== null && claimValue !== '') {
      const claimStr = String(claimValue).trim().toLowerCase();
      const claimNum = parseFloat(claimStr);
      if (claimType === 'angle' || claimType === 'reverse_angle') {
        // Với góc: góc với vectơ-không là KHÔNG XÁC ĐỊNH, mọi phát biểu góc cụ thể đều sai
        zeroValid = false;
        zeroReason = 'Vectơ không có độ dài bằng 0 nên không xác định góc với vectơ khác (mẫu số |u||v| = 0 trong công thức cos).';
      } else if (claimStr.includes('vecto') || claimStr.includes('vector')) {
        zeroValid = false;
        zeroReason = 'Tích vô hướng là một số thực (ở đây bằng 0), không phải một vectơ.';
      } else if (['không âm', '>= 0'].includes(claimStr)) {
        zeroValid = true;
      } else if (claimStr === '> 0') {
        zeroValid = false;
      } else if (!isNaN(claimNum)) {
        zeroValid = Math.abs(claimNum - 0) < 1e-5;
        zeroReason = zeroValid
          ? 'Chính xác! Tích vô hướng của vectơ không với mọi vectơ luôn bằng 0.'
          : `Tích vô hướng với vectơ không luôn bằng 0, không phải ${claimNum}.`;
      } else {
        zeroValid = null;
        zeroReason = 'Không phân tích được giá trị số từ phát biểu.';
      }
    }

    return {
      isValid: zeroValid,
      dotProduct: 0,
      angleDeg: null,
      reversedAngleDeg: null,
      isZeroVector: true,
      reason: zeroReason,
      formula: '\\vec{u} \\cdot \\vec{v} = 0 \\text{ nhưng góc không xác định}',
    };
  }

  // 2. Tính tích vô hướng u . v = |u||v|cos(theta)
  let calculatedDot = null;
  let calculatedCos = null;
  if (theta !== undefined && theta !== null && !isNaN(theta)) {
    const rad = (theta * Math.PI) / 180;
    calculatedCos = Math.cos(rad);
    // Làm tròn tránh sai số dấu phẩy động (vd: cos 90° = 0)
    if (Math.abs(calculatedCos) < 1e-10) calculatedCos = 0;
    calculatedDot = Math.round(u * v * calculatedCos * 1000) / 1000;
  }

  const steps = [];
  steps.push(`Độ dài các vectơ: |\\vec{u}| = ${u}, |\\vec{v}| = ${v}.`);
  if (theta !== undefined && theta !== null) {
    steps.push(`Góc giữa hai vectơ: \\theta = ${theta}^\\circ \\implies \\cos(${theta}^\\circ) = ${calculatedCos.toFixed(3)}.`);
    steps.push(`Tích vô hướng: \\vec{u} \\cdot \\vec{v} = ${u} \\times ${v} \\times (${calculatedCos.toFixed(3)}) = ${calculatedDot}.`);
  }

  // 3. Đánh giá claim nếu có
  let isValid = null;
  let reason = '';
  let correct = null;

  if (claimValue !== undefined && claimValue !== null && claimValue !== '') {
    const claimStr = String(claimValue).trim().toLowerCase();
    const claimNum = parseFloat(claimStr);

    // DẠNG A: Góc đảo chiều angle(-u, v) = 180° - theta (MISC_VEC_017)
    if (effectiveIsReversed) {
      correct = `${theta}°`;

      if (!isNaN(claimNum)) {
        if (Math.abs(claimNum - theta) < 0.1) {
          isValid = true;
          reason = `Chính xác! Khi đảo một vectơ (ví dụ từ \\vec{v} thành -\\vec{v}), góc giữa hai vectơ trở thành góc bù: ${theta}°.`;
        } else if (hasTheta && (Math.abs(claimNum - baseTheta) < 0.1 || claimStr.includes('không đổi') || claimStr.includes('bằng nhau'))) {
          isValid = false;
          reason = `Sai lầm ngộ nhận 'đảo một vectơ không đổi góc'! Với hai vectơ khác không, đảo một vectơ sẽ làm góc θ thành góc bù 180° - θ (tức 180° - ${baseTheta}° = ${theta}°), không giữ nguyên ${baseTheta}°.`;
        } else {
          isValid = false;
          reason = `Góc sau khi đảo một vectơ là ${theta}°, không phải ${claimNum}°.`;
        }
      } else {
        isValid = false;
        reason = `Góc bù khi đảo một vectơ là ${theta}°.`;
      }

      steps.push(`Đảo một vectơ: (-\\vec{u}, \\vec{v}) = 180^\\circ - (${baseTheta}^\\circ) = ${theta}^\\circ.`);
    }
    // DẠNG B: Bình phương tổng bỏ số hạng chéo (MISC_VEC_020)
    else if (claimType === 'norm_sum_squared' || claimType === 'dot_expansion') {
      const uSq = Math.round(u * u * 1000) / 1000;
      const vSq = Math.round(v * v * 1000) / 1000;
      const crossTerm = Math.round(2 * calculatedDot * 1000) / 1000;
      const sumSquared = Math.round((uSq + vSq + crossTerm) * 1000) / 1000;
      correct = String(sumSquared);

      // Nếu Bo bỏ số hạng chéo: claimNum === u^2 + v^2
      const omittedCrossValue = uSq + vSq;

      if (!isNaN(claimNum)) {
        if (Math.abs(claimNum - sumSquared) < 0.05) {
          isValid = true;
          reason = `Chính xác! |\\vec{u}+\\vec{v}|^2 = |\\vec{u}|^2 + |\\vec{v}|^2 + 2\\vec{u}\\cdot\\vec{v} = ${uSq} + ${vSq} + ${crossTerm} = ${sumSquared}.`;
        } else if (Math.abs(claimNum - omittedCrossValue) < 0.05) {
          isValid = false;
          reason = `Sai lầm ngộ nhận bỏ quên số hạng chéo 2\\vec{u}\\cdot\\vec{v}! Theo hằng đẳng thức: |\\vec{u}+\\vec{v}|^2 = |\\vec{u}|^2 + |\\vec{v}|^2 + 2\\vec{u}\\cdot\\vec{v} = ${uSq} + ${vSq} + ${crossTerm} = ${sumSquared}, không phải ${claimNum}. (Chỉ được bỏ số hạng chéo khi hai vectơ vuông góc).`;
        } else {
          isValid = false;
          reason = `Bình phương độ dài tổng chính xác là ${sumSquared}, trong khi phát biểu đưa ra là ${claimNum}.`;
        }
      }

      steps.push(`Khai triển bình phương tổng: |\\vec{u}+\\vec{v}|^2 = ${u}^2 + ${v}^2 + 2(${calculatedDot}) = ${sumSquared}.`);
    }
    // DẠNG C: Kiểm tra góc thông thường
    else if (claimType === 'angle') {
      correct = `${theta}°`;
      if (!isNaN(claimNum) && theta !== undefined) {
        if (Math.abs(claimNum - theta) < 0.1) {
          isValid = true;
          reason = `Chính xác! Góc giữa hai vectơ là ${theta}°.`;
        } else {
          isValid = false;
          reason = `Góc tính toán là ${theta}°, trong khi phát biểu cho rằng là ${claimNum}°.`;
        }
      }
    }
    // DẠNG D: Tích vô hướng thông thường (MISC_VEC_019, v.v.)
    else {
      correct = String(calculatedDot);
      if (claimStr.includes('vecto') || claimStr.includes('vector')) {
        isValid = false;
        reason = 'Tích vô hướng của hai vectơ là một SỐ THỰC (vô hướng), không phải là một vectơ!';
      } else if (!isNaN(claimNum) && calculatedDot !== null) {
        if (Math.abs(claimNum - calculatedDot) < 0.05) {
          isValid = true;
          reason = `Chính xác! Tích vô hướng \\vec{u} \\cdot \\vec{v} = ${calculatedDot}.`;
        } else {
          isValid = false;
          reason = `Tích vô hướng chính xác là ${calculatedDot}, không phải ${claimNum}. (Lưu ý: khi góc tù > 90°, cos âm nên tích vô hướng âm).`;
        }
      } else if (claimStr === 'không âm' || claimStr === '>= 0' || claimStr === '> 0') {
        if (calculatedDot !== null && calculatedDot < 0) {
          isValid = false;
          reason = `Sai lầm: Tích vô hướng có thể âm! Với góc ${theta}° (> 90°), cos là số âm nên tích vô hướng ra ${calculatedDot} < 0.`;
        } else if (calculatedDot !== null) {
          isValid = claimStr !== '> 0' || calculatedDot > 0;
        }
      }
    }
  }

  return {
    isValid,
    dotProduct: calculatedDot,
    cosValue: calculatedCos,
    angleDeg: theta,
    reversedAngleDeg: reversedAngleVal,
    correct,
    formula: effectiveIsReversed 
      ? '(\\vec{u}, -\\vec{v}) = 180^\\circ - (\\vec{u}, \\vec{v})'
      : claimType === 'norm_sum_squared'
        ? '|\\vec{u}+\\vec{v}|^2 = |\\vec{u}|^2 + |\\vec{v}|^2 + 2\\vec{u}\\cdot\\vec{v}'
        : '\\vec{u} \\cdot \\vec{v} = |\\vec{u}| |\\vec{v}| \\cos(\\theta)',
    reason: reason || `Kết quả tích vô hướng: ${calculatedDot}.`,
    steps,
  };
}

export default calculateDotProduct;
