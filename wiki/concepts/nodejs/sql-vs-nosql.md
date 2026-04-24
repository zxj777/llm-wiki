---
title: "SQL vs NoSQL 数据库选型"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, database, sql, nosql, backend]
status: active
sources: []
---

# SQL vs NoSQL 数据库选型

## 定义

SQL（关系型）数据库以二维表与外键建模，强调 Schema、事务（ACID）与跨表 JOIN；NoSQL 是一系列非关系型存储的统称，包括文档（MongoDB）、键值（Redis）、列族（Cassandra/HBase）、图（Neo4j）、时序（InfluxDB）、搜索（Elasticsearch）等，各自针对特定访问模式做了取舍。选型并非二元对立，多数生产系统采用"主库 SQL + 缓存/搜索/时序"的多模型架构。

## 工作原理

**PostgreSQL / MySQL（关系型）**：基于表与行，提供事务、外键、丰富的索引（B-Tree、GIN、BRIN）、强一致；JOIN 让多对多关系建模优雅。Postgres 进一步支持 JSONB、CTE、窗口函数、向量扩展（pgvector），是默认主库的稳妥选择。MySQL 在 OLTP 简单查询场景仍有性能优势。

**MongoDB（文档型）**：以 BSON 文档为单位，Schema 灵活、深度嵌套，适合数据结构差异大或频繁演进的业务。事务自 4.0 起支持，但跨文档 JOIN（`$lookup`）性能不及 SQL。索引覆盖、分片基于 shard key。

**Redis（内存键值）**：内存速度（μs 级），数据结构丰富（String/Hash/List/Set/ZSet/Stream/HyperLogLog/Bitmap），TTL 适合缓存、会话、计数器、排行榜、限流（令牌桶/漏桶）。可持久化（RDB/AOF），但本质内存数据库需关注容量。

**时序数据库**：InfluxDB、TimescaleDB（Postgres 扩展）针对按时间写入、按时间窗口聚合的访问模式做了存储压缩与降采样。

**搜索引擎**：Elasticsearch / OpenSearch 倒排索引提供全文检索、聚合、近似最近邻向量搜索。

**选型矩阵**（典型决策）：

| 需求 | 推荐 |
|------|------|
| 强一致 OLTP、复杂查询 | PostgreSQL |
| Schema 频繁变化的内容 | MongoDB |
| 缓存 / 会话 / 限流 | Redis |
| 海量监控指标 | InfluxDB / Timescale |
| 全文搜索 / 日志 | Elasticsearch |
| 强关系网（社交/风控） | Neo4j |

```js
// 多模型组合示例
await pg.tx(async t => {                  // 主库写入
  const order = await t.insertOrder(...);
  await redis.del(`user:${uid}:cart`);    // 失效缓存
  await es.index({ index: 'orders', document: order }); // 同步搜索
});
```

CAP 定理与 PACELC 是理解分布式 NoSQL 的理论基础：网络分区时必须在一致性与可用性间取舍。

## 优势与局限

- ✅ SQL：强一致、表达力强、生态成熟
- ✅ NoSQL：灵活/极速/水平扩展强
- ❌ SQL：水平扩展与 Schema 演进成本
- ❌ NoSQL：缺乏跨集合事务/JOIN，运维复杂
- ❌ 多模型架构带来一致性与运维负担

## 应用场景

- 电商交易：PostgreSQL 主库 + Redis 缓存 + ES 商品搜索
- IoT 监控：Timescale 时序 + Postgres 配置表
- 社交网络：Postgres + Redis Feed + Neo4j 关系图
- 内容平台：MongoDB 灵活内容 + ES 检索

## 相关概念

- [[concepts/nodejs/orm-query-builder]]: 选型后如何访问数据库
- [[concepts/nodejs/connection-pool]]: 数据库连接管理
