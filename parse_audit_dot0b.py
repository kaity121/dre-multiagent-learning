import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

JSON_PATH = r"C:\Users\PC\.gemini\antigravity\brain\38147043-e3c2-4a34-b014-8ebeee945eb2\audit_dot0b_results.json"

with open(JSON_PATH, encoding='utf-8') as f:
    data = json.load(f)

states = data["states"]

print(f"Tổng số trạng thái đã kiểm tra: {len(states)}")
print("\n--- PHÂN TÍCH CONSOLE ERRORS ---")
console_stats = {}
for k, v in states.items():
    for err in v.get("console_errors", []):
        r = err["reason"]
        console_stats[r] = console_stats.get(r, 0) + 1

for r, count in console_stats.items():
    print(f"- {r}: {count} lần ghi nhận")

print("\n--- KIỂM TRA DUPLICATE HASH ---")
dups = data.get("hash_duplicates", [])
print(f"Số lượng ảnh trùng hash: {len(dups)}")
for d in dups:
    print(f"- {d['file']} giống hệt {d['duplicate_of']}")

print("\n--- BẢNG TỔNG HỢP THEO MÀN / TRẠNG THÁI ---")
print("| Màn & Trạng thái | Độ phân giải | SVG Text cắt | Placeholder cắt | Đáy thừa (px) | Chênh cột >120px | Nút chính ko chuẩn | Chữ <12px | Tiếng Anh cấm | Lỗi Console |")
print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")

rows = []
for k, v in states.items():
    st = v["state"]
    res = v["resolution"]
    f = v["findings"]
    svg_cut = len(f.get("clippedSvgText", []))
    ph_cut = len(f.get("clippedPlaceholders", []))
    v_gap = f.get("verticalGap", {}).get("gapFromViewportBottom", 0)
    col_mismatch = len(f.get("columnHeightMismatch", []))
    btn_issues = 1 if (f.get("primaryButtonIssues", {}).get("hasForeignPrimary") or f.get("primaryButtonIssues", {}).get("multiplePrimary")) else 0
    small_f = len(f.get("smallFonts", []))
    forb_en = len(f.get("forbiddenEnglish", []))
    c_errs = len(v.get("console_errors", []))
    
    rows.append(f"| `{st}` | `{res}` | {svg_cut} | {ph_cut} | {v_gap}px | {col_mismatch} | {btn_issues} | {small_f} | {forb_en} | {c_errs} |")

for r in rows:
    print(r)
