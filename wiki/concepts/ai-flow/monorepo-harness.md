---
title: "Monorepo Harness"
type: concept
created: 2026-04-24
updated: 2026-04-24
tags: [ai-coding, harness-engineering, monorepo, full-stack]
status: active
sources: [/Users/zhuxiaojiang/work/flow-abc/monorepo-harness-plan.md]
---

# Monorepo Harness

## 定义

Monorepo Harness 是将 [[concepts/ai-flow/harness-engineering]] 的三阶段、三 Gate 与自治护栏，映射到前端、后端、shared contracts 同仓协作环境中的分层治理方法。它的核心不是“让 AI 在一个大仓里随便跑”，而是通过仓库级规则、子系统边界与跨栈 Feature Spec，把自治边界和协作边界都显式化。

## 工作原理

Monorepo Harness 通常分三层运行：

1. **仓库级 Harness**：统一定义 Feature ID、Spec 模板、risk tiering、permission scopes、trace 与 gate 规则。
2. **子系统级 Harness**：分别约束 `apps/web`、`apps/api`、`packages/contracts`、`packages/shared` 等目录的局部上下文、验证方式与高风险边界。
3. **跨栈 Feature Harness**：围绕同一份定稿 Spec 拆出 `contracts`、`backend`、`frontend`、`integration`、`rollout` 子任务，所有子任务共享同一个 Feature ID、Spec 版本与 progress 状态。

默认执行顺序是 **contract-first**：只要 feature 涉及 API、事件、字段或 schema 契约，必须先冻结 contract，再让前后端实现并行推进；而 Gate 3 不再是“前后端各自绿灯”，而是输出一份 feature-level AutoPilot Report，对照 Spec 聚合验证、trace、升级记录与回滚方案。

## 关键护栏

- **权限边界按路径与资源双重隔离**：`packages/contracts/**` 至少视为跨模块风险，`migrations/**`、`infra/**`、生产配置默认进入更高风险层级。
- **验证分三层**：前端验证、后端验证、跨栈 integration 验证必须拆开设计，不能用单边 CI 代替联调闭环。
- **回滚按依赖图逆序**：默认先停 rollout，再回 frontend、backend，最后处理 contracts，避免出现半回滚状态。
- **Trace 以 feature 为中心**：commit、PR、CI、deploy、monitor event 都要回挂到同一个 Feature ID，而不是散落在不同 agent 视角里。

## 优势与局限

- ✅ 让前后端围绕同一份 Spec 与 shared contracts 工作，减少各自理解需求造成的漂移
- ✅ 把 validation、rollback、trace 提升到跨栈 feature 层级，更适合多 agent 协作
- ✅ 支持从低风险试点逐步扩大自治范围，而不是一开始就追求全自动化
- ❌ 前期需要先补齐 Spec 模板、风险分层、权限规则、报告与 CI 聚合机制
- ❌ 如果 contracts 边界、发布节奏或责任分工不清晰，多 agent 自治会退化成并行混乱
- ❌ 不适合一开始就放开 schema migration、infra/prod 变更等高风险自动化

## 应用场景

- `apps/web + apps/api + packages/contracts` 一类的全栈 monorepo
- 多前端应用、多后端服务共享 DTO、schema、domain model 的 monorepo
- 希望把 AI 从“修改单点代码”提升到“交付跨栈 feature”，但仍保留明确 HITL Gate 的团队

## 相关概念

- [[concepts/ai-flow/harness-engineering]]: 提供三阶段、三 Gate 与四层 Harness 的总模型
- [[concepts/ai-flow/agents-md]]: 为仓库级与子系统级 context 提供地图式上下文入口
- [[topics/ai-flow/ai-coding]]: Monorepo Harness 所属的 AI Coding 工程实践主题
