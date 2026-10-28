import os
import sys
import time
import socket
import subprocess
import urllib.request
import json
import hashlib

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
URL = f"http://127.0.0.1:{PORT}"

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
        
    driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {
        "width": width,
        "height": height,
        "deviceScaleFactor": 1,
        "mobile": False
    })
    
    return driver

def get_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def save_screen(driver, filename, hash_tracker):
    filepath = os.path.join(ARTIFACT_DIR, filename)
    driver.save_screenshot(filepath)
    f_hash = get_file_hash(filepath)
    
    is_duplicate = False
    dup_with = None
    if f_hash in hash_tracker:
        is_duplicate = True
        dup_with = hash_tracker[f_hash]
        print(f"  [HASH TRÙNG!] {filename} giống hệt {dup_with} (Hash: {f_hash[:8]})")
    else:
        hash_tracker[f_hash] = filename
        print(f"  [SCREENSHOT] {filename} (Hash: {f_hash[:8]})")
        
    return {
        "filename": filename,
        "filepath": filepath,
        "hash": f_hash,
        "is_duplicate": is_duplicate,
        "duplicate_with": dup_with
    }

AUDIT_JS = """
function runDeepAudit() {
    const findings = {
        viewport: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            devicePixelRatio: window.devicePixelRatio
        },
        clippedSvgText: [],
        clippedPlaceholders: [],
        verticalGap: {},
        columnHeightMismatch: [],
        primaryButtonIssues: {},
        smallFonts: [],
        forbiddenEnglish: []
    };

    // 1. Chữ bị cắt trong SVG
    const svgTexts = document.querySelectorAll('svg text');
    svgTexts.forEach(t => {
        try {
            if (t.getBBox) {
                const bbox = t.getBBox();
                const svg = t.ownerSVGElement;
                if (svg) {
                    const viewBox = svg.viewBox?.baseVal;
                    if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
                        if (bbox.x + bbox.width > viewBox.x + viewBox.width + 2 || bbox.x < viewBox.x - 2) {
                            findings.clippedSvgText.push({
                                text: t.textContent.trim(),
                                bbox: { x: Math.round(bbox.x), width: Math.round(bbox.width) },
                                viewBoxWidth: Math.round(viewBox.width)
                            });
                        }
                    }
                }
            }
        } catch(e) {}
    });

    // 2. Placeholder bị cắt
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
    inputs.forEach(el => {
        const ph = el.getAttribute('placeholder');
        if (!ph || el.offsetParent === null) return;
        const style = window.getComputedStyle(el);
        ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const textWidth = ctx.measureText(ph).width;
        const padLeft = parseFloat(style.paddingLeft) || 0;
        const padRight = parseFloat(style.paddingRight) || 0;
        const availWidth = el.clientWidth - padLeft - padRight;
        if (availWidth > 0 && textWidth > availWidth + 4) {
            findings.clippedPlaceholders.push({
                tag: el.tagName.toLowerCase(),
                placeholder: ph,
                textWidth: Math.round(textWidth),
                availWidth: Math.round(availWidth),
                overflowPx: Math.round(textWidth - availWidth)
            });
        }
    });

    // 3. Khoảng trống dọc thật
    const main = document.querySelector('main') || document.body;
    let maxBottom = 0;
    const allEls = main.querySelectorAll('*');
    allEls.forEach(el => {
        if (el.offsetParent !== null) {
            const r = el.getBoundingClientRect();
            if (r.bottom > maxBottom && r.height > 0) {
                maxBottom = r.bottom;
            }
        }
    });
    findings.verticalGap = {
        maxElementBottom: Math.round(maxBottom),
        windowHeight: window.innerHeight,
        gapFromViewportBottom: Math.max(0, Math.round(window.innerHeight - maxBottom))
    };

    // 4. Hai cột kề nhau chênh chiều cao > 120px
    const grids = document.querySelectorAll('div.grid');
    grids.forEach((grid, gIdx) => {
        const children = Array.from(grid.children).filter(c => c.offsetParent !== null && c.getBoundingClientRect().width > 150);
        for (let i = 0; i < children.length - 1; i++) {
            const r1 = children[i].getBoundingClientRect();
            const r2 = children[i + 1].getBoundingClientRect();
            if (Math.abs(r1.top - r2.top) < 30) {
                const diff = Math.abs(r1.height - r2.height);
                if (diff > 120) {
                    findings.columnHeightMismatch.push({
                        gridIndex: gIdx,
                        col1Height: Math.round(r1.height),
                        col2Height: Math.round(r2.height),
                        heightDiff: Math.round(diff)
                    });
                }
            }
        }
    });

    // 5. Nút chính không phải #C8F169 hoặc nhiều hơn 1 nút chính
    const buttons = Array.from(document.querySelectorAll('button, a[role=\"button\"], div[role=\"button\"]')).filter(b => {
        if (b.offsetParent === null) return false;
        const r = b.getBoundingClientRect();
        return r.width > 30 && r.height > 20;
    });
    const limeButtons = [];
    const foreignPrimaryButtons = [];
    buttons.forEach(btn => {
        const style = window.getComputedStyle(btn);
        const bg = style.backgroundColor;
        if (bg.includes('200, 241, 105') || bg.includes('200,241,105')) {
            limeButtons.push({ text: btn.textContent.trim().slice(0, 40), bg });
        } else if (
            bg !== 'rgba(0, 0, 0, 0)' && 
            bg !== 'transparent' && 
            !bg.includes('255, 255, 255') && 
            !bg.includes('243, 248, 232') && 
            !bg.includes('226, 234, 210') && 
            !bg.includes('18, 23, 18') && 
            !bg.includes('245, 245, 245') && 
            !bg.includes('231, 229, 228')
        ) {
            foreignPrimaryButtons.push({ text: btn.textContent.trim().slice(0, 40), bg });
        }
    });
    findings.primaryButtonIssues = {
        limeCount: limeButtons.length,
        foreignPrimaryButtons: foreignPrimaryButtons,
        hasForeignPrimary: foreignPrimaryButtons.length > 0,
        multiplePrimary: limeButtons.length > 1
    };

    // 6. Chữ nhỏ < 12px
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || parent.offsetParent === null) continue;
        const text = node.textContent.trim();
        if (text.length < 2) continue;
        const style = window.getComputedStyle(parent);
        const fSize = parseFloat(style.fontSize);
        if (fSize < 11.5 && !parent.closest('svg') && !parent.closest('sub') && !parent.closest('sup')) {
            findings.smallFonts.push({
                text: text.slice(0, 30),
                fontSize: `${fSize}px`,
                tag: parent.tagName.toLowerCase()
            });
        }
    }

    // 7. Tiếng Anh cấm (Bỏ qua "Bloom" và tên công cụ trong ngoặc như "(Inspector)")
    const FORBIDDEN = ["evaluate", "mastered", "student growth view", "predict", "observe", "explain", "live", "checkpoint", "quiz", "drawer", "step", "hint"];
    const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (node = textWalker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || parent.offsetParent === null) continue;
        let text = node.textContent;
        // Bỏ qua cụm trong ngoặc ví dụ (Inspector), (Bloom), v.v.
        const textWithoutParentheses = text.replace(/\\([^)]+\\)/g, ' ');
        const words = textWithoutParentheses.toLowerCase().split(/[^a-z0-9_]+/);
        words.forEach(w => {
            if (FORBIDDEN.includes(w)) {
                findings.forbiddenEnglish.push({
                    word: w,
                    context: text.trim().slice(0, 60),
                    tag: parent.tagName.toLowerCase()
                });
            }
        });
    }

    return findings;
}
return runDeepAudit();
"""

