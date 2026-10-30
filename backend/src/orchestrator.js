import { getMisconception } from './contentLibrary.js';
import { createSession, getSession, updateSession } from './sessionStore.js';
import { boChallenge, boRespondToRebuttal } from './agents/bo.js';
import { coLamKhoiDong, coLamCanThiep, coLamChotKienThuc } from './agents/colam.js';
import { chamDapAn, chamPhanBien } from './agents/assessor.js';

/**
 * Bước 1 — Cô Lam mở checkpoint.
 */
export async function startSession({ misconceptionId }) {
  const misc = getMisconception(misconceptionId);
  const session = createSession({ misconceptionId });

  const coLam = await coLamKhoiDong({ baiToan: misc.baiToan, giaiThichChuan: misc.giaiThichChuan });

  return {
    sessionId: session.id,
    baiToan: misc.baiToan,
    coLamDialogue: coLam.dialogue,
  };
}

/**
 * Bước 2-5 — học viên trả lời gốc → Assessor chấm → chọn loại bẫy → Bo thách thức.
 */
export async function submitAnswer({ sessionId, cauTraLoi }) {
  const session = getSession(sessionId);
  const misc = getMisconception(session.misconceptionId);

  const cham = await chamDapAn({
    baiToan: misc.baiToan,
    cauTraLoiHocVien: cauTraLoi,
    giaiThichChuan: misc.giaiThichChuan,
  });

  const danhGia = cham.danh_gia === 'dung' ? 'dung' : 'sai';

  // Bước 4: chọn loại bẫy theo đúng quy tắc đã chốt
  const loaiBay =
    danhGia === 'dung'
      ? Math.random() < 0.5
        ? 'shortcut_fallacy'
        : 'edge_case_skeptic'
      : 'misconception_ally';

  const bo = await boChallenge({
    baiToan: misc.baiToan,
    cauTraLoiHocVien: cauTraLoi,
    danhGia,
    loaiBay,
    giaiThichChuan: misc.giaiThichChuan,
  });

  updateSession(sessionId, {
    cauTraLoiGoc: cauTraLoi,
    danhGiaGoc: danhGia,
    loaiBay,
  });

  return {
    sessionId,
    danhGia,
    boDialogue: bo.dialogue,
    mode: bo.mode,
    done: false,
  };
}

/**
 * Bước 6-8 — học viên phản biện Bo → Assessor chấm phản biện → rẽ nhánh:
 *   sac_ben  → Bo nhận thua → Cô Lam chốt kiến thức → done
 *   chua_ro (lần 1) → Cô Lam gợi ý cấp 1 → chưa done, đợi phản biện lại
 *   chua_ro (lần 2, đã dùng gợi ý cấp 1) → Cô Lam gợi ý cấp 2 → Cô Lam chốt kiến thức → done
 */
export async function submitRebuttal({ sessionId, phanBien }) {
  const session = getSession(sessionId);
  if (session.done) {
    throw new Error(`Session "${sessionId}" đã kết thúc, không nhận phản biện thêm.`);
  }
  const misc = getMisconception(session.misconceptionId);

  const cham = await chamPhanBien({
    phanBienHocVien: phanBien,
    giaiThichChuan: misc.giaiThichChuan,
    moTaLoi: misc.moTaLoi,
  });

  const danhGiaPhanBien = cham.danh_gia_phan_bien === 'sac_ben' ? 'sac_ben' : 'chua_ro';

  if (danhGiaPhanBien === 'sac_ben') {
    const bo = await boRespondToRebuttal({
      baiToan: misc.baiToan,
      phanBienHocVien: phanBien,
      danhGiaPhanBien,
    });
    const coLam = await coLamChotKienThuc({
      baiToan: misc.baiToan,
      giaiThichChuan: misc.giaiThichChuan,
    });

    updateSession(sessionId, { done: true });

    return {
      sessionId,
      danhGiaPhanBien,
      boDialogue: bo.dialogue,
      coLamDialogue: coLam.dialogue,
      done: true,
    };
  }

  // danhGiaPhanBien === 'chua_ro'
  if (session.hintLevel === 0) {
    const coLam = await coLamCanThiep({
      baiToan: misc.baiToan,
      mucGoiY: 1,
      goiY: misc.goiY1,
    });
    updateSession(sessionId, { hintLevel: 1 });

    return {
      sessionId,
      danhGiaPhanBien,
      coLamDialogue: coLam.dialogue,
      hintLevel: 1,
      done: false, // học viên được thử phản biện lại một lần nữa
    };
  }

  // đã dùng gợi ý cấp 1 mà vẫn chưa rõ → dùng gợi ý cấp 2 rồi chốt luôn, tránh cãi vòng vô tận
  const coLamGoiY2 = await coLamCanThiep({
    baiToan: misc.baiToan,
    mucGoiY: 2,
    goiY: misc.goiY2,
  });
  const coLamChot = await coLamChotKienThuc({
    baiToan: misc.baiToan,
    giaiThichChuan: misc.giaiThichChuan,
  });

  updateSession(sessionId, { hintLevel: 2, done: true });

  return {
    sessionId,
    danhGiaPhanBien,
    coLamDialogue: [coLamGoiY2.dialogue, coLamChot.dialogue],
    hintLevel: 2,
    done: true,
  };
}
