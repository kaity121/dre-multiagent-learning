#!/usr/bin/env python3
"""
DRE Multi-Agent Studio - Automated UI Screenshot Tool
Tu dong chup va xuat anh sac net tung man hinh, tung component tren local.
Ho tro day du Windows, macOS va Linux.
"""

import os
import sys
import time
import argparse
import socket
import subprocess
import urllib.request

# Khac phuc loi ma hoa ky tu tieng Viet tren Windows console (cp1252)
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def is_port_open(port, host="127.0.0.1"):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False

def wait_for_http(url, timeout=15):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status == 200:
                    return True
        except Exception:
            time.sleep(0.5)
    return False

def detect_default_url():
    if is_port_open(3000):
        return "http://localhost:3000"
    elif is_port_open(5173):
        return "http://localhost:5173"
    return "http://localhost:3000"

def parse_args():
    default_url = os.environ.get("TARGET_APP_URL", detect_default_url())
    parser = argparse.ArgumentParser(description="Chup anh giao dien web DRE Multi-Agent Studio tren local")
    parser.add_argument("--url", default=default_url,
                        help=f"Dia chi URL web local (mac dinh tu phat hien: {default_url})")
    parser.add_argument("--output", default="./screenshots",
                        help="Thu muc xuat anh screenshot (mac dinh: ./screenshots)")
    parser.add_argument("--dpr", type=float, default=1.5,
                        help="He so Device Pixel Ratio de anh net min (mac dinh: 1.5)")
    return parser.parse_args()

def init_driver(width=1920, height=1080, dpr=1.5):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument(f"--window-size={width},{height}")
    options.add_argument(f"--force-device-scale-factor={dpr}")
    
    potential_binaries = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    ]
    
    for binary in potential_binaries:
        if os.path.exists(binary):
            options.binary_location = binary
            break
            
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception:
        driver = webdriver.Chrome(options=options)
        
    driver.set_window_size(width, height)
    return driver

