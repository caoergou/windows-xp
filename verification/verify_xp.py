from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_xp(page: Page):
    # 1. Login
    page.goto("http://localhost:4173")
    
    # Wait for login screen
    expect(page.get_by_text("Administrator")).to_be_visible()
    
    # Type password
    page.fill('input[type="password"]', "shanyue2015")
    page.click('button')

    # DEBUG: Screenshot the state after login attempt
    page.wait_for_timeout(2000)
    page.screenshot(path="/home/jules/verification/debug_login.png")
    
    # 2. Desktop
    # Increase timeout for potential load delays
    page.wait_for_timeout(2000)
    expect(page.get_by_text("我的电脑")).to_be_visible(timeout=10000)
    
    # 3. Open My Computer
    # Using dblclick to open
    page.dblclick('text=我的电脑')
    
    # Wait for window to appear
    expect(page.get_by_text("本地磁盘 (C:)")).to_be_visible()
    
    # 4. Open QQ
    # Close My Computer first? Or just open QQ alongside
    # Let's open QQ from Desktop shortcut if available, or Start Menu
    # Desktop shortcut might not be reliably double-clickable if obscured, but let's try
    
    # Minimize My Computer to see desktop clear or just find the icon
    # page.click('button:has-text("_")') # Minimize
    
    # Let's use start menu to open QQ? Or just desktop icon
    # Finding icon by text "QQ"
    page.dblclick('text=QQ')
    
    # Wait for QQ window
    # QQ window has "我的 QQ" if logged in? No, initially login screen
    expect(page.get_by_text("登录")).to_be_visible() # Button text
    
    # 5. Take screenshot of desktop with windows
    time.sleep(1) # Wait for animations
    page.screenshot(path="/home/jules/verification/xp_desktop.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_xp(page)
        finally:
            browser.close()
