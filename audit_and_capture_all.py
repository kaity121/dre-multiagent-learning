import os
import sys
import time
import socket
import subprocess
import urllib.request
import json
import re

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

ARTIFACT_DIR = r"C:\Users\PC\.gemini\antigravity\brain\38147043-e3c2-4a34-b014-8ebeee945eb2"
PORT = 4195
URL = f"http://localhost:{PORT}"

FORBIDDEN_ENGLISH_WORDS = [
    "bloom", "evaluate", "mastered", "student growth view", 
    "predict", "observe", "explain", "inspector", "live", 
    "checkpoint", "quiz", "drawer", "step", "hint"
]

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0

def wait_for_http(url, timeout=20):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.3)
    return False

def init_driver(width=1920, height=1080):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument(f"--window-size={width},{height}")
    options.add_argument("--force-device-scale-factor=1.0")
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    
    potential_binaries = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]
    for b in potential_binaries:
        if os.path.exists(b):
            options.binary_location = b
            break
            
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception:
        driver = webdriver.Chrome(options=options)
        
    driver.set_window_size(width, height)
    return driver

def save_screen(driver, filename):
    filepath = os.path.join(ARTIFACT_DIR, filename)
    driver.save_screenshot(filepath)
    print(f"  [SCREENSHOT] {filename}")
    return filepath

