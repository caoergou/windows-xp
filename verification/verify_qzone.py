from playwright.sync_api import sync_playwright

def verify_qzone():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        print("Navigating to http://localhost:5173")
        page.goto("http://localhost:5173")

        # Wait for login screen and login
        print("Waiting for login button")
        # Click the arrow button (submit)
        page.click("button:has-text('→')")

        # Wait for desktop
        print("Waiting for desktop (QQ icon)")
        page.wait_for_selector('div[title="QQ"]', timeout=20000)

        # Open QQ
        print("Opening QQ")
        page.dblclick('div[title="QQ"]')

        # Wait for QQ window
        print("Waiting for QQ login screen")
        page.wait_for_selector("text=QQ号码/手机/邮箱", timeout=5000)

        # Login to QQ
        print("Logging into QQ")
        page.click("button:has-text('登录')")

        # Wait for friend list
        print("Waiting for friend list")
        page.wait_for_selector("text=山月 (1001)", timeout=5000)

        # Click QZone button for User 1001
        print("Clicking QZone for User 1001")
        # Find the button associated with 山月 (1001)
        # We look for the row containing the text, then find the button within it
        # Actually the structure is a bit loose, let's target the specific button text if unique
        # The buttons both have text "⭐空间". We need the first one.
        page.click("button:has-text('⭐空间') >> nth=0")

        # Wait for QZone window
        print("Waiting for QZone window")
        page.wait_for_selector("text=我的空间", timeout=10000)

        # Take a screenshot
        print("Taking screenshot")
        page.screenshot(path="verification/qzone_success.png")

        print("Verification successful!")
        browser.close()

if __name__ == "__main__":
    verify_qzone()
