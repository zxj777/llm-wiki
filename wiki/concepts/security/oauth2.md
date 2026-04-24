---
title: "OAuth 2.0"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [security, authentication, authorization]
status: active
sources: []
---

# OAuth 2.0

## 定义

OAuth 2.0（RFC 6749）是一个**授权框架**,允许第三方应用在用户许可下,获得对受保护资源的有限访问权,而无需共享用户密码。它把"认证用户"与"访问 API"解耦,是当今 Web 与移动应用最广泛使用的授权协议——"使用 GitHub/Google/微信登录" 背后都是 OAuth 2.0。注意:OAuth 2.0 本身只解决**授权**(authorization),要做身份**认证**需要在其上叠加 OpenID Connect。

四个核心角色：
- **Resource Owner**：资源所有者(用户)
- **Client**：第三方应用
- **Authorization Server**：授权服务器,签发 Token
- **Resource Server**：资源服务器,校验 Token 提供 API

## 工作原理

**1. 授权码流程（Authorization Code,推荐）** —— 适合有后端的 Web 应用

```
用户 → Client → Authorization Server (登录授权)
                       ↓ redirect with ?code=xxx&state=yyy
                     Client (后端用 code + secret 换 Token)
                       ↓
                Authorization Server → access_token + refresh_token
                       ↓
                     Client → Resource Server (Bearer Token)
```

```http
# Step 1: 跳转授权
GET /authorize?response_type=code
  &client_id=abc&redirect_uri=https://app/cb
  &scope=read:user&state=xyz123

# Step 2: 回调后用 code 换 token
POST /token
grant_type=authorization_code&code=xxx
&redirect_uri=https://app/cb
&client_id=abc&client_secret=secret
```

**2. PKCE 扩展（Proof Key for Code Exchange,RFC 7636）** —— 适合 SPA 与移动端(无法保密 client_secret)

客户端生成随机 `code_verifier`,授权请求时带 `code_challenge = SHA256(verifier)`,换 Token 时再带 `code_verifier`,服务端校验,防止授权码被中间人截取。**当前 OAuth 2.1 草案要求所有客户端强制使用 PKCE**。

**3. 隐式流程（Implicit）** —— 已废弃

直接在 URL fragment 返回 access_token,易泄漏,被 PKCE 取代。

**4. 客户端凭据（Client Credentials）** —— 服务端到服务端

```
POST /token
grant_type=client_credentials&client_id=...&client_secret=...
```

**5. 设备授权（Device Code,RFC 8628）** —— 电视、CLI 等输入受限设备

**Token 类型：**
- **Access Token**：短期凭据,通常是 [[concepts/security/jwt]] 或不透明字符串
- **Refresh Token**：长期凭据,用于换新 Access Token,必须保密
- **ID Token**：OIDC 引入,包含用户身份信息的 JWT

**state 参数**：防 [[concepts/security/csrf]],客户端生成随机值,回调时校验一致。

## 优势与局限

- ✅ 用户无需向第三方泄露密码
- ✅ 细粒度 scope 控制权限范围
- ✅ Token 可独立撤销,refresh_token 实现长期登录
- ✅ 标准化,生态完善(Auth0、Keycloak、各大平台)
- ❌ 协议复杂,流程多,误用易引入漏洞
- ❌ 隐式流程历史漏洞频发,SPA 必须用 PKCE 替代
- ❌ Refresh Token 泄漏后果严重,需轮换(rotation)与绑定(DPoP/MTLS)
- ❌ OAuth 仅授权,误当作认证(只看 access_token 不看 ID Token)是常见安全反模式

## 应用场景

- **第三方登录**："使用 GitHub/Google 登录" 是 OAuth + OIDC
- **开放 API**：GitHub API、Slack API 通过 OAuth 授权第三方访问
- **企业 SSO**：Keycloak/Okta/Auth0 统一身份
- **微服务网关**：服务间用 client_credentials 互信
- **移动应用**：原生 App 用 PKCE + 系统浏览器(AppAuth 库)

## 相关概念

- [[concepts/security/jwt]]: Access/ID Token 的常见格式
- oidc: 在 OAuth 2.0 上叠加身份认证层
- [[concepts/security/csrf]]: state 参数即 OAuth 中的 CSRF 防护
- [[concepts/security/https-tls]]: OAuth 流程必须运行在 HTTPS 上
- cookie security: refresh_token 在 BFF 模式下存于 HttpOnly Cookie
- [[concepts/methodology/bff]]: SPA + OAuth 的现代推荐架构
