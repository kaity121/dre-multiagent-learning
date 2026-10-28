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

def save(driver, filename):
    filepath = os.path.join(ARTIFACT_DIR, filename)
    driver.save_screenshot(filepath)
    print(f"[CAPTURED] {filename} -> {filepath}")
    return filepath

def inspect_summary_modal(driver):
    return driver.execute_script("""
        const titleEl = document.getElementById('modal-summary-title');
        const titleStyle = titleEl ? window.getComputedStyle(titleEl) : null;
        
        // Find modal container
        const modal = document.querySelector('div.bg-white.border.border-\\\\[\\\\#E2EAD2\\\\].rounded-3xl') || 
                      document.querySelector('div[role="dialog"]') ||
                      document.querySelector('div.max-h-\\\\[90vh\\\\]');
                      
        // Measure all text elements inside modal for font-size < 12px
        let sub12pxCount = 0;
        let sub12pxSamples = [];
        if (modal) {
            const allElements = modal.querySelectorAll('*');
            for (let el of allElements) {
                // only check leaf or elements with direct text
                if (el.children.length === 0 && el.textContent.trim().length > 0) {
                    const fs = parseFloat(window.getComputedStyle(el).fontSize);
                    if (fs < 11.5) { // strictly smaller than 12px
                        sub12pxCount++;
                        if (sub12pxSamples.length < 5) {
                            sub12pxSamples.push({ text: el.textContent.trim().slice(0, 30), fs: fs + 'px' });
                        }
                    }
                }
            }
        }
        
        // Check footer buttons rect
        const footerBtns = Array.from(document.querySelectorAll('button')).filter(b => {
            const txt = b.textContent || '';
            return txt.includes('Đóng') || txt.includes('góc nhìn giáo viên') || txt.includes('góc nhìn học sinh') || txt.includes('chu trình học mới');
        });
        
        const footerInfo = footerBtns.map(b => {
            const r = b.getBoundingClientRect();
            return {
                text: b.textContent.trim().slice(0, 25),
                top: Math.round(r.top),
                bottom: Math.round(r.bottom),
                height: Math.round(r.height),
                inViewport: r.bottom <= window.innerHeight && r.top >= 0
            };
        });

        // Check staircase columns
        const ladderHeader = Array.from(document.querySelectorAll('h2, span, div')).find(el => el.textContent && el.textContent.includes('Thang bậc nhận thức'));
        const ladderBadge = Array.from(document.querySelectorAll('span')).find(el => el.textContent && el.textContent.includes('Đạt 6/6 bậc'));

        return {
            windowSize: { width: window.innerWidth, height: window.innerHeight },
            title: {
                text: titleEl ? titleEl.textContent.trim() : null,
                fontSize: titleStyle ? titleStyle.fontSize : null,
                fontWeight: titleStyle ? titleStyle.fontWeight : null,
                lineHeight: titleStyle ? titleStyle.lineHeight : null
            },
            ladder: {
                hasTitle: !!ladderHeader,
                hasBadge6of6: !!ladderBadge,
                badgeText: ladderBadge ? ladderBadge.textContent.trim() : null
            },
            sub12px: {
                count: sub12pxCount,
                samples: sub12pxSamples
            },
            footerButtons: footerInfo
        };
    """)

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
            print(f"[ERROR] Server failed to start on {URL} within 20s!")
            if server_proc.poll() is not None:
                out, err = server_proc.communicate()
                print(f"Server stdout: {out}")
                print(f"Server stderr: {err}")
            sys.exit(1)
        print(f"[OK] Preview server is up on {URL}")

    print("Server ready. Starting modal captures and measurements...")

    results = {}
    resolutions = [
        ("1920x1080", 1920, 1080),
        ("1280x720", 1280, 720)
    ]

    for res_name, w, h in resolutions:
        print(f"\n==========================================")
        print(f"TESTING AT {res_name} ({w}x{h})")
        print(f"==========================================")
        driver = init_driver(w, h)
        results[res_name] = {}
        try:
            # 1. Student Tab
            driver.get(f"{URL}/?station=4")
            time.sleep(2)
            
            # Click open summary modal
            driver.execute_script("""
                const buttons = Array.from(document.querySelectorAll('button'));
                const summaryBtn = buttons.find(b => b.textContent && b.textContent.includes('Xem tổng kết hành trình'));
                if (summaryBtn) summaryBtn.click();
            """)
            time.sleep(1.5)
            
            # Student view screenshot
            student_file = f"summary_student_{res_name}.png"
            save(driver, student_file)
            
            student_metrics = inspect_summary_modal(driver)
            results[res_name]["student"] = student_metrics
            print(f"Student Metrics ({res_name}): {json.dumps(student_metrics, indent=2, ensure_ascii=False)}")
            
            # 2. Teacher Tab
            driver.execute_script("""
                const buttons = Array.from(document.querySelectorAll('button'));
                const teacherTab = buttons.find(b => b.textContent && b.textContent.includes('Giáo viên'));
                if (teacherTab) teacherTab.click();
            """)
            time.sleep(1)
            
            teacher_file = f"summary_teacher_{res_name}.png"
            save(driver, teacher_file)
            
            teacher_metrics = inspect_summary_modal(driver)
            results[res_name]["teacher"] = teacher_metrics
            print(f"Teacher Metrics ({res_name}): {json.dumps(teacher_metrics, indent=2, ensure_ascii=False)}")

        finally:
            driver.quit()

    if server_proc:
        server_proc.terminate()

    with open(os.path.join(ARTIFACT_DIR, "summary_modal_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\nALL MODAL CAPTURES AND MEASUREMENTS COMPLETED!")

if __name__ == "__main__":
    main()
