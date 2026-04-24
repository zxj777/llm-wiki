---
title: "REST vs GraphQL"
type: comparison
created: 2026-04-02
updated: 2026-04-02
tags: [api, rest, graphql, backend]
status: active
sources: []
---

# REST vs GraphQL

REST 与 GraphQL 是当今最主流的两种 Web API 设计范式。REST 由 Roy Fielding 在 2000 年提出，以「资源 + HTTP 动词」为核心；GraphQL 由 Facebook 在 2012 年内部研发、2015 年开源，以「类型化查询语言 + 单一端点」为核心。

## 对比维度

| 维度 | REST | GraphQL |
|------|------|---------|
| 端点结构 | 多端点（每资源一组 URL） | 单端点（通常 `/graphql`） |
| 数据获取粒度 | 服务端决定返回字段 | 客户端按需声明字段 |
| 过度获取 / 不足获取 | 常见 | 几乎消除 |
| 多资源聚合 | 多次请求或专门 BFF 接口 | 一次查询完成 |
| 类型系统 | 无（依赖 OpenAPI 等外挂） | 内建 schema（强类型） |
| 版本化 | URL 版本（/v1, /v2）或 header | 通过字段弃用（@deprecated）演进 |
| HTTP 缓存 | 天然契合（GET + ETag + CDN） | 需自建（持久化查询、客户端缓存如 Apollo） |
| 错误处理 | HTTP 状态码语义清晰 | 总是 200，错误在 `errors` 字段 |
| 文件上传 | 原生 multipart | 需扩展（graphql-multipart） |
| 学习曲线 | 低（HTTP 即可） | 中（需理解 schema、resolver、N+1） |
| 工具链 | curl / Postman / OpenAPI | GraphiQL / Apollo / Relay / codegen |
| 适用场景 | 公共 API、CRUD、缓存敏感 | 复杂前端、多端聚合、BFF |

## 分析

### 数据获取模型

REST 以资源为中心：`GET /users/1` 返回完整用户对象。客户端常面临两个问题：
- **过度获取（over-fetching）**：只需 `name`，却拿到整个对象。
- **不足获取（under-fetching）**：渲染一个页面需要请求 `/users/1`、`/users/1/posts`、`/posts/x/comments` 等多个端点，产生「瀑布请求」。

GraphQL 用查询语言让客户端精确声明需要的字段与关联：

```graphql
query { user(id:1) { name posts { title comments { text } } } }
```

服务端按 resolver 解析，一次返回。

### 版本化

REST 通常通过 `/v1`、`/v2` 隔离 breaking change，长期维护多套实现。GraphQL 提倡持续演进：新增字段无影响、旧字段标 `@deprecated`，再监控字段使用率后下线，避免显式版本。

### 缓存

REST 与 HTTP 缓存契合：GET 请求 URL 即缓存键，配合 ETag、CDN 可获得极佳性能。GraphQL 通常使用 POST 单端点，破坏了 HTTP 缓存语义；需借助 **持久化查询（persisted queries）** 将查询哈希为 GET 请求，或在客户端用 Apollo / Relay 维护标准化缓存（基于 `__typename + id`）。

### N+1 与性能

GraphQL 的灵活性带来 resolver 的 N+1 风险：嵌套字段会触发多次数据库查询。需用 **DataLoader** 批量化与缓存；这是 GraphQL 工程实践的关键能力。

### 错误与可观测性

REST 用 HTTP 状态码（4xx/5xx）传达错误，监控、网关、日志都易处理。GraphQL 总是返回 200，错误集中在 `errors` 数组，需要自定义观测策略。

## 结论

- **公共开放 API、强缓存需求、CRUD 资源模型**：选 REST。
- **复杂前端 / 移动端 / 多端聚合 / 频繁产品迭代**：选 GraphQL。
- **微服务聚合层（BFF）**：GraphQL 优势明显。
- **团队规模小 / 工具链熟悉 HTTP**：REST 上手成本低。
- **混合策略**：对内 GraphQL，对外 REST，是常见折中方案。

## 相关
- rest api
- [[concepts/nodejs/graphql]]
