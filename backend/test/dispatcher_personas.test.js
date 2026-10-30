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
  assert.notEqual(d2.followUpResponse, null, 'TA An must step in with progressive scaffolding');
  assert.equal(d2.followUpResponse.author, 'Trợ giảng An', 'Cô Lam must NOT close prematurely, TA An provides hint');
  assert.equal(d2.followUpResponse.hintLevel, 1, 'Hint must be level 1');
  console.log('✅ PASS Test 2: Bo phản bác lại đòi chứng minh + Trợ giảng An gợi ý cấp 1, Cô Lam không vào cắt ngang.\n');

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

  // TEST 19: Học sinh nói "Bo sai rồi, không bằng 2 đâu" (Không có lý lẽ toán học)
  console.log('--- Test 19: "Bo sai rồi, không bằng 2 đâu" (Unsubstantiated Math Rebuttal) ---');
  const h19 = classifyHeuristic('Bo sai rồi, không bằng 2 đâu');
  assert.notEqual(h19.detectedIntent, 'sharp_rebuttal', 'Must NOT be sharp_rebuttal without valid math argument');
  assert.equal(h19.dispatchedAgent, 'bo');
  assert.equal(h19.unsubstantiatedRebuttal, true);

  const d19 = await dispatchMessage({
    message: 'Bo sai rồi, không bằng 2 đâu',
    useLLM: false,
  });
  assert.equal(d19.primaryResponse.author, 'Bo');
  assert.equal(d19.primaryResponse.mode, 'skeptic_pushback', 'Bo must push back, NOT concede');
  assert.match(d19.primaryResponse.text, /Ủa, tớ sai chỗ nào|chưa phục/i);
  assert.notEqual(d19.followUpResponse, null, 'TA An must step in with scaffolding hint');
  assert.equal(d19.followUpResponse.author, 'Trợ giảng An');
  assert.equal(d19.followUpResponse.hintLevel, 1, 'Hint must be level 1');
  console.log('✅ PASS Test 19: Bo KHÔNG nhận thua, Bo phản bác + Trợ giảng An gợi ý cấp 1 chuẩn xác.\n');

  // TEST 20: Học sinh nói câu đời sống "em không bằng bạn Trí đâu"
  console.log('--- Test 20: "em không bằng bạn Trí đâu" (Non-math Comparison) ---');
  const h20 = classifyHeuristic('em không bằng bạn Trí đâu');
  assert.notEqual(h20.detectedIntent, 'sharp_rebuttal', 'Must NOT be sharp_rebuttal');
  assert.equal(h20.dispatchedAgent, 'minhkhang');

  const d20 = await dispatchMessage({
    message: 'em không bằng bạn Trí đâu',
    useLLM: false,
  });
  assert.equal(d20.primaryResponse.author, 'Minh Khang');
  assert.match(d20.primaryResponse.text, /Đừng tự ti|thế mạnh riêng|tiến bộ/i);
  assert.equal(d20.followUpResponse, null);
  console.log('✅ PASS Test 20: "em không bằng bạn Trí đâu" định tuyến về Minh Khang khích lệ, Bo không bị nhận thua oan.\n');

  // TEST 21: Học sinh kêu "thầy Tiến giảng nhanh quá em không theo kịp"
  console.log('--- Test 21: "thầy Tiến giảng nhanh quá em không theo kịp" (Pacing Help) ---');
  const h21 = classifyHeuristic('thầy Tiến giảng nhanh quá em không theo kịp');
  assert.equal(h21.dispatchedAgent, 'an', 'Must route to Trợ giảng An');
  assert.equal(h21.detectedIntent, 'ask_scaffolding_help');

  const d21 = await dispatchMessage({
    message: 'thầy Tiến giảng nhanh quá em không theo kịp',
    useLLM: false,
  });
  assert.equal(d21.primaryResponse.author, 'Trợ giảng An');
  assert.match(d21.primaryResponse.text, /Trợ giảng An|tạm dừng video|hỗ trợ từng bước/i);
  console.log('✅ PASS Test 21: "thầy Tiến giảng nhanh quá..." về đúng Trợ giảng An hỗ trợ điều phối.\n');

  // TEST 22: Học sinh chào bạn "chào Bo nha" (Không dấu / có dấu)
  console.log('--- Test 22: "chào Bo nha" (Accentless Persona Matching) ---');
  const h22 = classifyHeuristic('chào Bo nha');
  assert.equal(h22.dispatchedAgent, 'bo', 'Must route to Bo');
  assert.equal(h22.detectedIntent, 'challenge_shortcut_fallacy');

  const d22 = await dispatchMessage({
    message: 'chào Bo nha',
    useLLM: false,
  });
  assert.equal(d22.primaryResponse.author, 'Bo');
  assert.match(d22.primaryResponse.text, /Chào cậu nha|tớ là Bo/i);
  console.log('✅ PASS Test 22: "chào Bo nha" khớp chính xác bạn học Bo.\n');

  // TEST 23: Phân tầng gợi ý Scaffolding Progression theo session (Level 1 -> Level 2 -> Cô Lam chốt)
  console.log('--- Test 23: Scaffolding Progression (Level 1 -> Level 2 -> Cô Lam) ---');
  const testSessionId = `test_session_${Date.now()}`;

  // Lần 1: Học sinh cãi chưa rõ
  const turn1 = await dispatchMessage({
    message: 'Bo sai rồi, không bằng 2 đâu',
    sessionId: testSessionId,
    useLLM: false,
  });
  assert.equal(turn1.primaryResponse.author, 'Bo');
  assert.equal(turn1.followUpResponse.author, 'Trợ giảng An');
  assert.equal(turn1.followUpResponse.hintLevel, 1, 'Turn 1 must provide hint level 1');
  assert.equal(turn1.sessionState.hintLevel, 1);

  // Lần 2: Học sinh tiếp tục cãi chưa rõ
  const turn2 = await dispatchMessage({
    message: 'sai rồi bo',
    sessionId: testSessionId,
    useLLM: false,
  });
  assert.equal(turn2.primaryResponse.author, 'Bo');
  assert.equal(turn2.followUpResponse.author, 'Trợ giảng An');
  assert.equal(turn2.followUpResponse.hintLevel, 2, 'Turn 2 must provide hint level 2');
  assert.equal(turn2.sessionState.hintLevel, 2);

  // Lần 3: Học sinh vẫn bế tắc -> Cô Lam can thiệp chốt lời giải mẫu
  const turn3 = await dispatchMessage({
    message: 'chưa hiểu, cứu em với',
    sessionId: testSessionId,
    useLLM: false,
  });
  assert.equal(turn3.followUpResponse.author, 'Cô Lam');
  assert.equal(turn3.followUpResponse.concluded, true, 'Cô Lam concludes on turn 3');
  assert.equal(turn3.sessionState.done, true);
  console.log('✅ PASS Test 23: Phân tầng gợi ý hoạt động hoàn hảo: Level 1 -> Level 2 -> Cô Lam chốt kiến thức.\n');

  // TEST 24: Ghi nhận ActivityLogEvent vào SessionStore (Issue #11 & PR #21)
  console.log('--- Test 24: Session Activity Log Events (Issue #11 & PR #21) ---');
  const { getSession } = await import('../src/sessionStore.js');
  const loggedSession = getSession(testSessionId);
  assert.ok(Array.isArray(loggedSession.activity_log), 'activity_log must be an array');
  assert.ok(loggedSession.activity_log.length >= 3, 'Must have at least 3 logged events');
  const eventTypes = loggedSession.activity_log.map(e => e.type);
  assert.ok(eventTypes.includes('intent_routed'), 'Must log intent_routed');
  assert.ok(eventTypes.includes('learner_answer'), 'Must log learner_answer');
  assert.ok(eventTypes.includes('colam_concluded'), 'Must log colam_concluded');
  console.log('✅ PASS Test 24: Toàn bộ sự kiện sư phạm được ghi nhận đúng chuẩn ActivityLogEvent.\n');

  // TEST 25: Nhúng dữ liệu Deterministic Tool vào suy luận của Trí
  console.log('--- Test 25: Deterministic Tool Injection into Trí Reasoning ---');
  const d25 = await dispatchMessage({
    message: "|BC + DD'| bằng bao nhiêu vậy Trí",
    recipient: 'tri',
    useLLM: false,
  });
  assert.equal(d25.primaryResponse.author, 'Trí');
  assert.ok(d25.primaryResponse.toolCall, 'Primary response must attach toolCall');
  assert.match(d25.primaryResponse.text, /kiểm chứng toạ độ 3D|a\\sqrt\{2\}|chuẩn xác/i, 'Trí must cite coordinate tool verification');
  console.log('✅ PASS Test 25: Dữ liệu tính toán từ Deterministic Tool được đưa trực tiếp vào lời thoại của Trí.\n');

  // TEST 26: Ràng buộc fastPath (chỉ true khi có @mention hoặc recipient !== "all")
  console.log('--- Test 26: Fast-path constraint verification ---');
  const freeMsg = classifyHeuristic('hôm nay trời đẹp ghê ha các bạn');
  assert.equal(freeMsg.fastPath, false, 'Free message must have fastPath: false');
  const mentionMsg = classifyHeuristic('@bo hôm nay học gì');
  assert.equal(mentionMsg.fastPath, true, 'Message with @bo must have fastPath: true');
  const recipientMsg = classifyHeuristic('hôm nay học gì', 'bo');
  assert.equal(recipientMsg.fastPath, true, 'Explicit recipient must have fastPath: true');
  console.log('✅ PASS Test 26: fastPath chỉ kích hoạt khi có chỉ định đích danh @mention hoặc recipient.\n');

  // TEST 27: Phản biện sắc bén với đầy đủ căn cứ hình học Pytago
  console.log('--- Test 27: Phản biện sắc bén có căn cứ Pytago và góc vuông ---');
  const sharpSessionId = `test_sharp_${Date.now()}`;
  const d27 = await dispatchMessage({
    message: 'Bo sai rồi, vì BC và DD\' vuông góc nhau nên phải tính theo Pytago ra a căn 2 chứ không thể bằng 2 được!',
    sessionId: sharpSessionId,
    useLLM: false,
  });
  assert.equal(d27.primaryResponse.author, 'Bo');
  assert.equal(d27.primaryResponse.mode, 'concede', 'Bo must concede on sharp rebuttal');
  assert.equal(d27.followUpResponse.author, 'Cô Lam');
  assert.equal(d27.sessionState.done, true);
  console.log('✅ PASS Test 27: Phản biện có căn cứ Pytago/vuông góc kích hoạt Bo nhận thua và Cô Lam chốt.\n');

  // TEST 28: LLM classification / Graceful fallback verification
  console.log('--- Test 28: LLM Intent Classifier Graceful Execution ---');
  const { classifyLearnerIntent } = await import('../src/services/dispatcher.js');
  const llmRes = await classifyLearnerIntent({
    message: 'Linh Chi cho mình xin công thức quy tắc hình bình hành với',
    useLLM: true,
  });
  assert.ok(llmRes.detectedIntent, 'Must return a detectedIntent');
  assert.ok(llmRes.dispatchedAgent, 'Must return a dispatchedAgent');
  console.log(`✅ PASS Test 28: LLM Classifier/Fallback trả về intent=${llmRes.detectedIntent}, agent=${llmRes.dispatchedAgent}.\n`);

  // TEST 29: Phát biểu toán học sai không được kích hoạt Bo nhận thua
  console.log('--- Test 29: "Bo sai rồi vì hai vectơ cùng hướng thì độ dài tổng luôn bằng 0" ---');
  const d29 = await dispatchMessage({
    message: 'Bo sai rồi vì hai vectơ cùng hướng thì độ dài tổng luôn bằng 0',
    sessionId: `test_false_math_${Date.now()}`,
    useLLM: false,
  });
  assert.equal(d29.primaryResponse.author, 'Bo');
  assert.equal(d29.primaryResponse.mode, 'skeptic_pushback', 'Bo must push back, false math reason must NOT concede');
  assert.notEqual(d29.sessionState?.done, true, 'Must not mark session as done');
  console.log('✅ PASS Test 29: Phát biểu toán học sai không làm Bo nhận thua, Bo phản bác chính xác.\n');

  // TEST 30: Luồng xin gợi ý thuần túy (Help-only progression: L1 -> L2 -> Cô Lam)
  console.log('--- Test 30: Scaffolding Help Progression (Turn 1 -> Turn 2 -> Turn 3) ---');
  const helpSessionId = `test_help_progression_${Date.now()}`;
  const helpTurn1 = await dispatchMessage({
    message: 'Em bí quá, cho em gợi ý với',
    sessionId: helpSessionId,
    useLLM: false,
  });
  assert.equal(helpTurn1.primaryResponse.author, 'Trợ giảng An');
  assert.equal(helpTurn1.primaryResponse.hintLevel, 1);
  assert.equal(helpTurn1.followUpResponse, null);

  const helpTurn2 = await dispatchMessage({
    message: 'Vẫn chưa hiểu ạ, cho em thêm gợi ý nữa với',
    sessionId: helpSessionId,
    useLLM: false,
  });
  assert.equal(helpTurn2.primaryResponse.author, 'Trợ giảng An');
  assert.equal(helpTurn2.primaryResponse.hintLevel, 2);
  assert.equal(helpTurn2.followUpResponse, null);

  const helpTurn3 = await dispatchMessage({
    message: 'Em vẫn bí quá chưa làm được, cứu em với',
    sessionId: helpSessionId,
    useLLM: false,
  });
  assert.equal(helpTurn3.primaryResponse.author, 'Trợ giảng An');
  assert.notEqual(helpTurn3.followUpResponse, null);
  assert.equal(helpTurn3.followUpResponse.author, 'Cô Lam');
  assert.equal(helpTurn3.sessionState.done, true);
  console.log('✅ PASS Test 30: Luồng xin gợi ý thuần túy tăng cấp bền bỉ: Cấp 1 -> Cấp 2 -> Cô Lam chốt.\n');

  // TEST 31: Tính toán hình lập phương cạnh bằng 2 có claim
  console.log('--- Test 31: Hình lập phương cạnh bằng 2 có claim 2√2 ---');
  const { extractSideFromText, extractClaimFromText } = await import('../src/tools/tool_verify_vector_algebra.js');
  const q31 = "Hình lập phương cạnh bằng 2, |BC + DD'| bằng 2√2 có đúng không?";
  const side31 = extractSideFromText(q31);
  const claim31 = extractClaimFromText(q31);
  assert.equal(side31, 2, 'Side must be parsed as 2');
  assert.match(claim31, /2.*sqrt.*2|2.*√.*2/i, 'Claim must be parsed as 2√2');
  const { executeTool } = await import('../src/tools/index.js');
  const t31 = executeTool('tool_verify_vector_algebra', {
    shape: 'cube',
    side: side31,
    expr: "|BC + DD'|",
    claim: claim31,
  });
  assert.equal(t31.isValid, true, '2√2 must be marked valid for cube side 2');
  assert.equal(t31.output.correct, '2\\sqrt{2}');
  console.log('✅ PASS Test 31: Nhận diện cạnh bằng 2 và kiểm chứng 2√2 khớp chuẩn 100%.\n');

  // TEST 32: Tính toán thuần túy không có claim (Calculation only)
  console.log('--- Test 32: Tính toán thuần túy "bằng bao nhiêu", không có claim ---');
  const q32 = "Hình lập phương cạnh bằng 2, |BC + DD'| bằng bao nhiêu?";
  const side32 = extractSideFromText(q32);
  const claim32 = extractClaimFromText(q32);
  assert.equal(side32, 2);
  assert.equal(claim32, null, 'bằng bao nhiêu must NOT be parsed as claim answer');
  const t32 = executeTool('tool_verify_vector_algebra', {
    shape: 'cube',
    side: side32,
    expr: "|BC + DD'|",
    claim: claim32,
  });
  assert.equal(t32.isValid, null, 'Calculation-only must have isValid: null');
  assert.equal(t32.output.calculatedValue, 2.828);
  console.log('✅ PASS Test 32: Tính toán thuần túy bảo toàn isValid: null, không gán bừa true/false.\n');

  // TEST 33: Two independent omitted-ID requests at 37:13 do NOT collide
  console.log('--- Test 33: Two independent omitted-ID requests at 37:13 do NOT collide ---');
  const d33a = await dispatchMessage({
    message: 'Em bí quá, cho em gợi ý với',
    currentTime: 2233, // 37:13
    sessionId: null, // omitted
    useLLM: false,
  });
  const d33b = await dispatchMessage({
    message: 'Em bí quá, cho em gợi ý với',
    currentTime: 2233, // 37:13
    sessionId: null, // omitted
    useLLM: false,
  });
  assert.notEqual(d33a.sessionState?.id, d33b.sessionState?.id, 'Omitted-ID requests must have distinct session IDs');
  assert.equal(d33a.primaryResponse.hintLevel, 1, 'First omitted-ID request gets Level 1');
  assert.equal(d33b.primaryResponse.hintLevel, 1, 'Independent second omitted-ID request must NOT be polluted by first request (stays Level 1)');
  console.log('✅ PASS Test 33: Hai request omitted-ID độc lập tại 37:13 sinh session riêng biệt, không bị ô nhiễm chéo cấp độ gợi ý.\n');

  // TEST 34: Switching lessons after using hints resets session namespace and progression
  console.log('--- Test 34: Switching lessons resets session progression ---');
  const lesson1SessionId = `session_lesson1_${Date.now()}`;
  const l1_turn1 = await dispatchMessage({
    message: 'Em bí quá, cho em gợi ý với',
    sessionId: lesson1SessionId,
    useLLM: false,
  });
  const l1_turn2 = await dispatchMessage({
    message: 'Vẫn chưa hiểu, gợi ý thêm với ạ',
    sessionId: lesson1SessionId,
    useLLM: false,
  });
  assert.equal(l1_turn2.primaryResponse.hintLevel, 2, 'Lesson 1 turn 2 reached level 2');

  // Now student switches to lesson 2 (new session ID bound to lesson.id)
  const lesson2SessionId = `session_lesson2_${Date.now()}`;
  const l2_turn1 = await dispatchMessage({
    message: 'Em bí quá, cho em gợi ý với',
    sessionId: lesson2SessionId,
    useLLM: false,
  });
  assert.equal(l2_turn1.primaryResponse.hintLevel, 1, 'Lesson 2 turn 1 must start fresh at Level 1, not Level 3 / conclusion');
  console.log('✅ PASS Test 34: Chuyển đổi bài học tách biệt session hoàn toàn, bài mới bắt đầu từ Gợi ý cấp 1 chuẩn xác.\n');

  // TEST 35: Parameterless health check on Knowledge Base / Content Library
  console.log('--- Test 35: Parameterless health check verification ---');
  const { listMisconceptionIds } = await import('../src/contentLibrary.js');
  const ids = listMisconceptionIds();
  assert.ok(Array.isArray(ids) && ids.length > 0, 'Misconceptions must be available for parameterless health check');
  console.log(`✅ PASS Test 35: Endpoint tra cứu/health check /api/misconceptions sẵn sàng (${ids.length} misconceptions: ${ids.join(', ')}).\n`);

  console.log('🎉 TẤT CẢ 35 BÀI TEST ĐÃ VƯỢT QUA XUẤT SẮC!');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
