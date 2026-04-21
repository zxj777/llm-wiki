# LLM Wiki

基于 [Karpathy 的 LLM Knowledge Base 理念](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)，用 LLM 增量编译和维护的个人知识库。

## 核心理念

LLM 不是每次查询时从零检索文档碎片（RAG），而是**增量构建和维护一个持久化 wiki**——知识被编译一次，然后持续更新，越用越丰富。

## 目录结构

```
llm-wiki/
├── raw/                    # 原始素材（只读，LLM 不修改）
│   ├── *.md                # 文章、论文、笔记等
│   └── assets/             # 素材中引用的图片
├── wiki/                   # LLM 维护的知识库（LLM 是唯一编辑者）
│   ├── index.md            # 全局索引（每页一行摘要，按主题分组）
│   ├── log.md              # 操作日志（摄入/查询/lint 记录）
│   ├── concepts/           # 概念页（技术、方法、理论）
│   ├── entities/           # 实体页（人物、组织、项目）
│   ├── sources/            # 每个原始素材的摘要页
│   ├── comparisons/        # 对比分析页
│   └── topics/             # 主题概览页（充当子索引）
└── CLAUDE.md               # Schema（告诉 LLM 如何维护 wiki）
```

## 三种操作

1. **Ingest（摄入）**：新素材丢进 `raw/` → LLM 读取 → 拆解信息分发到 wiki 多个页面 → 更新索引和日志
2. **Query（查询）**：提问 → LLM 读索引定位 → 深入阅读相关页面 → 综合回答 → 好的回答归档回 wiki
3. **Lint（检查）**：健康检查 → 断链、矛盾、孤儿页、缺失概念 → 提出修复建议

## 使用方式

1. 用 Obsidian 打开本目录作为 Vault
2. 用 Obsidian Web Clipper 抓取文章到 `raw/`
3. 让 LLM agent 读取 `CLAUDE.md`，然后处理 `raw/` 中的新文件
4. 在 Obsidian 中浏览 wiki，提问，探索

## 这是模板还是一个具体 wiki？

这个仓库现在更适合被理解为一个 **starter / template**：

- `CLAUDE.md` 定义了 llm-wiki 的规则
- `tools/` 提供了 CLI 运行时
- `README.md` 解释了工作流

你可以直接在这个仓库里持续积累自己的知识库；也可以把它当模板，为每个主题复制一份独立仓库。

### 推荐理解

- **如果你只有一个 wiki**：直接在这个仓库里用，没问题
- **如果你以后会有多个 wiki**：把这个仓库当模板，每个 wiki 单独建一个 repo 更清晰

所以前面说的“建仓”，更准确地说是：

1. **如果这是你的主 wiki 仓库**：直接 clone 下来，然后开始用
2. **如果这是模板仓库**：从模板创建一个新的具体 wiki 仓库

也就是说，`init` 不是为了替代 `git clone`，而是为了：

- 在一个空目录里快速初始化 llm-wiki 结构
- 未来支持多 wiki 时，快速创建一个新的 wiki 工作区
- 让 CLI 在任何目录都能落起完整结构，而不依赖手工建文件夹

## CLI 用法

统一入口：

```bash
pnpm llm-wiki <command> [args]
```

### `init [root]`

初始化一个 llm-wiki 目录结构。

```bash
pnpm llm-wiki init
pnpm llm-wiki init ./my-wiki
```

- `root`：可选，初始化到哪个目录；默认当前目录

会创建：

- `raw/`
- `raw/assets/`
- `wiki/` 及其子目录
- `wiki/index.md`
- `wiki/log.md`

### `status`

查看当前 wiki 的整体状态。

```bash
pnpm llm-wiki status
```

会显示：

- `raw` 文档数
- `wiki` 页面数
- 各页面类型数量

### `lint [wikiDir]`

做 wiki 健康检查。

```bash
pnpm llm-wiki lint
pnpm llm-wiki lint wiki
```

- `wikiDir`：可选，要检查的目录；默认 `wiki`

当前检查项：

- 断链
- 孤儿页
- `index.md` 一致性
- frontmatter 完整性
- `disputed` 页面
- `stub` 页面

### `search <query> [options]`

全文搜索 wiki，必要时也搜 raw。

```bash
pnpm llm-wiki search transformer
pnpm llm-wiki search attention --type concept
pnpm llm-wiki search karpathy --all --json
```

- `query`：必填，搜索词

参数：

- `-t, --type <type>`：限制页面类型，支持 `concept | entity | source | comparison | topic`
- `-n, --max <num>`：最多返回几条，默认 `10`
- `-a, --all`：同时搜索 `raw/`
- `--titles`：只搜索标题
- `--tags`：只搜索 tags
- `--json`：JSON 输出

### `query <query> [options]`

给 agent 提供“查询上下文候选”。

```bash
pnpm llm-wiki query transformers
pnpm llm-wiki query attention --type concept
pnpm llm-wiki query karpathy --json
```

- `query`：必填，查询词

参数：

- `-t, --type <type>`：限制页面类型
- `-n, --max <num>`：最多返回几条，默认 `5`
- `--titles`：只搜索标题
- `--tags`：只搜索 tags
- `--json`：JSON 输出
- `--wiki-only`：只搜索 `wiki/`，否则默认联搜 `wiki/ + raw/`

`query` 和 `search` 的区别：

- `search` 更偏向人工检索
- `query` 更偏向给 LLM / agent 准备候选上下文

### `ingest <raw-file> [options]`

为某个 raw 文档准备 ingest 流程。

```bash
pnpm llm-wiki ingest raw/demo.md
pnpm llm-wiki ingest raw/demo.md --write-stub
pnpm llm-wiki ingest raw/demo.md --json
```

- `raw-file`：必填，要处理的原始文件路径

参数：

- `--write-stub`：直接创建 `wiki/sources/*.md` stub，并更新 `index.md`、`log.md`
- `--json`：JSON 输出

两种模式：

1. **不带 `--write-stub`**
   - 只输出 ingest plan
   - 适合 agent 先看计划再执行
2. **带 `--write-stub`**
   - 真正落文件
   - 创建 source stub
   - 更新索引和日志

### `export [options]`

导出当前 wiki 页面清单。

```bash
pnpm llm-wiki export
pnpm llm-wiki export --format markdown
```

参数：

- `--format <json|markdown>`：输出格式，默认 `json`

导出字段包括：

- `id`
- `path`
- `title`
- `type`
- `status`
- `sources`

## 典型交互方式

最常见的调用关系是：

1. **你** 提需求：`处理 raw/demo.md`
2. **终端 agent** 调 CLI：`pnpm llm-wiki ingest raw/demo.md --write-stub`
3. **agent** 再按 `CLAUDE.md` 继续补充 source/concept/entity/topic 页面
4. **agent** 再调用：
   - `pnpm llm-wiki lint`
   - `pnpm llm-wiki query "某个问题"`

所以：

- **人**：表达意图
- **agent**：编排流程
- **CLI**：执行稳定、可复用的动作

## 推荐 Obsidian 插件

- **Marp Slides** — markdown 转幻灯片
- **Dataview** — 基于 frontmatter 的动态查询
- **Obsidian Web Clipper**（浏览器扩展）— 网页转 .md

## Obsidian 配置建议

- Settings → Files and links → Attachment folder path → `raw/assets/`
- Settings → Hotkeys → 搜索 "Download" → 绑定 Ctrl+Shift+D 下载当前页图片