AUDIT_JS = """
function auditPage(forbiddenList) {
    const findings = {
        clippedText: [],
        smallFont: [],
        nonTokenColors: [],
        forbiddenEnglish: [],
        largeVerticalGap: [],
        summary: {}
    };

    // Helper: is visible
    function isVisible(el) {
        if (!el || el.offsetParent === null && el.tagName !== 'BODY') return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    // Helper: parse rgb/rgba to hex
    function rgbToHex(rgbStr) {
        if (!rgbStr || rgbStr === 'transparent' || rgbStr === 'rgba(0, 0, 0, 0)') return null;
        const m = rgbStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
        if (!m) return null;
        return "#" + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    // Color tokens allowed
    const ALLOWED_COLORS = new Set([
        // Primary Lime Soft tokens
        "#F3F8E8", "#FFFFFF", "#121712", "#E2EAD2", "#EAF1D8", "#C8F169", "#B8E356", "#A6D83B",
        "#1F271F", "#2B3326", "#4A5540", "#B9C4A8", "#2C2A29", "#F3EFE6", "#F5D65D",
        // Functional Red/Pink
        "#DC2626", "#EF4444", "#B91C1C", "#991B1B", "#FEE2E2", "#FEF2F2", "#F43F5E", "#E11D48", "#881337", "#4C0519", "#FDA4AF",
        // Functional Green
        "#16A34A", "#22C55E", "#15803D", "#166534", "#DCFCE7", "#F0FDF4",
        // Functional Blue for vectors
        "#2563EB", "#3B82F6", "#1D4ED8", "#1E40AF", "#DBEAFE", "#EFF6FF", "#60A5FA",
        // Grays / stones
        "#78716C", "#57534E", "#44403C", "#292524", "#A8A29E", "#D6D3D1", "#E7E5E4", "#F5F5F4", "#FAFAF9",
        "#000000", "#111827", "#1F2937", "#374151", "#4B5563", "#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB", "#F3F4F6", "#F9FAFB"
    ]);

    const allEls = document.querySelectorAll('*');

    for (const el of allEls) {
        if (!isVisible(el)) continue;
        const style = window.getComputedStyle(el);

        // (a) Tràn viền & cắt chữ
        if (el.children.length === 0 && el.textContent.trim().length > 0) {
            const hasEllipsis = style.textOverflow === 'ellipsis';
            const isCut = (el.scrollWidth > el.clientWidth + 2) || (el.scrollHeight > el.clientHeight + 2);
            if (isCut && (style.overflow === 'hidden' || style.overflowX === 'hidden' || hasEllipsis)) {
                findings.clippedText.push({
                    text: el.textContent.trim().slice(0, 40),
                    tag: el.tagName.toLowerCase(),
                    scrollWidth: Math.round(el.scrollWidth),
                    clientWidth: Math.round(el.clientWidth)
                });
            }
        }

        // (b) Chữ nhỏ < 12px (hoặc nhãn toán < 13px)
        if (el.children.length === 0 && el.textContent.trim().length > 0) {
            const fs = parseFloat(style.fontSize);
            const isMathSvg = !!el.closest('svg');
            if (isMathSvg && fs < 12.5) {
                findings.smallFont.push({
                    text: el.textContent.trim().slice(0, 30),
                    fontSize: fs + 'px',
                    type: 'math_label'
                });
            } else if (!isMathSvg && fs < 11.5) {
                findings.smallFont.push({
                    text: el.textContent.trim().slice(0, 30),
                    fontSize: fs + 'px',
                    type: 'ui_text'
                });
            }
        }

        // (c) Màu ngoài bảng token (chỉ check chữ và nền trực tiếp)
        const bgHex = rgbToHex(style.backgroundColor);
        const textHex = rgbToHex(style.color);
        if (bgHex && !ALLOWED_COLORS.has(bgHex)) {
            // Check if decorative orange, cyan, magenta
            findings.nonTokenColors.push({
                type: 'background',
                color: bgHex,
                text: el.textContent ? el.textContent.trim().slice(0, 20) : '',
                tag: el.tagName.toLowerCase()
            });
        }
        if (textHex && !ALLOWED_COLORS.has(textHex) && el.children.length === 0 && el.textContent.trim().length > 0) {
            findings.nonTokenColors.push({
                type: 'color',
                color: textHex,
                text: el.textContent.trim().slice(0, 20),
                tag: el.tagName.toLowerCase()
            });
        }

        // (d) Chuỗi tiếng Anh nằm trong danh sách cấm
        if (el.children.length === 0 && el.textContent.trim().length > 0) {
            const txt = el.textContent.trim().toLowerCase();
            for (const fw of forbiddenList) {
                // Word boundary match
                const regex = new RegExp(`\\\\b${fw}\\\\b`, 'i');
                if (regex.test(txt)) {
                    findings.forbiddenEnglish.push({
                        matched: fw,
                        snippet: el.textContent.trim().slice(0, 40)
                    });
                    break;
                }
            }
        }
    }

    // (e) Khoảng trống dọc > 120px ở nửa dưới trang
    const bodyHeight = window.innerHeight;
    const halfY = bodyHeight / 2;
    const mainContainers = document.querySelectorAll('main, div.page, div.grid, div.card');
    let maxGap = 0;
    // Inspect bottom clearance
    const lastContentEl = document.querySelector('footer, main > *:last-child, div.page > *:last-child');
    if (lastContentEl) {
        const rect = lastContentEl.getBoundingClientRect();
        if (rect.bottom < bodyHeight - 120 && rect.bottom > halfY) {
            maxGap = Math.round(bodyHeight - rect.bottom);
            findings.largeVerticalGap.push({
                gap: maxGap,
                bottomY: Math.round(rect.bottom),
                windowHeight: bodyHeight
            });
        }
    }

    // Deduplicate lists
    findings.clippedText = findings.clippedText.slice(0, 8);
    findings.smallFont = findings.smallFont.slice(0, 8);
    findings.nonTokenColors = findings.nonTokenColors.slice(0, 8);
    findings.forbiddenEnglish = findings.forbiddenEnglish.slice(0, 8);

    findings.summary = {
        clippedTextCount: findings.clippedText.length,
        smallFontCount: findings.smallFont.length,
        nonTokenColorsCount: findings.nonTokenColors.length,
        forbiddenEnglishCount: findings.forbiddenEnglish.length,
        largeVerticalGapCount: findings.largeVerticalGap.length
    };

    return findings;
}
return auditPage(arguments[0]);
"""

