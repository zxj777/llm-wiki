# LLM Wiki — 实施计划

> 基于 [Karpathy 的 LLM Knowledge Base 理念](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) 及社区实践

## 一、社区生态现状（2026.04）

Karpathy 的 gist 在一周内获得 5000+ stars、1500+ forks，社区已涌现多个实现：

| 项目 | 定位 | 特点 |
|------|------|------|
| [llm-wiki-compiler](https://github.com/ussumant/llm-wiki-compiler) | Claude Code 插件 | 自动编译 .md wiki，反向链接，139 stars |
| [llm-wiki-karpathy](https://github.com/balukosuri/llm-wiki-karpathy) | 开箱即用模板 | 含 CLAUDE.md schema、Obsidian 配置、示例 vault |
| [SwarmVault](https://github.com/SwarmVaultAI/cli) | 本地知识编译器 | CLI 优先，图谱视图，离线运行，插件架构 |
| [qmd](https://github.com/tobi/qmd) | 搜索引擎 | 本地 BM25+向量混合搜索，CLI + MCP server |

**社区共识**: LLM Wiki 是一个 **pattern（模式）而非 product（产品）**，核心是三层架构 + 三种操作。

---

## 二、Karpathy 原始方案精要

### 核心洞察
> "大多数人对 LLM + 文档的体验是 RAG：每次查询从零开始。这里不同——LLM **增量构建和维护一个持久化 wiki**，知识被编译一次，然后持续更新，而非每次查询重新推导。"

### 三层架构
```
llm-wiki/
├── raw/                    # 第一层：原始数据（不可变，LLM 只读）
│   ├── *.md                # Web Clipper 抓取的文章
│   ├── *.pdf               # 论文
│   └── assets/             # 本地化的图片（Obsidian 设置 attachment folder）
│
├── wiki/                   # 第二层：LLM 生成并维护的 wiki（LLM 全权负责）
│   ├── index.md            # 全局索引（内容导向：每页一行摘要，按类别分组）
│   ├── log.md              # 时间线日志（追加写：摄入/查询/lint 记录）
│   ├── overview.md         # 全局综述
│   ├── entities/           # 实体页（人物、组织、项目等）
│   ├── concepts/           # 概念页（技术、方法、理论等）
│   ├── sources/            # 每个原始源的摘要页
│   └── comparisons/        # 对比分析页
│
└── CLAUDE.md               # 第三层：Schema（告诉 LLM 如何结构化 wiki）
    (或 AGENTS.md / COPILOT.md — 取决于你用的 LLM agent)
```

### 三种操作
1. **Ingest（摄入）**: 新源文件 → LLM 读取 → 写摘要 → 更新 index → 更新相关实体/概念页 → 追加 log（一个源可能触及 10-15 个 wiki 页面）
2. **Query（查询）**: 提问 → LLM 读 index.md 定位 → 钻入相关页 → 综合回答 → **好的回答归档回 wiki 成为新页面**（知识复利）
3. **Lint（检查）**: 矛盾检测、过时标记、孤儿页、缺失概念页、缺失交叉引用、数据缺口（可 web search 补全）

### LLM Wiki vs RAG — 核心区别

RAG 每次查询从零检索原始文档碎片再拼凑答案，无积累。LLM Wiki 先把知识编译进持久化 wiki，查询时读已编译好的结构化页面，好的回答归档回 wiki 形成复利。个人规模（~200页 wiki）只需 index.md 文本索引即可导航，无需向量数据库或 RAG 基础设施。

### 导航策略随规模递进

| 规模 | 方法 | 本方案阶段 |
|------|------|-----------|
| ~200 页 | index.md 文本索引 | Phase 1（立即） |
| ~200-5000 页 | BM25 全文搜索 (qmd/ripgrep) | Phase 2（可选） |
| 5000+ 页 | 向量语义搜索 | Phase 4（可选） |

### 多主题知识如何组织？—— 分层而非分库

CLAUDE.md 是一个 **schema（规则文件）**，不是知识本身。它告诉 LLM "如何组织任何主题的知识"。

**方案 A：单 wiki，多主题共存（推荐起步）**
```
wiki/
├── index.md              # 全局索引，按主题分组
├── concepts/
│   ├── llm-training.md      # AI 主题
│   ├── transformer.md       # AI 主题
│   ├── rust-ownership.md    # 编程语言主题
│   └── stoicism.md          # 哲学主题
├── entities/
│   ├── karpathy.md
│   └── marcus-aurelius.md
└── topics/                # 主题概览页（关键！）
    ├── ai-research.md        # "AI 研究" 主题的概览 + 相关页链接
    ├── programming.md        # "编程" 主题的概览
    └── philosophy.md         # "哲学" 主题的概览
```
- index.md 按主题分组，LLM 可快速定位
- `topics/` 目录下每个主题有一个概览页，像"子索引"
- YAML frontmatter 中的 `tags` 字段标记主题归属
- Obsidian graph view 天然可视化主题聚类

**方案 B：多 wiki，每个主题独立 repo（大规模时）**
```
~/wikis/
├── ai-research/         # 独立 wiki，有自己的 raw/ wiki/ CLAUDE.md
├── programming/
└── philosophy/
```
- 每个 wiki 有自己的 CLAUDE.md（可继承公共模板 + 主题特定规则）
- 适合主题间交集很少、各自规模较大的场景

**方案 C：单 repo，子目录隔离**
```
llm-wiki/
├── CLAUDE.md             # 公共 schema
├── ai-research/
│   ├── raw/
│   ├── wiki/
│   └── CLAUDE.local.md   # 主题特定规则（覆盖/扩展公共 schema）
├── programming/
│   ├── raw/
│   └── wiki/
```

**建议**: 从方案 A 开始（最简单），靠 index.md 分组 + topics/ 概览页 + tags 来区分主题。当某个主题膨胀到 ~200+ 页时，再拆成独立 wiki（方案 B）。

### 关键设计原则（来自 Karpathy + 社区）
- **人类永远不直接编辑 wiki**——LLM 是唯一的编辑者
- **index.md 是核心导航**——在 ~100 篇源、~数百页 wiki 的规模下，索引 + 上下文窗口够用，不需要向量 DB
- **log.md 用一致前缀**——如 `## [2026-04-02] ingest | Article Title`，可用 grep 解析
- **矛盾不删除，标记**——新知识与旧知识冲突时创建矛盾章节而非覆盖
- **小步编辑**——LLM 做小的、可逆的改动，不大规模重写
- **Git 即版本控制**——wiki 就是 git repo，免费获得历史、分支、协作

---

## 三、立即可执行方案

### 第 1 步：创建项目骨架
```bash
mkdir -p raw/assets wiki tools prompts
touch wiki/index.md wiki/log.md wiki/overview.md
touch CLAUDE.md README.md .gitignore
git init && git add -A && git commit -m "init: llm-wiki scaffold"
```

### 第 2 步：编写 CLAUDE.md（核心 Schema）
这是最关键的文件。定义：
- 目录结构约定和页面类型（entity / concept / source / comparison / index）
- YAML frontmatter 规范（tags, date, sources, status）
- Ingest 工作流（读源 → 摘要 → 更新索引 → 更新关联页 → 写日志）
- Query 工作流（读索引 → 定位 → 综合 → 可选归档）
- Lint 工作流（矛盾 / 孤儿 / 缺失 / 过时）
- 编辑守则（小步改动、矛盾标记不删除、引用来源）

### 第 3 步：配置 Obsidian
- 用 Obsidian 打开项目根目录作为 Vault
- 安装插件：Marp Slides、Dataview
- 设置 attachment folder → `raw/assets/`
- 绑定快捷键 Ctrl+Shift+D → 下载当前页图片
- 安装 Obsidian Web Clipper 浏览器扩展

### 第 4 步：开始使用
- Web Clipper 剪藏文章到 `raw/`
- 打开 LLM agent（Claude Code / Copilot CLI / Cursor），让它读 CLAUDE.md
- 告诉 LLM："Process the new file in raw/ according to CLAUDE.md"
- 在 Obsidian 中实时查看 wiki 更新

### 技术栈
| 组件 | 工具 | 备注 |
|------|------|------|
| IDE | Obsidian | 查看 wiki、图谱视图、Marp slides |
| 数据摄入 | Obsidian Web Clipper | 网页 → .md |
| LLM Agent | Claude Code / Copilot CLI | 编译 wiki 的核心引擎 |
| 搜索 | ripgrep / qmd | 小规模 rg 够用，大规模用 qmd |
| 版本控制 | Git | 追踪 wiki 演变 |
| 幻灯片 | Marp (Obsidian 插件) | .md → 演示文稿 |
| 数据查询 | Dataview (Obsidian 插件) | frontmatter 查询 |

---

## 四、完整产品方案——需考虑的维度

"There is room here for an incredible new product instead of a hacky collection of scripts." —— Karpathy

### 1. 数据摄入层（Data Ingestion）
- **多源适配器**: 网页(.md)、PDF、YouTube 字幕、Twitter 线程、RSS、API、代码仓库
- **格式标准化**: 统一转为 .md + 本地图片 + YAML frontmatter
- **去重 & 冲突**: URL 指纹去重，内容相似度检测
- **批量 vs 交互**: 支持批量自动摄入，也支持逐篇引导式摄入
- **元数据**: 来源 URL、摄入时间、标签、质量评分、处理状态

### 2. 编译引擎（Compilation Engine）
- **增量编译**: 只处理 raw/ 中新增/变更的文件（基于 git diff 或文件修改时间）
- **概念抽取**: 自动识别实体、概念、关系 → 决定创建/更新哪些页面
- **交叉引用**: 自动建立双向链接 `[[concept]]`，维护反向链接
- **矛盾处理**: 新信息与旧信息冲突时标记而非覆盖
- **索引维护**: 每次编译后自动更新 index.md 和 log.md
- **Schema 驱动**: CLAUDE.md 定义所有编译规则，可 per-wiki 定制

### 3. 查询 & 交互（Query & Interaction）
- **索引优先导航**: LLM 先读 index.md → 定位相关页 → 深入阅读
- **规模分级**: 小(index) → 中(qmd BM25+向量) → 大(RAG pipeline)
- **结果归档**: 好的查询回答自动归档为新 wiki 页面（知识复利）
- **多格式输出**: .md 页面 / Marp slides / matplotlib 图 / 对比表 / canvas
- **工具调用**: LLM 可调用 web search、计算工具等增强回答

### 4. 维护 & 质量（Lint & Health）
- **自动 lint**: 断链检测、孤儿页、矛盾标记、过时内容、缺失概念页
- **Web 补全**: 检测到知识缺口时自动 web search 补充
- **LLM 建议**: 推荐进一步探索的方向和新文章候选
- **质量评分**: 每页的完整度/准确度/引用密度评分
- **Git 版本**: 所有变更可追溯、可回滚

### 5. 工具生态（Tooling）
- **统一 CLI**: `llm-wiki init|ingest|query|lint|export|search`
- **MCP Server**: 将 wiki 能力暴露为工具，供任何 LLM agent 调用
- **搜索引擎**: 集成 qmd 或自建（BM25 + 向量 + LLM 重排序）
- **Obsidian 插件**: 一键 ingest、一键 lint、侧边栏状态面板
- **API 层**: REST/GraphQL API，支持第三方集成

### 6. 规模化路径（Scaling）
| 规模 | 量级 | 导航策略 | 存储 |
|------|------|----------|------|
| 小 | ~100 源，~300 页 | index.md + 上下文窗口 | 纯文件 |
| 中 | ~1000 源，~3000 页 | qmd 混合搜索 | 文件 + SQLite 索引 |
| 大 | ~10000+ 源 | RAG pipeline + 分层摘要 | 文件 + 向量 DB |
| 极大 | 持续增长 | 合成数据微调专属模型 | 文件 + 模型权重 |

### 7. 多场景适配
- **个人研究**: 默认场景，单人 + Obsidian + LLM agent
- **读书笔记**: 按章节摄入，自动建角色/主题/情节线索页
- **团队知识库**: 多人协作，Slack/会议转录自动摄入，人工审核循环
- **竞品分析 / 尽调 / 课程笔记 / 旅行规划**: 预设 schema 模板

### 8. 产品差异化（vs 现有工具）
| vs | 差异 |
|----|------|
| NotebookLM / ChatGPT 文件上传 | 它们是无状态 RAG；我们是持久化编译 wiki |
| Obsidian 本身 | Obsidian 是 IDE，我们是引擎——用户不手动编辑 wiki |
| Notion AI / Mem.ai | 它们在已有笔记上加 AI；我们是 AI 从头构建知识库 |
| 现有社区脚本 | 它们是 pattern 的 demo；我们要做成 product |

---

## 五、实施阶段（Todos）

### Phase 1: 立即可用的骨架
- **scaffold**: 创建目录结构 + README + .gitignore
- **schema**: 编写 CLAUDE.md（核心 schema，定义所有编译/查询/lint 规则）
- **obsidian-setup**: 创建 .obsidian 基础配置 + 推荐插件文档
- **first-ingest**: 手动摄入一篇示例文章，验证完整 ingest → wiki 流程

### Phase 2: 工作流自动化
- **index-system**: 编写 index.md / log.md 自动维护规则（写入 CLAUDE.md）
- **lint-rules**: 定义 lint 检查规则并编写执行脚本
- **search-cli**: 集成 qmd 或编写简易搜索脚本
- **query-archive**: 实现查询结果自动归档回 wiki 的工作流

### Phase 3: 工具化
- **cli-tool**: 统一 CLI `llm-wiki`（init / ingest / query / lint / export）
- **mcp-server**: MCP Server，将 wiki 暴露为 LLM 工具
- **output-formats**: 多格式输出支持（Marp / matplotlib / 对比表）

### Phase 4: 产品化
- **web-ui**: 独立 Web UI（搜索 + 浏览 + 问答）
- **vector-search**: 向量搜索支持（中大规模）
- **multi-wiki**: 多 wiki 管理
- **team-mode**: 多人协作 + 审核流程
