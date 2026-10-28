import json
import os
import sys

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

path = r"C:\Users\PC\.gemini\antigravity\brain\38147043-e3c2-4a34-b014-8ebeee945eb2\audit_dot0_results.json"
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

for res in ["1920x1080", "1280x720"]:
    print(f"\n==========================================")
    print(f"RESOLUTION: {res}")
    print(f"==========================================")
    states = data.get(res, {})
    for state_name, info in states.items():
        summary = info.get("summary", {})
        clipped = info.get("clippedText", [])
        small = info.get("smallFont", [])
        forbidden = info.get("forbiddenEnglish", [])
        gap = info.get("largeVerticalGap", [])
        colors = info.get("nonTokenColors", [])
        errs = info.get("consoleErrors", [])
        
        issues = []
        if clipped:
            samples = "; ".join([f'"{x["text"]}" ({x["scrollWidth"]}px > {x["clientWidth"]}px)' for x in clipped[:2]])
            issues.append(f"Cắt chữ/Tràn: {samples}")
        if small:
            samples = "; ".join([f'"{x["text"]}" ({x["fontSize"]})' for x in small[:2]])
            issues.append(f"Chữ <12px: {samples}")
        if forbidden:
            samples = "; ".join([f'"{x["snippet"]}" [từ: {x["matched"]}]' for x in forbidden[:2]])
            issues.append(f"Tiếng Anh cấm: {samples}")
        if gap:
            issues.append(f"Khoảng trống đáy: {gap[0]['gap']}px")
        if colors:
            samples = "; ".join([f'{x["color"]} ({x.get("text", "")})' for x in colors[:2]])
            issues.append(f"Màu ngoài token: {samples}")
        if errs:
            issues.append(f"Console error: {len(errs)} lỗi")
            
        status_str = " | ".join(issues) if issues else "Không phát hiện lỗi tự động"
        print(f"[{state_name}] ({info.get('screenshot')}): {status_str}")
