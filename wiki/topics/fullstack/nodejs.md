---
title: Node.js 与服务端
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, backend, api, database]
status: active
sources: []
---

# Node.js 与服务端

## 概述

Node.js 把 JavaScript 带到了服务端，凭借 V8 + libuv 的事件驱动非阻塞 I/O 模型，特别擅长高并发的 I/O 密集型场景（API 网关、BFF、实时通信）。理解 Node.js 的事件循环阶段（timers → pending → poll → check → close）以及 `setImmediate` / `process.nextTick` / 微任务的执行顺序，是写出正确异步代码的前提。

服务端开发还涉及流（Stream）抽象、中间件模式、API 设计（REST/GraphQL）、数据库选型（SQL/NoSQL）、ORM 与查询构建、认证授权、连接池与消息队列等议题。这些模式大多与具体语言无关，掌握后可以平滑迁移到 Go、Python、Java 等其他后端语言。

## 核心概念

- [[concepts/nodejs/event-loop]]: libuv 阶段化事件循环与 Node 特性
- [[concepts/nodejs/streams]]: Readable/Writable/Duplex/Transform 与背压
- [[concepts/nodejs/middleware-pattern]]: Koa 洋葱模型、Express 链式
- [[concepts/nodejs/restful-design]]: 资源建模、状态码、版本化、HATEOAS
- [[concepts/nodejs/graphql]]: Schema、Resolver、N+1 与 DataLoader
- [[concepts/nodejs/sql-vs-nosql]]: 一致性、扩展性、Schema 演进权衡
- [[concepts/nodejs/orm-query-builder]]: Prisma / TypeORM / Drizzle / Knex
- [[concepts/nodejs/auth-patterns]]: Session / JWT / OAuth2 / OIDC
- [[concepts/nodejs/connection-pool]]: 数据库连接复用与泄漏排查
- [[concepts/nodejs/message-queue]]: Kafka / RabbitMQ / Redis Stream 选型

## 关联板块

- 前端语言：[[topics/fullstack/javascript]]（共享 JS/TS 基础）
- 安全：[[topics/fullstack/security]]（XSS、CSRF、SQL 注入）
- 工程化：[[topics/fullstack/engineering]]（CI/CD、Monorepo、BFF）

## 推荐学习路径

**初级**
1. Node.js 基础：模块、文件 I/O、HTTP server
2. Express/Koa/Fastify 写一个 RESTful CRUD
3. 一种数据库（PostgreSQL/MySQL）的 SQL 基础

**进阶**
1. [[concepts/nodejs/event-loop]] + [[concepts/nodejs/streams]] 串讲
2. [[concepts/nodejs/restful-design]] vs [[concepts/nodejs/graphql]] 取舍
3. [[concepts/nodejs/auth-patterns]]：Session vs JWT，刷新令牌设计
4. [[concepts/nodejs/orm-query-builder]]：Prisma/Drizzle 与原生 SQL 的权衡

**深入**
1. [[concepts/nodejs/connection-pool]]：连接池调优与压测
2. [[concepts/nodejs/message-queue]]：异步解耦与可靠投递
3. 可观测性：日志、Metrics、OpenTelemetry Trace
4. 性能：cluster、worker_threads、Node.js 性能剖析

## 开放问题

- Bun / Deno 是否能在生产环境替代 Node.js？各自的优劣边界？
- 在边缘运行时（Cloudflare Workers / Vercel Edge）上，传统 Node 模式有多少需要重新思考？
