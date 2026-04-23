---
title: "AGENTS.md"
type: concept
created: 2026-04-23
updated: 2026-04-23
tags: [ai-coding, agents-md, project-context, best-practices]
status: active
sources: [raw/ai-flow/一个文件让 AI Coding 效率翻倍：AGENTS.md 实践指南.md]
---

# AGENTS.md

## 定义

AGENTS.md 是一个简单的开放格式，用于指导 AI Coding Agent 在你的项目中工作。你可以把它理解为 **给 AI 看的 README** ——README.md 是给人类看的项目说明，AGENTS.md 则是给 AI Agent 看的项目指令，包含构建命令、编码规范、测试要求、安全注意事项等 AI 需要知道的上下文。

## 与其他格式的关系

| 工具 | 上下文文件 |
| --- | --- |
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` / `.cursor/rules` |
| Copilot | `.github/copilot-instructions.md` |
| Gemini CLI | `GEMINI.md` |
| Cline | `.clinerules` |

AGENTS.md 最终成为事实标准，由 Linux Foundation 下属的 Agentic AI Foundation 托管。Claude Code 仍用 CLAUDE.md，但内容完全通用，一个软链接即可兼容：`ln -s AGENTS.md CLAUDE.md`。

## 编写原则

### 地图而非手册（Map, not Manual）

AGENTS.md 应该是一张**约 200 行的导航地图**，告诉 Agent「去哪里找什么」，详细内容放在链接的文档里。什么都重要的时候，什么都不重要——如果把所有内容都塞进 AGENTS.md，它会变成一个巨型文件，AI 的注意力被稀释。

### 渐进式披露

只有两类内容应该直接写在 AGENTS.md 中：

1. **AI 理解项目全貌的必要信息** ——技术栈、仓库结构、核心模块、分层架构
2. **违反会直接导致问题的硬性规则** ——编码规约、命名约定、禁止项

其他详细信息通过**文档链接和引用**指向对应的文档。判断标准：**如果 AI 不知道这条信息就会写出错误的代码，放 AGENTS.md；如果只是写出不够好的代码，放详细文档，AGENTS.md 里放链接。**

## AGENTS.md 通用模板（9 章节）

```markdown
# AGENTS.md

## 1. 项目概述
一段话说清楚：项目是什么、技术栈、仓库结构。
前 10 行必须让 AI 建立项目心智模型。

## 2. 快速命令
构建、启动、格式化、质量检查的命令速查表。
环境变量配置说明（env 文件位置、启动脚本自动 source）。

## 3. 后端架构
包结构树（ASCII）+ 每个包的用途注释。
核心子系统的简要说明 + 详细文档链接。
前后端术语映射（如有差异）。

## 4. 前端架构
技术栈、路由方案、API 层约定、组件库规范。
详细文档链接。

## 5. 关键约定
5-10 条硬性编码规则（违反会直接导致问题的）。
每条规则附详细文档链接。

## 6. 本地开发及验证流程
「改 → 构建 → 启动 → 验证」的完整闭环。
curl 验证模板、Token 获取、日志路径。

## 7. 质量检查
lint、format、build、test 命令矩阵。

## 8. 参考项目约定
参考项目列表 + 优先级规则。

## 9. 文档导航
所有详细文档的索引表。
```

建议控制在 **200 行以内**。超过这个范围，考虑将细节拆分到 `docs/` 下的专题文档。

## 实施建议

- **从 `/init` 开始**：大多数 AI Coding 工具提供 `/init` 命令自动生成初始 AGENTS.md
- **Bad Case 驱动**：不要试图一次写完。从实际使用中发现的 bad case 出发，判断「如果 AGENTS.md 里多写一条 XX 规则，AI 是不是就不会犯这个错」
- **规则要有执行力**：重要的规则要有对应的自动化检查。能自动化检查的 > 写在 AGENTS.md 中的 > 口头约定的
- **团队共建**：鼓励团队成员在遇到 AI bad case 时主动补充规则，遵循「地图」原则决定维护位置

## 相关概念

- [[concepts/ai-flow/harness-engineering]]: AGENTS.md 是 Harness Engineering 的核心组件之一
- [[entities/ai-flow/kiritomoe]]: AGENTS.md 实践方法论的提出者和推广者
