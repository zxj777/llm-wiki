# CLAUDE.md — LLM Wiki Schema

> 本文件定义 LLM 如何维护这个知识库。LLM 必须在每次操作前阅读本文件。

---

## 一、环境

```
llm-wiki/
├── raw/                  # 原始数据（只读，人类管理）
│   ├── *.md              # Web Clipper 抓取的文章
│   ├── *.pdf             # 论文、报告
│   ├── <subdir>/         # 人类自定义的子目录（如 ai-flow/、papers/）
│   └── assets/           # 图片（Obsidian attachment folder）
│
├── wiki/                 # LLM 生成并维护的 wiki（LLM 全权负责）
│   ├── index.md          # 全局索引
│   ├── log.md            # 操作日志
│   ├── concepts/         # 概念页（镜像 raw/ 目录结构）
│   │   └── <subdir>/     # 与 raw/<subdir>/ 对应的子目录
│   ├── entities/         # 实体页（镜像 raw/ 目录结构）
│   │   └── <subdir>/
│   ├── sources/          # 源文件摘要页（镜像 raw/ 目录结构）
│   │   └── <subdir>/
│   ├── comparisons/      # 对比分析页（镜像 raw/ 目录结构）
│   │   └── <subdir>/
│   └── topics/           # 主题概览页（镜像 raw/ 目录结构）
│       └── <subdir>/
│
└── CLAUDE.md             # 本文件（schema 规范）
```

### 目录镜像规则

- **raw/ 根目录下的文件** → wiki 各分类目录的根层级
  - 例：`raw/foo.md` → `wiki/sources/foo.md`, `wiki/concepts/bar.md`
- **raw/ 子目录下的文件** → wiki 各分类目录下的同名子目录
  - 例：`raw/ai-flow/foo.md` → `wiki/sources/ai-flow/foo.md`, `wiki/concepts/ai-flow/bar.md`
- **子目录命名**: 与 raw/ 中保持完全一致，不做转换
- **跨目录概念**: 如果一个概念被多个 raw/ 子目录的文件引用，概念页放在第一次出现的子目录下，后续通过 `[[]]` 链接引用，不重复创建

