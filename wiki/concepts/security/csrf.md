---
title: "CSRF 跨站请求伪造"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [security, web, backend]
status: active
sources: []
---

# CSRF 跨站请求伪造

## 定义

CSRF（Cross-Site Request Forgery,跨站请求伪造）是一种利用受害者已认证的会话,在其不知情的情况下发起非预期请求的攻击。攻击者诱导用户访问恶意页面,该页面自动向目标站点发起带有受害者 Cookie 的请求,从而以受害者身份执行转账、改密、删除等敏感操作。与 XSS 不同,CSRF 不窃取数据,而是借用用户的"身份"代为操作,本质上是浏览器自动携带 Cookie 机制的滥用。

CSRF 攻击成立的三个必要条件：
1. 目标接口依赖 Cookie 等浏览器自动凭据进行认证
2. 接口未校验请求来源/自定义令牌
3. 受害者在登录态下访问了攻击者控制的页面

## 工作原理

经典攻击示例：

```html
<!-- 受害者已登录 bank.com,访问 evil.com 时 -->
<form action="https://bank.com/transfer" method="POST" id="f">
  <input name="to" value="attacker">
  <input name="amount" value="10000">
</form>
<script>document.getElementById('f').submit();</script>
```

浏览器会自动附带 `bank.com` 的 Cookie,服务端认为是合法请求。

**主流防御方案：**

1. **同步令牌模式（Synchronizer Token）**：服务端在表单中嵌入随机一次性令牌,提交时校验。

```js
// 服务端渲染
res.render('form', { csrfToken: req.session.csrfToken });
// 校验
if (req.body._csrf !== req.session.csrfToken) return res.status(403).end();
```

2. **双重提交 Cookie（Double Submit Cookie）**：把同一随机值同时放在 Cookie 和请求头/表单中,服务端比对二者一致。无需服务端存储,适合无状态 API。

3. **SameSite Cookie**：现代浏览器默认 `SameSite=Lax`,跨站 POST/AJAX 不再附带 Cookie,从根源阻断 CSRF。

```
Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Strict
```

4. **自定义请求头校验**：要求请求带 `X-Requested-With: XMLHttpRequest` 等自定义头,简单跨站请求无法添加自定义头（受 CORS 预检限制）。

5. **Origin/Referer 校验**：服务端检查 `Origin` 或 `Referer` 头是否属于白名单。

## 优势与局限

- ✅ SameSite Cookie 几乎零成本,默认开启即可防御大部分 CSRF
- ✅ 同步令牌方案兼容性最好,对老旧浏览器也有效
- ✅ 双重提交 Cookie 无需服务端会话存储,适合 SPA + REST
- ❌ SameSite=Strict 影响跨站跳转后的登录态体验
- ❌ 同步令牌方案对完全无状态架构不友好
- ❌ 一旦存在 [[concepts/security/xss]] 漏洞,所有 CSRF 防御均失效（脚本可读取令牌）
- ❌ JSON API 若误开启 `Content-Type: text/plain` 接收,可能被简单请求绕过

## 应用场景

- **银行/支付系统**：必须组合使用 SameSite=Strict + 同步令牌 + Origin 校验
- **后台管理系统**：所有写操作接口启用 CSRF Token
- **SPA + REST API**：双重提交 Cookie 或基于 Authorization 头的 [[concepts/security/jwt]]（不依赖 Cookie 则免疫 CSRF）
- **OAuth 授权端点**：state 参数即专用的 CSRF 令牌
- **表单提交**：服务端渲染框架（Django、Rails、Spring）默认内置 CSRF 中间件

## 相关概念

- [[concepts/security/xss]]: XSS 可窃取 CSRF Token,二者需同时防御
- [[concepts/security/cors]]: CORS 不能防御 CSRF（简单请求不触发预检）
- [[concepts/security/jwt]]: 基于 Authorization 头的 JWT 天然免疫 CSRF
- cookie security: SameSite/HttpOnly/Secure 是基础防线
- [[concepts/security/oauth2]]: state 参数本质是 OAuth 流程中的 CSRF Token
