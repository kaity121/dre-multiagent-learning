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

  // TEST 7: Ngộ nhận định nghĩa vectơ: "AB BA giống hệt nhau thôi mà"
  console.log('--- Test 7: "AB BA giống hệt nhau thôi mà" (Vector vs Segment Misconception) ---');
  const h7 = classifyHeuristic('AB BA giống hệt nhau thôi mà');
  assert.equal(h7.dispatchedAgent, 'tri', 'Dispatched agent must be Trí');
  assert.equal(h7.detectedIntent, 'ask_deep_concept');
  assert.equal(h7.isVectorEqualityTopic, true, 'Must identify vector equality topic');

  const d7 = await dispatchMessage({
    message: 'AB BA giống hệt nhau thôi mà',
    currentTime: 88, // 1:28
    useLLM: false,
  });
  assert.equal(d7.primaryResponse.author, 'Trí');
  assert.match(d7.primaryResponse.text, /CÓ HƯỚNG|ngược hướng|AB ≠ BA|không phân biệt thứ tự/i, 'Trí must explain directed segment');
  assert.notEqual(d7.followUpResponse, null, 'Minh Khang must follow up with real life analogy');
  assert.equal(d7.followUpResponse.author, 'Minh Khang');
  assert.match(d7.followUpResponse.text, /vé máy bay|Đà Nẵng|Hà Nội|ngược hướng/i, 'Minh Khang explains with flight analogy');
  console.log('✅ PASS Test 7: Trí phản biện sâu sắc ngộ nhận AB = BA + Minh Khang minh họa vé máy bay chuẩn xác.\n');

  // TEST 8: Học sinh bảo quãng đường như nhau, quan trọng gì đâu
  console.log('--- Test 8: "nhưng quãng đường cũng chừng đó mà, quan trọng gì đâu, AB = BA thôi" ---');
  const h8 = classifyHeuristic('nhưng quãng đường cũng chừng đó mà, quan trọng gì đâu, AB = BA thôi');
  assert.equal(h8.dispatchedAgent, 'tri');

  const d8 = await dispatchMessage({
    message: 'nhưng quãng đường cũng chừng đó mà, quan trọng gì đâu, AB = BA thôi',
    currentTime: 144, // 2:24
    useLLM: false,
  });
  assert.equal(d8.primaryResponse.author, 'Trí');
  assert.match(d8.primaryResponse.text, /quãng đường|CÓ HƯỚNG|ngược hướng/i, 'Trí distinguishes distance vs vector');
  console.log('✅ PASS Test 8: Trí phân biệt rành mạch giữa độ dài/quãng đường và hướng vectơ.\n');

  // TEST 9: Học sinh khẳng định vectơ AB = vectơ BA
  console.log('--- Test 9: "vậy vector cũng bằng nhau y như vậy, vector AB = vector BA" ---');
  const h9 = classifyHeuristic('vậy vector cũng bằng nhau y như vậy, vector AB = vector BA');
  assert.equal(h9.dispatchedAgent, 'tri');

  const d9 = await dispatchMessage({
    message: 'vậy vector cũng bằng nhau y như vậy, vector AB = vector BA',
    currentTime: 177, // 2:57
    useLLM: false,
  });
  assert.equal(d9.primaryResponse.author, 'Trí');
  assert.match(d9.primaryResponse.text, /ngược hướng|vectơ AB ≠ vectơ BA|vectơ AB = - vectơ BA/i, 'Trí confirms AB = -BA');
  console.log('✅ PASS Test 9: Trí bẻ gãy khẳng định sai lầm vector AB = vector BA bằng vectơ đối.\n');

  // TEST 10: Học sinh xem thường kiến thức, bảo dễ quá / giống hệt lớp 10
  console.log('--- Test 10: "dễ quá quan trọng gì đâu, giống hệt lớp 10 thôi mà" (Provocative 3D Hook) ---');
  const h10 = classifyHeuristic('dễ quá quan trọng gì đâu, giống hệt lớp 10 thôi mà');
  assert.equal(h10.dispatchedAgent, 'tri');
  assert.equal(h10.isTrivializingTopic, true);

  const d10 = await dispatchMessage({
    message: 'dễ quá quan trọng gì đâu, giống hệt lớp 10 thôi mà',
    currentTime: 100,
    useLLM: false,
  });
  assert.equal(d10.primaryResponse.author, 'Trí');
  assert.match(d10.primaryResponse.text, /CHÉO NHAU|VUÔNG GÓC|không gian 3D/i, 'Trí hooks curiosity with skew lines in 3D');
  assert.notEqual(d10.followUpResponse, null);
  assert.equal(d10.followUpResponse.author, 'Cô Lam');
  assert.match(d10.followUpResponse.text, /Cô rất thích sự tự tin|kỳ thú|Thầy Tiến/i, 'Cô Lam encourages');
  console.log('✅ PASS Test 10: Trí đưa ra câu hỏi kích thích tư duy 3D + Cô Lam khích lệ học tập xuất sắc.\n');

  // TEST 11: Học sinh nói với Bo về AB vs BA: Bo KHÔNG ảo giác bẫy hình lập phương
  console.log('--- Test 11: "@bo AB BA giống hệt nhau mà" (Bo Context Awareness) ---');
  const h11 = classifyHeuristic('@bo AB BA giống hệt nhau mà', 'bo');
  assert.equal(h11.dispatchedAgent, 'bo');
  assert.equal(h11.isVectorEqualityTopic, true);

  const d11 = await dispatchMessage({
    message: '@bo AB BA giống hệt nhau mà',
    currentTime: 88,
    recipient: 'bo',
    useLLM: false,
  });
  assert.equal(d11.primaryResponse.author, 'Bo');
  assert.match(d11.primaryResponse.text, /tớ cũng nghĩ hệt như cậu|Vectơ là đoạn thẳng CÓ HƯỚNG/i, 'Bo reflects on his past mistake');
  assert.doesNotMatch(d11.primaryResponse.text, /cộng ba cạnh|đường chéo|hình hộp/i, 'Bo must NOT hallucinate cube shortcuts');
  assert.equal(d11.followUpResponse.author, 'Trí');
  assert.match(d11.followUpResponse.text, /ngược hướng|vectơ AB = - vectơ BA/i, 'Trí follows up with rigorous explanation');
  console.log('✅ PASS Test 11: Bo đồng cảm ngộ nhận và nhường Trí chốt kiến thức, không ảo giác bẫy hình hộp.\n');

  // TEST 12: Câu hỏi tại mốc 7:15 về hành trình khép kín / Quãng đường vs Độ dời
  console.log('--- Test 12: "từ C về A thì vẫn là 1 đoạn dài mà, giống như tớ tới trường rồi về nhà cũng đi 1 đoạn dài mà, chứ đâu phải là 0" ---');
  const h12 = classifyHeuristic('từ C về A thì vẫn là 1 đoạn dài mà, giống như tớ tới trường rồi về nhà cũng đi 1 đoạn dài mà, chứ đâu phải là 0');
  assert.equal(h12.dispatchedAgent, 'tri', 'Must route to Trí');
  assert.equal(h12.detectedIntent, 'ask_deep_concept', 'Must be ask_deep_concept');
  assert.equal(h12.isZeroVectorTopic, true, 'Must flag isZeroVectorTopic');

  const d12 = await dispatchMessage({
    message: 'từ C về A thì vẫn là 1 đoạn dài mà, giống như tớ tới trường rồi về nhà cũng đi 1 đoạn dài mà, chứ đâu phải là 0',
    currentTime: 435, // 7:15
    useLLM: false,
  });
  assert.equal(d12.primaryResponse.author, 'Trí');
  assert.match(d12.primaryResponse.text, /QUÃNG ĐƯỜNG.*ĐỘ DỜI|vectơ-không|vectơ 0/i, 'Trí distinguishes distance vs displacement');
  assert.doesNotMatch(d12.primaryResponse.text, /hình lập phương|căn 2|1 \+ 1 = 2/i, 'Trí does NOT hallucinate irrelevant cube traps');
  assert.notEqual(d12.followUpResponse, null, 'Minh Khang must follow up');
  assert.equal(d12.followUpResponse.author, 'Minh Khang');
  assert.match(d12.followUpResponse.text, /máy tập gym|chạy bộ|độ dời/i, 'Minh Khang explains with treadmill analogy');
  console.log('✅ PASS Test 12: Trí giải thích Quãng đường vs Độ dời + Minh Khang ví von máy tập gym chuẩn xác.\n');

  // TEST 13: Đảm bảo không tồn tại artifact 'd6c2' trong bất kỳ phản hồi nào
  console.log('--- Test 13: Sanitize d6c2 artifact check ---');
  assert.doesNotMatch(d12.primaryResponse.text, /d6c2/, 'Primary response must not contain d6c2');
  assert.doesNotMatch(d12.followUpResponse.text, /d6c2/, 'Follow-up response must not contain d6c2');
  assert.doesNotMatch(d11.primaryResponse.text, /d6c2/, 'Primary response must not contain d6c2');
  assert.doesNotMatch(d11.followUpResponse.text, /d6c2/, 'Follow-up response must not contain d6c2');
  console.log('✅ PASS Test 13: Toàn bộ phản hồi sạch bóng artifact d6c2.\n');

  // TEST 14: Thắc mắc "1 + 1 = 2 thì chân lý mà nhỉ" tại 1:33
  console.log('--- Test 14: "1 + 1 =2 thì chân lý mà nhỉ" (1+1=2 vs Vector Magnitude) ---');
  const h14 = classifyHeuristic('1 + 1 =2 thì chân lý mà nhỉ');
  assert.equal(h14.isSumOnePlusOneTopic, true);
  assert.equal(h14.dispatchedAgent, 'tri');

  const d14 = await dispatchMessage({
    message: '1 + 1 =2 thì chân lý mà nhỉ',
    currentTime: 93, // 1:33
    useLLM: false,
  });
  assert.equal(d14.primaryResponse.author, 'Trí');
  assert.match(d14.primaryResponse.text, /1 \+ 1 = 2 đúng là chân lý|bất đẳng thức tam giác|CÙNG HƯỚNG/i);
  assert.notEqual(d14.followUpResponse, null);
  assert.equal(d14.followUpResponse.author, 'Cô Lam');
  assert.match(d14.followUpResponse.text, /không được nhầm lẫn|đại số thông thường/i);
  console.log('✅ PASS Test 14: Trí giải thích rạch ròi chân lý 1+1=2 số học vs bất đẳng thức tam giác vectơ + Cô Lam chốt.\n');

  // TEST 15: Câu hỏi ngoài lề quả bóng vàng "ai vừa giành quả bóng vàng 2026 vậy" tại 2:22
  console.log('--- Test 15: "ai vừa giành quả bóng vàng 2026 vậy" (Off-topic Ballon d\'Or with Study Focus Reminder) ---');
  const h15 = classifyHeuristic('ai vừa giành quả bóng vàng 2026 vậy');
  assert.equal(h15.isOffTopic, true);
  assert.equal(h15.dispatchedAgent, 'minhkhang');

  const d15 = await dispatchMessage({
    message: 'ai vừa giành quả bóng vàng 2026 vậy',
    currentTime: 142, // 2:22
    useLLM: false,
  });
  assert.equal(d15.primaryResponse.author, 'Minh Khang');
  assert.match(d15.primaryResponse.text, /Quả Bóng Vàng|Bellingham|Vinicius|Mbappe|Rodri/i);
  assert.match(d15.primaryResponse.text, /Thầy Tiến|tập trung|bài kiểm tra/i, 'Minh Khang must encourage returning to lesson');
  assert.notEqual(d15.followUpResponse, null);
  assert.equal(d15.followUpResponse.author, 'Cô Lam');
  assert.match(d15.followUpResponse.text, /tập trung|Thầy Tiến/i);
  console.log('✅ PASS Test 15: Minh Khang trả lời khéo léo Quả bóng vàng và nhắc nhở quay lại bài học của Thầy Tiến.\n');

  // TEST 16: Ngộ nhận định nghĩa Giá của vectơ "giá là giá trị của vector, là độ dài của vector đó" tại 3:22
  console.log('--- Test 16: "giá là giá trị của vector, là độ dài của vector đó" (Line of Vector Misconception Correction) ---');
  const h16 = classifyHeuristic('giá là giá trị của vector, là độ dài của vector đó');
  assert.equal(h16.isLineOfVectorTopic, true);
  assert.equal(h16.dispatchedAgent, 'tri');

  const d16 = await dispatchMessage({
    message: 'giá là giá trị của vector, là độ dài của vector đó',
    currentTime: 202, // 3:22
    useLLM: false,
  });
  assert.equal(d16.primaryResponse.author, 'Trí');
  assert.match(d16.primaryResponse.text, /KHÔNG PHẢI là "giá trị"|KHÔNG PHẢI là "độ dài"|ĐƯỜNG THẲNG đi qua/i, 'Trí must refute value/magnitude misconception');
  assert.doesNotMatch(d16.primaryResponse.text, /Cậu làm đúng rồi/i, 'Must NEVER praise misconception');
  assert.notEqual(d16.followUpResponse, null);
  assert.equal(d16.followUpResponse.author, 'Minh Khang');
  assert.match(d16.followUpResponse.text, /đường ray|con tàu/i, 'Minh Khang gives train track analogy');
  console.log('✅ PASS Test 16: Trí đính chính trực tiếp Giá của vectơ là đường thẳng mang vectơ + Minh Khang ví von đường ray xe lửa.\n');

  // TEST 17: Thắc mắc tại sao Thầy Tiến gạch bỏ "tách ra bình thường mà nhỉ, sao thầy lại gạch bỏ" tại 37:18
  console.log('--- Test 17: "tách ra bình thường mà nhỉ, sao thầy lại gạch bỏ" (Why Teacher Crossed Out Split Expression) ---');
  const h17 = classifyHeuristic('tách ra bình thường mà nhỉ, sao thầy lại gạch bỏ');
  assert.equal(h17.isSumOnePlusOneTopic, true);
  assert.equal(h17.dispatchedAgent, 'tri');

  const d17 = await dispatchMessage({
    message: 'tách ra bình thường mà nhỉ, sao thầy lại gạch bỏ',
    currentTime: 2238, // 37:18
    useLLM: false,
  });
  assert.equal(d17.primaryResponse.author, 'Trí');
  assert.match(d17.primaryResponse.text, /Thầy Tiến gạch bỏ|KHÔNG ĐƯỢC tách|bất đẳng thức tam giác|vuông góc/i);
  assert.notEqual(d17.followUpResponse, null);
  assert.equal(d17.followUpResponse.author, 'Cô Lam');
  console.log('✅ PASS Test 17: Trí giải thích lý do Thầy Tiến gạch bỏ phép tách độ dài ở Ví dụ 3 chuẩn xác.\n');

  // TEST 18: Học sinh đùa "giá là giá đỗ" tại 3:29
  console.log('--- Test 18: "giá là giá đỗ" (Humorous Misconception Handling) ---');
  const h18 = classifyHeuristic('giá là giá đỗ');
  assert.equal(h18.isLineOfVectorTopic, true);

  const d18 = await dispatchMessage({
    message: 'giá là giá đỗ',
    currentTime: 209,
    useLLM: false,
  });
  assert.equal(d18.primaryResponse.author, 'Bo');
  assert.match(d18.primaryResponse.text, /giá đỗ xào thịt bò/i);
  assert.notEqual(d18.followUpResponse, null);
  assert.equal(d18.followUpResponse.author, 'Linh Chi');
  assert.match(d18.followUpResponse.text, /đường thẳng vô hạn|giá đỡ/i);
  console.log('✅ PASS Test 18: Bo hưởng ứng hóm hỉnh + Linh Chi giải nghĩa từ nguyên học của "Giá của vectơ".\n');

  console.log('🎉 TẤT CẢ 18 BÀI TEST ĐÃ VƯỢT QUA XUẤT SẮC!');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
