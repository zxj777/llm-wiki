---
title: "BFF 模式"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, bff, backend, api, architecture, fullstack]
status: active
sources: []
---

# BFF 模式

## 定义

BFF（Backend for Frontend）是为前端定制的中间层服务，由 SoundCloud 在微服务实践中提出。在前端与后端微服务之间引入一层薄薄的服务，专门负责面向前端的 API 聚合、数据裁剪、协议转换、鉴权透传。每种前端形态（Web、iOS、Android）可以有自己的 BFF，避免后端通用 API 既要照顾 Web 又要兼顾移动端而变得臃肿。它是"通用 API 难以同时满足多端差异化需求"问题的工程化答案。

## 工作原理

**解决的问题**：

- 前端常需调用多个微服务并合并数据，N 次串行/并行请求拖慢首屏
- 不同端对同一份数据的字段需求不同（Web 要全量、移动端要精简）
- 微服务返回的数据结构与前端组件结构错位，前端需大量胶水代码转换
- 鉴权 token 转换、跨服务调用串接、错误统一处理散落到前端

**典型架构**：

```
浏览器 / App  →  BFF（Node.js/Go）  →  用户服务
                                  →  订单服务
                                  →  推荐服务
```

BFF 的核心职责：

1. **聚合（Aggregation）**：在一次 BFF 请求里并行调用多个后端服务，合并返回
2. **裁剪（Transformation）**：只返回前端真正需要的字段，减少响应体积
3. **协议转换**：把后端 gRPC / 内部协议封装为前端友好的 REST / GraphQL
4. **鉴权代理**：前端持 Cookie/Token，BFF 转换为内部服务所需凭据
5. **缓存**：在 BFF 层做请求合并、短期缓存
6. **错误归一**：把各服务异构错误结构统一为前端易处理的格式

```js
// 一个简化的 BFF 接口
app.get('/api/home', async (req, res) => {
  const [user, orders, recs] = await Promise.all([
    userService.get(req.userId),
    orderService.recent(req.userId),
    recService.feed(req.userId),
  ]);
  res.json({
    name: user.displayName,
    recentOrders: orders.map((o) => ({ id: o.id, total: o.amount })),
    recommendations: recs.slice(0, 5),
  });
});
```

**Next.js / Nuxt 视角**：Next.js 的 API Routes、Server Actions、Server Components 本质上是把 BFF "内嵌"到前端框架里。Server Component 在服务端直接 `await db.query(...)` 或调用内部服务，结果以渲染产物（而非 JSON）发给浏览器，是 BFF 的进一步演化——直接产出 UI 而非数据。

**与 GraphQL 的关系**：GraphQL 让前端以查询语言精确指定所需字段，是另一种 BFF 思路（"前端驱动的聚合"）。两种方案不互斥：很多团队用 GraphQL Gateway 作为 BFF 层，对内汇聚多个微服务，对外提供统一 schema。

**适用场景**：多端共存、后端微服务化、前端调用复杂；**不适用**：单一前端 + 单体后端（直接合并到后端即可）、团队规模小（多一层就多一层维护成本）。

## 优势与局限

- ✅ 减少前端请求数，提升首屏性能
- ✅ 让后端专注业务领域、前端专注 UI
- ✅ 不同端可独立演进 API 形态
- ❌ 多了一个需要部署、监控、运维的服务
- ❌ BFF 与前端要同步迭代，容易成为"前端的后端的瓶颈"
- ❌ 团队边界不清时易演变为又一个膨胀的中间层

## 应用场景

- 多端产品（Web、iOS、Android）共享后端微服务
- 中后台聚合多个内部系统数据
- 老旧后端 API 不便修改，引入 BFF 适配前端
- Next.js / Nuxt 全栈应用的 API Routes / Server Actions

## 相关概念

- [[concepts/nodejs/restful-design]]: BFF 通常以 REST 接口对外暴露
- [[concepts/nodejs/graphql]]: GraphQL 是另一种 BFF 实现路径
