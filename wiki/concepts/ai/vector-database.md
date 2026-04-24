---
title: "向量数据库"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [ai, database, retrieval]
status: active
sources: []
---

# 向量数据库

## 定义

向量数据库(Vector Database)是专为高维稠密向量(通常 384–4096 维浮点数组)的存储与近似最近邻(ANN, Approximate Nearest Neighbor)搜索而设计的数据库。它解决传统数据库无法高效回答"找出与这个向量最相似的 K 个向量"的问题——在 [[concepts/ai/rag]]、推荐、图像/语音检索、去重、聚类等 AI 场景中必不可少。代表产品有 Pinecone、Weaviate、Milvus、Qdrant、Chroma,以及关系数据库扩展 PostgreSQL + pgvector、ClickHouse 等。

## 工作原理

**1. 相似度度量**

- **余弦相似度(Cosine)**: `cos(A,B) = A·B / (|A||B|)`,只看方向,文本向量首选
- **内积(Dot Product)**: `A·B`,常与归一化向量配合
- **欧氏距离(L2)**: `√Σ(Aᵢ-Bᵢ)²`,图像/几何向量常用

```python
import numpy as np
def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

**2. 暴力搜索 vs ANN 索引**

向量库通常存百万到十亿级向量,逐个计算距离(brute force)的 O(N) 不可接受。ANN 通过牺牲少量精度换取数量级的速度提升。

**主流 ANN 算法：**

- **HNSW(Hierarchical Navigable Small World)**: 分层小世界图,查询复杂度 O(log N),内存占用高,精度最好。Pinecone、Weaviate、Qdrant、pgvector 0.5+ 都支持
- **IVF(Inverted File)**: 先 K-Means 聚类成 nlist 个簇,查询时只搜最近 nprobe 个簇
- **IVF-PQ(Product Quantization)**: IVF + 向量压缩(把 1536 维拆成 96 段 16 维,每段用 256 个聚类中心编码),内存压缩 16–64 倍,适合超大规模
- **ScaNN**: Google 开源,综合性能领先

```sql
-- pgvector + HNSW 示例
CREATE EXTENSION vector;
CREATE TABLE docs (
  id bigserial PRIMARY KEY,
  content text,
  embedding vector(1536)
);
CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 查询 Top 5
SELECT id, content, 1 - (embedding <=> $1) AS similarity
FROM docs
ORDER BY embedding <=> $1
LIMIT 5;
```

**3. 元数据过滤(Hybrid Filter)**

实际查询常需"在某租户/某时间范围内的最相似 5 条"。过滤分两种:
- **Pre-filter**: 先按元数据筛,再向量搜索(召回率高,大数据集慢)
- **Post-filter**: 先向量搜索 Top-K',再按元数据过滤(快但可能不足 K 条)
- 现代库(Qdrant、Weaviate)支持索引级别的过滤,兼顾两者

**4. 主流产品对比**

| 产品 | 部署 | 强项 |
|------|------|------|
| **Pinecone** | 全托管 SaaS | 易用、可扩展、Serverless |
| **Weaviate** | 自托管/云 | 内置 Embedding、模块化、GraphQL |
| **Milvus** | 自托管/Zilliz Cloud | 大规模、GPU 索引 |
| **Qdrant** | 自托管/云 | Rust 性能、过滤强 |
| **Chroma** | 嵌入式/本地 | 轻量、原型开发 |
| **pgvector** | PostgreSQL 扩展 | 与业务库共生、事务/SQL |

**5. 工程注意事项**

- 维度必须与 [[concepts/ai/embedding]] 模型匹配,不可换模型不重建
- 建索引耗时长(数小时),需后台异步
- HNSW 写入比读慢得多,海量更新场景考虑 IVF
- 监控召回率(recall@K)与延迟,定期重建优化

## 优势与局限

- ✅ 毫秒级在百万/亿级向量中检索 Top-K
- ✅ 支持语义检索,补全关键词检索短板
- ✅ 与传统数据库元数据/SQL 结合(pgvector)实现混合检索
- ❌ 索引内存占用大,HNSW 一亿向量需数百 GB
- ❌ ANN 是近似,极端精度场景需混合 BM25 + Rerank
- ❌ 维度灾难:超高维下相似度区分度下降
- ❌ 数据隐私:向量可被反演还原原文,敏感场景需加密或私有部署

## 应用场景

- **RAG 知识库**: 企业问答、Copilot 的检索后端
- **语义搜索**: 电商搜索、文档搜索(同义词无需手维护)
- **推荐系统**: 用户/物品 Embedding 召回
- **图像/视频检索**: CLIP 向量找相似图
- **去重 / 聚类**: 文本/图像/音频去重
- **异常检测**: 正常样本聚集,异常远离

## 相关概念

- [[concepts/ai/rag]]: 向量数据库的最大应用场景
- [[concepts/ai/embedding]]: 向量的来源
- reranker: 与向量检索互补
- hnsw: 主流 ANN 算法
- hybrid search: 向量 + 关键词融合
