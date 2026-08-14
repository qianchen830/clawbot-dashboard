# WSL环境登录指南

由于WSL环境无法直接显示浏览器窗口，需要通过以下方式登录：

## 方法一：复制Cookies（推荐）

1. 在Windows浏览器中登录DeepSeek
2. 使用开发者工具导出cookies
3. 将cookies导入到Playwright配置

## 方法二：使用VNC/X11转发

1. 安装VNC服务器
2. 配置X11转发
3. 在VNC中操作浏览器

## 方法三：使用远程调试

1. 在Windows中启动Chrome远程调试
2. 在WSL中连接到远程调试端口

---

## 当前状态

- ✅ Playwright已安装
- ✅ Chromium已安装
- ✅ 自动化脚本已创建
- ❌ DeepSeek未登录
- ❌ 可灵AI未登录

## 下一步

需要用户在Windows浏览器中登录后，提供登录凭证（cookies或token）。

---

*创建时间: 2026-03-08*
