from playwright.sync_api import sync_playwright

def verify_tieba():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173")
        page.wait_for_timeout(5000)

        # Login
        # Look for password input. It's likely the only input on the login screen.
        password_input = page.locator('input[type="password"]')
        if password_input.count() > 0:
            password_input.fill("shanyue2015")
            page.keyboard.press("Enter")
            page.wait_for_timeout(5000) # Wait for desktop to load
        else:
            print("Password input not found, maybe already logged in?")

        # Check desktop
        page.screenshot(path="verification/desktop_logged_in.png")

        # Open Internet Explorer
        ie_icon = page.get_by_text("Internet Explorer")
        if ie_icon.count() > 0:
            ie_icon.first.dblclick()
            page.wait_for_timeout(2000)

            # Find address bar
            address_bar = page.locator('div').filter(has_text="地址:").locator('input')

            # Yunshan No.1 Middle School
            address_bar.fill("http://tieba.com/yunshan_no1_middle_school")
            page.get_by_text("转到").click()

            page.wait_for_timeout(3000)
            page.screenshot(path="verification/tieba_school.png")

            # Click thread
            page.get_by_text("今天的数学作业").first.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="verification/tieba_thread.png")

            # Back to list (using breadcrumb or just new url)
            address_bar.fill("http://tieba.com/yunshan_county")
            page.get_by_text("转到").click()
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/tieba_county.png")

        else:
            print("IE Icon not found on desktop")

        browser.close()

if __name__ == "__main__":
    verify_tieba()
