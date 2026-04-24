---
title: "RAG 检索增强生成"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [ai, llm, retrieval]
status: active
sources: []
---

# RAG 检索增强生成

## 定义

RAG(Retrieval-Augmented Generation,检索增强生成)是一种把"外部知识检索"与"LLM 生成"结合的架构模式。在生成回答前,系统先从知识库(文档、数据库、网页)中检索与问题相关的片段,将其注入提示上下文,让 LLM 基于真实资料而非仅靠参数化记忆作答。RAG 解决了 LLM 三大痛点:**知识时效性**(模型训练有截止日期)、**幻觉**(编造事实)、**私有数据**(企业内部文档无法进入预训练)——成为企业 LLM 应用的事实标准架构。

## 工作原理

RAG 包含两个阶段:**离线索引(Indexing)** 与 **在线检索生成(Retrieval + Generation)**。

**离线索引流程：**

```
原始文档(PDF/网页/数据库)
    ↓ 解析提取文本
文本块(Chunking,如 500 token)
    ↓ Embedding 模型
向量(如 1536 维)
    ↓ 存储
向量数据库 + 原文 + 元数据
```

```ts
// 伪代码
const chunks = splitDocument(doc, { size: 500, overlap: 50 });
for (const c of chunks) {
  const vec = await embed(c.text);
  await vectorDB.insert({ vec, text: c.text, meta: { source, page } });
}
```

**在线问答流程：**

```
用户问题
    ↓ 同样的 Embedding 模型
查询向量
    ↓ 向量相似度搜索(Top-K)
候选片段(K=10–50)
    ↓ Rerank 重排(Cross-Encoder)
精选片段(Top-3–5)
    ↓ 填入提示模板
LLM
    ↓
回答 + 引用来源
```

```ts
const qVec = await embed(question);
const candidates = await vectorDB.search(qVec, { topK: 20 });
const top = await rerank(question, candidates, { topK: 5 });

const prompt = `基于以下资料回答问题,若无答案请说"我不知道"。
资料:
${top.map((c,i)=>`[${i+1}] ${c.text}`).join('\n\n')}

问题: ${question}`;

const answer = await llm(prompt);
```

**关键工程要点：**

1. **Chunking 策略**: 固定窗口 / 按句子 / 按 Markdown 标题 / 递归分割。长度需平衡上下文完整性与检索精度
2. **Embedding 模型**: text-embedding-3-large、bge-m3、Cohere embed-v3 等。中英混合需多语言模型
3. **混合检索(Hybrid)**: 向量检索 + BM25 关键词检索结果融合(RRF),弥补纯语义在专有名词、代码、ID 上的不足
4. **Rerank**: 用 Cross-Encoder(如 bge-reranker、Cohere Rerank)对 Top-K 重排,精度大幅提升
5. **元数据过滤**: 按租户、时间、权限过滤,既安全又提升相关性
6. **引用回溯**: 输出强制带 `[1][2]` 来源标注,可点击跳转原文
7. **评测**: Ragas / TruLens 等框架评估 faithfulness、answer relevancy、context precision

**进阶变体：**

- **HyDE**: 先让 LLM 生成假设答案,再用其向量检索
- **Multi-Query**: 把问题改写成多个变体并行检索
- **Agentic RAG**: 让 Agent 决定何时检索、检索什么(见 [[concepts/ai/agent-framework]])
- **GraphRAG**: 用知识图谱补充向量检索

## 优势与局限

- ✅ 解决知识时效与私有数据问题,无需重新训练模型
- ✅ 可追溯引用,大幅减少幻觉
- ✅ 知识更新只需重建索引,成本低
- ✅ 与微调互补:RAG 管"知道什么",微调管"如何回答"
- ❌ 检索质量决定上限,差检索 + 强 LLM 仍出错答案
- ❌ Chunk 切割不当会割裂语义
- ❌ 多跳推理(需要综合多文档)效果有限,需 GraphRAG/Agent
- ❌ 上下文窗口有限,Top-K 不能太大
- ❌ 索引与查询使用不同 Embedding 模型会失效

## 应用场景

- **企业知识库问答**:基于内部 Wiki、Confluence、SharePoint
- **客服机器人**:基于产品手册、FAQ、工单历史
- **代码助手**:基于代码库的"问代码"功能
- **法律/医疗/金融**:必须可追溯引用的高风险领域
- **个人笔记 AI**:Notion AI、Obsidian Smart Connections

## 相关概念

- [[concepts/ai/embedding]]: RAG 的数学基础
- [[concepts/ai/vector-database]]: 存储与检索向量
- [[concepts/ai/llm-integration]]: 生成阶段的载体
- [[concepts/ai/prompt-engineering]]: 检索结果如何注入提示
- [[concepts/ai/agent-framework]]: Agentic RAG 的承载
- reranker: 提升检索精度的关键
