/**
 * tool_calculate_dot_product.js
 *
 * Deterministic Tool: Tính toán tích vô hướng chính xác u . v = |u||v|cos(theta)
 * và góc giữa hai vectơ theta = arccos((u . v) / (|u||v|)).
 *
 * Phục vụ kiểm chứng các bẫy ngộ nhận:
 * - MISC_VEC_017: Đảo một vectơ không đổi góc (góc bù: 180° - theta)
 * - MISC_VEC_018: Gán góc cố định cho vectơ không (mẫu số bằng 0, không xác định)
 * - MISC_VEC_019: Tích vô hướng luôn không âm hoặc là vectơ (thực tế có thể âm khi góc tù, kết quả là số thực)
 * - MISC_VEC_020: Bình phương tổng bỏ số hạng chéo (|u+v|^2 = |u|^2 + |v|^2 + 2u.v)
 */

export function calculateDotProduct({
  uMag,
  vMag,
  angleDeg,
  claimValue,
  claimType = 'dot_product', // 'dot_product' | 'angle'
  reverseU = false, // MISC_VEC_017: angle between -u and v is 180° - angle(u, v)
}) {
  const u = typeof uMag === 'string' ? parseFloat(uMag) : uMag;
  const v = typeof vMag === 'string' ? parseFloat(vMag) : vMag;
  const baseTheta = typeof angleDeg === 'string' ? parseFloat(angleDeg) : angleDeg;
  const hasTheta = baseTheta !== undefined && baseTheta !== null && !isNaN(baseTheta);
  const theta = hasTheta && reverseU ? 180 - baseTheta : baseTheta;
  const hasClaim = claimValue !== undefined && claimValue !== null && claimValue !== '';

  // 1. Vectơ không (MISC_VEC_018): tích vô hướng bằng 0, còn góc thì không xác định
  if (u === 0 || v === 0) {
    let isValid = null;
    let reason = 'Vectơ không có độ dài bằng 0 nên tích vô hướng bằng 0, còn góc với vectơ khác không xác định (mẫu số |u||v| = 0 trong công thức cos).';
    if (hasClaim) {
      const claimStr = String(claimValue).trim().toLowerCase();
      const claimNum = parseFloat(claimStr);
      if (claimType === 'angle') {
        isValid = false;
        reason = `Vectơ không thì không xác định góc với vectơ khác, nên không có góc ${claimStr}° nào cả.`;
      } else if (claimStr.includes('vecto') || claimStr.includes('vector')) {
        isValid = false;
        reason = 'Tích vô hướng là một số thực (ở đây bằng 0), không phải một vectơ.';
      } else if (['không âm', '>= 0'].includes(claimStr)) {
        isValid = true;
      } else if (claimStr === '> 0') {
        isValid = false;
      } else if (!isNaN(claimNum)) {
        isValid = Math.abs(claimNum) < 0.05;
        if (!isValid) reason = `Tích vô hướng với vectơ không bằng 0, không phải ${claimNum}.`;
      }
    }
    return {
      isValid,
      dotProduct: 0,
      angleDeg: null,
      isZeroVector: true,
      reason,
      formula: '\\vec{u} \\cdot \\vec{v} = 0 \\text{ nhưng góc không xác định}',
    };
  }

  // 2. Tính tích vô hướng u . v = |u||v|cos(theta)
  let calculatedDot = null;
  let calculatedCos = null;
  if (hasTheta) {
    const rad = (theta * Math.PI) / 180;
    calculatedCos = Math.cos(rad);
    // Làm tròn tránh sai số dấu phẩy động (vd: cos 90° = 0)
    if (Math.abs(calculatedCos) < 1e-10) calculatedCos = 0;
    calculatedDot = Math.round(u * v * calculatedCos * 1000) / 1000;
  }

  const steps = [];
  steps.push(`Độ dài các vectơ: |\\vec{u}| = ${u}, |\\vec{v}| = ${v}.`);
  if (hasTheta) {
    if (reverseU) {
      steps.push(`Đảo hướng vectơ u: góc giữa -\\vec{u} và \\vec{v} là 180^\\circ - ${baseTheta}^\\circ = ${theta}^\\circ.`);
    }
    steps.push(`Góc giữa hai vectơ: \\theta = ${theta}^\\circ \\implies \\cos(${theta}^\\circ) = ${calculatedCos.toFixed(3)}.`);
    steps.push(`Tích vô hướng: \\vec{u} \\cdot \\vec{v} = ${u} \\times ${v} \\times (${calculatedCos.toFixed(3)}) = ${calculatedDot}.`);
  }

  // 3. Đánh giá claim nếu có
  let isValid = null;
  let reason = '';

  if (hasClaim) {
    const claimStr = String(claimValue).trim().toLowerCase();
    const claimNum = parseFloat(claimStr);

    if (claimType === 'angle') {
      if (!isNaN(claimNum) && hasTheta) {
        if (Math.abs(claimNum - theta) < 0.1) {
          isValid = true;
          reason = `Chính xác! Góc giữa hai vectơ là ${theta}°.`;
        } else {
          isValid = false;
          reason = `Góc tính toán là ${theta}°, trong khi phát biểu cho rằng là ${claimNum}°.`;
        }
      }
    } else {
      // claimType === 'dot_product'
      // Kiểm tra ngộ nhận tích vô hướng là vectơ hoặc luôn không âm
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
    formula: '\\vec{u} \\cdot \\vec{v} = |\\vec{u}| |\\vec{v}| \\cos(\\theta)',
    reason: reason || `Kết quả tích vô hướng: ${calculatedDot}.`,
    steps,
  };
}

export default calculateDotProduct;
