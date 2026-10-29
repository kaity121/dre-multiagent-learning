import readline from 'readline';
import { dispatchMessage } from '../backend/src/services/dispatcher.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('================================================================');
console.log('🎯 DRE RUNTIME INTENT DISPATCHER — BÀN TEST NHANH (ISSUE #401)');
console.log('Gõ bất kỳ câu hỏi/phản biện nào của học sinh để thử nghiệm.');
console.log('Gõ "exit" hoặc nhấn Ctrl+C để thoát.');
console.log('================================================================\n');

function promptUser() {
  rl.question('💬 Nhập câu của học sinh: ', async (input) => {
    const text = input.trim();
    if (!text || text.toLowerCase() === 'exit') {
      console.log('Tạm biệt!');
      rl.close();
      return;
    }

    try {
      const result = await dispatchMessage({
        message: text,
        currentTime: 2233, // 37:13
        useLLM: false, // fallback an toàn/deterministic
      });

      console.log('\n--- 🧠 KẾT QUẢ PHÂN TÍCH & ĐIỀU PHỐI (DISPATCH VERDICT) ---');
      console.log(`📌 Ý định phát hiện: [${result.verdict.detectedIntent}]`);
      console.log(`👤 Bạn học được chọn: [${result.verdict.dispatchedAgent.toUpperCase()}]`);
      console.log(`🎯 Độ tin cậy (Confidence): ${(result.verdict.confidence * 100).toFixed(1)}%`);
      console.log(`💡 Lý do: ${result.verdict.reasoning}`);

      console.log('\n--- 🗣️ PHẢN HỒI LỚP HỌC (AGENT RESPONSES) ---');
      console.log(`[${result.primaryResponse.author}]: "${result.primaryResponse.text}"`);

      if (result.followUpResponse) {
        console.log(`[${result.followUpResponse.author} (Follow-up)]: "${result.followUpResponse.text}"`);
      }

      if (result.ragContextUsed) {
        console.log(`\n📚 Tri thức RAG: [${result.ragContextUsed.title}]`);
      }
      console.log('----------------------------------------------------------------\n');
    } catch (err) {
      console.error('❌ Lỗi:', err.message);
    }

    promptUser();
  });
}

promptUser();
