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
    let zeroReason = 'Theo quy ước SGK (KN_VEC_018), góc giữa vectơ không với một vectơ khác có thể nhận giá trị tùy ý từ 0° đến 180°, còn tích vô hướng bằng 0 (không áp dụng công thức chia cos vì mẫu bằng 0).';
    let correctVal = null;

    if (claimValue !== undefined && claimValue !== null && claimValue !== '') {
      const claimStr = String(claimValue).trim().toLowerCase();
      const claimNum = parseFloat(claimStr);

      if (claimType === 'norm_sum_squared' || claimType === 'dot_expansion') {
        // |0 + v|^2 = |v|^2 (vì 0 + v = v, hoặc u^2 + v^2 + 2*0 = u^2 + v^2)
        const expectedNormSq = Math.round((u * u + v * v) * 1000) / 1000;
        correctVal = String(expectedNormSq);
        if (!isNaN(claimNum)) {
          zeroValid = Math.abs(claimNum - expectedNormSq) < 0.05;
          zeroReason = zeroValid
            ? `Chính xác! Với vectơ không, |\\vec{u}+\\vec{v}|^2 = ${expectedNormSq}.`
            : `Với vectơ không, |\\vec{u}+\\vec{v}|^2 = ${expectedNormSq}, không phải ${claimNum}.`;
        } else {
          zeroValid = false;
          zeroReason = `Với vectơ không, |\\vec{u}+\\vec{v}|^2 = ${expectedNormSq}.`;
        }
      } else if (claimType === 'angle' || claimType === 'reverse_angle') {
        correctVal = '0° đến 180° (tùy ý)';
        const isArbitraryClaim = /tùy\s*ý|tuy\s*y|0.*180|từ\s*0|tu\s*0/i.test(claimStr);

        if (isArbitraryClaim) {
          zeroValid = true;
          zeroReason = 'Chính xác! Theo quy ước SGK (KN_VEC_018), góc giữa vectơ không với một vectơ khác nhận giá trị tùy ý từ 0° đến 180°.';
        } else if (!isNaN(claimNum)) {
          // Bẫy Bo: gán góc cố định duy nhất (ví dụ bắt buộc bằng 0°)
          zeroValid = false;
          zeroReason = `Sai lầm ngộ nhận 'gán góc cố định cho vectơ không' (MISC_VEC_018)! Quy ước SGK cho phép góc với vectơ không nhận giá trị tùy ý từ 0° đến 180°, không bắt buộc duy nhất là ${claimNum}°. Ngoài ra mẫu số |u||v| = 0 nên không thể áp dụng công thức chia cos.`;
        } else {
          zeroValid = false;
          zeroReason = 'Theo quy ước SGK (KN_VEC_018), góc với vectơ không nhận giá trị tùy ý từ 0° đến 180°.';
        }
      } else if (/vect[oơ]|vector/i.test(claimStr)) {
        zeroValid = false;
        zeroReason = 'Tích vô hướng là một số thực (ở đây bằng 0), không phải một vectơ.';
      } else if (['không âm', 'khong am', '>= 0', '>=0'].includes(claimStr)) {
        zeroValid = true;
      } else if (claimStr === '> 0' || claimStr === '>0') {
        zeroValid = false;
        zeroReason = 'Tích vô hướng với vectơ không bằng đúng 0, không lớn hơn 0.';
      } else if (!isNaN(claimNum)) {
        correctVal = '0';
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
      correct: correctVal,
      isZeroVector: true,
      reason: zeroReason,
      formula: (claimType === 'angle' || claimType === 'reverse_angle')
        ? '0^\\circ \\le (\\vec{u}, \\vec{v}) \\le 180^\\circ \\text{ (tùy ý theo quy ước SGK)}'
        : (claimType === 'norm_sum_squared' || claimType === 'dot_expansion')
          ? '|\\vec{u}+\\vec{v}|^2 = |\\vec{u}|^2 + |\\vec{v}|^2 + 2\\vec{u}\\cdot\\vec{v}'
          : '\\vec{u} \\cdot \\vec{v} = 0',
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

    // DẠNG A: Góc giữa hai vectơ hoặc góc đảo chiều angle(-u, v) = 180° - theta (MISC_VEC_017)
    if (claimType === 'angle' || claimType === 'reverse_angle') {
      if (!hasTheta) {
        return {
          isValid: false,
          dotProduct: null,
          cosValue: null,
          angleDeg: null,
          reversedAngleDeg: null,
          correct: null,
          error: effectiveIsReversed
            ? 'Thiếu tham số angleDeg: cần có góc ban đầu để tính góc sau khi đảo hướng.'
            : 'Thiếu tham số angleDeg để kiểm chứng góc giữa hai vectơ.',
          reason: effectiveIsReversed
            ? 'Cần có góc ban đầu angleDeg để tính góc bù 180° - θ khi đảo chiều vectơ.'
            : 'Chưa có thông tin góc ban đầu giữa hai vectơ để kiểm chứng.',
          formula: effectiveIsReversed
            ? '(\\vec{u}, -\\vec{v}) = 180^\\circ - (\\vec{u}, \\vec{v})'
            : '\\cos(\\vec{u}, \\vec{v}) = \\frac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}| |\\vec{v}|',
          steps: [],
        };
      }
      correct = `${theta}°`;

      if (effectiveIsReversed) {
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
      } else {
        // Góc thông thường không đảo
        if (!isNaN(claimNum)) {
          if (Math.abs(claimNum - theta) < 0.1) {
            isValid = true;
            reason = `Chính xác! Góc giữa hai vectơ là ${theta}°.`;
          } else {
            isValid = false;
            reason = `Góc tính toán là ${theta}°, trong khi phát biểu cho rằng là ${claimNum}°.`;
          }
        }
      }
    }
    // DẠNG B: Bình phương tổng bỏ số hạng chéo (MISC_VEC_020)
    else if (claimType === 'norm_sum_squared' || claimType === 'dot_expansion') {
      if (!hasTheta || calculatedDot === null) {
        return {
          isValid: false,
          dotProduct: null,
          cosValue: null,
          angleDeg: null,
          reversedAngleDeg: null,
          correct: null,
          error: 'Thiếu tham số angleDeg: cần có góc giữa hai vectơ để tính số hạng chéo 2\\vec{u}\\cdot\\vec{v}.',
          reason: 'Không thể tính bình phương độ dài tổng |\\vec{u}+\\vec{v}|^2 khi chưa biết góc giữa hai vectơ (thiếu angleDeg). Khẳng định |\\vec{u}+\\vec{v}|^2 = |\\vec{u}|^2 + |\\vec{v}|^2 chỉ đúng khi hai vectơ vuông góc (góc 90°); không được tự tiện bỏ qua số hạng chéo khi chưa có góc.',
          formula: '|\\vec{u}+\\vec{v}|^2 = |\\vec{u}|^2 + |\\vec{v}|^2 + 2\\vec{u}\\cdot\\vec{v}',
          steps: [
            `Độ dài các vectơ: |\\vec{u}| = ${u}, |\\vec{v}| = ${v}.`,
            'Thiếu góc \\theta giữa hai vectơ nên không xác định được số hạng chéo 2\\vec{u}\\cdot\\vec{v}.',
          ],
        };
      }
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
    // DẠNG C: Tích vô hướng thông thường hoặc sau khi đảo vectơ (claimType === 'dot_product' hoặc mặc định)
    else {
      if (effectiveIsReversed && !hasTheta) {
        return {
          isValid: false,
          dotProduct: null,
          cosValue: null,
          angleDeg: null,
          reversedAngleDeg: null,
          correct: null,
          error: 'Thiếu tham số angleDeg: cần có góc ban đầu để tính tích vô hướng sau khi đảo hướng.',
          reason: 'Cần có góc ban đầu angleDeg để tính góc bù 180° - θ khi đảo chiều vectơ.',
          formula: '(\\vec{u}, -\\vec{v}) = 180^\\circ - (\\vec{u}, \\vec{v})',
          steps: [],
        };
      }
      correct = String(calculatedDot);
      if (/vect[oơ]|vector/i.test(claimStr)) {
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
    formula: (claimType === 'angle' || claimType === 'reverse_angle')
      ? (effectiveIsReversed
          ? '(\\vec{u}, -\\vec{v}) = 180^\\circ - (\\vec{u}, \\vec{v})'
          : '\\cos(\\vec{u}, \\vec{v}) = \\frac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}| |\\vec{v}|')
      : (claimType === 'norm_sum_squared' || claimType === 'dot_expansion')
        ? '|\\vec{u}+\\vec{v}|^2 = |\\vec{u}|^2 + |\\vec{v}|^2 + 2\\vec{u}\\cdot\\vec{v}'
        : (effectiveIsReversed
            ? '\\vec{u} \\cdot (-\\vec{v}) = |\\vec{u}| |\\vec{v}| \\cos(180^\\circ - \\theta)'
            : '\\vec{u} \\cdot \\vec{v} = |\\vec{u}| |\\vec{v}| \\cos(\\theta)'),
    reason: reason || `Kết quả tích vô hướng: ${calculatedDot}.`,
    steps,
  };
}

export default calculateDotProduct;
