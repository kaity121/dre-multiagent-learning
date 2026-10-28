import sys
import os
import json
import time
import subprocess

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\PC\.gemini\antigravity\brain\38147043-e3c2-4a34-b014-8ebeee945eb2"
BASE_URL = "http://127.0.0.1:4195"

# Start vite preview server
print("Starting vite preview...")
proc = subprocess.Popen(
    [r"D:\Program Files\nodejs\npx.cmd", "vite", "preview", "--port", "4195", "--host", "127.0.0.1"],
    cwd=r"D:\DRE-prototype",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(2)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Test 1920x1080
        page1920 = browser.new_page(viewport={"width": 1920, "height": 1080})
        
        # Set localStorage so that summary modal or specific views open directly
        # Let's inspect how the summary modal is opened. In AlternativeFlowsSheet:
        # It opens when showFinalBloomReport is true.
        # Or can be opened by clicking "Tổng kết" button or via custom event/state.
        page1920.goto(f"{BASE_URL}/?station=1", wait_until="networkidle")
        time.sleep(1)
        
        # Check if there is an open summary button or we can trigger it in page
        # In AlternativeFlowsSheet: window.dispatchEvent or button with text "Tổng kết"
        # Let's see what buttons exist on header
        print("Page title:", page1920.title())
        
        browser.close()
finally:
    proc.terminate()
