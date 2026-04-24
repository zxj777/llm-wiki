---
title: 后端开发
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [backend, nodejs, database, security, api]
status: active
sources: []
---

# 后端开发

## 概述

后端开发关注「数据如何被持久化、业务规则如何被执行、接口如何被安全可靠地暴露」。相比前端，后端更强调一致性、可用性、可扩展性与安全性，需要在并发、事务、缓存、分布式等问题上做权衡。

本板块以 Node.js 为主线（与前端语言对齐，便于全栈工程师快速上手），覆盖事件循环、流式处理、中间件、API 设计（REST/GraphQL）、数据库（SQL/NoSQL）、认证授权、连接池、消息队列等核心议题。安全单独成块，包含 XSS、CSRF、SQL 注入、CSP、HTTPS/TLS、供应链等 Web 攻防全景。

后端的能力建设并不限于某一种语言，模式（中间件、ORM、消息队列）和架构思想（BFF、微服务、CQRS）才是真正可迁移的资产。

## 子领域

### Node.js 与服务端 [[topics/fullstack/nodejs]]
- [[concepts/nodejs/event-loop]]: libuv 与阶段化事件循环
- [[concepts/nodejs/streams]]: 可读/可写/Transform 流
- [[concepts/nodejs/middleware-pattern]]: Koa/Express 洋葱模型
- [[concepts/nodejs/restful-design]]: REST 规范与版本化
- [[concepts/nodejs/graphql]]: Schema-first 与 N+1 问题
- [[concepts/nodejs/sql-vs-nosql]]: 一致性/扩展性权衡
- [[concepts/nodejs/orm-query-builder]]: Prisma / TypeORM / Knex
- [[concepts/nodejs/auth-patterns]]: Session / JWT / OAuth2
- [[concepts/nodejs/connection-pool]]: 连接复用与泄漏排查
- [[concepts/nodejs/message-queue]]: Kafka / RabbitMQ / Redis Stream

### Web 安全 [[topics/fullstack/security]]
- [[concepts/security/xss]]: 反射型/存储型/DOM 型
- [[concepts/security/csrf]]: 同站防御与 SameSite Cookie
- [[concepts/security/sql-injection]]: 参数化查询
- csp: 内容安全策略
- [[concepts/security/https-tls]]: TLS 握手与证书
- auth security: 密码哈希、令牌泄漏防护
- supply chain: 依赖投毒与 SBOM

## 关联板块

- 工程化：[[topics/fullstack/engineering]]（CI/CD、BFF 模式、Monorepo）
- AI 工程：[[topics/fullstack/ai-engineering]]（LLM API、RAG 后端架构）
- 方法论：[[topics/fullstack/methodology]]（测试策略、技术债务）

## 推荐学习路径

**初级（0-1 年）**
1. 理解 HTTP 报文结构、请求-响应模型、状态码语义
2. 用 Express/Koa/Fastify 写一个 CRUD 服务
3. 掌握一个关系型数据库（PostgreSQL/MySQL）的基本 SQL

**进阶（1-3 年）**
1. 深入 [[concepts/nodejs/event-loop]] 与 [[concepts/nodejs/streams]]
2. 系统学习 [[concepts/nodejs/restful-design]] 与 [[concepts/nodejs/graphql]] 的取舍
3. 掌握 [[concepts/nodejs/auth-patterns]]、[[concepts/security/xss]]、[[concepts/security/csrf]]
4. 理解索引、事务、隔离级别、连接池

**深入（3+ 年）**
1. 引入 [[concepts/nodejs/message-queue]] 解耦核心链路
2. 设计可观测性体系：日志、指标、Trace
3. 安全攻防：csp、[[concepts/security/https-tls]]、supply chain
4. 部署：容器化、K8s、灰度发布、蓝绿部署

## 开放问题

- 在边缘计算（Edge Runtime）兴起后，传统 Node.js 长驻进程的优势还剩多少？
- LLM 驱动的「AI Backend」（自然语言到 API）会改变后端的开发范式吗？
