---
title: "鉴权方案"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, auth, jwt, session, oauth, backend, security]
status: active
sources: []
---

# 鉴权方案

## 定义

鉴权（Authentication & Authorization）涵盖"你是谁"（Authn）与"你能做什么"（Authz）两类问题。Web/移动后端常见方案包括 Cookie+Session、JWT（JSON Web Token）、OAuth 2.0、OpenID Connect（OIDC）以及 API Key、mTLS 等。不同方案在状态性、可撤销性、跨域、第三方接入与运维成本上各有权衡。

## 工作原理

**Cookie + Session（有状态）**：用户登录后服务端生成随机 Session ID 存入 Redis/DB，浏览器以 `HttpOnly; Secure; SameSite` Cookie 保存。每次请求自动带上 Cookie，服务端查会话取得用户信息。可主动撤销（删 Session），但分布式下需要共享存储；跨域需 CORS + `credentials: 'include'`，且要防 CSRF。

```js
// Express + express-session + connect-redis
app.use(session({ store: new RedisStore({ client }), cookie: { httpOnly: true, secure: true, sameSite: 'lax' } }));
```

**JWT（无状态）**：Token = `Header.Payload.Signature`，三段 base64url。Payload 含 `sub/iat/exp/...` claims，Signature 由 HMAC（HS256）或非对称（RS256/ES256）算法签出。服务端只需校验签名与过期，无需查库；天然适合微服务/跨域。

代价：**无法主动失效**（用户改密、被盗用），常见缓解：
1. 短有效期 Access Token（15 分钟）+ 长有效期 Refresh Token，刷新时检查黑名单
2. 服务端维护 token blacklist 或 sessionVersion
3. 撤销时直接更新签名密钥（粗暴，全员重新登录）

```js
const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
const payload = jwt.verify(token, process.env.JWT_SECRET);
```

**OAuth 2.0（授权委托）**：解决"第三方应用代表用户访问资源"的问题。四个角色：Resource Owner（用户）、Client（第三方应用）、Authorization Server（如 Google）、Resource Server（如 Google Drive API）。最常用 **Authorization Code Flow + PKCE**：客户端跳到授权服务器 → 用户同意 → 回调带 code → 客户端用 code + verifier 换 access_token + refresh_token。隐式流程已废弃。

**OpenID Connect**：在 OAuth 2.0 之上叠加身份认证标准，引入 `id_token`（JWT）携带用户身份信息（`sub/email/name`），是"用 Google 登录"等社交登录的标准协议。

**安全细则**：JWT 不要放敏感信息（任何人可解码 payload）；存 LocalStorage 易遭 XSS，存 Cookie 要防 CSRF；优先 `HttpOnly + SameSite=Lax/Strict + CSRF token`；密钥定期轮换；多端可签发不同 audience。

## 优势与局限

- ✅ Session：可撤销、安全可控
- ✅ JWT：无状态、跨服务/跨域
- ✅ OAuth/OIDC：标准化第三方接入
- ❌ Session：分布式存储依赖
- ❌ JWT：撤销难，泄露危害大
- ❌ OAuth：实现复杂、回调与重定向坑多

## 应用场景

- 单体 Web：Session + Cookie
- 微服务/SPA + API：JWT + Refresh Token
- 第三方接入/开放平台：OAuth 2.0
- 社交登录（Google/Apple）：OIDC

## 相关概念

- auth security: 鉴权安全实践细节
- [[concepts/security/csrf]]: Cookie 鉴权必须防御 CSRF
