import json, sys, pathlib

# Thêm đường dẫn tới backend/src/scripts để dùng chung module query_kb chuẩn
scripts_dir = pathlib.Path(__file__).resolve().parent.parent / 'backend' / 'src' / 'scripts'
sys.path.insert(0, str(scripts_dir))

from query_kb import search, find_default_kb

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

kb_path = find_default_kb()
kb = json.loads(kb_path.read_text(encoding='utf-8'))

# Bộ query thử nghiệm thực tế với kết quả kỳ vọng (gồm 10 query gốc + 8 câu diễn đạt tự nhiên & guardrail test)
test_cases = [
    {
        "query": "cộng độ dài vectơ",
        "expected_ids": ["MISC_VEC_005"],
        "topic_focus": "Bẫy cộng độ dài thay cho độ dài tổng"
    },
    {
        "query": "ví dụ 3 hình lập phương",
        "expected_ids": ["MISC_VEC_005"],
        "topic_focus": "Ví dụ 3 SGK KNTT hình lập phương"
    },
    {
        "query": "góc giữa hai vectơ 120 độ",
        "expected_ids": ["MISC_VEC_017"],
        "topic_focus": "Góc giữa hai vectơ đảo chiều (ra MISC_VEC_017 chứ không phải 019)"
    },
    {
        "query": "quy tắc hình hộp",
        "expected_ids": ["MISC_VEC_006"],
        "topic_focus": "Cộng ba cạnh xuất phát cùng đỉnh"
    },
    {
        "query": "trọng tâm tam giác",
        "expected_ids": ["MISC_VEC_015"],
        "topic_focus": "Đẳng thức vectơ trọng tâm tam giác"
    },
    {
        "query": "vectơ không có góc bao nhiêu",
        "expected_ids": ["MISC_VEC_018"],
        "topic_focus": "Quy ước góc với vectơ không"
    },
    {
        "query": "hiệu hai vectơ chung gốc",
        "expected_ids": ["MISC_VEC_007", "MISC_VEC_008"],
        "topic_focus": "Quy tắc trừ chung gốc bị lộn ngược thứ tự"
    },
    {
        "query": "hệ số âm nhân vectơ",
        "expected_ids": ["MISC_VEC_011"],
        "topic_focus": "Hệ số âm k < 0 đảo ngược hướng vectơ"
    },
    {
        "query": "tích vô hướng của hai vectơ",
        "expected_ids": ["MISC_VEC_019"],
        "topic_focus": "Tích vô hướng là số vô hướng, có thể âm"
    },
    {
        "query": "bình phương tổng hai vectơ",
        "expected_ids": ["MISC_VEC_020"],
        "topic_focus": "Hằng đẳng thức vectơ cần số hạng chéo 2u.v"
    },
    {
        "query": "em chưa hiểu chỗ này",
        "expected_ids": ["NONE"],
        "topic_focus": "Guardrail: Câu hỏi chung của học sinh không bị gán nhầm ngộ nhận phép trừ (MISC_VEC_007)"
    },
    {
        "query": "hai vectơ có cùng độ dài thì bằng nhau không",
        "expected_ids": ["MISC_VEC_001"],
        "topic_focus": "Độ dài bằng nhau chưa đủ để kết luận hai vectơ bằng nhau"
    },
    {
        "query": "hai vectơ cùng phương có chắc cùng hướng không",
        "expected_ids": ["MISC_VEC_003"],
        "topic_focus": "Cùng phương có thể cùng hướng hoặc ngược hướng"
    },
    {
        "query": "quy tắc ba điểm nối đuôi",
        "expected_ids": ["MISC_VEC_004"],
        "topic_focus": "Quy tắc tam giác cộng nối đuôi và thứ tự điểm"
    },
    {
        "query": "độ dài của hiệu có bằng hiệu độ dài hai vectơ không",
        "expected_ids": ["MISC_VEC_009"],
        "topic_focus": "Bẫy độ dài hiệu bằng hiệu độ dài"
    },
    {
        "query": "vectơ đối có độ dài âm không",
        "expected_ids": ["MISC_VEC_010"],
        "topic_focus": "Vectơ đối có cùng độ dài không âm, chỉ ngược hướng"
    },
    {
        "query": "tỉ số vectơ trọng tâm tứ diện",
        "expected_ids": ["MISC_VEC_016"],
        "topic_focus": "Hệ thức vectơ trọng tâm tứ diện và dấu tỉ số"
    },
    {
        "query": "tại sao tích vô hướng có thể mang dấu âm",
        "expected_ids": ["MISC_VEC_019"],
        "topic_focus": "Tích vô hướng góc tù mang giá trị âm"
    }
]

print("=========================================================================================")
print(f"📊 BẢNG KẾT QUẢ ĐÁNH GIÁ BỘ {len(test_cases)} QUERY TRUY VẤN RAG KNOWLEDGE BASE")
print("=========================================================================================\n")
print(f"{'#':<3} | {'Query thử nghiệm':<52} | {'Kỳ vọng':<15} | {'Actual Top-1':<15} | {'Score':<5} | {'Trạng thái'}")
print("-" * 105)

all_passed = True
results_summary = []

for idx, tc in enumerate(test_cases, 1):
    hits = search(kb, tc["query"], limit=1)
    if hits:
        top_hit = hits[0]
        actual_id = top_hit["misconception"]["id"]
        score = top_hit["retrieval_score"]
        title = top_hit["misconception"]["title"]
        source_refs = top_hit["misconception"].get("source_refs", [])
    else:
        actual_id = "NONE"
        score = 0
        title = "None (No false positive)"
        source_refs = []

    passed = actual_id in tc["expected_ids"]
    if not passed:
        all_passed = False

    status = "PASS ✅" if passed else "FAIL ❌"
    print(f"{idx:<3} | {tc['query']:<52} | {'/'.join(tc['expected_ids']):<15} | {actual_id:<15} | {score:<5} | {status}")

    results_summary.append({
        "index": idx,
        "query": tc["query"],
        "expected": tc["expected_ids"],
        "actual": actual_id,
        "title": title,
        "score": score,
        "passed": passed,
        "topic_focus": tc["topic_focus"],
        "source_refs": source_refs
    })

print("-" * 105)
print(f"Tổng kết: {'TẤT CẢ ' + str(len(test_cases)) + '/' + str(len(test_cases)) + ' QUERIES ĐẠT CHUẨN PASS!' if all_passed else 'Có query chưa đạt!'}\n")

# Lưu bản ghi minh chứng vào thư mục tests/
evidence_path = pathlib.Path(__file__).resolve().parent / 'rag_benchmark_evidence.json'
evidence_path.write_text(
    json.dumps({
        "algorithm_version": "DRE RAG Hybrid Token-Alias Matcher v1.2",
        "total_queries": len(test_cases),
        "all_passed": all_passed,
        "results": results_summary
    }, ensure_ascii=False, indent=2),
    encoding='utf-8'
)
print(f"📁 Đã lưu minh chứng tại: {evidence_path}")