### 权限规则
- **raw/**: LLM **只读**，绝不修改
- **wiki/**: LLM **可读写**，是 LLM 的唯一工作区
- **CLAUDE.md**: LLM **可读写**，可根据用户指示修改 schema 规范
- **PLAN.md / README.md**: LLM **只读**

---

## 二、页面规范

### 通用 Frontmatter

所有 wiki 页面必须以 YAML frontmatter 开头：

```yaml
---
title: 页面标题
type: concept | entity | source | comparison | topic
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [tag1, tag2]
status: active | stub | outdated | disputed
sources: [raw/文件名.md, raw/文件名2.md]
---
```

### 页面类型

#### 1. Source（源摘要页）— `wiki/sources/`

每个 raw/ 文件对应一个源摘要页。文件名与 raw/ 保持一致，**目录层级也与 raw/ 保持一致**（如 `raw/ai-flow/foo.md` → `wiki/sources/ai-flow/foo.md`）。

```markdown
---
title: "文章标题"
type: source
created: 2026-04-02
updated: 2026-04-02
tags: [llm, knowledge-base]
status: active
sources: [raw/karpathy-llm-wiki.md]
---

# 文章标题

## 核心论点
- 论点 1
- 论点 2

## 关键概念
- [[concept-name]]: 简要说明
- [[entity-name]]: 简要说明

## 摘要
3-5 段的结构化摘要，保留原文的关键数据和观点。

## 引用片段
> 重要的原文引用（保留出处）
```

#### 2. Concept（概念页）— `wiki/concepts/`

解释一个技术概念、方法或理论。

```markdown
---
title: "概念名称"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [llm, architecture]
status: active
sources: [raw/source1.md, raw/source2.md]
---

# 概念名称

## 定义
一段清晰的定义。

## 工作原理
技术细节。

## 优势与局限
- ✅ 优势 1
- ❌ 局限 1

## 应用场景
实际用例。

## 相关概念
- [[related-concept-1]]: 关系说明
- [[related-concept-2]]: 关系说明
```

#### 3. Entity（实体页）— `wiki/entities/`

描述一个人物、组织或项目。

```markdown
---
title: "实体名称"
type: entity
created: 2026-04-02
updated: 2026-04-02
tags: [person, ai]
status: active
sources: [raw/source1.md]
---

# 实体名称

## 概述
简要介绍。

## 关键贡献 / 事件
- 贡献 1
- 贡献 2

## 关联
- [[related-entity]]: 关系说明
- [[related-concept]]: 关系说明
```

#### 4. Comparison（对比页）— `wiki/comparisons/`

对比两个或多个概念/实体/方案。

```markdown
---
title: "A vs B"
type: comparison
created: 2026-04-02
updated: 2026-04-02
tags: [comparison]
status: active
sources: [raw/source1.md]
---

# A vs B

## 对比维度

| 维度 | A | B |
|------|---|---|
| 维度1 | ... | ... |
| 维度2 | ... | ... |

## 分析
详细的对比分析。

## 结论
适用场景建议。
```

#### 5. Topic（主题概览页）— `wiki/topics/`

某个研究主题的入口页，起"子索引"作用。

```markdown
---
title: "主题名称"
type: topic
created: 2026-04-02
updated: 2026-04-02
tags: [topic-tag]
status: active
sources: []
---

# 主题名称

## 概述
主题简介。

## 核心概念
- [[concept-1]]: 一句话说明
- [[concept-2]]: 一句话说明

## 关键实体
- [[entity-1]]: 一句话说明

## 重要来源
- [[source-1]]: 一句话说明

## 开放问题
- 待研究问题 1
- 待研究问题 2
```

---

## 三、操作流程

### 操作 1: Ingest（摄入）

**触发**: 用户说 "ingest raw/xxx.md" 或 "处理 raw/ 中的新文件"

**步骤**:

1. **读取 CLAUDE.md**（本文件）
2. **读取 wiki/index.md** 了解现有知识结构
3. **读取 raw/ 中的目标文件**
4. **创建源摘要页** `wiki/sources/<subdir>/<filename>.md`（子目录与 raw/ 保持一致，根目录文件则直接放 `wiki/sources/<filename>.md`）
5. **识别概念和实体**，对每个：
   - 如果已有页面 → 读取并**增量更新**（添加新信息，不重写已有内容）
   - 如果没有页面 → 创建新页面（可以是 stub 状态）
6. **建立交叉引用**：在所有相关页面中添加 `[[链接]]`
7. **检查是否需要对比页**：如果新源涉及两个可对比的概念/实体，考虑创建 comparison 页
8. **更新 wiki/index.md**：为新页面添加条目，为更新的页面刷新摘要
9. **更新相关 topics/ 页面**：如果新内容属于某主题，更新主题概览
10. **追加 wiki/log.md**：

```markdown
## [YYYY-MM-DD] ingest | 源文件标题
- 源文件: raw/xxx.md
- 新建页面: wiki/sources/xxx.md, wiki/concepts/yyy.md
- 更新页面: wiki/concepts/zzz.md, wiki/entities/aaa.md
- 新增链接: yyy ↔ zzz, xxx → aaa
```

### 操作 2: Query（查询）

**触发**: 用户提出知识性问题

**步骤**:

1. **读取 wiki/index.md** 定位相关页面
2. **读取相关 wiki 页面**（通常 3-10 个）
3. **综合分析，给出回答**
4. **评估归档价值**：如果回答产生了新的有用综合分析：
   - 询问用户："这个回答要归档到 wiki 吗？"
   - 如果是 → 创建新页面或更新现有页面 → 更新 index.md → 追加 log.md
5. **追加 log.md**（无论是否归档）：

```markdown
## [YYYY-MM-DD] query | 问题简述
- 查阅页面: wiki/concepts/xxx.md, wiki/entities/yyy.md
- 归档: 是/否（如果是，说明新建/更新了哪些页面）
```

### 操作 3: Lint（检查）

**触发**: 用户说 "lint wiki" 或 "检查 wiki 健康度"

**检查项**:

1. **断链**: `[[xxx]]` 指向不存在的页面 → 创建 stub 或移除链接
2. **孤儿页**: 没有任何其他页面链接到的页面 → 建议添加引用或标记为候选删除
3. **过时内容**: `status: outdated` 的页面 → 列出并建议更新方向
4. **矛盾**: 不同页面的信息相互矛盾 → 标记 `status: disputed`，创建矛盾说明章节
5. **缺失概念页**: 被多个页面 `[[引用]]` 但不存在的概念 → 创建 stub
6. **缺失交叉引用**: 内容相关但没有相互链接的页面 → 建议添加
7. **Index 一致性**: index.md 中的条目与实际文件不一致 → 修复
8. **Frontmatter 完整性**: 缺少必填字段 → 补全

**输出**: 在终端报告所有发现，然后逐项修复（每项修复前确认）

**追加 log.md**:

```markdown
## [YYYY-MM-DD] lint | 健康检查
- 检查页面数: N
- 发现问题: 断链 x 个, 孤儿页 y 个, 矛盾 z 个, ...
- 修复: 列出已修复的问题
- 待处理: 列出需要人工判断的问题
```

---

## 四、编辑守则

### 不可违反的规则
1. **绝不修改 raw/ 中的任何文件**
2. **绝不删除内容来解决矛盾**——标记 `disputed` 并保留所有观点
3. **绝不编造信息**——所有内容必须可追溯到 raw/ 中的源文件或明确标注为推断
4. **绝不大规模重写**——做小的、增量的改动

### 编辑原则
5. **引用来源**: 每个事实性陈述应能追溯到 `sources:` 字段中的文件
6. **保持链接**: 提到其他 wiki 页面中的概念时使用 `[[链接]]`
7. **增量更新**: 新信息追加到现有章节，不重写已有段落
8. **标记不确定**: 不确定的信息用 `⚠️` 或 `[需验证]` 标记
9. **日期一致**: 更新页面时同步更新 frontmatter 的 `updated` 字段

### 矛盾处理流程

当新信息与已有内容冲突时：

1. **不删除旧内容**
2. 在相关页面添加 **矛盾章节**：

```markdown
## ⚠️ 矛盾记录

### 矛盾: [简述矛盾内容]
- **观点 A**（来源: [[source-a]]）: ...
- **观点 B**（来源: [[source-b]]）: ...
- **状态**: 未解决
- **建议**: [LLM 的分析和建议]
```

3. 将页面 `status` 改为 `disputed`
4. 在 log.md 中记录矛盾发现
5. 等待人类在后续 lint 中决定如何处理（统一、搜索更多证据、保留双方、或人工裁定）

---

## 五、index.md 维护规则

index.md 是全局目录，是 LLM 导航整个 wiki 的入口。**每次操作前必须先读取 index.md**。

### 格式

```markdown
# Wiki 索引

> 最后更新: YYYY-MM-DD | 页面总数: N

## 主题
- [[topics/topic-name]]: 一句话描述（≤30字）

## 概念
- [[concepts/concept-name]]: 一句话描述（≤30字）

## 实体
- [[entities/entity-name]]: 一句话描述（≤30字）

## 来源
- [[sources/source-name]]: 一句话描述（≤30字）

## 对比
- [[comparisons/a-vs-b]]: 一句话描述（≤30字）
```

### 维护策略

1. **每条一行**: 每个 wiki 页面在 index.md 中占且仅占一行，格式为 `- [[path]]: 摘要`
2. **摘要精炼**: 每条摘要 ≤30 字，用于快速扫描定位，不是完整描述
3. **同步更新**: 新建页面 → 添加条目；删除页面 → 移除条目；更新页面内容使摘要过时 → 刷新摘要
4. **分类排序**: 每个分类内按字母顺序排列
5. **页面计数**: 头部的 `页面总数: N` 必须准确反映 wiki/ 下的实际 .md 文件数（不含 index.md 和 log.md）
6. **完整覆盖**: wiki/ 下的每个内容页面都必须在 index.md 中有对应条目（由 lint 检查）
7. **stub 标记**: 状态为 stub 的页面在摘要末尾加 `[stub]`，如 `- [[concepts/xxx]]: 待补充 [stub]`

### 规模预警

当 index.md 超过 **500 行**时，说明 wiki 规模已大，应考虑：
- 将频繁查阅的概念标记 `⭐` 前缀
- 每个 topic 页作为该主题的子索引，index.md 只保留 topic 入口
- 引入搜索工具（`tools/search.sh`）辅助导航

---

## 六、log.md 维护规则

log.md 是按时间倒序的操作日志（最新的条目在 `# 操作日志` 标题之后）。

### 格式

```markdown
# 操作日志

## [YYYY-MM-DD] ingest | 源文件标题
- 源文件: raw/xxx.md
- 新建页面: wiki/sources/xxx.md, wiki/concepts/yyy.md
- 更新页面: wiki/concepts/zzz.md
- 新增链接: yyy ↔ zzz

## [YYYY-MM-DD] query | 问题简述
- 查阅页面: wiki/concepts/xxx.md, wiki/entities/yyy.md
- 归档: 是 → wiki/concepts/new-insight.md
- 归档: 否

## [YYYY-MM-DD] lint | 健康检查
- 检查页面数: N
- 发现问题: 断链 3, 孤儿页 1
- 修复: 创建 2 个 stub, 添加 1 个引用
- 待处理: 1 个矛盾需人工判断
```

### 维护策略

1. **时间倒序**: 最新记录紧跟在标题之后（插入位置: `# 操作日志` 的下一行）
2. **每次操作必记**: ingest / query / lint 完成后都必须写一条日志
3. **保持简洁**: 每条日志 ≤10 行，只记关键变更事实
4. **可 grep**: 操作类型固定为 `ingest` | `query` | `lint`，方便 `grep "ingest" wiki/log.md` 过滤

---

## 七、查询归档规则

查询（Query）产生的有价值回答应归档回 wiki，实现知识复利。

### 归档判断标准

**应该归档** 的情况：
- 回答综合了 3+ 个 wiki 页面的信息，产生了新的洞察
- 回答揭示了现有页面未明确记录的关联或对比
- 回答纠正了现有页面中的错误或补充了重要缺失信息
- 回答可以独立成文，对未来查询有复用价值

**不应归档** 的情况：
- 回答只是简单复述了单个页面的内容
- 回答是临时性的（如"帮我列个清单"）
- 回答的信息已完整存在于现有页面

### 归档方式

1. **新建页面**: 如果回答产生了新概念/新对比/新主题 → 创建对应类型的新页面
2. **更新现有页面**: 如果回答深化了某个已有概念 → 增量追加到该概念页的相关章节
3. **混合**: 一次归档可能同时新建 + 更新多个页面

### 归档流程

1. LLM 完成回答后，评估归档价值
2. 如果值得归档 → 向用户建议: "建议归档到 [[concepts/xxx]]，是否同意？"
3. 用户同意后 → 执行归档（创建/更新页面 + 更新 index.md）
4. 在 log.md 中记录归档详情
5. 如果用户拒绝 → 仅在 log.md 中记录查询（归档: 否）

### 归档页面命名

- 从查询回答中提炼最核心的概念作为文件名
- 使用 kebab-case: `wiki/concepts/llm-vs-rag-tradeoffs.md`
- 如果是对比类回答 → 放入 `wiki/comparisons/`
- 如果是某主题的综合分析 → 考虑放入 `wiki/topics/`
