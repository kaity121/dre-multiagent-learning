from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
import json

options = Options()
options.add_argument('--headless=new')
options.add_argument('--no-sandbox')
options.add_argument('--disable-gpu')
options.binary_location = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
driver = webdriver.Chrome(options=options)
driver.get('http://localhost:4195/?station=4')
time.sleep(1.5)
driver.execute_script("""
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent.includes('Xem tổng kết'));
    if (b) b.click();
""")
time.sleep(1.5)
info = driver.execute_script("""
    const el = document.getElementById('modal-summary-title');
    if (!el) return { error: 'Element not found!' };
    const cs = window.getComputedStyle(el);
    return {
        outerHTML: el.outerHTML,
        inlineStyle: el.getAttribute('style'),
        computedFontSize: cs.fontSize,
        computedFontWeight: cs.fontWeight,
        computedLineHeight: cs.lineHeight,
        className: el.className,
        parent: el.parentElement ? el.parentElement.tagName + '.' + el.parentElement.className : null
    };
""")
print(json.dumps(info, indent=2))
driver.quit()
