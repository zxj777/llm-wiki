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

## 推荐 Obsidian 插件

- **Marp Slides** — markdown 转幻灯片
- **Dataview** — 基于 frontmatter 的动态查询
- **Obsidian Web Clipper**（浏览器扩展）— 网页转 .md

## Obsidian 配置建议

- Settings → Files and links → Attachment folder path → `raw/assets/`
- Settings → Hotkeys → 搜索 "Download" → 绑定 Ctrl+Shift+D 下载当前页图片
