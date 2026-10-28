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

ARTIFACT_DIR = r"C:\Users\PC\.gemini\antigravity\brain\38147043-e3c2-4a34-b014-8ebeee945eb2"
PORT = 4199
URL = f"http://127.0.0.1:{PORT}"

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0

def wait_for_http(url, timeout=10):
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

    report = {
        "onboarding": {},
        "summary": {}
    }

    try:
        # =====================================================================
        # 1. SUITE 1920x1080
        # =====================================================================
        print("\n--- 1920x1080 Suite ---", flush=True)
        d1920 = init_driver(1920, 1080)

        # Onboarding 1920
        d1920.get(f"{URL}/?onboarding=1")
        time.sleep(1.2)
        save_screen(d1920, "onboarding_modal_1920x1080.png")
        m_onb1920 = d1920.execute_script("""
            const modal = document.querySelector('div[role="dialog"]');
            const rect = modal ? modal.getBoundingClientRect() : {};
            const titleEl = document.querySelector('#onboarding-modal-title');
            const lvlBox = document.querySelector('#onboarding-level-selection');
            const lvlRect = lvlBox ? lvlBox.getBoundingClientRect() : {};
            const bodyEl = document.querySelector('div.flex-1.overflow-y-auto');

            return {
                modalWidth: Math.round(rect.width),
                modalHeight: Math.round(rect.height),
                modalTop: Math.round(rect.top),
                modalBottom: Math.round(rect.bottom),
                titleText: titleEl ? titleEl.textContent.trim() : null,
                titleFontSize: titleEl ? window.getComputedStyle(titleEl).fontSize : null,
                bodyHeight: bodyEl ? bodyEl.clientHeight : 0,
                levelButtonsVisibleWithoutScroll: lvlRect.bottom <= (bodyEl ? bodyEl.getBoundingClientRect().bottom : 0)
            };
        """)
        report["onboarding"]["1920"] = m_onb1920

        # Summary Student 1920
        d1920.get(f"{URL}/?station=4&summary=student")
        time.sleep(1.2)
        save_screen(d1920, "summary_student_1920x1080.png")
        m_s1920 = d1920.execute_script("""
            const modal = document.querySelector('div.max-w-5xl');
            const rect = modal ? modal.getBoundingClientRect() : {};
            const heroLabel = document.querySelector('span.text-xs.font-semibold.tracking-wider.text-\\\\[\\\\#B9C4A8\\\\].uppercase');
            const heading = document.querySelector('h2.font-extrabold.text-\\\\[\\\\#121712\\\\]');

            return {
                modalHeight: Math.round(rect.height),
                modalTop: Math.round(rect.top),
                modalBottom: Math.round(rect.bottom),
                heroLabelText: heroLabel ? heroLabel.textContent.trim() : null,
                staircaseHeading: heading ? heading.textContent.trim() : null
            };
        """)
        report["summary"]["student_1920"] = m_s1920

        # Summary Teacher 1920
        d1920.get(f"{URL}/?station=4&summary=teacher")
        time.sleep(1.2)
        save_screen(d1920, "summary_teacher_1920x1080.png")
        m_t1920 = d1920.execute_script("""
            const modal = document.querySelector('div.max-w-5xl');
            const rect = modal ? modal.getBoundingClientRect() : {};
            const tableTitle = document.querySelector('h2.text-sm.sm\\\\:text-base');
            const tableRow = document.querySelector('table tbody tr td.text-sm');
            const pCardText = document.querySelector('div.grid-cols-1.sm\\\\:grid-cols-2 ul li');

            return {
                modalHeight: Math.round(rect.height),
                tableTitle: tableTitle ? tableTitle.textContent.trim() : null,
                tableTextFontSize: tableRow ? window.getComputedStyle(tableRow).fontSize : null,
                pedagogicalFontSize: pCardText ? window.getComputedStyle(pCardText).fontSize : null
            };
        """)
        report["summary"]["teacher_1920"] = m_t1920

        d1920.quit()

        # =====================================================================
        # 2. SUITE 1280x720
        # =====================================================================
        print("\n--- 1280x720 Suite ---", flush=True)
        d1280 = init_driver(1280, 720)

        # Onboarding 1280
        d1280.get(f"{URL}/?onboarding=1")
        time.sleep(1.2)
        save_screen(d1280, "onboarding_modal_1280x720.png")
        m_onb1280 = d1280.execute_script("""
            const modal = document.querySelector('div[role="dialog"]');
            const rect = modal ? modal.getBoundingClientRect() : {};
            const titleEl = document.querySelector('#onboarding-modal-title');
            const lvlBox = document.querySelector('#onboarding-level-selection');
            const lvlRect = lvlBox ? lvlBox.getBoundingClientRect() : {};
            const bodyEl = document.querySelector('div.flex-1.overflow-y-auto');

            return {
                modalWidth: Math.round(rect.width),
                modalHeight: Math.round(rect.height),
                modalTop: Math.round(rect.top),
                modalBottom: Math.round(rect.bottom),
                titleText: titleEl ? titleEl.textContent.trim() : null,
                titleFontSize: titleEl ? window.getComputedStyle(titleEl).fontSize : null,
                bodyHeight: bodyEl ? bodyEl.clientHeight : 0,
                bodyScrollHeight: bodyEl ? bodyEl.scrollHeight : 0,
                levelButtonsVisibleWithoutScroll: lvlRect.bottom <= (bodyEl ? bodyEl.getBoundingClientRect().bottom : 0)
            };
        """)
        report["onboarding"]["1280"] = m_onb1280

        # Summary Student 1280
        d1280.get(f"{URL}/?station=4&summary=student")
        time.sleep(1.2)
        save_screen(d1280, "summary_student_1280x720.png")
        m_s1280 = d1280.execute_script("""
            const modal = document.querySelector('div.max-w-5xl');
            const rect = modal ? modal.getBoundingClientRect() : {};
            const cols = Array.from(document.querySelectorAll('div.grid-cols-6 > div'));
            const descriptions = cols.map(c => {
                const desc = c.querySelector('div.text-\\\\[\\\\#3F4A36\\\\]') || c.querySelector('div.line-clamp-2');
                return {
                    text: desc ? desc.textContent.trim() : null,
                    color: desc ? window.getComputedStyle(desc).color : null,
                    fontSize: desc ? window.getComputedStyle(desc).fontSize : null
                };
            });

            return {
                modalHeight: Math.round(rect.height),
                totalStaircaseCols: cols.length,
                descriptions: descriptions
            };
        """)
        report["summary"]["student_1280"] = m_s1280

        # Summary Teacher 1280
        d1280.get(f"{URL}/?station=4&summary=teacher")
        time.sleep(1.2)
        save_screen(d1280, "summary_teacher_1280x720.png")
        m_t1280 = d1280.execute_script("""
            const modal = document.querySelector('div.max-w-5xl');
            const rect = modal ? modal.getBoundingClientRect() : {};
            const tableTitle = document.querySelector('h2.text-sm.sm\\\\:text-base');

            return {
                modalHeight: Math.round(rect.height),
                tableTitle: tableTitle ? tableTitle.textContent.trim() : null
            };
        """)
        report["summary"]["teacher_1280"] = m_t1280

        d1280.quit()

        out_json = os.path.join(ARTIFACT_DIR, "nhom_ab_verification.json")
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"\nMeasurements saved to: {out_json}", flush=True)
        print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)

    finally:
        if server_proc:
            server_proc.kill()

if __name__ == "__main__":
    main()
