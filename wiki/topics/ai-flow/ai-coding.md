---
title: "AI Coding 工程实践"
type: topic
created: 2026-04-23
updated: 2026-04-24
tags: [ai-coding, topic, best-practices, agents-md]
status: active
sources: [raw/ai-flow/一个文件让 AI Coding 效率翻倍：AGENTS.md 实践指南.md, /Users/zhuxiaojiang/work/flow-abc/monorepo-harness-plan.md]
---

# AI Coding 工程实践

## 概述

AI Coding 工程实践是一系列让 AI Agent 在真实项目中高效工作的方法论和工具链。核心目标是实现「打开即理解、改完即验证」的开发体验——AI 打开项目就能理解上下文，改完代码就能自主构建、启动和验证。

## 核心概念

- [[concepts/ai-flow/agents-md]]: 给 AI Agent 使用的项目上下文文件格式，核心理念是"地图而非手册"
- [[concepts/ai-flow/harness-engineering]]: 让 AI 自主完成「改 → 构建 → 启动 → 验证」闭环的工程方法
- [[concepts/ai-flow/monorepo-harness]]: 在全栈 monorepo 中落地 Harness 的分层治理方案
- **验证闭环**：改完代码不算完，跑通接口才算完。包括 curl 验证规范、Agent Browser 页面验证等

## 关键实体

- [[entities/ai-flow/kiritomoe]]: AI Coding 实践系列作者，AGENTS.md 和 Harness Engineering 方法论的提出者

## 重要来源

- [[sources/ai-flow/一个文件让 AI Coding 效率翻倍：AGENTS.md 实践指南]]: kiritomoe 的实践总结，涵盖 AGENTS.md 编写指南和五大工程实践
- [[sources/ai-flow/monorepo-harness-plan]]: 面向 full-stack monorepo 的 Harness 引入蓝图与渐进采纳路径

## 开放问题

- AGENTS.md 与特定工具配置文件（CLAUDE.md、.cursorrules 等）的最佳共存策略
- 大型 monorepo 中多层级 AGENTS.md 的继承与覆盖机制
- feature-level AutoPilot Report 与 repo CI/CD 的最佳耦合方式
- 验证闭环在前端视觉测试方面的进一步自动化方案
- Harness Engineering 在团队协作场景中的规范化推广路径
