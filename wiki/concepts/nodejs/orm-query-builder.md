---
title: "ORM vs Query Builder"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, orm, prisma, knex, database, backend]
status: active
sources: []
---

# ORM vs Query Builder

## 定义

ORM（Object-Relational Mapping）将数据库的行映射为编程语言中的对象，用对象 API 操作数据；Query Builder 则提供一套链式 API 生成 SQL，依然以 SQL 语义为中心；原生 SQL 直接书写。三者分别代表"重抽象/中等抽象/无抽象"的三档选择，权衡开发效率、类型安全、性能与可控性。

## 工作原理

**ORM 代表**：
- **Prisma**：基于 schema.prisma 描述模型，CLI 生成强类型 client，查询用对象式 API；类型推导极佳，迁移与种子工具完善。
- **TypeORM / Sequelize / MikroORM**：装饰器或类定义实体，支持 Active Record 与 Data Mapper 模式；功能全但类型推导和复杂查询常退化为字符串。

```ts
// Prisma
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: { where: { published: true } } },
});
```

**Query Builder 代表**：
- **Knex.js**：经典链式 API，跨方言（PG/MySQL/SQLite/MSSQL），常作为底层被 ORM 复用。
- **Drizzle**：TypeScript 优先，schema 即 TS 代码，类型推导接近 Prisma 但贴近 SQL 表达。
- **Kysely**：纯类型 SQL 构造器，零运行时元数据，类型安全极高。

```ts
// Drizzle
const rows = await db.select({ id: users.id, name: users.name })
  .from(users)
  .leftJoin(posts, eq(posts.authorId, users.id))
  .where(eq(users.active, true));
```

**原生 SQL**：复杂报表、窗口函数、CTE、性能敏感查询往往直接写 SQL（用参数化避免 SQL 注入）；ORM/Builder 也都提供 `raw` 转义入口。

**对比维度**：

| 维度 | ORM | Query Builder | 原生 SQL |
|------|-----|---------------|----------|
| 开发效率 | 高 | 中 | 低 |
| 类型安全 | 高（Prisma/Drizzle） | 中-高 | 低 |
| 学习曲线 | 中 | 低 | SQL 本身 |
| 复杂查询表达 | 弱 | 强 | 最强 |
| 性能可控 | 弱 | 强 | 最强 |
| 防 N+1 | 需显式 include/dataloader | 手写 JOIN | 完全可控 |

**选型建议**：
- 中后台 CRUD 居多 → **Prisma** 收益最大
- 需要复杂 SQL 与精细控制 → **Drizzle/Kysely**
- 团队熟悉 SQL、追求最低魔法 → **Knex + 原生 SQL**
- 同一项目混用：90% 用 ORM/Builder，10% 复杂查询写 raw SQL，是常见生产实践

迁移工具（Prisma Migrate、Knex migrations、Drizzle Kit）是不可忽视的部分，影响长期演进体验。

## 优势与局限

- ✅ ORM：开发快、类型强、抽象统一
- ✅ Builder：贴近 SQL 又有组合性
- ❌ ORM：复杂查询性能"魔法"难调
- ❌ ORM：跨表/聚合时易踩 N+1
- ❌ Builder：业务对象映射需自己处理

## 应用场景

- SaaS 中后台：Prisma + 少量 raw SQL
- 高性能数据 API：Drizzle/Kysely
- 已有大量 SQL 资产迁移：Knex
- 数据分析 Job：直接 SQL/视图

## 相关概念

- [[concepts/nodejs/sql-vs-nosql]]: 选型先于选 ORM
- [[concepts/security/sql-injection]]: 参数化是底线
