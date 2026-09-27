import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { listMisconceptionIds } from './src/contentLibrary.js';
import { startSession, submitAnswer, submitRebuttal } from './src/orchestrator.js';

const rl = readline.createInterface({ input: stdin, output: stdout });

async function main() {
  console.log('=== DRE test CLI ===');
  console.log('Các bài có sẵn:', listMisconceptionIds().join(', '));

  const misconceptionId = (await rl.question('Chọn misconceptionId (VD: MISC_001): ')).trim();

  const { sessionId, baiToan, coLamDialogue } = await startSession({ misconceptionId });
  console.log(`\n[Đề bài] ${baiToan}`);
  console.log(`[Cô Lam] ${coLamDialogue}\n`);

  const cauTraLoi = await rl.question('Nhập câu trả lời của bạn: ');
  const answerResult = await submitAnswer({ sessionId, cauTraLoi });
  console.log(`\n[Assessor] đánh giá: ${answerResult.danhGia}`);
  console.log(`[Bo] (${answerResult.mode}) ${answerResult.boDialogue}\n`);

  let done = answerResult.done;
  while (!done) {
    const phanBien = await rl.question('Phản biện lại Bo: ');
    const rebuttalResult = await submitRebuttal({ sessionId, phanBien });

    console.log(`\n[Assessor] phản biện: ${rebuttalResult.danhGiaPhanBien}`);
    if (rebuttalResult.boDialogue) {
      console.log(`[Bo] ${rebuttalResult.boDialogue}`);
    }
    if (Array.isArray(rebuttalResult.coLamDialogue)) {
      rebuttalResult.coLamDialogue.forEach((line) => console.log(`[Cô Lam] ${line}`));
    } else if (rebuttalResult.coLamDialogue) {
      console.log(`[Cô Lam] ${rebuttalResult.coLamDialogue}`);
    }
    console.log('');

    done = rebuttalResult.done;
  }

  console.log('=== Hết bài, session đóng ===');
  rl.close();
}

main().catch((err) => {
  console.error('Lỗi:', err.message);
  rl.close();
  process.exit(1);
});
