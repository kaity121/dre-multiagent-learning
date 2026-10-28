from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument('--headless=new')
driver = webdriver.Chrome(options=options)
driver.get('http://127.0.0.1:4195/?station=3')
time.sleep(1)

# Click Phe Trí
driver.execute_script("""
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent.includes('Phe Trí'));
    if (b) b.click();
""")
time.sleep(0.5)

# Check button before typing
btn_before = driver.execute_script("""
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Chốt kết luận'));
    return { disabled: b.disabled, bg: window.getComputedStyle(b).backgroundColor };
""")
print('Before typing:', btn_before)

# Set textarea value with prototype setter
driver.execute_script("""
    const ta = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'IA và IG là hai vectơ ngược hướng nên hệ số tỉ lệ mang dấu âm: IA = -3*IG.');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
""")
time.sleep(0.5)

# Check button after typing
btn_after = driver.execute_script("""
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Chốt kết luận'));
    return { disabled: b.disabled, bg: window.getComputedStyle(b).backgroundColor };
""")
print('After typing:', btn_after)

# Click Chốt kết luận
driver.execute_script("""
    const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.includes('Chốt kết luận'));
    b.click();
""")
time.sleep(0.5)

completed_check = driver.execute_script("""
    const card = Array.from(document.querySelectorAll('div')).find(x => x.textContent.includes('Đã chốt nguyên lý POE thành công'));
    return !!card;
""")
print('Completed card appeared:', completed_check)

driver.quit()
