---
title: "中间件模式"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, middleware, express, koa, backend]
status: active
sources: []
---

# 中间件模式

## 定义

中间件（Middleware）是一种把请求/响应处理拆分为可组合函数的模式：每个中间件负责一项横切关注点（鉴权、日志、限流、解析、错误处理等），通过 `next()` 把控制权传递给下一个中间件。Express、Koa、Fastify、Hono 等 Web 框架都以该模式为核心，区别主要在执行模型（线性 vs 洋葱）与异步语义。

## 工作原理

**Express 线性模型**：中间件按注册顺序执行，调用 `next()` 进入下一个；不调用则请求挂起。

```js
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use('/api', authMiddleware);
app.get('/api/users', (req, res) => res.json([]));

// 错误中间件签名 4 参数：err, req, res, next
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

**Koa 洋葱模型**：中间件是 `async (ctx, next)`，`next()` 返回 Promise，前半段在进入时执行，`next()` 之后是后半段——形成"先进后出"的洋葱嵌套。便于在前后做配对操作（计时、事务）。

```js
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();           // 进入下一层
  ctx.set('X-Time', `${Date.now() - start}ms`); // 出来时执行
});
```

**典型中间件类别**：
- 解析：`body-parser`、`multer`（multipart）
- 安全：`helmet`、`cors`、`csurf`
- 鉴权：JWT 校验、Session 加载
- 限流：`express-rate-limit`、`@fastify/rate-limit`
- 日志：`morgan`、`pino-http`
- 错误处理：统一捕获并格式化响应

**异步错误**：Express 4 中 async 函数抛错不会自动进入错误中间件，需要手动 `next(err)` 或用 `express-async-errors`；Express 5 与 Koa/Fastify 已原生支持。

**顺序很重要**：鉴权要在路由之前；body parser 要在用到 `req.body` 之前；错误中间件要在最后。

## 优势与局限

- ✅ 关注点分离，复用度高
- ✅ 生态丰富，常见需求开箱即用
- ✅ 易测试（中间件即纯函数）
- ❌ 顺序错误是常见 Bug 来源
- ❌ 异步错误处理在不同框架差异大
- ❌ 调用链长时性能与可观测性下降

## 应用场景

- REST/GraphQL API 框架的请求处理
- BFF 层做鉴权、缓存、聚合
- 网关/代理的流量治理
- CLI/RPC 框架（如 Telegraf）也借鉴该模式

## 相关概念

- [[concepts/nodejs/auth-patterns]]: 鉴权常以中间件实现
- [[concepts/nodejs/restful-design]]: REST API 的标准实现方式
