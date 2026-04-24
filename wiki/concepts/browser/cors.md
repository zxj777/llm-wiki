---
title: "跨域（CORS）"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, cors, security, network, frontend]
status: active
sources: []
---

# 跨域（CORS）

## 定义
**同源策略（Same-Origin Policy）** 是浏览器的核心安全机制：限制不同源（协议 + 域名 + 端口三者之一不同）之间脚本的相互访问。**CORS（Cross-Origin Resource Sharing）**是 W3C 标准，允许服务端通过响应头显式声明哪些跨源请求是被允许的，从而在保证安全的前提下放开必要的跨域访问。理解 CORS 是前后端联调、API 网关与第三方资源接入的必备知识。

## 工作原理
**同源判定**：`https://a.com:443` 与 `http://a.com`（协议不同）、`https://b.a.com`（域名不同）、`https://a.com:8080`（端口不同）均为不同源。

**CORS 请求分类**：
**1. 简单请求（Simple Request）**：同时满足以下条件，直接发实际请求：
- 方法为 `GET`/`HEAD`/`POST`
- Header 仅限 CORS 安全列表（`Accept`、`Accept-Language`、`Content-Language`、`Content-Type` 限于 `text/plain`/`multipart/form-data`/`application/x-www-form-urlencoded`）
- 没有自定义 header（如 `Authorization`、`X-Custom`）
- 没有使用 `ReadableStream` 等新特性

**2. 预检请求（Preflighted Request）**：不满足上述条件时，浏览器先发 `OPTIONS` 请求询问：
```http
OPTIONS /api/user HTTP/1.1
Origin: https://a.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: Authorization, Content-Type

# 服务端响应
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400  # 预检结果缓存 1 天
```

预检通过后浏览器才发实际请求；失败则报 CORS 错误。

**关键响应头**：
- `Access-Control-Allow-Origin`：允许的源，可为具体域名或 `*`
- `Access-Control-Allow-Credentials: true`：允许携带 Cookie
- `Access-Control-Expose-Headers`：JS 可读取的响应头白名单（默认仅安全列表）
- `Access-Control-Max-Age`：预检缓存秒数

**Credentials 模式**：
```js
fetch('https://api.b.com/data', { credentials: 'include' })
```
当 `credentials: 'include'` 时，服务端：
- `Allow-Origin` **不能为 `*`**，必须是具体源
- 必须返回 `Allow-Credentials: true`
- Cookie 还需 `SameSite=None; Secure` 才能跨站发送

**其他跨域方案**：
- **代理**：同源前端服务器代理转发（开发阶段 Vite/webpack proxy；生产用 Nginx）
- **JSONP**：利用 `<script>` 不受同源限制，仅支持 GET，已逐渐淘汰
- **postMessage**：跨窗口/iframe 显式消息通信
- **WebSocket**：协议层不受同源策略限制（但服务端应校验 `Origin`）

## 优势与局限
- ✅ 标准化、声明式，服务端可精细控制开放范围
- ✅ 预检机制保障写操作安全
- ✅ 浏览器自动处理，前端代码无感
- ❌ 预检带来一次额外往返，影响性能（可用 Max-Age 缓解）
- ❌ 配置错误是前后端联调的常见痛点
- ❌ Credentials + 通配符冲突易踩坑

## 应用场景
- **前后端分离**：前端 a.com 调用 api.com 接口
- **CDN 字体/图片**：跨域字体需 `Access-Control-Allow-Origin`
- **第三方 API 集成**：地图、支付、OAuth
- **微前端**：子应用与主应用跨域资源加载

## 相关概念
- [[concepts/browser/security-model]]: 同源策略是浏览器安全模型的基石
- [[concepts/security/csrf]]: 与 CORS 配合的攻击与防御机制
