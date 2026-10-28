import socket, subprocess, time, sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

sys.stdout.reconfigure(encoding='utf-8')

npx_path = r"D:\Program Files\nodejs\npx.cmd"
proc = subprocess.Popen(
    [npx_path, "vite", "preview", "--port", "4195", "--host", "127.0.0.1"],
    cwd=r"D:\DRE-prototype",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)
time.sleep(2)

options = Options()
options.add_argument('--headless=new')
driver = webdriver.Chrome(options=options)

try:
    driver.get('http://127.0.0.1:4195/?station=3')
    time.sleep(1)

    # Click Phe Trí
    driver.execute_script("""
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(x => x.textContent.includes('Phe Trí'));
        if (b) b.click();
    """)
    time.sleep(0.5)

    # Check textarea
    ta_exists = driver.execute_script("return !!document.querySelector('textarea');")
    print("Textarea exists:", ta_exists)

    # Type using send_keys in selenium
    ta_el = driver.find_element("css selector", "textarea")
    ta_el.send_keys("IA và IG là hai vectơ ngược hướng nên hệ số tỉ lệ mang dấu âm: IA = -3*IG.")
    time.sleep(0.5)

    btn_style = driver.execute_script("""
        const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Chốt kết luận'));
        return {
            disabled: b.disabled,
            bg: window.getComputedStyle(b).backgroundColor,
            classes: b.className
        };
    """)
    print("Button style after selenium send_keys:", btn_style)

finally:
    driver.quit()
    proc.kill()
