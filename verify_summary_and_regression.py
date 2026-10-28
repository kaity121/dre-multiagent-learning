import os
import sys
import time
import socket
import subprocess
import urllib.request
import json

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
    print(f"  [SCREENSHOT] {filename} -> {filepath}")
    return filepath

def main():
    server_proc = None
    if not is_port_open(PORT):
        print(f"Starting vite preview server on port {PORT}...")
        npx_path = r"D:\Program Files\nodejs\npx.cmd"
        if not os.path.exists(npx_path):
            npx_path = "npx"
        server_proc = subprocess.Popen(
            [npx_path, "vite", "preview", "--port", str(PORT), "--host", "127.0.0.1"],
            cwd=r"D:\DRE-prototype",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        if not wait_for_http(URL, timeout=15):
            print("ERROR: Server did not respond within 15s")
            if server_proc:
                server_proc.kill()
            sys.exit(1)
        print("Server preview online.")
    else:
        print(f"Server is already running on port {PORT}.")

    results = {
        "summary_measurements": {},
        "regression_h1": {},
    }

    try:
        # =========================================================================
        # PART 1: 1920x1080 SUMMARY MODAL & REGRESSION
        # =========================================================================
        print("\n--- Running 1920x1080 Suite ---")
        d1920 = init_driver(1920, 1080)
        
        # 1. Summary Student 1920
        d1920.get(f"{URL}/?station=4")
        time.sleep(1.2)
        d1920.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Xem tổng kết'));
            if (b) b.click();
        """)
        time.sleep(0.8)
        save_screen(d1920, "summary_student_1920x1080.png")
        
        # Check student staircase in 1920
        student_1920_metrics = d1920.execute_script("""
            const titleEl = document.querySelector('#modal-summary-title');
            const h1Font = titleEl ? window.getComputedStyle(titleEl).fontSize : null;
            const subtitle = document.querySelector('span.text-xs.font-bold.text-\\\\[\\\\#4A5540\\\\]');
            return {
                h1Font: h1Font,
                hasTitle: !!titleEl
            };
        """)
        results["summary_measurements"]["student_1920"] = student_1920_metrics

        # 2. Switch to Teacher tab 1920
        d1920.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.trim() === 'Giáo viên');
            if (b) b.click();
        """)
        time.sleep(0.8)
        save_screen(d1920, "summary_teacher_1920x1080.png")

        # Measure teacher tab elements at 1920
        teacher_1920_metrics = d1920.execute_script("""
            // 1. Measure Bậc chips
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            const chips = rows.map((tr, idx) => {
                const chipSpan = tr.querySelector('span');
                if (!chipSpan) return { row: idx + 1, text: '', height: 0, width: 0, wrapped: false };
                const rect = chipSpan.getBoundingClientRect();
                const style = window.getComputedStyle(chipSpan);
                const lineHeight = parseFloat(style.lineHeight) || 20;
                return {
                    row: idx + 1,
                    text: chipSpan.textContent.trim(),
                    height: Math.round(rect.height),
                    width: Math.round(rect.width),
                    lineHeight: lineHeight,
                    isSingleLine: rect.height <= 26
                };
            });

            // 2. Measure Pedagogical cards & footer collision
            const footer = document.querySelector('div.shrink-0.border-t.border-\\\\[\\\\#E2EAD2\\\\]');
            const footerTop = footer ? footer.getBoundingClientRect().top : 1080;
            
            // Find the 2 cards
            const cardHeaders = Array.from(document.querySelectorAll('span')).filter(s => 
                s.textContent.includes('Điểm cần can thiệp') || s.textContent.includes('Gợi ý hành động')
            );
            const cards = cardHeaders.map(ch => {
                const cardDiv = ch.closest('div.rounded-xl, div.rounded-2xl') || ch.parentElement;
                const rect = cardDiv.getBoundingClientRect();
                return {
                    title: ch.textContent.trim(),
                    top: Math.round(rect.top),
                    bottom: Math.round(rect.bottom),
                    visibleAboveFooter: rect.bottom <= footerTop + 5,
                    footerTop: Math.round(footerTop)
                };
            });

            // 3. Scroll container metrics
            const scrollContainer = document.querySelector('div.flex-1.overflow-y-auto');
            const scrollInfo = scrollContainer ? {
                scrollHeight: scrollContainer.scrollHeight,
                clientHeight: scrollContainer.clientHeight,
                scrollTop: scrollContainer.scrollTop,
                isScrollable: scrollContainer.scrollHeight > scrollContainer.clientHeight
            } : null;

            return {
                chips: chips,
                cards: cards,
                scrollInfo: scrollInfo
            };
        """)
        results["summary_measurements"]["teacher_1920"] = teacher_1920_metrics

        # Regression screenshots & H1 audit at 1920:
        # Timeline Editor
        d1920.get(f"{URL}/?view=editor")
        time.sleep(1.2)
        save_screen(d1920, "timeline_editor_h1_check_1920px.png")
        t_h1 = d1920.execute_script("""
            const h1 = document.querySelector('h1');
            return h1 ? { tag: 'h1', text: h1.textContent.trim(), fontSize: window.getComputedStyle(h1).fontSize, lineHeight: window.getComputedStyle(h1).lineHeight } : null;
        """)
        results["regression_h1"]["timeline_editor"] = t_h1

        # War Room
        d1920.get(f"{URL}/?view=warroom")
        time.sleep(1.2)
        save_screen(d1920, "warroom_h1_check_1920px.png")
        w_h = d1920.execute_script("""
            const h1 = document.querySelector('h1, h2, h3');
            return h1 ? { tag: h1.tagName.toLowerCase(), text: h1.textContent.trim(), fontSize: window.getComputedStyle(h1).fontSize } : null;
        """)
        results["regression_h1"]["warroom"] = w_h

        # Inspector
        d1920.get(f"{URL}/?station=2&inspector=1")
        time.sleep(1.2)
        save_screen(d1920, "inspector_h1_check_1920px.png")
        i_h = d1920.execute_script("""
            const h1 = document.querySelector('h1, h2, h3, header div.font-bold');
            return h1 ? { tag: h1.tagName.toLowerCase(), text: h1.textContent.trim(), fontSize: window.getComputedStyle(h1).fontSize } : null;
        """)
        results["regression_h1"]["inspector"] = i_h

        # Trạm 1
        d1920.get(f"{URL}/?station=1")
        time.sleep(1.2)
        save_screen(d1920, "tram1_h1_check_1920px.png")
        tram1_h = d1920.execute_script("""
            const h1 = document.querySelector('h1, h2, h3');
            return h1 ? { tag: h1.tagName.toLowerCase(), text: h1.textContent.trim(), fontSize: window.getComputedStyle(h1).fontSize } : null;
        """)
        results["regression_h1"]["tram1"] = tram1_h

        # Trạm 2
        d1920.get(f"{URL}/?station=2")
        time.sleep(1.2)
        save_screen(d1920, "tram2_h1_check_1920px.png")
        tram2_h = d1920.execute_script("""
            const h1 = document.querySelector('h1, h2, h3');
            return h1 ? { tag: h1.tagName.toLowerCase(), text: h1.textContent.trim(), fontSize: window.getComputedStyle(h1).fontSize } : null;
        """)
        results["regression_h1"]["tram2"] = tram2_h

        # Trạm 3
        d1920.get(f"{URL}/?station=3")
        time.sleep(1.2)
        save_screen(d1920, "tram3_h1_check_1920px.png")
        tram3_h = d1920.execute_script("""
            const h1 = document.querySelector('h1, h2, h3');
            return h1 ? { tag: h1.tagName.toLowerCase(), text: h1.textContent.trim(), fontSize: window.getComputedStyle(h1).fontSize } : null;
        """)
        results["regression_h1"]["tram3"] = tram3_h

        # Trạm 4
        d1920.get(f"{URL}/?station=4")
        time.sleep(1.2)
        save_screen(d1920, "tram4_h1_check_1920px.png")
        tram4_h = d1920.execute_script("""
            const h1 = document.querySelector('h1, h2, h3');
            return h1 ? { tag: h1.tagName.toLowerCase(), text: h1.textContent.trim(), fontSize: window.getComputedStyle(h1).fontSize } : null;
        """)
        results["regression_h1"]["tram4"] = tram4_h

        # PreClassLobbyModal
        d1920.get(f"{URL}/?lobby=1")
        time.sleep(1.2)
        save_screen(d1920, "lobby_h1_check_1920px.png")
        lobby_h = d1920.execute_script("""
            const h1 = document.querySelector('h1');
            return h1 ? { tag: 'h1', text: h1.textContent.trim(), fontSize: window.getComputedStyle(h1).fontSize } : null;
        """)
        results["regression_h1"]["preclass_lobby"] = lobby_h

        d1920.quit()

        # =========================================================================
        # PART 2: 1280x720 SUMMARY MODAL CHECKS
        # =========================================================================
        print("\n--- Running 1280x720 Suite ---")
        d1280 = init_driver(1280, 720)

        # 1. Summary Student 1280
        d1280.get(f"{URL}/?station=4")
        time.sleep(1.2)
        d1280.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Xem tổng kết'));
            if (b) b.click();
        """)
        time.sleep(0.8)
        save_screen(d1280, "summary_student_1280x720.png")

        # Measure student staircase in 1280
        student_1280_metrics = d1280.execute_script("""
            const footer = document.querySelector('div.shrink-0.border-t.border-\\\\[\\\\#E2EAD2\\\\]');
            const footerTop = footer ? footer.getBoundingClientRect().top : 720;
            const scrollContainer = document.querySelector('div.flex-1.overflow-y-auto');

            // Find staircase container and columns
            const staircaseEl = document.querySelector('div.grid.grid-cols-6');
            let cols = [];
            if (staircaseEl) {
                cols = Array.from(staircaseEl.children).map((col, idx) => {
                    const rect = col.getBoundingClientRect();
                    return {
                        colIndex: idx + 1,
                        top: Math.round(rect.top),
                        bottom: Math.round(rect.bottom),
                        height: Math.round(rect.height),
                        visibleWithoutScroll: rect.bottom <= footerTop
                    };
                });
            }

            return {
                footerTop: Math.round(footerTop),
                staircaseFound: !!staircaseEl,
                cols: cols,
                isScrollContainerScrollable: scrollContainer ? (scrollContainer.scrollHeight > scrollContainer.clientHeight) : false,
                clientHeight: scrollContainer ? scrollContainer.clientHeight : 0,
                scrollHeight: scrollContainer ? scrollContainer.scrollHeight : 0
            };
        """)
        results["summary_measurements"]["student_1280"] = student_1280_metrics

        # 2. Switch to Teacher tab 1280
        d1280.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.trim() === 'Giáo viên');
            if (b) b.click();
        """)
        time.sleep(0.8)
        save_screen(d1280, "summary_teacher_1280x720.png")

        # Measure teacher tab elements at 1280
        teacher_1280_metrics = d1280.execute_script("""
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            const chips = rows.map((tr, idx) => {
                const chipSpan = tr.querySelector('span');
                if (!chipSpan) return { row: idx + 1, text: '', height: 0, width: 0, wrapped: false };
                const rect = chipSpan.getBoundingClientRect();
                return {
                    row: idx + 1,
                    text: chipSpan.textContent.trim(),
                    height: Math.round(rect.height),
                    width: Math.round(rect.width),
                    isSingleLine: rect.height <= 26
                };
            });

            const scrollContainer = document.querySelector('div.flex-1.overflow-y-auto');
            const footer = document.querySelector('div.shrink-0.border-t.border-\\\\[\\\\#E2EAD2\\\\]');

            return {
                chips: chips,
                footerTop: footer ? Math.round(footer.getBoundingClientRect().top) : 720,
                isScrollable: scrollContainer ? (scrollContainer.scrollHeight > scrollContainer.clientHeight) : false,
                clientHeight: scrollContainer ? scrollContainer.clientHeight : 0,
                scrollHeight: scrollContainer ? scrollContainer.scrollHeight : 0
            };
        """)
        results["summary_measurements"]["teacher_1280"] = teacher_1280_metrics

        d1280.quit()

        # Save results to json
        out_json_path = os.path.join(ARTIFACT_DIR, "summary_and_regression_verification.json")
        with open(out_json_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\nVerification metrics written to: {out_json_path}")
        print(json.dumps(results, indent=2, ensure_ascii=False))

    finally:
        if server_proc:
            print("Terminating server...")
            server_proc.kill()

if __name__ == "__main__":
    main()
