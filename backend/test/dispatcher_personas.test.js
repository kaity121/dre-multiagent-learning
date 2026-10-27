import assert from 'node:assert/strict';
import { classifyHeuristic, dispatchMessage } from '../src/services/dispatcher.js';

console.log('🧪 BẮT ĐẦU KIỂM THỬ: Disambiguation of Agent Personas & DRE Dispatcher\n');

async function runTests() {
  // TEST 1: Học sinh hỏi Bo đang thắc mắc câu nào
  console.log('--- Test 1: "bo thắc mắc câu nào không mình giải thích cho" ---');
  const h1 = classifyHeuristic('bo thắc mắc câu nào không mình giải thích cho');
  assert.equal(h1.dispatchedAgent, 'bo', 'Dispatched agent must be Bo');
  assert.equal(h1.detectedIntent, 'challenge_shortcut_fallacy', 'Intent must be challenge_shortcut_fallacy');
  
  const d1 = await dispatchMessage({
    message: 'bo thắc mắc câu nào không mình giải thích cho',
    useLLM: false,
  });
  assert.equal(d1.primaryResponse.author, 'Bo');
  assert.match(d1.primaryResponse.text, /Ví dụ 3|BC \+ DD'|1 \+ 1 = 2/, 'Bo must voice his Ví dụ 3 dilemma');
  assert.equal(d1.followUpResponse, null, 'No follow-up from Cô Lam yet');
  console.log('✅ PASS Test 1: Bo nêu bẫy Ví dụ 3, không nhận thua sớm.\n');

  // TEST 2: Học sinh chỉ nói bâng quơ "sai rồi bo" mà không đưa ra lý do toán học
  console.log('--- Test 2: "sai rồi bo" (Unsubstantiated Rebuttal) ---');
  const h2 = classifyHeuristic('sai rồi bo');
  assert.equal(h2.dispatchedAgent, 'bo', 'Dispatched agent must be Bo');
  assert.equal(h2.unsubstantiatedRebuttal, true, 'Must be marked as unsubstantiatedRebuttal');
  assert.notEqual(h2.detectedIntent, 'sharp_rebuttal', 'Must NOT be sharp_rebuttal without math reasons');

  const d2 = await dispatchMessage({
    message: 'sai rồi bo',
    useLLM: false,
  });
  assert.equal(d2.primaryResponse.author, 'Bo');
  assert.match(d2.primaryResponse.text, /Ủa, tớ sai chỗ nào|chưa phục/i, 'Bo must push back for reasons');
  assert.equal(d2.followUpResponse, null, 'Cô Lam must NOT close prematurely');
  console.log('✅ PASS Test 2: Bo phản bác lại đòi chứng minh, Cô Lam không vào cắt ngang.\n');

  // TEST 3: Học sinh hỏi so sánh "vậy thì bo đúng hay bo sai vậy"
  console.log('--- Test 3: "vậy thì bo đúng hay bo sai vậy" (Comparison Inquiry) ---');
  const h3 = classifyHeuristic('vậy thì bo đúng hay bo sai vậy');
  assert.equal(h3.dispatchedAgent, 'tri', 'Dispatched agent must be Trí');
  assert.equal(h3.detectedIntent, 'ask_deep_concept');

  const d3 = await dispatchMessage({
    message: 'vậy thì bo đúng hay bo sai vậy',
    useLLM: false,
  });
  assert.equal(d3.primaryResponse.author, 'Trí');
  assert.match(d3.primaryResponse.text, /Bo sai rồi|bất đẳng thức tam giác|cùng hướng/i, 'Trí explains why Bo is wrong');
  console.log('✅ PASS Test 3: Trí trả lời rõ ràng Bo sai vì ngộ nhận bất đẳng thức tam giác.\n');

  // TEST 4: Học sinh hỏi Cô Lam "vậy em nói có đúng không"
  console.log('--- Test 4: "vậy em nói có đúng không" (Teacher Confirmation) ---');
  const h4 = classifyHeuristic('vậy em nói có đúng không');
  assert.equal(h4.dispatchedAgent, 'colam', 'Dispatched agent must be Cô Lam');

  const d4 = await dispatchMessage({
    message: 'vậy em nói có đúng không',
    useLLM: false,
  });
  assert.equal(d4.primaryResponse.author, 'Cô Lam');
  assert.equal(d4.primaryResponse.avatarId, 'colam');
  assert.match(d4.primaryResponse.text, /Cô khen ngợi|của em/i, 'Cô Lam speaks as teacher');
  console.log('✅ PASS Test 4: Cô Lam xác nhận đúng đắn với tư cách giáo viên.\n');

  // TEST 5: Học sinh phản biện sắc bén có dẫn chứng toán học "Bo sai rồi, độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng thôi!"
  console.log('--- Test 5: "Bo sai rồi, độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng thôi!" (Sharp Rebuttal) ---');
  const h5 = classifyHeuristic('Bo sai rồi, độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng thôi!');
  assert.equal(h5.detectedIntent, 'sharp_rebuttal');
  assert.equal(h5.dispatchedAgent, 'bo');

  const d5 = await dispatchMessage({
    message: 'Bo sai rồi, độ dài tổng chỉ bằng tổng độ dài khi hai vectơ cùng hướng thôi!',
    useLLM: false,
  });
  assert.equal(d5.primaryResponse.author, 'Bo');
  assert.match(d5.primaryResponse.text, /Phục cậu|cùng hướng/i, 'Bo concedes');
  assert.notEqual(d5.followUpResponse, null, 'Cô Lam must step in');
  assert.equal(d5.followUpResponse.author, 'Cô Lam');
  assert.equal(d5.followUpResponse.avatarId, 'colam');
  console.log('✅ PASS Test 5: Chuỗi liên hoàn Bo nhận thua -> Cô Lam chốt kiến thức với author Cô Lam chuẩn xác.\n');

  // TEST 6: Học sinh rủ đi chơi / xao nhãng học tập "chắc giống hệt thôi học hành gì bo ơi, mình đi chơi thôi"
  console.log('--- Test 6: "chắc giống hệt thôi học hành gì bo ơi, mình đi chơi thôi" (Encourage Study Focus) ---');
  const h6 = classifyHeuristic('chắc giống hệt thôi học hành gì bo ơi, mình đi chơi thôi');
  assert.equal(h6.detectedIntent, 'encourage_study_focus');
  assert.equal(h6.dispatchedAgent, 'bo');

  const d6 = await dispatchMessage({
    message: 'chắc giống hệt thôi học hành gì bo ơi, mình đi chơi thôi',
    useLLM: false,
  });
  assert.equal(d6.primaryResponse.author, 'Bo');
  assert.match(d6.primaryResponse.text, /trốn học|THPT Quốc Gia|Ráng ở lại học/i, 'Bo urges to stay and study');
  assert.notEqual(d6.followUpResponse, null, 'Cô Lam must step in to encourage and focus');
  assert.equal(d6.followUpResponse.author, 'Cô Lam');
  assert.equal(d6.followUpResponse.avatarId, 'colam');
  assert.match(d6.followUpResponse.text, /Cô nghe thấy|rủ nhau đi chơi|tập trung/i, 'Cô Lam reminds and encourages');
  console.log('✅ PASS Test 6: Bo từ chối đi chơi + Cô Lam nhắc nhở kéo về bài học và khích lệ học tập chuẩn xác.\n');

  console.log('🎉 TẤT CẢ 6 BÀI TEST ĐÃ VƯỢT QUA XUẤT SẮC!');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
