---
title: "Monorepo Harness 引入计划"
type: source
created: 2026-04-24
updated: 2026-04-24
tags: [ai-coding, harness-engineering, monorepo, full-stack]
status: active
sources: [/Users/zhuxiaojiang/work/flow-abc/monorepo-harness-plan.md]
---

# Monorepo Harness 引入计划

> 来源：AI 整理的综合方案文档

## 核心论点

- 在 full-stack monorepo 中引入 Harness，不应把仓库当成一个巨大项目，而应拆成仓库级、子系统级、跨栈 feature 三级治理对象
- Harness 的最小执行单位不是单独的前端任务或后端任务，而是共享单一 Spec、Feature ID 与 DoD 的跨栈 feature
- 落地顺序应先建立 repo 级最小闭环，再用低风险跨栈 feature 试点，最后沉淀模板并逐步扩大自治范围
- monorepo 成败关键不在目录数量，而在边界显式化：contract-first、feature-level validation、trace、rollback、permission scopes

## 关键概念

- [[concepts/ai-flow/harness-engineering]]: Spec-Then-Build with Gates 的通用方法论底座
- [[concepts/ai-flow/monorepo-harness]]: 将 Harness 体系映射到全栈 monorepo 的分层治理方案
- [[topics/ai-flow/ai-coding]]: AI Coding 工程实践总入口

## 摘要

这份方案讨论的不是如何改某一个仓库，而是如何把 [[concepts/ai-flow/harness-engineering]] 引入一个前后端同仓的 full-stack monorepo。文档的核心判断是：monorepo 不应被视为“一个巨大项目”，而应拆成仓库级 Harness、子系统级 Harness，以及围绕单一 Feature Spec 协调的跨栈 Feature Harness。这样才能把前端、后端、shared contracts、rollout 等边界从隐式协作变成显式治理对象。

在资产组织上，方案建议在仓库根目录建立统一的 `/harness` 区域，集中存放 spec、progress、report、risk tiering、permission scopes、trace policy 与模板；在执行上则强调 contract-first 是默认顺序，frontend、backend、integration、rollout 都要绑定同一个 Feature ID 与同一份 Spec 版本，并通过 `progress.json` 和 feature-level AutoPilot Report 维持多 agent 协调。

在验证与采纳路径上，方案特别强调 Gate 3 必须提升到 feature 级，而不是前后端各自 CI 通过就视为完成；回滚顺序要按依赖图逆序设计，trace 也要以 feature 为中心而不是以 agent 为中心。整体引入顺序则主张从仓库级最小闭环和低风险跨栈试点开始，先跑通可验证、可回滚、可追溯的骨架，再逐步放宽自治范围。

## 引用片段

> monorepo 的关键不是多目录，而是多边界。Harness 的作用就是把这些边界显式化。

> Harness 的最小单位不应该是“前端任务”或“后端任务”，而应该是跨栈 feature。

> 不要一开始就在整个 monorepo 全面铺开。
