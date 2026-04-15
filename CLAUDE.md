# CLAUDE.md — LLM Wiki Schema

> 本文件定义 LLM 如何维护这个知识库。LLM 必须在每次操作前阅读本文件。

---

## 一、环境

```
llm-wiki/
├── raw/                  # 原始数据（只读，人类管理）
│   ├── *.md              # Web Clipper 抓取的文章
│   ├── *.pdf             # 论文、报告
│   └── assets/           # 图片（Obsidian attachment folder）
│
├── wiki/                 # LLM 生成并维护的 wiki（LLM 全权负责）
│   ├── index.md          # 全局索引
│   ├── log.md            # 操作日志
│   ├── concepts/         # 概念页
│   ├── entities/         # 实体页（人物、组织、项目）
│   ├── sources/          # 源文件摘要页
│   ├── comparisons/      # 对比分析页
│   └── topics/           # 主题概览页
│
└── CLAUDE.md             # 本文件（schema，不可修改）
```

### 权限规则
- **raw/**: LLM **只读**，绝不修改
- **wiki/**: LLM **可读写**，是 LLM 的唯一工作区
- **CLAUDE.md**: LLM **只读**，仅人类可修改
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

每个 raw/ 文件对应一个源摘要页。文件名与 raw/ 保持一致。

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
4. **创建源摘要页** `wiki/sources/<filename>.md`
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

## 五、index.md 格式

index.md 是全局目录，LLM 每次操作前都应读取。格式：

```markdown
# Wiki 索引

> 最后更新: YYYY-MM-DD | 页面总数: N

## 主题
- [[topics/topic-name]]: 一句话描述

## 概念
- [[concepts/concept-name]]: 一句话描述

## 实体
- [[entities/entity-name]]: 一句话描述

## 来源
- [[sources/source-name]]: 一句话描述

## 对比
- [[comparisons/a-vs-b]]: 一句话描述
```

按类别分组，每个条目一行。LLM 通过读 index.md 就能了解整个 wiki 的全貌，然后决定钻入哪些页面。

---

## 六、log.md 格式

log.md 是按时间倒序的操作日志（最新的在最前面）。

```markdown
# 操作日志

## [YYYY-MM-DD] 操作类型 | 标题
- 详情...
```

操作类型: `ingest` | `query` | `lint`

每次操作完成后必须追加一条记录。
