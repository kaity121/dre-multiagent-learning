import json, sys, pathlib

# Thêm đường dẫn tới backend/src/scripts để dùng chung module query_kb chuẩn
scripts_dir = pathlib.Path(__file__).resolve().parent.parent / 'backend' / 'src' / 'scripts'
sys.path.insert(0, str(scripts_dir))

from query_kb import search, find_default_kb

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

kb_path = find_default_kb()
kb = json.loads(kb_path.read_text(encoding='utf-8'))

# Bộ 10 query thử nghiệm thực tế với kết quả kỳ vọng
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
        "query": "góc 120 độ",
        "expected_ids": ["MISC_VEC_017", "MISC_VEC_019"],
        "topic_focus": "Góc giữa hai vectơ / tích vô hướng góc tù"
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
    }
]

print("=========================================================================================")
print("📊 BẢNG KẾT QUẢ ĐÁNH GIÁ BỘ 10 QUERY TRUY VẤN RAG KNOWLEDGE BASE")
print("=========================================================================================\n")
print(f"{'#':<3} | {'Query thử nghiệm':<30} | {'Kỳ vọng':<15} | {'Actual Top-1':<15} | {'Score':<5} | {'Trạng thái'}")
print("-" * 92)

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
        title = "None"
        source_refs = []

    passed = actual_id in tc["expected_ids"]
    if not passed:
        all_passed = False

    status = "PASS ✅" if passed else "FAIL ❌"
    print(f"{idx:<3} | {tc['query']:<30} | {'/'.join(tc['expected_ids']):<15} | {actual_id:<15} | {score:<5} | {status}")

    results_summary.append({
        "index": idx,
        "query": tc["query"],
        "expected": tc["expected_ids"],
        "actual": actual_id,
        "title": title,
        "score": score,
        "passed": passed,
        "source_refs": source_refs
    })

print("-" * 92)
print(f"Tổng kết: {'TẤT CẢ 10/10 QUERIES ĐẠT CHUẨN PASS!' if all_passed else 'Có query chưa đạt!'}\n")

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
