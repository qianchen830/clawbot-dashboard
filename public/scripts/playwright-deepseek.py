#!/usr/bin/env python3
"""
浏览器自动化脚本 - 使用 Playwright
"""

from playwright.sync_api import sync_playwright
import time
import sys

def open_deepseek_and_input():
    """打开 DeepSeek 并输入文本"""

    with sync_playwright() as p:
        # 启动浏览器（使用默认浏览器）
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # 访问 DeepSeek
        print("正在打开 DeepSeek...")
        page.goto('https://www.deepseek.com')

        # 等待页面加载
        time.sleep(3)

        # 查找输入框（尝试多种选择器）
        selectors = [
            'textarea[placeholder*="输入"]',
            'textarea[placeholder*="message"]',
            'textarea[placeholder*="问"]',
            'div[contenteditable="true"]',
            'textarea',
            'input[type="text"]',
        ]

        input_box = None
        for selector in selectors:
            try:
                input_box = page.wait_for_selector(selector, timeout=5000)
                if input_box:
                    print(f"找到输入框: {selector}")
                    break
            except:
                continue

        if not input_box:
            print("❌ 未找到输入框，尝试截图...")
            page.screenshot(path='/tmp/deepseek_before_input.png')
            print("截图已保存: /tmp/deepseek_before_input.png")
            print("请检查页面结构，可能需要手动输入")
            time.sleep(10)
            browser.close()
            return False

        # 输入文本
        print("正在输入: 帮我写一个短视频剧本")
        input_box.fill('帮我写一个短视频剧本')

        # 等待一下
        time.sleep(2)

        # 截图
        page.screenshot(path='/tmp/deepseek_after_input.png')
        print("✅ 截图已保存: /tmp/deepseek_after_input.png")

        # 查找发送按钮
        send_button = None
        button_selectors = [
            'button:has-text("发送")',
            'button[aria-label*="发送"]',
            'button[type="submit"]',
            'div:has-text("发送")',
        ]

        for selector in button_selectors:
            try:
                send_button = page.wait_for_selector(selector, timeout=3000)
                if send_button:
                    print(f"找到发送按钮: {selector}")
                    break
            except:
                continue

        if send_button:
            print("点击发送按钮...")
            send_button.click()

            # 等待响应
            time.sleep(10)

            # 截图结果
            page.screenshot(path='/tmp/deepseek_result.png')
            print("✅ 结果截图已保存: /tmp/deepseek_result.png")

        # 保持浏览器打开一段时间
        print("浏览器将在 30 秒后关闭...")
        time.sleep(30)

        browser.close()
        return True

if __name__ == '__main__':
    try:
        success = open_deepseek_and_input()
        if success:
            print("\n✅ 操作成功完成")
            print("📸 截图位置:")
            print("  - /tmp/deepseek_before_input.png")
            print("  - /tmp/deepseek_after_input.png")
            print("  - /tmp/deepseek_result.png")
        else:
            print("\n⚠️ 操作部分完成，请检查截图")
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
