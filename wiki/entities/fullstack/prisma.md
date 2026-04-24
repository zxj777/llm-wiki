---
title: "Prisma"
type: entity
created: 2026-04-02
updated: 2026-04-02
tags: [orm, database, prisma, typescript, backend]
status: active
sources: []
---

# Prisma

Prisma 是由 **Prisma Labs**（前身 Graphcool）于 2019 年发布的、面向 [[entities/fullstack/nodejs]] 与 [[entities/fullstack/typescript]] 生态的下一代 ORM / 数据库工具集。它以「**schema-first** + **代码生成的类型安全客户端**」为核心，区别于传统 Active Record（Sequelize、TypeORM）与 Data Mapper（MikroORM）模式，提供了在 TS 生态中迄今最完整的类型安全数据库访问体验。

## 概述

Prisma 的工作流以一份 `schema.prisma` 文件为中心，描述数据源、生成器、模型与关系：

```prisma
datasource db { provider = "postgresql" url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}
```

执行 `prisma generate` 后，Prisma 会基于此 schema **代码生成**一个完全类型化的 Prisma Client：所有表、字段、关系、查询参数、返回类型都由 TS 推导精确表达，IDE 跳转、补全、重命名、错误提示几乎无懈可击。

Prisma 由四个工具组成：
- **Prisma Schema**：单一事实来源（DSL）。
- **Prisma Migrate**：基于 schema diff 自动生成 SQL 迁移文件，支持开发与生产环境分离。
- **Prisma Client**：类型安全的查询构造器。
- **Prisma Studio**：可视化数据浏览与编辑界面。

## 关键特性或贡献

- **类型安全到极致**：`prisma.user.findUnique({ where: { email }, include: { posts: true } })` 的返回类型会自动推导为 `User & { posts: Post[] }`；忘记 `include` 时访问 `posts` 即编译期报错。
- **Schema-first**：相较 TypeORM 的「装饰器写实体」与传统 SQL-first 工具，Prisma 的 DSL 更紧凑、可读、跨语言友好。
- **强大的 Migrate 工作流**：`prisma migrate dev` 自动生成迁移并应用；`prisma migrate deploy` 用于 CI/CD 生产部署；保留版本化 SQL 文件方便审查。
- **多数据库支持**：PostgreSQL、MySQL、SQLite、SQL Server、MongoDB、CockroachDB、PlanetScale；不同数据库使用统一 API。
- **关系 API**：`include`、`select` 让 N+1 风险降低；嵌套写入（nested writes）一行完成多表插入。
- **Prisma Accelerate**：官方托管的全球连接池 + 边缘缓存层，让 Prisma 在 Serverless / Edge 环境（Vercel、Cloudflare Workers）也能用。
- **Prisma Pulse**：基于数据库 CDC 的实时订阅能力，便于构建实时应用。
- **Driver Adapters（v5+）**：解耦 Rust 查询引擎与原生数据库驱动，支持 `@libsql/client`、`@neondatabase/serverless`、`pg`、`mysql2` 等，原生适配 Edge runtime。
- **Rust 引擎重写为 TS（进行中）**：Prisma 团队 2025 年宣布将查询引擎从 Rust 迁回 TS，简化分发、优化体积、改善 Serverless 冷启动。
- **生态联动**：与 tRPC、NestJS、Next.js、Remix、Nuxt 等框架配合极佳；许多模板与 SaaS 起手套件（如 T3 Stack、create-t3-app）默认采用 Prisma。

## 关联

- [[entities/fullstack/typescript]]：Prisma 类型安全能力的根基；Prisma 是 TS 类型系统在后端价值的典型代表之一。
- [[entities/fullstack/nodejs]]：Prisma Client 的运行环境（也支持 Edge runtime）。
- [[comparisons/fullstack/sql-vs-nosql]]：Prisma 主要面向 SQL 数据库，也支持 MongoDB（功能子集）。
- **Drizzle ORM**：近年崛起的 SQL-first 类型安全替代方案，零运行时、贴近 SQL，是 Prisma 的主要竞争者。
- **Kysely**：纯类型安全的 SQL query builder，比 Prisma 更轻量、更靠近 SQL。
- **TypeORM / Sequelize / MikroORM**：传统 Node ORM 方案；类型安全程度普遍弱于 Prisma 与 Drizzle。
- **tRPC**：与 Prisma 是「TS 全栈类型安全」的黄金组合：DB → API → Client 全链路类型不丢失。
- **T3 Stack**：Next.js + TypeScript + Prisma + tRPC + Tailwind 的流行模板，Prisma 是其数据层标配。
