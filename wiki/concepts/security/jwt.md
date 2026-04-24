---
title: "JWT 令牌"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [security, authentication, backend]
status: active
sources: []
---

# JWT 令牌

## 定义

JWT（JSON Web Token,RFC 7519）是一种紧凑、URL 安全的声明（claims）传递格式,常用于身份认证与信息交换。JWT 把一段 JSON 编码为三部分点号分隔的字符串,服务端用密钥签名,客户端在后续请求中通过 `Authorization: Bearer <token>` 携带,服务端只需校验签名即可信任其内容,无需查询数据库。这种"自包含 + 无状态"特性使 JWT 成为微服务和 SPA 鉴权的主流选择。

## 工作原理

JWT 由三段 Base64URL 编码的 JSON 组成,用 `.` 连接：

```
xxxxx.yyyyy.zzzzz
 │     │     └── Signature  签名,防篡改
 │     └──────── Payload    声明（claims）
 └────────────── Header     算法与类型
```

示例：

```json
// Header
{ "alg": "HS256", "typ": "JWT" }

// Payload (Registered Claims + 自定义)
{
  "sub": "user_123",
  "iat": 1704067200,
  "exp": 1704070800,
  "role": "admin"
}

// Signature
HMACSHA256( base64UrlEncode(header) + "." + base64UrlEncode(payload), secret )
```

Node 端示例：

```js
import jwt from 'jsonwebtoken';
const access = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '15m' });
const refresh = jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

// 校验
const payload = jwt.verify(token, SECRET); // 失败抛异常
```

**双令牌模式（Access + Refresh Token）：**

- **Access Token**：短期（5–15 分钟）,放内存或 Authorization 头,泄漏窗口小
- **Refresh Token**：长期(7–30 天）,放 HttpOnly + SameSite Cookie,只用于换新 Access Token,服务端可在数据库中记录撤销列表

签名算法：
- **HS256（对称）**：单密钥,适合单体服务
- **RS256/ES256（非对称）**：私钥签发,公钥验证,适合多服务共享验证（OIDC 通过 JWKS 端点暴露公钥）

## 优势与局限

- ✅ 无状态,服务端不存会话,水平扩展友好
- ✅ 自包含,内含用户信息,减少数据库查询
- ✅ 跨域/跨服务通用,微服务/移动端皆适用
- ✅ 标准化,生态完善（jsonwebtoken、jose 等）
- ❌ **无法即时撤销**：在过期前一直有效,需配合黑名单或短 TTL
- ❌ Payload 仅 Base64 编码非加密,**不要存放敏感信息**
- ❌ 体积比 Session ID 大,增加每次请求开销
- ❌ 算法混淆攻击（`alg: none`、HS256 vs RS256 公钥滥用）历史漏洞频发,务必固定算法
- ❌ 存放于 LocalStorage 易被 [[concepts/security/xss]] 窃取;存于 Cookie 又需防 [[concepts/security/csrf]]

## 应用场景

- **SPA / 移动端 API 鉴权**：Access Token 放 Authorization 头
- **微服务内部传递身份**：网关签发,下游服务用公钥验证
- **OpenID Connect**：ID Token 是标准 JWT
- **一次性令牌**：邮箱验证、密码重置链接（短 TTL + 一次使用）
- **Server-to-Server**：JWT Bearer Grant（如 GitHub App、Google Service Account）

## 相关概念

- [[concepts/security/oauth2]]: JWT 常作为 OAuth 2.0 的 Access/ID Token 格式
- [[concepts/security/csrf]]: Authorization 头方式天然免疫 CSRF
- [[concepts/security/xss]]: LocalStorage 中的 JWT 易被 XSS 窃取
- cookie security: HttpOnly Cookie 存放 Refresh Token 的最佳实践
- [[concepts/security/https-tls]]: JWT 必须通过 HTTPS 传输
- session vs token: 与传统 Session 的取舍
