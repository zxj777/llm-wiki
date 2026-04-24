---
title: Web 安全
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [security, xss, csrf, https, backend]
status: active
sources: []
---

# Web 安全

## 概述

Web 安全的核心是「不信任来自客户端的任何输入」「最小权限」「纵深防御」。前端层面要防注入（XSS）、防伪造请求（CSRF）、防点击劫持；后端要防注入（SQL/Command Injection）、防越权、保护凭证；传输层要保证机密性与完整性（HTTPS/TLS）；供应链层要防依赖投毒。

OWASP Top 10 是 Web 安全的入门必读清单。在工程实践中，安全应「左移」（Shift-Left）：通过类型系统、参数化查询、CSP、安全头、自动化扫描、依赖审计等手段，在编码阶段就消除大部分风险，而不是事后补救。

## 核心概念

- [[concepts/security/xss]]: 反射型 / 存储型 / DOM 型，转义与白名单
- [[concepts/security/csrf]]: Token、SameSite Cookie、双重提交
- [[concepts/security/sql-injection]]: 参数化查询、ORM 防御
- csp: 内容安全策略与 nonce/hash
- [[concepts/security/https-tls]]: TLS 握手、证书链、HSTS
- auth security: 密码哈希（bcrypt/argon2）、令牌泄漏防护
- supply chain: 依赖投毒、SBOM、npm 审计

## 关联板块

- 后端：[[topics/fullstack/backend]]、[[topics/fullstack/nodejs]]
- 浏览器安全模型：[[concepts/browser/security-model]]、[[concepts/browser/cors]]
- 工程化：[[topics/fullstack/engineering]]（CI 中集成安全扫描）

## 推荐学习路径

**初级**
1. OWASP Top 10 概览
2. [[concepts/security/xss]]、[[concepts/security/csrf]]、[[concepts/security/sql-injection]] 的基本攻击与防御
3. HTTPS 基本概念，浏览器安全提示的含义

**进阶**
1. csp：完整策略设计与上线流程
2. [[concepts/security/https-tls]]：握手过程、证书链、HSTS、OCSP
3. auth security：密码哈希算法选型、Token 轮换
4. 安全头清单：X-Content-Type-Options、Referrer-Policy、Permissions-Policy

**深入**
1. supply chain：SBOM 生成、依赖审计、签名校验
2. 实战渗透测试：Burp Suite、自动化扫描
3. 设计安全的 OAuth2 / OIDC 流程
4. WAF、防爬、风控的工程化集成

## 开放问题

- LLM 时代的「Prompt 注入」是否会成为新的 XSS 级别风险？
- npm 生态供应链攻击频发，社区是否需要强制签名与可复现构建？
