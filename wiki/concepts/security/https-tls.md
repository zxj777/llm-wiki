---
title: "HTTPS 与 TLS"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [security, network, protocol]
status: active
sources: []
---

# HTTPS 与 TLS

## 定义

HTTPS(HTTP over TLS)是在 HTTP 之下叠加 TLS(Transport Layer Security,传输层安全协议,前身 SSL)所形成的加密 Web 通信协议。TLS 在客户端与服务端之间建立加密通道,提供三大安全保证：**机密性**(对称加密防窃听)、**完整性**(MAC/AEAD 防篡改)、**身份认证**(X.509 证书防冒充)。当前主流版本为 TLS 1.2 与 TLS 1.3,后者删除了 RSA 密钥交换等不安全特性,握手仅需 1-RTT(0-RTT 恢复),性能与安全双双提升。

## 工作原理

**TLS 1.3 握手(简化)：**

```
Client                                    Server
  │   ClientHello                          │
  │   (支持的密码套件、Key Share、SNI)      │
  │ ────────────────────────────────────►  │
  │                                        │
  │   ServerHello + Certificate            │
  │   + EncryptedExtensions                │
  │   + Finished (用派生密钥加密)           │
  │ ◄────────────────────────────────────  │
  │                                        │
  │   Finished                             │
  │ ────────────────────────────────────►  │
  │                                        │
  │      Application Data (对称加密)        │
  │ ◄══════════════════════════════════►   │
```

关键步骤：
1. **ClientHello**：列出支持的密码套件、TLS 版本,通过 SNI 指明目标域名,附带 ECDHE 公钥
2. **ServerHello**：服务端选定套件,返回自己的 ECDHE 公钥与 X.509 证书
3. **证书校验**：客户端用本地 CA 信任根验证证书链,检查域名、有效期、吊销状态(OCSP/CRL)
4. **密钥派生**：双方通过 ECDHE 算出同一会话密钥,实现前向保密(Forward Secrecy)
5. **加密通信**：用 AES-GCM/ChaCha20-Poly1305 等 AEAD 算法加密应用数据

**X.509 证书链：**

```
根 CA(Root)── 自签名,内置于操作系统/浏览器
   └── 中间 CA(Intermediate)
         └── 站点证书(Leaf,如 *.example.com)
```

**HSTS(HTTP Strict Transport Security,RFC 6797)：**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

强制浏览器在 max-age 期间只用 HTTPS 访问该域,杜绝 SSL Stripping 中间人攻击。`preload` 可申请加入浏览器内置预加载列表,首次访问就强制 HTTPS。

**Nginx 配置示例：**

```nginx
server {
  listen 443 ssl http2;
  ssl_certificate     /etc/letsencrypt/live/x.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/x.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers off;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

## 优势与局限

- ✅ 防窃听、防篡改、防冒充,Web 安全基石
- ✅ TLS 1.3 + 0-RTT + HTTP/2/3 性能损耗已极小
- ✅ Let's Encrypt 提供免费自动化证书,普及成本归零
- ✅ 浏览器对非 HTTPS 站点标"不安全",HTTPS 已是事实标准
- ❌ CA 体系存在信任集中风险(误签、被入侵历史事件)
- ❌ 证书过期未续会导致全站不可访问,需自动化监控
- ❌ 中间盒(MITM 代理、企业审计)可能破坏端到端加密
- ❌ 错误配置(弱套件、TLS 1.0/1.1、自签证书)仍会被降级利用

## 应用场景

- **所有 Web 站点**：HTTPS 是当前 Web 默认要求,搜索引擎与浏览器双双推动
- **API 通信**：REST/GraphQL/gRPC 必须 TLS,JWT 等 Bearer 凭据无 TLS 等同明文
- **服务间 mTLS**：服务网格(Istio/Linkerd)用双向 TLS 实现零信任
- **邮件/数据库**：SMTPS、IMAPS、PostgreSQL SSL 等同样基于 TLS
- **CDN 与边缘**：Cloudflare/Fastly 终止 TLS,源站可用 mTLS 回源

## 相关概念

- [[concepts/security/cors]]: 跨域请求几乎全部要求 HTTPS
- [[concepts/security/jwt]]: Bearer Token 必须通过 TLS 传输
- [[concepts/security/oauth2]]: OAuth 流程强制 HTTPS
- [[concepts/security/csrf]]: SameSite=Secure 要求 HTTPS
- mtls: 双向 TLS,服务间零信任认证
- content security policy: `upgrade-insecure-requests` 配合 HTTPS
