---
title: "GraphQL"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, graphql, api, schema, backend]
status: active
sources: []
---

# GraphQL

## 定义

GraphQL 是 Facebook 2015 年开源的 API 查询语言与运行时，让客户端通过强类型 Schema 精确声明所需字段，服务端按需解析并返回。它解决了 REST 中常见的过度获取（over-fetching）与不足获取（under-fetching）问题，单端点即可承载多种聚合查询，特别适合移动端/多端场景与字段维度差异大的产品。

## 工作原理

**Schema** 是 GraphQL 的契约，包含三类根操作与若干自定义类型：

```graphql
type User { id: ID!, name: String!, posts: [Post!]! }
type Post { id: ID!, title: String!, author: User! }
type Query { user(id: ID!): User, posts(first: Int = 10): [Post!]! }
type Mutation { createPost(title: String!): Post! }
type Subscription { postAdded: Post! }
```

**Resolver** 为每个字段提供取值逻辑：

```js
const resolvers = {
  Query: {
    user: (_, { id }, ctx) => ctx.db.user.find(id),
  },
  User: {
    posts: (user, _, ctx) => ctx.db.post.byAuthor(user.id),
  },
};
```

**执行流程**：解析查询 → 校验（语法+类型） → 自顶向下并行调用 Resolver → 组装响应。

**N+1 问题**：上例中查询 100 个 User 再各自取 posts 会触发 1+100 次数据库调用。**DataLoader** 通过同一事件循环 tick 内批量化与缓存解决：

```js
const postLoader = new DataLoader(async (userIds) => {
  const rows = await db.post.byAuthorIds(userIds); // 单条 SQL
  return userIds.map(id => rows.filter(r => r.authorId === id));
});
// resolver 内：postLoader.load(user.id)
```

**Subscription** 通过 WebSocket（`graphql-ws`）实现服务端推送。

**变体**：
- *Schema-first*：Apollo Server，先写 SDL
- *Code-first*：Nexus / TypeGraphQL / Pothos，TS 推导 schema
- *Federation*：跨服务组合 supergraph
- *Persisted Queries*：把查询哈希化预注册，提升性能与安全

```js
// Apollo Server
import { ApolloServer } from '@apollo/server';
const server = new ApolloServer({ typeDefs, resolvers });
```

**典型坑**：缓存难（不像 REST 能靠 URL）、查询深度/复杂度攻击需限制（`graphql-depth-limit`、cost analysis）、错误统一在响应 `errors` 字段、文件上传需要扩展协议。

## 优势与局限

- ✅ 客户端按需取数，减少冗余传输
- ✅ 强类型 Schema，自带文档与 IDE 支持
- ✅ 一端点统一聚合多源数据
- ❌ HTTP 缓存复杂，需 CDN/客户端配合
- ❌ N+1 与权限控制易出错
- ❌ 学习与运维成本高于 REST

## 应用场景

- 多端共用的 BFF
- 社交/内容平台字段差异大的查询
- 中后台报表灵活组合
- Apollo Federation 微前端聚合

## 相关概念

- [[concepts/nodejs/restful-design]]: 主要替代/对比方案
- [[concepts/engineering/bff-pattern]]: GraphQL 常作为 BFF 实现
