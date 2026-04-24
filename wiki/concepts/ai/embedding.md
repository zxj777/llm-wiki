---
title: "嵌入向量"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [ai, nlp, embedding]
status: active
sources: []
---

# 嵌入向量

## 定义

嵌入向量(Embedding)是把离散对象(单词、句子、文档、图像、音频、用户、商品)映射为连续高维实数向量的表示方法。优秀的嵌入满足"语义相近 → 向量距离近"的几何性质——"猫"与"狗"的向量比"猫"与"汽车"更接近。这种"用几何表达语义"的能力是现代 AI 的基础设施,支撑 [[concepts/ai/rag]]、语义检索、推荐、聚类、分类、迁移学习等几乎所有下游任务。Embedding 把符号问题转化为数值问题,让神经网络可处理。

## 工作原理

**1. 向量空间的语义结构**

著名例子(Word2Vec):

```
vec("国王") - vec("男人") + vec("女人") ≈ vec("女王")
vec("巴黎") - vec("法国") + vec("德国") ≈ vec("柏林")
```

这种线性可加性源于神经网络在大规模文本上学到的分布式表示——"You shall know a word by the company it keeps"(Firth, 1957)。

**2. 主流文本 Embedding 模型**

| 模型 | 维度 | 特点 |
|------|------|------|
| **OpenAI text-embedding-3-small** | 1536(可降至 256) | API 易用,Matryoshka 可裁剪 |
| **OpenAI text-embedding-3-large** | 3072 | 多语言强,精度高 |
| **Cohere embed-v3** | 1024 | 多语言,有压缩版本 |
| **BGE-M3(智源)** | 1024 | 开源、多语言、稠密+稀疏+多向量 |
| **Voyage-3** | 1024 | RAG 优化 |
| **E5-mistral-7b** | 4096 | 开源 SOTA |
| **Sentence-BERT** | 768 | 开源轻量,经典基线 |

**3. 调用示例**

```ts
const res = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: ['今天天气真好', '我想吃火锅']
});
const vectors = res.data.map(d => d.embedding); // 两个 1536 维数组
```

```python
from sentence_transformers import SentenceTransformer
m = SentenceTransformer('BAAI/bge-m3')
v = m.encode(['今天天气真好', '我想吃火锅'], normalize_embeddings=True)
```

**4. 维度选择**

更高维通常更准但更贵更慢。Matryoshka Embedding(套娃式)允许同一向量截断使用——3072 维存储,256 维检索,精度几乎不降。维度需在精度、存储、检索速度之间权衡。

**5. 距离度量**

文本嵌入推荐 **余弦相似度**(对长度不敏感),向量需 L2 归一化后用内积等价于余弦,速度更快。归一化是 Embedding 工程的常见踩坑点。

**6. 异质 Embedding**

- **CLIP**: 把图像和文本嵌入到同一空间,实现"用文字搜图"
- **代码 Embedding**: CodeBERT、Voyage-code,支持代码搜索
- **多模态**: Gemini、GPT-4o 原生支持多模态嵌入
- **协同过滤 Embedding**: 推荐系统中的 user/item 向量

## 模型选择要点

1. **任务类型**: 检索 vs 分类 vs 聚类的最佳模型不同(看 MTEB 榜单)
2. **语言覆盖**: 中文/多语言场景必须用多语言模型
3. **领域**: 法律/医疗等专业领域,微调模型显著优于通用
4. **维度成本**: 维度越高,向量库存储与检索成本越高
5. **API vs 本地**: 私有数据用本地(BGE/E5),通用数据用 API
6. **一致性**: 索引与查询必须用同一模型,**升级模型必须重建索引**

## 优势与局限

- ✅ 把符号转为可计算的语义,通用基础设施
- ✅ 零样本即可用于检索/聚类/分类
- ✅ 跨语言、跨模态对齐(CLIP)
- ❌ 高维数值难以解释,黑盒
- ❌ 长文本嵌入会丢失细节,需先 chunk
- ❌ 模型偏见(性别、种族刻板印象)会被向量继承
- ❌ Embedding 可被反演还原近似原文,隐私敏感数据需注意
- ❌ 不同模型的向量空间不通用,迁移成本高

## 应用场景

- **RAG 检索**: 最大用例,见 [[concepts/ai/rag]]
- **语义搜索**: 同义/近义无需手维护词表
- **推荐召回**: 双塔模型 user/item 向量
- **聚类与可视化**: t-SNE/UMAP 降维到 2D 看分布
- **去重**: 近似重复检测(SimHash 升级版)
- **零样本分类**: 把类别名也嵌入,与文本算相似度

## 相关概念

- [[concepts/ai/vector-database]]: 嵌入的存储与检索
- [[concepts/ai/rag]]: 嵌入驱动的检索增强
- reranker: 与嵌入检索互补
- clip: 多模态嵌入代表
- matryoshka embedding: 可裁剪维度
- cosine similarity: 文本嵌入主流度量
