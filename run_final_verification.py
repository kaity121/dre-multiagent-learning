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
        
    driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {
        "width": width,
        "height": height,
        "deviceScaleFactor": 1,
        "mobile": False
    })
    
    return driver

def save_screen(driver, filename):
    filepath = os.path.join(ARTIFACT_DIR, filename)
    driver.save_screenshot(filepath)
    print(f"  [SCREENSHOT] {filename} -> {filepath}", flush=True)
    return filepath

def main():
    server_proc = None
    if not is_port_open(PORT):
        print(f"Starting http.server on port {PORT} for dist...", flush=True)
        dist_dir = r"D:\DRE-prototype\dist"
        server_proc = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(PORT), "--directory", dist_dir],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        if not wait_for_http(URL, timeout=10):
            print("ERROR: Server failed to start", flush=True)
            sys.exit(1)
        print("Server online.", flush=True)
    else:
        print(f"Server already running on port {PORT}.", flush=True)

    report_data = {
        "lesson_drawer": {},
        "summary_modals": {},
        "teacher_views": {},
        "inspector": {},
        "regression_measurements": {}
    }

    try:
        # =========================================================================
        # SUITE 1920x1080
        # =========================================================================
        print("\n--- Chạy bộ kiểm tra 1920x1080 ---")
        d1920 = init_driver(1920, 1080)

        # 1. Drawer Sổ bài tập (1920 - Default)
        d1920.get(f"{URL}/?lessons=1")
        time.sleep(1.2)
        save_screen(d1920, "drawer_lessons_1920x1080.png")
        drawer1920_info = d1920.execute_script("""
            const tag = document.querySelector('span.bg-\\\\[\\\\#F3F8E8\\\\].rounded-full.border');
            const title = document.querySelector('span.font-bold.text-base');
            return {
                tagText: tag ? tag.textContent.trim() : null,
                titleText: title ? title.textContent.trim() : null
            };
        """)
        report_data["lesson_drawer"]["1920_default"] = drawer1920_info

        # 2. Drawer Sổ bài tập (1920 - Scrolled to Bài 9)
        d1920.execute_script("""
            const list = document.getElementById('lesson-drawer-list');
            if (list) list.scrollTop = list.scrollHeight;
        """)
        time.sleep(0.5)
        save_screen(d1920, "drawer_lessons_bai9_1920x1080.png")

        # 3. Summary Student 1920
        d1920.get(f"{URL}/?station=4&summary=student")
        time.sleep(1.2)
        save_screen(d1920, "summary_student_1920x1080.png")
        s1920_m = d1920.execute_script("""
            const modal = document.querySelector('div.max-w-5xl');
            const mRect = modal ? modal.getBoundingClientRect() : {};
            const titleEl = document.querySelector('#modal-summary-title');
            const h1Font = titleEl ? window.getComputedStyle(titleEl).fontSize : null;
            const topChip = document.querySelector('span.text-xs.font-semibold.tracking-wider.text-\\\\[\\\\#4A5540\\\\]');
            const bloomHeroLabel = document.querySelector('span.text-xs.font-semibold.tracking-wider.text-\\\\[\\\\#B9C4A8\\\\].uppercase');
            const bloomHeading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Tháp Bloom'));
            
            return {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                modalTop: Math.round(mRect.top),
                modalBottom: Math.round(mRect.bottom),
                modalHeight: Math.round(mRect.height),
                h1Font: h1Font,
                topChip: topChip ? topChip.textContent.trim() : null,
                bloomHeroLabel: bloomHeroLabel ? bloomHeroLabel.textContent.trim() : null,
                bloomHeading: bloomHeading ? bloomHeading.textContent.trim() : null
            };
        """)
        report_data["summary_modals"]["student_1920"] = s1920_m

        # 4. Summary Teacher 1920
        d1920.get(f"{URL}/?station=4&summary=teacher")
        time.sleep(1.2)
        save_screen(d1920, "summary_teacher_1920x1080.png")
        t1920_m = d1920.execute_script("""
            const modal = document.querySelector('div.max-w-5xl');
            const mRect = modal ? modal.getBoundingClientRect() : {};
            const footer = document.querySelector('div.shrink-0.border-t.border-\\\\[\\\\#E2EAD2\\\\]');
            const footerTop = footer ? Math.round(footer.getBoundingClientRect().top) : 1080;

            // Chips
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            const chips = rows.map((tr) => {
                const s = tr.querySelector('span');
                const r = s ? s.getBoundingClientRect() : {};
                return {
                    step: s ? s.textContent.trim() : '',
                    height: Math.round(r.height),
                    isSingleLine: Math.round(r.height) <= 26
                };
            });

            // Evidence column check
            const evidenceHeaders = Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
            const hasEvidenceCol = evidenceHeaders.includes('Bằng chứng quan sát sư phạm');
            const tableTitle = document.querySelector('h2.text-sm.sm\\\\:text-base')?.textContent.trim();

            return {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                modalTop: Math.round(mRect.top),
                modalBottom: Math.round(mRect.bottom),
                modalHeight: Math.round(mRect.height),
                footerTop: footerTop,
                tableTitle: tableTitle,
                hasEvidenceCol: hasEvidenceCol,
                chips: chips
            };
        """)
        report_data["summary_modals"]["teacher_1920"] = t1920_m

        # 5. Timeline Editor 1920
        d1920.get(f"{URL}/?view=editor")
        time.sleep(1.2)
        save_screen(d1920, "timeline_editor_1920x1080.png")
        tl1920 = d1920.execute_script("""
            const h1 = document.querySelector('h1');
            const bloomCard = Array.from(document.querySelectorAll('div.rounded-\\\\[24px\\\\]')).find(d => d.textContent.includes('Tháp Bloom'));
            return {
                titleText: h1 ? h1.textContent.trim() : null,
                fontSize: h1 ? window.getComputedStyle(h1).fontSize : null,
                lineHeight: h1 ? window.getComputedStyle(h1).lineHeight : null,
                bloomCardText: bloomCard ? bloomCard.innerText.replace(/\\n+/g, ' ') : null
            };
        """)
        report_data["teacher_views"]["timeline_editor_1920"] = tl1920

        # 6. War Room 1920
        d1920.get(f"{URL}/?view=warroom")
        time.sleep(1.2)
        save_screen(d1920, "warroom_1920x1080.png")
        war1920 = d1920.execute_script("""
            const h2 = document.querySelector('#warroom-section h2');
            const desc = document.querySelector('#warroom-section p');
            return {
                titleText: h2 ? h2.textContent.trim() : null,
                fontSize: h2 ? window.getComputedStyle(h2).fontSize : null,
                lineHeight: h2 ? window.getComputedStyle(h2).lineHeight : null,
                descText: desc ? desc.textContent.trim() : null
            };
        """)
        report_data["teacher_views"]["warroom_1920"] = war1920

        # 7. Inspector Drawer 1920
        d1920.get(f"{URL}/?station=1&inspector=1")
        time.sleep(1.2)
        save_screen(d1920, "inspector_1920x1080.png")
        insp1920 = d1920.execute_script("""
            const title = document.querySelector('#inspector-drawer-title');
            const liveChip = document.querySelector('#inspector-drawer span.bg-\\\\[\\\\#121712\\\\].text-\\\\[\\\\#C8F169\\\\]');
            const intentVal = Array.from(document.querySelectorAll('#inspector-drawer div.font-sans.font-bold')).map(e => e.textContent.trim());
            return {
                drawerTitle: title ? title.textContent.trim() : null,
                chipText: liveChip ? liveChip.textContent.trim() : null,
                sampleValues: intentVal.slice(0, 3)
            };
        """)
        report_data["inspector"]["1920"] = insp1920

        d1920.quit()

        # =========================================================================
        # SUITE 1280x720
        # =========================================================================
        print("\n--- Chạy bộ kiểm tra 1280x720 ---")
        d1280 = init_driver(1280, 720)

        # 1. Drawer Sổ bài tập (1280 - Default)
        d1280.get(f"{URL}/?lessons=1")
        time.sleep(1.2)
        save_screen(d1280, "drawer_lessons_1280x720.png")
        drawer1280_info = d1280.execute_script("""
            const tag = document.querySelector('span.bg-\\\\[\\\\#F3F8E8\\\\].rounded-full.border');
            return {
                tagText: tag ? tag.textContent.trim() : null
            };
        """)
        report_data["lesson_drawer"]["1280_default"] = drawer1280_info

        # 2. Drawer Sổ bài tập (1280 - Scrolled to Bài 9)
        d1280.execute_script("""
            const list = document.getElementById('lesson-drawer-list');
            if (list) list.scrollTop = list.scrollHeight;
        """)
        time.sleep(0.5)
        save_screen(d1280, "drawer_lessons_bai9_1280x720.png")

        # 3. Summary Student 1280
        d1280.get(f"{URL}/?station=4&summary=student")
        time.sleep(1.2)
        save_screen(d1280, "summary_student_1280x720.png")
        s1280_m = d1280.execute_script("""
            const modal = document.querySelector('div.max-w-5xl');
            const mRect = modal ? modal.getBoundingClientRect() : {};
            const footer = document.querySelector('div.shrink-0.border-t.border-\\\\[\\\\#E2EAD2\\\\]');
            const footerTop = footer ? Math.round(footer.getBoundingClientRect().top) : 720;
            const scrollContainer = document.querySelector('div.flex-1.overflow-y-auto');

            return {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                modalTop: Math.round(mRect.top),
                modalBottom: Math.round(mRect.bottom),
                modalHeight: Math.round(mRect.height),
                footerTop: footerTop,
                clientHeight: scrollContainer ? scrollContainer.clientHeight : 0,
                scrollHeight: scrollContainer ? scrollContainer.scrollHeight : 0,
                isScrollable: scrollContainer ? (scrollContainer.scrollHeight > scrollContainer.clientHeight) : false
            };
        """)
        report_data["summary_modals"]["student_1280"] = s1280_m

        # 4. Summary Teacher 1280
        d1280.get(f"{URL}/?station=4&summary=teacher")
        time.sleep(1.2)
        save_screen(d1280, "summary_teacher_1280x720.png")
        t1280_m = d1280.execute_script("""
            const modal = document.querySelector('div.max-w-5xl');
            const mRect = modal ? modal.getBoundingClientRect() : {};
            const footer = document.querySelector('div.shrink-0.border-t.border-\\\\[\\\\#E2EAD2\\\\]');
            const footerTop = footer ? Math.round(footer.getBoundingClientRect().top) : 720;
            const scrollContainer = document.querySelector('div.flex-1.overflow-y-auto');

            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            const chips = rows.map((tr) => {
                const s = tr.querySelector('span');
                const r = s ? s.getBoundingClientRect() : {};
                return {
                    step: s ? s.textContent.trim() : '',
                    height: Math.round(r.height),
                    isSingleLine: Math.round(r.height) <= 26
                };
            });

            return {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                modalTop: Math.round(mRect.top),
                modalBottom: Math.round(mRect.bottom),
                modalHeight: Math.round(mRect.height),
                footerTop: footerTop,
                clientHeight: scrollContainer ? scrollContainer.clientHeight : 0,
                scrollHeight: scrollContainer ? scrollContainer.scrollHeight : 0,
                isScrollable: scrollContainer ? (scrollContainer.scrollHeight > scrollContainer.clientHeight) : false,
                chips: chips
            };
        """)
        report_data["summary_modals"]["teacher_1280"] = t1280_m

        d1280.quit()

        out_json = os.path.join(ARTIFACT_DIR, "final_verification_measurements.json")
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        print(f"\nFinal measurements saved to: {out_json}")
        print(json.dumps(report_data, ensure_ascii=False, indent=2))

    finally:
        if server_proc:
            server_proc.kill()

if __name__ == "__main__":
    main()
