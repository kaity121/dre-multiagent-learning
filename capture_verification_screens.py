#!/usr/bin/env python3
import os
import sys
import time
import socket
import subprocess
import urllib.request

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

ARTIFACT_DIR = r"C:\Users\PC\.gemini\antigravity\brain\38147043-e3c2-4a34-b014-8ebeee945eb2"
PORT = 4195
URL = f"http://localhost:{PORT}"

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

def init_driver(width=1920, height=1080, dpr=1.25):
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

def save(driver, filename):
    filepath = os.path.join(ARTIFACT_DIR, filename)
    driver.save_screenshot(filepath)
    print(f"[CAPTURED] {filename} -> {filepath}")
    return filepath

def main():
    server_proc = None
    if not is_port_open(PORT):
        print(f"Starting preview server on port {PORT}...")
        server_proc = subprocess.Popen(
            f"npx vite preview --port {PORT} --host 127.0.0.1",
            shell=True,
            cwd=r"D:\DRE-prototype",
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        wait_for_http(URL, timeout=15)

    print("Server ready. Starting captures...")

    resolutions = [
        ("1920px", 1920, 1080),
        ("1280px", 1280, 800)
    ]

    for res_name, w, h in resolutions:
        print(f"\n--- CAPTURING AT {res_name} ({w}x{h}) ---")
        driver = init_driver(w, h)
        try:
            # 1. Trạm 1 - Initial State (00:00)
            driver.get(f"{URL}/?station=1&time=0")
            time.sleep(2)
            driver.execute_script("localStorage.clear();")
            driver.get(f"{URL}/?station=1&time=0")
            time.sleep(2)
            save(driver, f"tram1_verified_initial_{res_name}.png")

            # 2. Trạm 1 - Checkpoint 37:13 with ChatSavedQuizBlock
            driver.get(f"{URL}/?station=1&time=2233&all_chat=1")
            time.sleep(2)
            driver.execute_script("""
                const quiz = document.getElementById('chat-saved-quiz-card');
                if (quiz) {
                    quiz.scrollIntoView({ behavior: 'instant', block: 'center' });
                }
            """)
            time.sleep(1)
            save(driver, f"tram1_verified_quiz_3713_{res_name}.png")

            # 3. Trạm 3 - POE Unselected
            driver.get(f"{URL}/?station=3")
            time.sleep(2)
            save(driver, f"tram3_poe_verified_unselected_{res_name}.png")

            # 4. Trạm 3 - POE Selected (Click Phe Trí)
            driver.execute_script("""
                const buttons = Array.from(document.querySelectorAll('button'));
                const triBtn = buttons.find(b => b.textContent && b.textContent.includes('Phe Trí'));
                if (triBtn) triBtn.click();
            """)
            time.sleep(1)
            save(driver, f"tram3_poe_verified_selected_{res_name}.png")

            # 5. Trạm 4 - Protégé Teaching & Create Problem
            driver.get(f"{URL}/?station=4")
            time.sleep(2)
            save(driver, f"tram4_protege_verified_{res_name}.png")

            # 6. Màn Tổng kết Modal
            driver.execute_script("""
                const buttons = Array.from(document.querySelectorAll('button'));
                const summaryBtn = buttons.find(b => b.textContent && b.textContent.includes('Xem tổng kết hành trình'));
                if (summaryBtn) summaryBtn.click();
            """)
            time.sleep(1.5)
            save(driver, f"summary_modal_verified_{res_name}.png")

            # 7. Màn Tổng kết Modal - Tab Giáo viên (only at 1920px)
            if res_name == "1920px":
                driver.execute_script("""
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const teacherTab = buttons.find(b => b.textContent && b.textContent.includes('Giáo viên'));
                    if (teacherTab) teacherTab.click();
                """)
                time.sleep(1)
                save(driver, f"summary_modal_teacher_{res_name}.png")

            # 8. Header 3-dots Menu & Modals (at 1920px)
            if res_name == "1920px":
                # Close modal first
                driver.get(f"{URL}/?station=2")
                time.sleep(1.5)
                # Click 3 dots button in header
                driver.execute_script("""
                    const btns = Array.from(document.querySelectorAll('button'));
                    const threeDots = btns.find(b => b.title && b.title.includes('Công cụ giáo viên & kỹ thuật nội bộ'));
                    if (threeDots) threeDots.click();
                """)
                time.sleep(1)
                save(driver, "header_3dots_menu_verified_1920px.png")

                # Open PauseModal
                driver.get(f"{URL}/?station=2")
                time.sleep(1)
                driver.execute_script("""
                    const btns = Array.from(document.querySelectorAll('button'));
                    const pauseBtn = btns.find(b => b.textContent && b.textContent.includes('Tạm dừng'));
                    if (pauseBtn) pauseBtn.click();
                """)
                time.sleep(1)
                save(driver, "pause_modal_verified_1920px.png")

                # Open LessonSelectorDrawer
                driver.get(f"{URL}/?station=2")
                time.sleep(1)
                driver.execute_script("""
                    const btns = Array.from(document.querySelectorAll('button'));
                    const changeBtn = btns.find(b => b.textContent && b.textContent.includes('Đổi bài'));
                    if (changeBtn) changeBtn.click();
                """)
                time.sleep(1)
                save(driver, "lesson_drawer_verified_1920px.png")

                # Open PreClassLobbyModal
                driver.get(f"{URL}/?lobby=1")
                time.sleep(1.5)
                save(driver, "lobby_modal_verified_1920px.png")

        finally:
            driver.quit()

    if server_proc:
        server_proc.terminate()
    print("\nALL CAPTURES COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
