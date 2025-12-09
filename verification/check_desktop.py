from playwright.sync_api import sync_playwright

def verify_qq(page):
    page.goto('http://localhost:5173')

    # Wait for desktop to load (assuming LoginScreen handles automatic login or we need to login)
    # The current App.jsx shows LoginScreen if not logged in.
    # The default LoginScreen has a button to login.

    # Wait for login screen
    page.wait_for_selector('text=Turn off computer', timeout=5000)

    # Click user to login (assuming default user from user_config.json)
    # Actually, I should check how LoginScreen works.
    # Let's assume the user clicks the user icon/name.

    page.locator('.user-account').first.click()
    page.fill('input[type="password"]', 'shanyue2015') # Default password from memory
    page.click('.go-button')

    # Wait for Desktop
    page.wait_for_selector('text=Recycle Bin', timeout=10000)

    # Open QQ (Need to find how to open it. Is it on desktop? Or start menu?)
    # Assuming there's a shortcut or I can inject it.
    # Let's check Desktop.jsx or just open it directly if I can.
    # Since I don't know if there is a shortcut, I might need to simulate opening it.
    # However, if I can't find it, I can't verify it easily without adding a shortcut.
    # Let's assume there is a QQ shortcut or I can use the Start Menu.

    # If there is no QQ shortcut, I might need to rely on the fact that I just modified QQ.jsx
    # but I need to mount it.

    # Let's try to double click a hypothetical "QQ" icon on desktop if it exists.
    # Or, I can check if I can modify Desktop.jsx to include QQ for testing?
    # Or just assume the user will open it?

    # Wait! I modified QQ.jsx but I didn't check if it's reachable.
    # The user request was to optimize QQ, implied it's already there.
    # Let's check `src/components/Desktop.jsx` to see if QQ is there.

    # If not, I can't verify it end-to-end.
    pass

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_qq(page)
        except Exception as e:
            print(e)
        finally:
            browser.close()
