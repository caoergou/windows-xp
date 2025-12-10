from playwright.sync_api import sync_playwright

def verify_yellow_pages():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("http://localhost:5173")
        page.wait_for_timeout(5000)

        # Login if needed
        password_input = page.locator('input[type="password"]')
        if password_input.count() > 0:
            password_input.fill("shanyue2015")
            page.keyboard.press("Enter")
            page.wait_for_timeout(5000)

        # Open "About.html" (Yellow Pages)
        # It's a file on desktop.
        about_icon = page.get_by_text("About.html")
        if about_icon.count() > 0:
            about_icon.first.dblclick()
            page.wait_for_timeout(2000)

            # Verify "Yellow Pages" content
            if page.get_by_text("黄页 (Yellow Pages)").count() > 0:
                print("Yellow Pages opened successfully.")
                page.screenshot(path="verification/yellow_pages.png")

                # Click "云山一中吧" link
                link = page.locator("a").filter(has_text="云山一中吧")
                link.click()

                page.wait_for_timeout(3000)

                # Verify navigation to Tieba
                if page.get_by_text("云山一中吧").count() > 0:
                     print("Navigated to Yunshan No.1 Middle School Tieba successfully.")
                     page.screenshot(path="verification/tieba_from_yellow_pages.png")
                else:
                     print("Failed to navigate to Tieba from Yellow Pages.")
                     print("Current content: ", page.content())
            else:
                print("Yellow Pages content not found.")
        else:
            print("About.html icon not found.")

        browser.close()

if __name__ == "__main__":
    verify_yellow_pages()
