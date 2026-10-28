import os
import sys
import time
import socket
import subprocess
import urllib.request

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

ARTIFACT_DIR = r"C:\Users\PC\.gemini\antigravity\brain\38147043-e3c2-4a34-b014-8ebeee945eb2"
PORT = 4198
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

    try:
        d = init_driver(1920, 1080)

        # -------------------------------------------------------------
        # 1. War Room: Đang chạy suy luận (running / in-progress stream)
        # -------------------------------------------------------------
        print("\n--- Chụp War Room: Đang chạy suy luận ---", flush=True)
        d.get(f"{URL}/?view=warroom")
        time.sleep(1.2)
        # Click Play button to start streaming
        d.execute_script("""
            const playBtn = document.querySelector('button[title*=\"phát\"]') || document.querySelector('button.w-20.h-20');
            if (playBtn) playBtn.click();
        """)
        # Wait a short moment so stream is actively running (events popping in, status changing)
        time.sleep(1.2)
        save_screen(d, "warroom_running_stream_1920px.png")

        # -------------------------------------------------------------
        # 2. War Room: Chạy xong đầy đủ (Full Event Stream + Tool Calls)
        # -------------------------------------------------------------
        print("\n--- Chụp War Room: Hoàn tất đầy đủ sự kiện & Tool Calls ---", flush=True)
        d.get(f"{URL}/?view=warroom")
        time.sleep(1.0)
        # Click "Xem toàn bộ dòng sự kiện mẫu" to immediately load all events & tool calls
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Xem toàn bộ dòng sự kiện mẫu'));
            if (b) b.click();
        """)
        time.sleep(1.2)
        save_screen(d, "warroom_full_events_and_tools_1920px.png")

        # -------------------------------------------------------------
        # 3. Timeline Editor: Đang sửa một lượt thoại (Edit Drawer)
        # -------------------------------------------------------------
        print("\n--- Chụp Timeline Editor: Đang sửa lượt thoại ---", flush=True)
        d.get(f"{URL}/?view=editor")
        time.sleep(1.2)
        # Click on the first "Sửa" button in the table
        d.execute_script("""
            const editBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Sửa'));
            if (editBtns.length > 0) editBtns[0].click();
        """)
        time.sleep(1.0)
        save_screen(d, "timeline_editor_editing_turn_1920px.png")

        # -------------------------------------------------------------
        # 4. Timeline Editor: Cảnh báo va chạm (<5s)
        # -------------------------------------------------------------
        print("\n--- Chụp Timeline Editor: Cảnh báo va chạm (<5s) ---", flush=True)
        d.get(f"{URL}/?view=editor&debug=1")
        time.sleep(1.2)
        # Click "Mô phỏng va chạm (<5s)" button
        d.execute_script("""
            const btns = Array.from(document.querySelectorAll('button'));
            const colBtn = btns.find(b => b.textContent.includes('Mô phỏng va chạm'));
            if (colBtn) colBtn.click();
        """)
        time.sleep(1.0)
        save_screen(d, "timeline_editor_collision_warning_1920px.png")

        d.quit()
        print("\nAll target state screenshots captured successfully!", flush=True)

    finally:
        if server_proc:
            server_proc.kill()

if __name__ == "__main__":
    main()
