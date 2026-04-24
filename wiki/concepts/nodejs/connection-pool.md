---
title: "连接池与数据库优化"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, database, connection-pool, performance, backend]
status: active
sources: []
---

# 连接池与数据库优化

## 定义

数据库连接的建立涉及 TCP、TLS 与认证，单次成本通常在数十毫秒级；高并发下若每请求新建连接将迅速耗尽数据库的连接配额。连接池在应用进程内维护一组复用连接，按需借出与归还，是后端性能与稳定性的基石。配合索引、查询优化与 N+1 治理，连接池是 OLTP 服务的标准组件。

## 工作原理

**连接池工作流**：
1. 启动时创建 `min` 个连接
2. 请求取连接 → 池中有空闲则直接给出，否则新建（不超过 `max`）
3. 达到 `max` 时新请求排队，等待 `acquireTimeout`，超时报错
4. 使用完毕归还到池而非关闭
5. 空闲超过 `idleTimeout` 的连接被销毁回归 `min`

**关键参数**：
- `min` / `max`：池大小，需结合数据库 `max_connections` 和应用实例数（总和不超数据库上限的 70%）
- `acquireTimeout`：取连接超时
- `idleTimeout`：空闲回收
- `connectionTimeout`：建连超时
- `validateOnBorrow`：借出前校验存活

```js
// pg 示例
import { Pool } from 'pg';
const pool = new Pool({
  max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000,
});
const { rows } = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
```

**Serverless 场景**：函数实例横向扩展会爆连接数，应使用 PgBouncer / RDS Proxy / Neon 等"代理池"在数据库前再做一层池化；或选用 HTTP-based 数据库（Neon HTTP、PlanetScale fetch）避免长连接。

**查询优化**：
- 索引：B-Tree 覆盖等值/范围查询；复合索引遵循"最左前缀"；高基数列优先；过多索引拖累写入
- `EXPLAIN ANALYZE` 看真实执行计划，关注 Seq Scan、行数估算偏差、Sort/Hash 内存
- 慢查询日志（`pg_stat_statements`、`slow_query_log`）持续治理 Top N
- `LIMIT` + cursor 分页避免深 OFFSET
- 大事务拆分，避免长锁

**N+1 问题**：取列表后逐条查关联，触发 1+N 次查询。三种治理：
1. **Eager Loading**：JOIN 一次取齐（适合一对一/小一对多）
2. **批量 IN 查询**：拿到 ID 列表后 `WHERE id IN (...)` 一次取
3. **DataLoader**：在事件循环 tick 内自动合并并缓存

```js
// Prisma include eager loading
const users = await prisma.user.findMany({ include: { posts: true } });
```

**写入优化**：批量 `INSERT ... VALUES (...), (...)`、`COPY`（PG）、合理批大小、必要时事务降级（PG 的 unlogged 表、批写入后再建索引）。

监控：连接池利用率、等待队列长度、慢查询 P99、锁等待是必备指标。

## 优势与局限

- ✅ 连接复用，吞吐和稳定性大增
- ✅ 隔离应用故障，不直接打挂数据库
- ✅ 与 ORM/Builder 透明集成
- ❌ Serverless 易爆连接，需要代理池
- ❌ 参数错配（max 过大/过小）反而加剧问题
- ❌ 长事务/慢查询会"卡住"整个池

## 应用场景

- HTTP API 与微服务的数据库访问
- 后台 Job 大批量写入
- BFF/网关聚合多数据源
- 多租户 SaaS（结合 schema 切换）

## 相关概念

- [[concepts/nodejs/sql-vs-nosql]]: 选型决定连接池形态
- [[concepts/nodejs/orm-query-builder]]: ORM 通常内置连接池
