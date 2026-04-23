---
title: "一个文件让 AI Coding 效率翻倍：AGENTS.md 实践指南"
type: source
created: 2026-04-23
updated: 2026-04-23
tags: [ai-coding, agents-md, harness-engineering, best-practices]
status: active
sources: [raw/ai-flow/一个文件让 AI Coding 效率翻倍：AGENTS.md 实践指南.md]
---

# 一个文件让 AI Coding 效率翻倍：AGENTS.md 实践指南

> 作者：[[entities/ai-flow/kiritomoe|kiritomoe]]
> 来源：微信公众号
> 发布时间：2026-04-20

## 核心论点

- AGENTS.md 是给 AI Agent 看的项目指令文件，相当于"给 AI 的 README"
- 核心理念是**地图而非手册**——约 200 行的导航地图，告诉 Agent"去哪里找什么"
- 配合仓库聚合、统一环境配置、验证闭环、自动化检查、参考项目引入五大实践，形成「打开即理解、改完即验证」的开发体验
- 规则要有执行力：能自动化检查的 > 写在 AGENTS.md 中的 > 口头约定的

## 关键概念

- [[concepts/ai-flow/agents-md]]: 给 AI Agent 使用的项目上下文文件格式
- [[concepts/ai-flow/harness-engineering]]: 让 AI 自主完成「改 → 构建 → 启动 → 验证」闭环的工程方法
- [[entities/ai-flow/kiritomoe]]: 本文作者，AI Coding 实践系列作者

## 所属主题

- [[topics/ai-flow/ai-coding]]: AI Coding 工程实践总入口

## 摘要

**AGENTS.md 是什么？** AGENTS.md 是一个简单的开放格式，用于指导 AI Coding Agent 在你的项目中工作。在仓库根目录创建 `AGENTS.md` 文件，写入项目概述、构建命令、编码规范、测试要求、安全注意事项等 AI 需要知道的上下文。大型 monorepo 可以在子目录放嵌套的 AGENTS.md，Agent 会读取最近的那个。

**格式统一历程：** 最早由 Anthropic 通过 Claude Code 的 `CLAUDE.md` 普及，随后各家工具跟进自己的版本（Cursor 的 `.cursorrules`、Copilot 的 `.github/copilot-instructions.md`、Cline 的 `.clinerules` 等）。2025 年 Sourcegraph AMP 提议统一为 `AGENT.md`，随后 OpenAI 买下 `agents.md` 域名提议复数形式 `AGENTS.md`，最终成为事实标准，由 Linux Foundation 下属的 Agentic AI Foundation 托管。

**五大实践：**

1. **仓库聚合**：解决前后端上下文割裂。从多仓分离到 monorepo，让 AI 在同一窗口中看到全栈代码。

2. **统一环境配置**：所有本地环境变量统一放在 `~/.<project>_env`，启动脚本自动 `source`。配套一键启动脚本封装 JDK 检测、优雅关闭、健康检查等逻辑，降低 AI 认知负担。

3. **验证闭环**：改完代码不算完，跑通接口才算完。定义严格的 curl 验证规范（每个 curl 独立执行、用临时文件传递数据、token 获取模板化），让 Agent 稳定跑通「改 → 构建 → 启动 → 验证」循环。前端可用 Agent Browser 验证页面渲染。

4. **自动化检查**：AGENTS.md 中的规则必须有自动化检查配套。如分层架构依赖检查，通过 shell 脚本扫描 Java import 语句，按包路径判断层级，违规时输出 WHAT + WHY + HOW 的可操作错误信息。

5. **参考项目引入**：不写文档，直接把源码放进来。通过 git submodule 引入参考项目（开源网关、私域组件库等），配合架构说明文档，让 AI 需要细节时直接读源码——源码永远不会过时。

**AGENTS.md 通用模板（9 章节）：** 项目概述、快速命令、后端架构、前端架构、关键约定、本地开发及验证流程、质量检查、参考项目约定、文档导航。建议控制在 200 行以内。

## 引用片段

> AGENTS.md 的第一原则是渐进式披露——它是一张地图，不是一本手册。

> 如果 AI 不知道这条信息就会写出错误的代码，放 AGENTS.md；如果只是写出不够好的代码，放详细文档，AGENTS.md 里放链接。

> 源码永远不会过时，它就是最准确的文档。

> 脚本是人和 AI 共用的，AGENTS.md 和 docs/ 下的文档主要是给 AI 的上下文，人不需要刻意阅读但可以参考。

> 为 AI 写好 AGENTS.md 的过程，也是在为团队做一次知识梳理。
