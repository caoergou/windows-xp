from playwright.sync_api import sync_playwright

def verify_tieba():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173")
        page.wait_for_timeout(5000)

        # Login
        password_input = page.locator('input[type="password"]')
        if password_input.count() > 0:
            password_input.fill("shanyue2015")
            page.keyboard.press("Enter")
            page.wait_for_timeout(5000)
        else:
            print("Password input not found, maybe already logged in?")

        # Check desktop
        page.screenshot(path="verification/desktop_logged_in.png")

        # Open "Yunshan No.1 Middle School" shortcut (TiebaApp)
        # Note: In the previous version, we opened generic IE.
        # Now we open the specific app which tests the "Inheritance" logic.
        tieba_icon = page.get_by_text("云山一中吧")
        if tieba_icon.count() > 0:
            tieba_icon.first.dblclick()
            page.wait_for_timeout(2000)

            # Verify we are in the correct Tieba
            # Screenshot of the main page
            page.screenshot(path="verification/tieba_school.png")

            # Click thread
            page.get_by_text("今天的数学作业").first.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/tieba_thread.png")

            # Now let's try to navigate to the OTHER tieba using the address bar
            # This verifies that TiebaApp handles navigation correctly using its internal plugin logic
            address_bar = page.locator('div').filter(has_text="地址:").locator('input')
            address_bar.fill("http://tieba.com/yunshan_county")
            page.get_by_text("转到").click()
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/tieba_county.png")

        else:
            print("Tieba Icon not found on desktop")

        browser.close()

if __name__ == "__main__":
    verify_tieba()
