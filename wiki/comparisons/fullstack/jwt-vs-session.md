---
title: "JWT vs Session"
type: comparison
created: 2026-04-02
updated: 2026-04-02
tags: [auth, jwt, session, security, backend]
status: active
sources: []
---

# JWT vs Session

JWT（JSON Web Token）与传统 Session 是 Web 鉴权的两种核心范式。它们的差异本质是「无状态 vs 有状态」，并由此延伸出撤销、扩展性、安全性、复杂度等一系列权衡。理解这些权衡比盲目选择「现代方案」更重要。

## 对比维度

| 维度 | Session（服务端会话） | JWT（无状态令牌） |
|------|-----------------------|--------------------|
| 状态存储 | 服务端（内存 / Redis / DB） | 客户端（令牌内含信息） |
| 凭证形态 | 不透明 session id（cookie） | 自描述 JSON + 签名 |
| 服务端开销 | 每请求查 session store | 仅验签 |
| 撤销 | 立即（删 session 即可） | 困难（需黑名单或短 TTL + refresh） |
| 跨域 / 跨服务 | 较繁琐（需共享 store） | 天然适合分布式 / 跨域 / SSO |
| 体积 | 小（几十字节） | 大（数百到数 KB） |
| 安全性 | 成熟（httpOnly + secure cookie + CSRF token） | 易误用（存 localStorage 易被 XSS 窃取） |
| 用户信息携带 | 需查库 | claims 内携带（避免一次查库） |
| 多端 / 移动端 | cookie 在原生端不便 | 原生友好 |
| 水平扩展 | 需共享 session store | 无需共享，纯计算验证 |
| 替换密钥 / 轮换 | 简单（无需触客户端） | 复杂（旧令牌仍合法直至过期） |
| 实施复杂度 | 低 | 中（refresh token、key rotation、撤销策略） |

## 分析

### Session：经典且仍然合适

Session 流程：用户登录后服务端生成不透明 session id，写入服务器 store（Redis 常见），通过 `Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax` 下发。后续请求浏览器自动带 cookie，服务端按 id 查 store 拿用户信息。

优点：
- 撤销简单：删 store 中的 entry 立即生效（强制下线、改密退出全设备）。
- Cookie 配合 `HttpOnly` 不可被 JS 读取，结合 `SameSite` 与 CSRF token，安全模型成熟。
- 信息只存服务端，泄露面小。

缺点：
- 横向扩展需共享 session store（Redis 集群、sticky session）。
- 跨域 SSO、多个独立服务共享身份较繁琐。

### JWT：无状态与可携带信息

JWT 由三段组成：`header.payload.signature`，签名通常用 HMAC（HS256）或非对称（RS256/EdDSA）。服务端只需用密钥/公钥验签即可信任 payload 中的 claims（如 `sub`、`exp`、`role`）。

优点：
- **无状态**：任何节点可独立验证，无需共享存储；适合微服务、Serverless、边缘计算。
- **跨域 / SSO 友好**：可在多个服务之间安全传递。
- **携带信息**：避免每次都查用户表（但需注意时效性）。

陷阱：
- **撤销难**：令牌签发后到过期前都有效。常见方案：短 TTL access token + 长 TTL refresh token + refresh 时检查黑名单/撤销表（这反过来又是一种「状态」）。
- **存储位置**：存 `localStorage` 易被 XSS 偷取；存 `HttpOnly` cookie 更安全，但又需要应对 CSRF——这时它的「无状态优势」相对 session 已弱化。
- **算法陷阱**：早期实现允许 `alg: none`，造成严重漏洞；务必在校验时锁定算法。
- **体积**：放入过多 claims 会显著增加每次请求开销。

### 实务中的混合模式

高质量系统通常组合使用：

1. **短 TTL access token（JWT）+ 长 TTL refresh token（服务端可撤销）**：兼顾分布式验证与可控撤销。
2. **服务端 session + JWT 网关令牌**：边缘网关用 JWT 透传到内部，内部仍维护 session。
3. **OAuth 2.1 / OIDC**：第三方登录场景下，access token 多为 JWT，refresh token 为不透明字符串。

### 安全原则共识

- 两者都必须 HTTPS 传输。
- 优先 `HttpOnly + Secure + SameSite` cookie 而非 localStorage。
- JWT 严禁 `alg: none`；优先 RS256/EdDSA；轮换密钥。
- session id 必须高熵随机；store 中保存最少必要信息。
- 任何方案都需要服务端的强密码哈希（bcrypt/argon2）作为基础。

## 结论

- **传统单体 / 同域 Web 应用 / 简单业务**：Session（最简、最安全、最易撤销）。
- **微服务 / 多端 / 移动 / 跨域 SSO / Serverless**：JWT（最好搭配 refresh token）。
- **极致安全敏感场景**：JWT 也搭配服务端撤销表 → 实际就是「无状态 + 状态」的混合。
- **常被高估的优势**：JWT 的「无状态」在引入 refresh token + 撤销表后大多回归有状态。
- **默认建议**：如果没有跨服务 / 跨域 / 移动端的明确需求，Session 仍是更稳的选择。

## 相关
- authentication
- oauth
