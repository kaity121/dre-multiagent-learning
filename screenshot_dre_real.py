#!/usr/bin/env python3
"""
DRE Learning - Chup anh giao dien THUC TE 4 TRAM va cac chuc nang DRE.
"""

import os
import sys
import time
import subprocess
import urllib.request
import socket

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

def click_button_by_text(driver, text):
    return driver.execute_script(f"""
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.includes('{text}'));
        if (btn) {{
            btn.scrollIntoView({{block: 'center'}});
            btn.click();
            return true;
        }}
        return false;
    """)

def capture():
    output_dir = os.path.abspath("./screenshots_real")
    os.makedirs(output_dir, exist_ok=True)
    
    url = "http://localhost:3000"
    server_proc = None
    if not is_port_open(3000):
        print("[*] Khoi chay server Vite preview o cong 3000...")
        cmd = "npx vite preview --port 3000 --host 127.0.0.1"
        server_proc = subprocess.Popen(cmd, shell=True, cwd=os.getcwd(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait_for_http(url, timeout=12)

    print("=" * 70)
    print("BAT DAU CHUP ANH THUC TE GIAO DIEN 4 TRAM DRE LEARNING")
    print(f"Thu muc xuat anh: {output_dir}")
    print("=" * 70)

    driver = init_driver(1920, 1080, dpr=1.5)

    try:
        # Load trang web va xoa sach localStorage
        driver.get(url)
        time.sleep(2)
        driver.execute_script("localStorage.clear();")
        driver.get(url)
        time.sleep(2)

        # 1. Tram 1: Video Thay Tien & Bo cai
        print("\n[1/8] Chup Tram 1: Video Checkpoint & Bo phan bien...")
        click_button_by_text(driver, "1 · Video")
        time.sleep(2)
        p1 = os.path.join(output_dir, "01_tram1_video_debate.png")
        driver.save_screenshot(p1)
        print(f"  ✓ [01] Tram 1 (Video & Bo phan bien): {p1}")

        # 2. Tram 2: So tay bat loi Bo
        print("\n[2/8] Chup Tram 2: So tay bat loi bai giai cua Bo...")
        click_button_by_text(driver, "2 · Sổ tay")
        time.sleep(2)
        p2 = os.path.join(output_dir, "02_tram2_so_tay_bat_loi_bo.png")
        driver.save_screenshot(p2)
        print(f"  ✓ [02] Tram 2 (So tay bat loi Bo): {p2}")

        # 3. Tram 3: Thu thach du doan POE
        print("\n[3/8] Chup Tram 3: Thu thach du doan POE (3D Geometry)...")
        click_button_by_text(driver, "3 · Đoán")
        time.sleep(2)
        p3 = os.path.join(output_dir, "03_tram3_du_doan_poe.png")
        driver.save_screenshot(p3)
        print(f"  ✓ [03] Tram 3 (Du doan POE 3D): {p3}")

        # 4. Tram 4: Day kem Bo & Sang tao de
        print("\n[4/8] Chup Tram 4: Gia su day kem Bo & Sang tao de...")
        click_button_by_text(driver, "4 · Dạy kèm")
        time.sleep(2)
        p4 = os.path.join(output_dir, "04_tram4_day_kem_bo_sang_tao_de.png")
        driver.save_screenshot(p4)
        print(f"  ✓ [04] Tram 4 (Day kem Bo & Sang tao de): {p4}")

        # 5. Bao cao tong ket hanh trinh & Thang Bloom
        print("\n[5/8] Chup Bao cao tong ket hanh trinh & Thang Bloom...")
        click_button_by_text(driver, "Hoàn thành 4 Trạm")
        time.sleep(1.5)
        p5 = os.path.join(output_dir, "05_bao_cao_tong_ket_bloom.png")
        driver.save_screenshot(p5)
        print(f"  ✓ [05] Bao cao tong ket Bloom: {p5}")

        # 6. Modal Hoi rieng 4 ban AI
        print("\n[6/8] Chup Modal Hoi rieng 4 ban AI...")
        driver.get(url)
        time.sleep(2)
        click_button_by_text(driver, "Hỏi riêng 4 bạn")
        time.sleep(1.5)
        p6 = os.path.join(output_dir, "06_modal_hoi_rieng_4_ban_ai.png")
        driver.save_screenshot(p6)
        print(f"  ✓ [06] Modal Hoi rieng 4 ban AI: {p6}")

        # 7. Drawer Doi / Chon bai hoc
        print("\n[7/8] Chup Drawer Doi / Chon bai hoc...")
        driver.get(url)
        time.sleep(2)
        click_button_by_text(driver, "Đổi bài")
        time.sleep(1.5)
        p7 = os.path.join(output_dir, "07_drawer_doi_bai_hoc.png")
        driver.save_screenshot(p7)
        print(f"  ✓ [07] Drawer Doi / Chon bai hoc: {p7}")

        # 8. Modal Tam dung bai hoc
        print("\n[8/8] Chup Modal Tam dung bai hoc...")
        driver.get(url)
        time.sleep(2)
        click_button_by_text(driver, "Tạm dừng")
        time.sleep(1.5)
        p8 = os.path.join(output_dir, "08_modal_tam_dung_bai_hoc.png")
        driver.save_screenshot(p8)
        print(f"  ✓ [08] Modal Tam dung bai hoc: {p8}")

    finally:
        driver.quit()
        if server_proc:
            try:
                server_proc.terminate()
            except Exception:
                pass

    print("\n" + "=" * 70)
    print("HOAN TAT! Toan bo anh chup THUC TE cua web DRE da duoc xuat ra:")
    print(f"Thu muc: {output_dir}")
    print("=" * 70)

if __name__ == "__main__":
    capture()
