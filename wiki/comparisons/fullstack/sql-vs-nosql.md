---
title: "SQL vs NoSQL"
type: comparison
created: 2026-04-02
updated: 2026-04-02
tags: [database, sql, nosql, backend]
status: active
sources: []
---

# SQL vs NoSQL

SQL（关系型数据库）与 NoSQL（非关系型数据库）代表了两种截然不同的数据建模与一致性哲学。SQL 以关系代数与 ACID 事务为基础，NoSQL 是一组松散统称（文档、键值、列族、图）以可扩展性与灵活模式为目标。

## 对比维度

| 维度 | SQL（PostgreSQL/MySQL） | NoSQL（MongoDB/DynamoDB/Redis/Cassandra） |
|------|------------------------|-------------------------------------------|
| 数据模型 | 行 × 列，强 schema | 文档 / 键值 / 列族 / 图，schema-less |
| 关系建模 | JOIN 原生支持 | 通常嵌入或在应用层关联 |
| 一致性模型 | 强一致（ACID） | 多为最终一致（BASE），部分支持 ACID |
| 事务 | 跨表多语句事务成熟 | 限制较多，常仅单文档 |
| 扩展方式 | 垂直扩展为主，水平扩展复杂（分片） | 水平扩展为天然设计目标 |
| 查询语言 | SQL 标准 | 各家专有 API（Mongo Query / CQL / Redis 命令） |
| 索引能力 | 丰富（B-tree, GIN, GiST 等） | 多样但因引擎差异大 |
| 写入吞吐 | 中高 | 高至极高（专为写优化的引擎如 Cassandra） |
| 适合工作负载 | OLTP、复杂查询、报表 | 高并发简单查询、海量数据、缓存、时序 |
| 运维成熟度 | 极高，DBA 生态齐全 | 视产品而异，云托管常见 |
| schema 演进 | 需 migration | 字段可随时增加 |

## 分析

### 数据模型与一致性

SQL 数据库以「关系」为中心：通过外键和 JOIN 在多个规范化表之间建立强约束，配合 ACID 事务保证转账类场景的正确性。代价是 schema 演进成本与水平扩展难度。

NoSQL 是一组异构产品：
- **文档数据库（MongoDB）**：以 JSON 文档为单位存储，适合嵌套结构。
- **键值数据库（Redis、DynamoDB）**：极简模型，O(1) 读写。
- **列族数据库（Cassandra、HBase）**：宽行模型，写入吞吐极高。
- **图数据库（Neo4j）**：节点 + 边，关系遍历优势明显。

它们普遍放宽一致性以换取扩展性，符合 CAP 定理中的 AP 取向。

### 扩展性

SQL 单机性能强，但水平扩展（分片、读写分离）通常需要应用层介入或专门方案（Citus、Vitess、TiDB）。NoSQL 多以无主或一致性哈希架构原生支持横向扩展，加节点几乎线性提升容量。

### 事务与正确性

ACID 是关系型核心：转账、库存、订单等业务对一致性敏感，SQL 仍是事实标准。MongoDB 自 4.0 起支持多文档事务，但成本与限制高；DynamoDB 提供有限的事务 API。**强一致需求大多场景下，SQL 仍最稳妥**。

### Schema 灵活性

NoSQL 的 schema-less 在快速迭代期非常友好：新字段直接写入即可。但实际生产中 schema 仍存在于应用代码中，缺乏数据库级约束反而易引入数据漂移。现代实践多用 schema validation（Mongo）或类型安全 ORM（Prisma、Mongoose）补齐。

### 现实组合：Polyglot Persistence

成熟系统常组合使用：PostgreSQL 存核心业务、Redis 做缓存与会话、Elasticsearch 做全文检索、ClickHouse 做分析、对象存储做大文件。「单一数据库通吃」并非好设计。

## 结论

- **强一致 / 复杂关系 / 报表分析 / 中小数据量**：SQL（PostgreSQL 是默认推荐）。
- **超高写入 / 海量数据 / 弱一致可接受**：Cassandra、DynamoDB。
- **缓存 / 会话 / 排行榜 / 简单 KV**：Redis。
- **嵌套文档 / 快速原型**：MongoDB。
- **关系遍历 / 知识图谱**：Neo4j。
- **时序数据**：InfluxDB / TimescaleDB。
- **默认选择**：除非有明确理由，先用 PostgreSQL；它的 JSONB 也能覆盖很多 NoSQL 场景。

## 相关
- database
- acid base