def run_state(driver, name, setup_fn, res_name):
    print(f"\n---> Auditing: {name} [{res_name}]")
    try:
        setup_fn(driver)
        time.sleep(1.2)
        screenshot_file = f"{name}_{res_name}.png"
        save_screen(driver, screenshot_file)
        
        # Execute in-page audit
        audit_result = driver.execute_script(AUDIT_JS, FORBIDDEN_ENGLISH_WORDS)
        
        # Get console errors
        console_logs = []
        try:
            raw_logs = driver.get_log('browser')
            for log in raw_logs:
                if log.get('level') in ['SEVERE', 'ERROR']:
                    console_logs.append(log.get('message', ''))
        except Exception:
            pass
            
        audit_result['consoleErrors'] = console_logs[:5]
        audit_result['consoleErrorsCount'] = len(console_logs)
        audit_result['screenshot'] = screenshot_file
        return audit_result
    except Exception as e:
        print(f"  [ERROR] Failed state {name}: {e}")
        return {
            "error": str(e),
            "screenshot": None,
            "summary": {
                "clippedTextCount": 0,
                "smallFontCount": 0,
                "nonTokenColorsCount": 0,
                "forbiddenEnglishCount": 0,
                "largeVerticalGapCount": 0
            },
            "consoleErrors": [str(e)],
            "consoleErrorsCount": 1
        }

def get_states():
    # Defines all 20 states across stations, modals, internal tools
    states = []

    # 1. Trạm 1: đầu video, đang phát, thẻ câu hỏi dừng 37:13, tab Bản chép lời
    def setup_t1_init(d):
        d.get(f"{URL}/?station=1&time=0")
        time.sleep(1)
        d.execute_script("localStorage.clear();")
        d.get(f"{URL}/?station=1&time=0")
    states.append(("tram1_initial", setup_t1_init))

    def setup_t1_playing(d):
        d.get(f"{URL}/?station=1&time=20")
    states.append(("tram1_playing", setup_t1_playing))

    def setup_t1_checkpoint(d):
        d.get(f"{URL}/?station=1&time=2233")
    states.append(("tram1_checkpoint_3713", setup_t1_checkpoint))

    def setup_t1_transcript(d):
        d.get(f"{URL}/?station=1&time=10")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Bản chép lời'));
            if (b) b.click();
        """)
    states.append(("tram1_transcript", setup_t1_transcript))

    # 2. Trạm 2: chưa chọn, đã chọn bước sai, đã chọn bước đúng
    def setup_t2_unselected(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("localStorage.clear();")
        d.get(f"{URL}/?station=2")
    states.append(("tram2_unselected", setup_t2_unselected))

    def setup_t2_wrong(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("""
            const cards = Array.from(document.querySelectorAll('button, div[role=\"button\"], div.cursor-pointer'));
            const b = cards.find(x => x.textContent.includes('Bước 2') || x.textContent.includes('Quy tắc hiệu'));
            if (b) b.click();
        """)
    states.append(("tram2_selected_wrong", setup_t2_wrong))

    def setup_t2_right(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("""
            const cards = Array.from(document.querySelectorAll('button, div[role=\"button\"], div.cursor-pointer'));
            const b = cards.find(x => x.textContent.includes('Bước 1'));
            if (b) b.click();
        """)
    states.append(("tram2_selected_right", setup_t2_right))

    # 3. Trạm 3: chưa chọn, chọn Phe Bo, chọn Phe Trí, đã nhập giải thích
    def setup_t3_unselected(d):
        d.get(f"{URL}/?station=3")
    states.append(("tram3_unselected", setup_t3_unselected))

    def setup_t3_bo(d):
        d.get(f"{URL}/?station=3")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Phe Bo'));
            if (b) b.click();
        """)
    states.append(("tram3_phe_bo", setup_t3_bo))

    def setup_t3_tri(d):
        d.get(f"{URL}/?station=3")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Phe Trí'));
            if (b) b.click();
        """)
    states.append(("tram3_phe_tri", setup_t3_tri))

    def setup_t3_explained(d):
        d.get(f"{URL}/?station=3")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Phe Trí'));
            if (b) b.click();
            const ta = document.querySelector('textarea');
            if (ta) {
                ta.value = "IA và IG là hai vectơ ngược hướng nhau nên hệ số phải mang dấu âm.";
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));
            }
        """)
    states.append(("tram3_explained", setup_t3_explained))

    # 4. Trạm 4: đầu, đã nhập đẳng thức, đã gửi
    def setup_t4_init(d):
        d.get(f"{URL}/?station=4")
    states.append(("tram4_initial", setup_t4_init))

    def setup_t4_typed(d):
        d.get(f"{URL}/?station=4")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Mẫu chuẩn'));
            if (b) b.click();
        """)
    states.append(("tram4_typed_equation", setup_t4_typed))

    def setup_t4_submitted(d):
        d.get(f"{URL}/?station=4")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const bSample = btns.find(x => x.textContent.includes('Mẫu chuẩn'));
            if (bSample) bSample.click();
            setTimeout(() => {
                const bSubmit = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Gửi đề thách đấu'));
                if (bSubmit) bSubmit.click();
            }, 300);
        """)
        time.sleep(0.5)
    states.append(("tram4_submitted", setup_t4_submitted))

    # 5. Tổng kết: học sinh, giáo viên
    def setup_summary_student(d):
        d.get(f"{URL}/?station=4")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Xem tổng kết'));
            if (b) b.click();
        """)
    states.append(("summary_student", setup_summary_student))

    def setup_summary_teacher(d):
        d.get(f"{URL}/?station=4")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Xem tổng kết'));
            if (b) b.click();
            setTimeout(() => {
                const teacherBtn = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Giáo viên'));
                if (teacherBtn) teacherBtn.click();
            }, 300);
        """)
        time.sleep(0.5)
    states.append(("summary_teacher", setup_summary_teacher))

    # 6. Modals & Drawer: Khảo sát, Gấp sổ nghỉ, Hỏi riêng, Sổ bài tập, Menu 3 chấm
    def setup_modal_survey(d):
        d.get(f"{URL}/?lobby=1")
    states.append(("modal_survey", setup_modal_survey))

    def setup_modal_pause(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Tạm dừng'));
            if (b) b.click();
        """)
    states.append(("modal_pause", setup_modal_pause))

    def setup_modal_ask_private(d):
        d.get(f"{URL}/?station=1")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Hỏi riêng'));
            if (b) b.click();
        """)
    states.append(("modal_ask_private", setup_modal_ask_private))

    def setup_drawer_lessons(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Đổi bài'));
            if (b) b.click();
        """)
    states.append(("drawer_lessons", setup_drawer_lessons))

    def setup_menu_three_dots(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.title && x.title.includes('Công cụ giáo viên'));
            if (b) b.click();
        """)
    states.append(("menu_three_dots", setup_menu_three_dots))

    # 7. Công cụ nội bộ: Timeline Editor, War Room, Inspector
    def setup_timeline(d):
        d.get(f"{URL}/?view=editor")
    states.append(("timeline_editor", setup_timeline))

    def setup_warroom(d):
        d.get(f"{URL}/?view=warroom")
    states.append(("war_room", setup_warroom))

    def setup_inspector(d):
        d.get(f"{URL}/?station=2&inspector=1")
    states.append(("inspector", setup_inspector))

    return states

