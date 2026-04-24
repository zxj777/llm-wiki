---
title: "浏览器安全模型"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, security, same-origin, csp, frontend]
status: active
sources: []
---

# 浏览器安全模型

## 定义
浏览器安全模型由多层机制组成，目标是在执行不可信代码（任意网页 JS）的前提下，保护用户数据、操作系统与其他站点的安全。核心包括：**同源策略**、**进程沙箱**、**HTTPS/HSTS**、**内容安全策略（CSP）**、**子资源完整性（SRI）**、以及针对 Spectre/Meltdown 等侧信道攻击的**跨源隔离**机制（CORP/COEP/COOP）。理解这些机制是构建安全 Web 应用与排查"莫名被拦"问题的基础。

## 工作原理
**1. 同源策略（SOP）**：限制不同源的脚本互访 DOM、Cookie、Storage、AJAX 响应。是浏览器最核心的隔离边界。可通过 [[concepts/browser/cors]] 显式放开。

**2. 进程沙箱**：现代浏览器（Chromium/Firefox）采用多进程架构：
- 每个 site/origin 运行在独立的渲染进程中（Site Isolation）
- 渲染进程权限受限，无法直接访问文件系统/网络
- 与浏览器主进程通过 IPC 通信
- iframe 也可能在独立进程中运行，进一步降低跨源攻击面

**3. HTTPS / HSTS**：
- HTTPS 提供加密、完整性、身份认证
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` 强制后续请求走 HTTPS，防降级攻击
- HSTS Preload List 内置在浏览器中

**4. 内容安全策略（CSP）**：通过响应头声明可加载的资源来源，防御 XSS 与数据外泄：
```http
Content-Security-Policy: default-src 'self';
  script-src 'self' 'nonce-r4nd0m';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  report-uri /csp-report
```
推荐使用 `nonce` 或 `hash` 替代 `'unsafe-inline'`。`report-only` 模式可灰度收集违规。

**5. Subresource Integrity（SRI）**：
```html
<script src="https://cdn.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"></script>
```
浏览器校验文件指纹，防 CDN 被劫持注入恶意代码。

**6. XSS / CSRF**（详见各自概念页）：
- XSS：注入并执行恶意脚本，主要靠 CSP + 输出转义 + HttpOnly Cookie 防御
- CSRF：诱导用户在已登录站点执行非预期操作，靠 SameSite Cookie + CSRF Token 防御

**7. 跨源隔离（针对 Spectre/Meltdown）**：
- `Cross-Origin-Opener-Policy: same-origin` (COOP)：与跨源 window 隔离 BrowsingContext
- `Cross-Origin-Embedder-Policy: require-corp` (COEP)：要求子资源显式声明可被嵌入
- `Cross-Origin-Resource-Policy: same-origin` (CORP)：声明资源是否可被跨源加载
- 三者齐备后 `crossOriginIsolated` 为 true，才能使用 `SharedArrayBuffer`、高精度 timer

**8. 权限模型**：摄像头、麦克风、地理位置、剪贴板、通知等需通过 Permissions API 显式申请，HTTPS + 用户手势是常见前置条件。

## 优势与局限
- ✅ 多层防御，单点失守不致全盘崩溃
- ✅ 标准化机制，跨浏览器一致
- ✅ CSP 等头部声明式部署成本低
- ❌ 安全策略复杂，配置错误反而开后门
- ❌ 老旧业务难以严格遵守 CSP（大量 inline）
- ❌ 第三方脚本仍是最大风险面（供应链攻击）

## 应用场景
- **金融/支付站点**：必须严格的 CSP + HSTS Preload + 严格 SameSite
- **嵌入第三方内容**：iframe sandbox + CSP frame-ancestors
- **使用 SharedArrayBuffer**：必须开启跨源隔离（如 ffmpeg.wasm）
- **CDN 资源**：SRI 校验防注入

## 相关概念
- [[concepts/security/xss]]: 主要的客户端注入攻击
- csp: CSP 是 XSS 的核心缓解手段
- [[concepts/browser/cors]]: 同源策略的标准化放开
