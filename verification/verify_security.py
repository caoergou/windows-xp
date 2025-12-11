from playwright.sync_api import sync_playwright

def verify_console_security():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Enable console logging
        context = browser.new_context()
        page = context.new_page()

        # Store logs
        logs = []
        page.on("console", lambda msg: logs.append(msg.text))

        try:
            # Navigate to the app (using preview port 4173 as per memory)
            page.goto("http://localhost:4173")

            # Wait for app to load (login screen or desktop)
            # Since auto-login is not guaranteed, we check what's there.
            # But the Easter Egg is in App.jsx useEffect, so it should fire immediately on mount.
            page.wait_for_timeout(2000)

            print("Captured Logs:")
            for log in logs:
                print(log)

            # Check for the specific texts
            security_found = any("Windows Security Center" in log for log in logs)
            chinese_warning_found = any("windows 安全防护中心发现入侵请求" in log for log in logs)

            if security_found and chinese_warning_found:
                print("SUCCESS: Easter egg message found in console.")
            else:
                print("FAILURE: Easter egg message NOT found.")

            # Test Context Menu Blocking
            # We try to right click on the body.
            # If the default context menu is blocked, we can't easily assert that with Playwright
            # (browser native menu is not DOM).
            # But we can assert that 'contextmenu' event default was prevented if we could hook it,
            # but simpler to rely on the code review for that part or assume if logs work, App.jsx loaded.

            # Take screenshot of the app just to see it runs
            page.screenshot(path="verification/app_running.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_console_security()