def main():
    server_proc = None
    if not is_port_open(PORT):
        print(f"Starting preview server on port {PORT}...")
        cmd = r'"D:\Program Files\nodejs\npx.cmd" vite preview --port 4195 --host 127.0.0.1'
        server_proc = subprocess.Popen(
            cmd,
            shell=True,
            cwd=r"D:\DRE-prototype",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        ready = wait_for_http(URL, timeout=20)
        if not ready:
            print(f"[ERROR] Server failed to start on {URL}")
            sys.exit(1)
        print(f"[OK] Preview server is up on {URL}")

    print("=================================================================")
    print("STARTING AUDIT ACROSS ALL SCREENS (1920x1080 & 1280x720)")
    print("=================================================================")

    resolutions = [
        ("1920x1080", 1920, 1080),
        ("1280x720", 1280, 720)
    ]

    all_results = {}
    states = get_states()

    for res_name, w, h in resolutions:
        print(f"\n==========================================")
        print(f"TESTING RESOLUTION: {res_name} ({w}x{h})")
        print(f"==========================================")
        driver = init_driver(w, h)
        all_results[res_name] = {}
        try:
            for state_name, setup_fn in states:
                res = run_state(driver, state_name, setup_fn, res_name)
                all_results[res_name][state_name] = res
        finally:
            driver.quit()

    if server_proc:
        server_proc.terminate()

    report_path = os.path.join(ARTIFACT_DIR, "audit_dot0_results.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)
    print(f"\nAUDIT FINISHED! Results saved to {report_path}")

if __name__ == "__main__":
    main()
