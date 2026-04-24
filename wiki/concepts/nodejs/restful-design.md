---
title: "RESTful API 设计"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, rest, api, http, backend]
status: active
sources: []
---

# RESTful API 设计

## 定义

REST（Representational State Transfer）是 Roy Fielding 在 2000 年提出的 Web 架构风格，强调无状态通信、统一接口、资源导向、可缓存性、分层系统等约束。RESTful API 借助 HTTP 自带语义（URL 表示资源、方法表示动作、状态码表示结果）实现"自描述"接口，是 Web/移动后端最广泛采用的 API 风格。

## 工作原理

**资源命名**：URL 用名词复数描述资源集合，避免动词。

```
GET    /users              # 列表
POST   /users              # 创建
GET    /users/42           # 详情
PATCH  /users/42           # 部分更新
DELETE /users/42           # 删除
GET    /users/42/orders    # 嵌套资源（不超过 2 层）
```

**HTTP 方法语义**：
- GET：安全、幂等，仅读取
- POST：创建或非幂等动作
- PUT：整体替换，幂等
- PATCH：部分更新
- DELETE：删除，幂等

**状态码**：
- 2xx：200 OK / 201 Created / 204 No Content
- 4xx：400 Bad Request / 401 Unauthorized / 403 Forbidden / 404 Not Found / 409 Conflict / 422 Unprocessable Entity（语义错误）/ 429 Too Many Requests
- 5xx：500 Internal / 502 Bad Gateway / 503 Service Unavailable

**响应体**：统一 JSON；错误使用 RFC 7807 `application/problem+json`：

```json
{ "type": "/errors/validation", "title": "Invalid email", "status": 422, "detail": "..." }
```

**版本管理**：
- URL 路径：`/v1/users`（直观，对缓存/路由友好，最常见）
- Header：`Accept: application/vnd.api.v1+json`（更"REST 纯粹"，但调试不便）

**分页**：
- Offset/Limit：`?page=2&size=20`，简单但深翻页慢且不稳定
- Cursor：`?cursor=abc&limit=20`，基于排序键，性能稳定，适合大数据流

**HATEOAS**：响应中带相关动作链接（`_links`），让客户端动态发现 API。实践中很少完全落地。

```js
// Express 示例
app.get('/users/:id', async (req, res) => {
  const u = await db.user.find(req.params.id);
  if (!u) return res.status(404).json({ error: 'not found' });
  res.json(u);
});
```

幂等性、缓存（`ETag`/`If-None-Match` 304）、内容协商（`Accept`）是高质量 REST 的进阶要点。

## 优势与局限

- ✅ 与 HTTP 生态完美契合（CDN/网关/缓存）
- ✅ 工具与文档（OpenAPI/Swagger）极其成熟
- ✅ 学习成本低，团队协作易达成共识
- ❌ 嵌套资源/批量操作表达力弱
- ❌ Over/Under-fetching 问题
- ❌ 实时推送需借助 WebSocket/SSE

## 应用场景

- 通用后端服务、SaaS API
- 移动端 BFF、第三方开放平台
- 微服务之间的同步调用
- 与 OpenAPI 配合自动生成 SDK

## 相关概念

- [[concepts/nodejs/graphql]]: 解决 over-fetching 的替代方案
- [[concepts/nodejs/auth-patterns]]: REST API 的鉴权实现
