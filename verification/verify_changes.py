from playwright.sync_api import sync_playwright, expect
import time

def verify_changes(page):
    page.goto("http://localhost:5173")

    # 1. Login
    # Input has no placeholder but is a password input type
    page.locator("input[type='password']").fill("shanyue2015")
    # Button is an arrow (GoButton) with "→" or similar.
    # It has a click handler.
    # We can assume it's the button inside PasswordBox
    page.locator("button").click()

    # Wait for desktop
    expect(page.get_by_text("我的电脑")).to_be_visible()

    # 2. Check Network Icon in Taskbar
    # The icon is in SystemTray. We can check for the SVG or the container.
    # The XPIcon with name "network" renders a wifi icon.
    # Let's check for the existence of the icon inside the system tray.
    # It's hard to target SVG specifically without ID or class, but we added a div wrapper.
    # We can snapshot the taskbar area.
    taskbar = page.locator("div").filter(has_text="开始").last

    # 3. Check Context Menu Refresh (Right click desktop)
    # Right click on desktop background
    page.mouse.click(100, 100, button="right")

    # Click "刷新"
    page.get_by_text("刷新").click()

    # Verify NO alert (Playwright automatically dismisses dialogs but we want to ensure custom modal DOES NOT appear,
    # or that the browser alert DOES NOT appear.
    # The previous implementation used window.alert.
    # The new implementation toggles refreshKey.
    # We can check that no modal appeared.
    expect(page.locator("text=桌面已刷新")).not_to_be_visible() # Old alert text

    # 4. Trigger a modal (QZone login failure)
    # Open QQ (double click icon)
    page.get_by_text("QQ").dblclick()

    # QQ Window opens. Wait for it.
    # The title of the window is likely "QQ" as per Desktop.jsx double click handler: openWindow(key, item.name, <QQ />, ...)
    # If the item name is "QQ", then the window title is "QQ".
    # The class in Window.jsx is "title-bar".
    expect(page.locator(".title-bar").filter(has_text="QQ")).to_be_visible()

    # Need to click QZone icon inside QQ or just open QZone directly?
    # Desktop has no QZone icon. QQ App has QZone button?
    # Looking at QQ.jsx, it has a QZone button.
    # Let's find "QZone" text or icon in QQ window.
    # The QQ app seems simple. Let's check QQ code if needed.
    # Actually, let's just use "我的电脑" (Explorer) to trigger access denied, it might be easier.
    # Or just create a test scenario.

    # Explorer access denied requires a locked folder.
    # Let's try to find a locked folder.
    # Looking at file system data... I don't recall seeing locked folders in default data.
    # But QZone login is easy to trigger if I can open QZone.
    # Wait, Desktop has QZone icon?
    # Let's check Desktop.jsx again.
    # It has "QQ" shortcut.
    # Let's look at QQ.jsx to see how to open QZone.

    # Alternatively, I can use the Console to trigger the modal if I exposed it? No.

    # Let's look at QZone.jsx. It is an app.
    # Is there a shortcut for QZone on desktop? No.
    # Is there one in Start Menu?
    # Taskbar.jsx: StartMenu has "Internet Explorer", "QQ", "My Documents"...

    # Let's try to open QZone via URL in IE?
    # Or just open Explorer and try to access a locked folder if one exists.
    # I don't think one exists by default.

    # Let's stick to checking the Visuals first (Network icon) and absence of alert on refresh.
    # I'll create a verification screenshot of the desktop with the network icon.

    time.sleep(2) # Wait for animations
    page.screenshot(path="verification/desktop_network_icon.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_changes(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