def capture_screens(url, output_dir, dpr):
    os.makedirs(output_dir, exist_ok=True)
    server_proc = None
    
    # Kiem tra neu web server chua chay thi tu dong start ban build dist qua vite preview
    parsed_port = 3000
    if ":5173" in url:
        parsed_port = 5173
    elif ":3000" in url:
        parsed_port = 3000

    if not is_port_open(parsed_port):
        print(f"[*] Web server chua chay o cong {parsed_port}. Dang tu dong khoi chay vite preview...")
        cmd = f"npx vite preview --port {parsed_port} --host 127.0.0.1"
        server_proc = subprocess.Popen(cmd, shell=True, cwd=os.getcwd(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if wait_for_http(url, timeout=12):
            print(f"  ✓ Web server khoi dong thanh cong tai {url}")
        else:
            print(f"  ! Khong the ket noi toi {url}, thu tiep tuc...")

    print("=" * 65)
    print("BAT DAU CHUP VA XUAT SCREENSHOT THUC TE TU LOCAL WEB")
    print(f"Target URL   : {url}")
    print(f"Output Folder : {os.path.abspath(output_dir)}")
    print("=" * 65)

    try:
        # 1. Chup War Room Panel & Cross-check
        print("\n[1/5] Chup War Room Panel va Phan quyet phan bien cheo...")
        driver = init_driver(1920, 1200, dpr)
        warroom_url = f"{url.rstrip('/')}/?view=warroom"
        driver.get(warroom_url)
        time.sleep(2)

        # Chup War Room ban dau
        try:
            warroom_el = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.ID, "warroom-section"))
            )
            # Click nut toc do 2x va nut Phat de chay replay
            driver.execute_script("""
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn2x = buttons.find(b => b.textContent.includes('2.0') || b.textContent.includes('2×'));
                if (btn2x) btn2x.click();
                const btnPlay = buttons.find(b => b.textContent.includes('Phát') || b.textContent.includes('▶'));
                if (btnPlay) btnPlay.click();
            """)
            print("  ✓ Da kich hoat phien suy luan Replay 2x...")
            time.sleep(5)  # Cho su kien duoc day vao feed

            p1 = os.path.join(output_dir, "01_war_room_full.png")
            warroom_el.screenshot(p1)
            print(f"  ✓ [01] War Room Panel: {p1}")
        except Exception as e:
            print(f"  ✕ War Room error: {e}")

        # 1.2 Chup Can canh phan quyet phan bien cheo (Tri bac Bo)
        try:
            crosscheck_el = WebDriverWait(driver, 6).until(
                EC.presence_of_element_located((By.CLASS_NAME, "event-crosscheck"))
            )
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", crosscheck_el)
            time.sleep(0.5)
            p2 = os.path.join(output_dir, "02_cross_check_verdict_focus.png")
            crosscheck_el.screenshot(p2)
            print(f"  ✓ [02] Phan quyet phan bien cheo (Tri bac Bo): {p2}")
        except Exception as e:
            print(f"  ✕ Crosscheck error: {e}")

        # 1.3 Chup Timeline Editor Full (1920px)
        print("\n[2/5] Chup Timeline Editor o 1920px...")
        editor_url = f"{url.rstrip('/')}/?view=editor"
        driver.get(editor_url)
        time.sleep(2)
        try:
            timeline_el = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.ID, "timeline-section"))
            )
            p3 = os.path.join(output_dir, "03_timeline_editor_1920px.png")
            timeline_el.screenshot(p3)
            print(f"  ✓ [03] Timeline Editor (1920px): {p3}")
        except Exception as e:
            print(f"  ✕ Timeline error: {e}")

        # 1.4 Chup Modal Phe Duyet / Mo Lop
        print("\n[3/5] Chup Modal Phe Duyet / Mo Lop...")
        try:
            btn_approve = driver.find_element(By.ID, "btn-approve-open")
            btn_approve.click()
            time.sleep(0.5)
            modal_el = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, "modal-card"))
            )
            p5 = os.path.join(output_dir, "05_approve_modal_opened.png")
            modal_el.screenshot(p5)
            print(f"  ✓ [05] Modal Mo Lop (Phe Duyet Giao An): {p5}")
        except Exception as e:
            print(f"  ✕ Modal error: {e}")

        # 1.5 Chup Inspector Drawer (Alt+I)
        print("\n[4/5] Chup Multi-Agent Turn Inspector Drawer...")
        inspector_url = f"{url.rstrip('/')}/?view=classroom&inspector=1"
        driver.get(inspector_url)
        time.sleep(2)
        try:
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.ID, "inspector-drawer"))
            )
            p4 = os.path.join(output_dir, "04_inspector_drawer_active.png")
            driver.save_screenshot(p4)
            print(f"  ✓ [04] Multi-Agent Turn Inspector Drawer (Alt+I): {p4}")
        except Exception as e:
            print(f"  ✕ Inspector error: {e}")

        driver.quit()

        # 2. Chup Responsive Laptop 1366x768
        print("\n[5/5] Kiem thu responsive o do phan giai Laptop 1366x768...")
        driver_1366 = init_driver(1366, 900, 1.2)
        driver_1366.get(editor_url)
        time.sleep(2)
        try:
            timeline_1366 = WebDriverWait(driver_1366, 5).until(
                EC.presence_of_element_located((By.ID, "timeline-section"))
            )
            p6 = os.path.join(output_dir, "06_timeline_editor_1366px.png")
            timeline_1366.screenshot(p6)
            print(f"  ✓ [06] Responsive Timeline Editor (1366px): {p6}")
        except Exception as e:
            print(f"  ✕ Responsive 1366 error: {e}")
        driver_1366.quit()

    finally:
        if server_proc:
            try:
                server_proc.terminate()
            except Exception:
                pass

    print("\n" + "=" * 65)
    print("HOAN TAT! Toan bo 6 file screenshot THUC TE da duoc chup va luu.")
    print("=" * 65)

if __name__ == "__main__":
    args = parse_args()
    capture_screens(args.url, args.output, args.dpr)
