---
title: 项目方法论
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [methodology, git, testing, agile, fullstack]
status: active
sources: []
---

# 项目方法论

## 概述

方法论是把个人能力放大到团队产出的乘数。Git 工作流决定了多人并行开发的效率与冲突成本，Code Review 决定了代码长期可维护性与知识传递，测试策略决定了重构与发布的信心，敏捷与文档决定了产品迭代节奏与新人上手速度，技术债务管理决定了系统的长期健康度。

这些议题没有银弹：小团队适用 Trunk-Based + 高频集成，大型组织可能需要 GitFlow + 发布列车；初创项目可以接受高技术债换取速度，成熟产品则必须建立偿债节奏。关键是**显式地选择**而不是被动滑入。

## 核心概念

- git workflow: GitFlow / Trunk-Based / GitHub Flow 对比
- code review: Review 重点、给/收反馈、自动化辅助
- testing strategy: 测试金字塔、单元/集成/E2E、契约测试
- agile: Scrum / Kanban、迭代节奏、估算
- documentation: ADR、README、API 文档、知识库
- technical debt: 债务识别、量化、偿还节奏

## 关联板块

- 工程化：[[topics/fullstack/engineering]]（CI/CD 是方法论的执行层）
- 安全：[[topics/fullstack/security]]（安全左移的方法论支撑）
- 知识库：本 Wiki 自身就是 documentation 实践

## 推荐学习路径

**初级**
1. Git 基本命令：branch、merge、rebase、cherry-pick
2. 写出可读的 commit message（Conventional Commits）
3. 单元测试入门（Jest / Vitest）

**进阶**
1. git workflow：选择适合团队的工作流
2. code review：建立团队 Review checklist
3. testing strategy：测试金字塔与覆盖率取舍
4. documentation：引入 ADR 记录关键决策

**深入**
1. agile：在团队中落地迭代节奏与回顾
2. technical debt：债务台账与偿还计划
3. 度量体系：DORA 指标（部署频率、变更失败率等）
4. 团队学习机制：分享会、读书会、Wiki 沉淀

## 开放问题

- LLM 辅助编码大幅提升人均产出后，Code Review 的形态会怎样变化？
- 远程 / 异步协作如何改变敏捷的核心实践（站会、迭代、回顾）？
