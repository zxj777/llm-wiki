---
title: "CORS 跨域资源共享"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [security, web, browser]
status: active
sources: []
---

# CORS 跨域资源共享

## 定义

CORS（Cross-Origin Resource Sharing,跨域资源共享）是 W3C 制定的浏览器机制,用于在受同源策略限制的前提下,允许服务端通过 HTTP 响应头显式授权特定来源的跨域请求。同源策略（Same-Origin Policy）规定:协议、域名、端口三者完全相同的脚本之间才能自由读取响应,否则浏览器拦截读取（请求本身可能仍被发送）。CORS 通过一组 `Access-Control-*` 响应头让服务端"打开门",在保留安全边界的同时支持现代 Web 的跨域 API 调用。

CORS 是**浏览器强制执行**的安全机制,而非服务端;非浏览器客户端（curl、移动端）不受 CORS 约束。

## 工作原理

CORS 把请求分为两类：

**1. 简单请求（Simple Request）** —— 无需预检,直接发送
满足:方法为 GET/HEAD/POST,Content-Type 为 `text/plain` / `application/x-www-form-urlencoded` / `multipart/form-data`,且无自定义头。

```http
GET /api/data HTTP/1.1
Origin: https://app.example.com
---
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
```

**2. 预检请求（Preflight）** —— 浏览器先发 OPTIONS 探询
当请求方法为 PUT/DELETE/PATCH,或带自定义头（如 `Authorization`、`X-Custom-*`）,或 `Content-Type: application/json` 时触发。

```http
OPTIONS /api/users/1 HTTP/1.1
Origin: https://app.example.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: authorization, content-type
---
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

预检通过后浏览器才发送实际请求,`Max-Age` 指示预检结果可缓存秒数,减少 OPTIONS 开销。

**3. 凭据请求（Credentials）**

要在跨域请求中携带 Cookie,客户端需 `fetch(url, {credentials: 'include'})`,服务端必须返回:

```
Access-Control-Allow-Origin: https://app.example.com   # 不能用 *
Access-Control-Allow-Credentials: true
```

Express 配置示例：

```js
import cors from 'cors';
app.use(cors({
  origin: ['https://app.example.com'],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Authorization','Content-Type'],
  maxAge: 86400
}));
```

## 优势与局限

- ✅ 在同源策略基础上提供细粒度授权,既安全又灵活
- ✅ 预检机制让服务端有机会拒绝危险方法,减小攻击面
- ✅ 标准化,所有现代浏览器一致实现
- ❌ 预检请求增加一次往返,影响首字节延迟（可用 Max-Age 缓解）
- ❌ 配置错误极易出现 `Allow-Origin: *` + `Allow-Credentials: true` 的安全反模式
- ❌ 无法防御 [[concepts/security/csrf]],因为简单请求不触发预检即可发送
- ❌ 仅对浏览器有效,不能作为后端访问控制手段

## 应用场景

- **前后端分离**：前端 `app.example.com` 调用 API `api.example.com`,需配置 CORS
- **公开 API**：开放 API 设置 `Access-Control-Allow-Origin: *`(不允许凭据)
- **多租户 SaaS**：动态校验 Origin 是否在租户白名单中
- **CDN 字体/图片资源**：跨域加载字体需服务器返回 CORS 头
- **WebGL/Canvas 图像处理**：跨域图像需 `crossorigin` 属性 + CORS 响应

## 相关概念

- same origin policy: CORS 的前提与边界
- [[concepts/security/csrf]]: CORS 不能防 CSRF,二者解决不同问题
- [[concepts/security/xss]]: 同源内的 XSS 完全绕过 CORS
- [[concepts/security/jwt]]: 跨域 API 常用 Authorization 头携带令牌（触发预检）
- [[concepts/security/https-tls]]: 跨域请求通常要求 HTTPS 以避免混合内容
