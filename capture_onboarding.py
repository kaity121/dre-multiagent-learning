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
PORT = 4197
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
    else:
        print(f"Server already running on port {PORT}.", flush=True)

    measurements = {}

    try:
        # 1. Onboarding at 1920x1080
        print("\n--- Chụp Onboarding 1920x1080 ---", flush=True)
        d1920 = init_driver(1920, 1080)
        d1920.get(f"{URL}/?onboarding=1")
        time.sleep(1.2)
        save_screen(d1920, "onboarding_modal_1920x1080.png")
        m1920 = d1920.execute_script("""
            const modal = document.querySelector('div[role="dialog"]');
            const rect = modal ? modal.getBoundingClientRect() : {};
            const titleEl = document.querySelector('#onboarding-modal-title');
            const h1Font = titleEl ? window.getComputedStyle(titleEl).fontSize : null;
            const btn = modal ? modal.querySelector('button.bg-\\\\[\\\\#C8F169\\\\]') : null;
            const btnRect = btn ? btn.getBoundingClientRect() : {};
            
            // Check level buttons
            const lvlBtns = Array.from(document.querySelectorAll('div.grid-cols-3 button')).map(b => ({
                text: b.textContent.trim(),
                bg: window.getComputedStyle(b).backgroundColor,
                color: window.getComputedStyle(b).color
            }));

            // Check highlight span
            const hl = document.querySelector('span.bg-\\\\[\\\\#E6F4BE\\\\]');

            return {
                viewport: { w: window.innerWidth, h: window.innerHeight },
                modalRect: { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height) },
                h1Font: h1Font,
                primaryButton: {
                    text: btn ? btn.textContent.trim() : null,
                    bg: btn ? window.getComputedStyle(btn).backgroundColor : null,
                    bottom: Math.round(btnRect.bottom),
                    visibleInViewport: btnRect.bottom <= window.innerHeight
                },
                levelButtons: lvlBtns,
                highlightSpan: hl ? {
                    text: hl.textContent.trim(),
                    bg: window.getComputedStyle(hl).backgroundColor
                } : null
            };
        """)
        measurements["onboarding_1920"] = m1920
        d1920.quit()

        # 2. Onboarding at 1280x720
        print("\n--- Chụp Onboarding 1280x720 ---", flush=True)
        d1280 = init_driver(1280, 720)
        d1280.get(f"{URL}/?onboarding=1")
        time.sleep(1.2)
        save_screen(d1280, "onboarding_modal_1280x720.png")
        m1280 = d1280.execute_script("""
            const modal = document.querySelector('div[role="dialog"]');
            const rect = modal ? modal.getBoundingClientRect() : {};
            const titleEl = document.querySelector('#onboarding-modal-title');
            const h1Font = titleEl ? window.getComputedStyle(titleEl).fontSize : null;
            const btn = modal ? modal.querySelector('button.bg-\\\\[\\\\#C8F169\\\\]') : null;
            const btnRect = btn ? btn.getBoundingClientRect() : {};
            const bodyEl = document.querySelector('div.flex-1.overflow-y-auto');

            return {
                viewport: { w: window.innerWidth, h: window.innerHeight },
                modalRect: { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height) },
                h1Font: h1Font,
                primaryButton: {
                    text: btn ? btn.textContent.trim() : null,
                    bg: btn ? window.getComputedStyle(btn).backgroundColor : null,
                    bottom: Math.round(btnRect.bottom),
                    visibleInViewport: btnRect.bottom <= window.innerHeight
                },
                scrollableBody: {
                    clientHeight: bodyEl ? bodyEl.clientHeight : 0,
                    scrollHeight: bodyEl ? bodyEl.scrollHeight : 0,
                    isScrollable: bodyEl ? (bodyEl.scrollHeight > bodyEl.clientHeight) : false
                }
            };
        """)
        measurements["onboarding_1280"] = m1280
        d1280.quit()

        out_json = os.path.join(ARTIFACT_DIR, "onboarding_verification.json")
        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(measurements, f, ensure_ascii=False, indent=2)
        print(f"\nOnboarding measurements saved to: {out_json}", flush=True)
        print(json.dumps(measurements, ensure_ascii=False, indent=2), flush=True)

    finally:
        if server_proc:
            server_proc.kill()

if __name__ == "__main__":
    main()
