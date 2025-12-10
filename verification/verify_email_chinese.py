from playwright.sync_api import sync_playwright

def verify_email_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (using the dev port)
        page.goto("http://localhost:5173")

        # Log in if necessary
        # Based on the HTML seen earlier, there is a login screen
        # User: Administrator, Password: ...

        # Let's try to bypass login or login
        if page.is_visible('text="Administrator"'):
            print("Login screen detected")

            page.fill('input[type="password"]', 'shanyue2015')
            page.click('button:has-text("→")')


        # Wait for the desktop to load
        print("Waiting for desktop...")
        page.wait_for_selector('text="Outlook Express"', timeout=10000)

        # Double click the "Outlook Express" icon
        # Finding the icon container
        outlook_icon = page.locator('text="Outlook Express"')
        outlook_icon.dblclick()

        # Wait for the Email window to open
        # The window title bar should contain "Outlook Express"
        print("Waiting for window...")
        page.wait_for_selector('text="新建邮件"', timeout=5000)

        # Wait for content to load
        print("Waiting for content...")
        # Check for Chinese content
        page.wait_for_selector('text="欢迎来到 Windows XP 模拟器"', timeout=5000)

        # Click on the email to show preview
        page.click('text="欢迎来到 Windows XP 模拟器"')

        # Wait for preview text
        page.wait_for_selector('text="欢迎使用 Windows XP 模拟器！"', timeout=5000)

        # Click on the long log email to check scrolling (visual verification via screenshot)
        if page.is_visible('text="系统运行日志 - 2005-04-05"'):
             page.click('text="系统运行日志 - 2005-04-05"')
             page.wait_for_timeout(500) # wait for render

        # Take a screenshot of the open email app
        page.screenshot(path="verification/email_app_chinese.png")

        print("Verification successful, screenshot saved to verification/email_app_chinese.png")

        browser.close()

if __name__ == "__main__":
    verify_email_app()