def extract_console_errors(driver):
    logs = driver.get_log('browser')
    console_errors = []
    for l in logs:
        msg = l.get('message', '')
        level = l.get('level', '')
        if level in ['SEVERE', 'ERROR'] or 'failed' in msg.lower() or '404' in msg or '3001' in msg or 'refused' in msg.lower():
            reason = "Unknown"
            if "3001" in msg or "ERR_CONNECTION_REFUSED" in msg:
                reason = "localhost:3001 từ chối kết nối (Backend Express không chạy lúc audit)"
            elif "api/tools/execute" in msg or "404" in msg:
                reason = "localhost:4195/api/tools/execute trả 404 (Endpoint API bị thiếu trên Vite Preview server)"
            else:
                reason = f"Lỗi runtime console ({level})"
            console_errors.append({
                "raw": msg,
                "level": level,
                "reason": reason
            })
    return console_errors

def build_states():
    states = []

    # 1. Trạm 1: Lớp học trống
    def s_t1_empty(d):
        d.get(f"{URL}/?station=1&time=0")
        time.sleep(1)
    states.append(("tram1_empty_chat", s_t1_empty))

    # 2. Trạm 1: Thẻ quiz 37:13 hiện trong chat & cuộn tới thẻ
    def s_t1_quiz(d):
        d.get(f"{URL}/?station=1&time=2233")
        time.sleep(1.2)
        d.execute_script("""
            const quizEl = document.querySelector('div.bg-\\\\[\\\\#F3F8E8\\\\].border-\\\\[\\\\#E2EAD2\\\\]') || 
                           Array.from(document.querySelectorAll('div')).find(x => x.textContent.includes('BC + DD') && x.textContent.includes('Câu hỏi dừng'));
            if (quizEl) quizEl.scrollIntoView({ behavior: 'instant', block: 'center' });
        """)
        time.sleep(0.5)
    states.append(("tram1_quiz_in_chat", s_t1_quiz))

    # 3. Trạm 1: Tab Bản chép lời thật sự đang mở
    def s_t1_transcript(d):
        d.get(f"{URL}/?station=1&time=30")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.trim() === 'Bản chép lời');
            if (b) b.click();
        """)
        time.sleep(0.5)
    states.append(("tram1_transcript", s_t1_transcript))

    # 4. Trạm 2: Chưa chọn bước
    def s_t2_unselected(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("localStorage.clear();")
        d.get(f"{URL}/?station=2")
        time.sleep(1)
    states.append(("tram2_unselected", s_t2_unselected))

    # 5. Trạm 2: Chọn bước sai (Bước 2)
    def s_t2_wrong(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("""
            const cards = Array.from(document.querySelectorAll('button, div[role=\"button\"], div.cursor-pointer'));
            const b = cards.find(x => x.textContent.includes('Bước 2') || x.textContent.includes('Quy tắc hiệu'));
            if (b) b.click();
        """)
        time.sleep(0.5)
    states.append(("tram2_selected_wrong", s_t2_wrong))

    # 6. Trạm 2: Chọn bước đúng (Bước 1)
    def s_t2_right(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("""
            const cards = Array.from(document.querySelectorAll('button, div[role=\"button\"], div.cursor-pointer'));
            const b = cards.find(x => x.textContent.includes('Bước 1'));
            if (b) b.click();
        """)
        time.sleep(0.5)
    states.append(("tram2_selected_right", s_t2_right))

    # 7. Trạm 3: Chưa chọn phe
    def s_t3_unselected(d):
        d.get(f"{URL}/?station=3")
        time.sleep(1)
    states.append(("tram3_unselected", s_t3_unselected))

    # 8. Trạm 3: Chọn phe Trí nhưng CHƯA nhập giải thích (Nút Chốt kết luận mờ/disabled)
    def s_t3_tri_no_exp(d):
        d.get(f"{URL}/?station=3")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Phe Trí'));
            if (b) b.click();
            const ta = document.querySelector('textarea');
            if (ta) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, '');
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
        """)
        time.sleep(0.5)
    states.append(("tram3_phe_tri_no_explanation", s_t3_tri_no_exp))

    # 9. Trạm 3: Chọn phe Trí ĐÃ nhập giải thích (Nút Chốt kết luận sáng/active #C8F169)
    def s_t3_tri_with_exp(d):
        d.get(f"{URL}/?station=3")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Phe Trí'));
            if (b) b.click();
            const ta = document.querySelector('textarea');
            if (ta) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, 'IA và IG là hai vectơ ngược hướng nên hệ số tỉ lệ mang dấu âm: IA = -3*IG.');
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
        """)
        time.sleep(0.5)
    states.append(("tram3_phe_tri_with_explanation", s_t3_tri_with_exp))

    # 10. Trạm 3: Đã bấm Chốt kết luận thành công (Hiển thị thẻ xanh hoàn thành Bậc 5)
    def s_t3_completed(d):
        d.get(f"{URL}/?station=3")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const bTri = btns.find(x => x.textContent.includes('Phe Trí'));
            if (bTri) bTri.click();
            const ta = document.querySelector('textarea');
            if (ta) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setter.call(ta, 'IA và IG là hai vectơ ngược hướng nên hệ số tỉ lệ mang dấu âm: IA = -3*IG.');
                ta.dispatchEvent(new Event('input', { bubbles: true }));
            }
            setTimeout(() => {
                const bSubmit = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Chốt kết luận'));
                if (bSubmit) bSubmit.click();
            }, 250);
        """)
        time.sleep(0.7)
    states.append(("tram3_completed", s_t3_completed))

    # 11. Trạm 4: Trạng thái ban đầu
    def s_t4_init(d):
        d.get(f"{URL}/?station=4")
        time.sleep(1)
    states.append(("tram4_initial", s_t4_init))

    # 12. Trạm 4: Đã nhập đẳng thức (Mẫu chuẩn)
    def s_t4_typed(d):
        d.get(f"{URL}/?station=4")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.trim() === 'Mẫu chuẩn');
            if (b) b.click();
        """)
        time.sleep(0.5)
    states.append(("tram4_typed_equation", s_t4_typed))

    # 13. Trạm 4: Đã gửi đề và được Hội đồng phê duyệt (pass_create)
    def s_t4_pass(d):
        d.get(f"{URL}/?station=4")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.trim() === 'Mẫu chuẩn');
            if (b) b.click();
            setTimeout(() => {
                const bSubmit = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Gửi đề thách đấu'));
                if (bSubmit) bSubmit.click();
            }, 250);
        """)
        time.sleep(0.7)
    states.append(("tram4_submitted_pass", s_t4_pass))

    # 14. Tổng kết: Góc nhìn Học sinh
    def s_summary_student(d):
        d.get(f"{URL}/?station=4")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Xem tổng kết'));
            if (b) b.click();
        """)
        time.sleep(0.6)
    states.append(("summary_student", s_summary_student))

    # 15. Tổng kết: Góc nhìn Giáo viên
    def s_summary_teacher(d):
        d.get(f"{URL}/?station=4")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Xem tổng kết'));
            if (b) b.click();
            setTimeout(() => {
                const teacherBtn = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'Giáo viên');
                if (teacherBtn) teacherBtn.click();
            }, 200);
        """)
        time.sleep(0.6)
    states.append(("summary_teacher", s_summary_teacher))

    # 16. Modal Khảo sát đầu vào (Lobby)
    def s_modal_survey(d):
        d.get(f"{URL}/?lobby=1")
        time.sleep(1)
    states.append(("modal_survey", s_modal_survey))

    # 17. Modal Tạm dừng
    def s_modal_pause(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Tạm dừng'));
            if (b) b.click();
        """)
        time.sleep(0.5)
    states.append(("modal_pause", s_modal_pause))

    # 18. Modal Hỏi riêng
    def s_modal_ask_private(d):
        d.get(f"{URL}/?station=1")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Hỏi riêng'));
            if (b) b.click();
        """)
        time.sleep(0.5)
    states.append(("modal_ask_private", s_modal_ask_private))

    # 19. Drawer Sổ bài tập / Đổi bài
    def s_drawer_lessons(d):
        d.get(f"{URL}/?station=2")
        time.sleep(1)
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Đổi bài'));
            if (b) b.click();
        """)
        time.sleep(0.5)
    states.append(("drawer_lessons", s_drawer_lessons))

    # 20. Timeline Editor
    def s_timeline(d):
        d.get(f"{URL}/?view=editor")
        time.sleep(1.2)
    states.append(("timeline_editor", s_timeline))

    # 21. War Room
    def s_warroom(d):
        d.get(f"{URL}/?view=warroom")
        time.sleep(1.2)
    states.append(("war_room", s_warroom))

    # 22. Inspector Drawer
    def s_inspector(d):
        d.get(f"{URL}/?station=2&inspector=1")
        time.sleep(1.2)
    states.append(("inspector", s_inspector))

    return states

def main():
    server_proc = None
    if not is_port_open(PORT):
        print(f"Starting server on port {PORT}...")
        npx_path = r"D:\Program Files\nodejs\npx.cmd"
        if not os.path.exists(npx_path): npx_path = "npx"
        server_proc = subprocess.Popen(
            [npx_path, "vite", "preview", "--port", str(PORT), "--host", "127.0.0.1"],
            cwd=r"D:\DRE-prototype",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        if not wait_for_http(URL, timeout=15):
            print("ERROR: Server failed to start")
            sys.exit(1)
    else:
        print(f"Server is already running on port {PORT}.")

    hash_tracker = {}
    audit_results = {
        "metadata": {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "suite": "Audit Đợt 0b (Đo sâu + Viewport chuẩn + Kiểm tra hash trùng)"
        },
        "viewport_checks": {},
        "states": {},
        "console_errors_summary": {},
        "hash_duplicates": []
    }

    resolutions = [
        ("1920x1080", 1920, 1080),
        ("1280x720", 1280, 720)
    ]

    states = build_states()

    try:
        for res_name, w, h in resolutions:
            print(f"\n==========================================")
            print(f"  CHẠY AUDIT VỚI VIEWPORT CHUẨN: {res_name}")
            print(f"==========================================")
            driver = init_driver(w, h)
            
            for state_name, setup_fn in states:
                print(f"\n-> [{res_name}] Trạng thái: {state_name}")
                setup_fn(driver)
                
                # Check innerWidth and innerHeight
                vp_actual = driver.execute_script("return { w: window.innerWidth, h: window.innerHeight };")
                if vp_actual['w'] != w or vp_actual['h'] != h:
                    print(f"  [LỖI VIEWPORT] Kỳ vọng {w}x{h} nhưng thực tế {vp_actual['w']}x{vp_actual['h']}")

                # 1. Chụp ảnh khung nhìn đầu trang (Normal viewport)
                fn_normal = f"{state_name}_{res_name}.png"
                cap_normal = save_screen(driver, fn_normal, hash_tracker)
                if cap_normal["is_duplicate"]:
                    audit_results["hash_duplicates"].append({
                        "file": fn_normal,
                        "duplicate_of": cap_normal["duplicate_with"],
                        "hash": cap_normal["hash"]
                    })

                # 2. Chụp ảnh sau khi cuộn tới cuối trang (Scrolled to bottom)
                driver.execute_script("""
                    const scrollables = Array.from(document.querySelectorAll('div.overflow-y-auto, main, div.overflow-hidden'));
                    const maxScrollEl = scrollables.sort((a,b) => b.scrollHeight - a.scrollHeight)[0];
                    if (maxScrollEl && maxScrollEl.scrollHeight > maxScrollEl.clientHeight) {
                        maxScrollEl.scrollTop = maxScrollEl.scrollHeight;
                    }
                    window.scrollTo(0, document.body.scrollHeight);
                """)
                time.sleep(0.3)
                fn_scrolled = f"{state_name}_{res_name}_scrolled.png"
                cap_scrolled = save_screen(driver, fn_scrolled, hash_tracker)
                # Chỉ cảnh báo duplicate nếu duplicate với một trạng thái KHÁC (không phải bản un-scrolled của chính nó)
                if cap_scrolled["is_duplicate"] and cap_scrolled["duplicate_with"] != fn_normal:
                    audit_results["hash_duplicates"].append({
                        "file": fn_scrolled,
                        "duplicate_of": cap_scrolled["duplicate_with"],
                        "hash": cap_scrolled["hash"]
                    })

                # 3. Chạy Deep Audit JS
                deep_findings = driver.execute_script(AUDIT_JS)
                
                # 4. Thu thập lỗi Console
                console_errs = extract_console_errors(driver)

                # Ghi kết quả
                key = f"{state_name}_{res_name}"
                audit_results["states"][key] = {
                    "state": state_name,
                    "resolution": res_name,
                    "expected_viewport": f"{w}x{h}",
                    "actual_viewport": f"{vp_actual['w']}x{vp_actual['h']}",
                    "normal_screenshot": fn_normal,
                    "scrolled_screenshot": fn_scrolled,
                    "hash_normal": cap_normal["hash"],
                    "hash_scrolled": cap_scrolled["hash"],
                    "findings": deep_findings,
                    "console_errors": console_errs
                }

            driver.quit()

        # Lưu kết quả JSON
        out_json_path = os.path.join(ARTIFACT_DIR, "audit_dot0b_results.json")
        with open(out_json_path, "w", encoding="utf-8") as f:
            json.dump(audit_results, f, ensure_ascii=False, indent=2)
        print(f"\n[HOÀN TẤT] File JSON audit Đợt 0b đã ghi tại: {out_json_path}")

    finally:
        if server_proc:
            server_proc.kill()

if __name__ == "__main__":
    main()
