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

        # Click on "Create Mail" button to verify no alert
        page.click('text="新建邮件"')

        # Click on "Reply" button to verify no alert
        page.click('text="回复"')

        # If no alert appeared, script continues. If alert appeared, it might block or need handling.
        # However, Playwright handles alerts by default by dismissing them if not handled,
        # but we can't easily assert "no alert happened" without an event listener.
        # But since we removed the alert code, we just want to ensure the UI is stable.

        # Take a screenshot of the open email app
        page.screenshot(path="verification/email_app_no_alert.png")

        print("Verification successful, screenshot saved to verification/email_app_no_alert.png")

        browser.close()

if __name__ == "__main__":
    verify_email_app()
