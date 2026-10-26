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
}) {
  const u = typeof uMag === 'string' ? parseFloat(uMag) : uMag;
  const v = typeof vMag === 'string' ? parseFloat(vMag) : vMag;
  const theta = typeof angleDeg === 'string' ? parseFloat(angleDeg) : angleDeg;

  // 1. Kiểm tra trường hợp góc với vectơ không (MISC_VEC_018)
  if (u === 0 || v === 0) {
    return {
      isValid: claimValue !== undefined ? (String(claimValue).includes('0') ? false : null) : null,
      dotProduct: 0,
      angleDeg: null,
      isZeroVector: true,
      reason: 'Vectơ không có độ dài bằng 0 nên không xác định góc với vectơ khác (mẫu số |u||v| = 0 trong công thức cos).',
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

  if (claimValue !== undefined && claimValue !== null && claimValue !== '') {
    const claimStr = String(claimValue).trim().toLowerCase();
    const claimNum = parseFloat(claimStr);

    if (claimType === 'angle') {
      if (!isNaN(claimNum) && theta !== undefined) {
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
