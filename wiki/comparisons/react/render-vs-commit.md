---
title: Render 阶段 vs Commit 阶段
type: comparison
created: 2026-04-21
updated: 2026-04-21
tags: [react, render, commit]
status: active
sources: []
---

# Render 阶段 vs Commit 阶段

## 对比维度

| 维度 | Render 阶段 | Commit 阶段 |
|------|-------------|-------------|
| 可中断性 | ✅ 可中断、可恢复、可丢弃重来 | ❌ 不可中断，必须同步完成 |
| 主要操作 | 构建 workInProgress Fiber 树，调用组件函数 / render 方法 | 将 flags 标记的变更应用到真实 DOM |
| 副作用 | ❌ 纯计算，无 DOM 操作，无外部副作用 | ✅ DOM 操作、useLayoutEffect、ref 更新、useEffect 调度 |
| 执行次数 | 可能被重复执行（中断后重新开始） | 每次更新只执行一次 |
| 输出产物 | 带 flags 标记的 workInProgress 树（finishedWork） | 更新后的 DOM + 触发副作用 |
| 重要函数 | `beginWork` / `completeWork` / `workLoopSync` / `workLoopConcurrent` | `commitBeforeMutationEffects` / `commitMutationEffects` / `commitLayoutEffects` |
| 耗时特征 | 计算密集，可切片（concurrent 模式下每片 ≤5ms） | IO 密集（DOM 操作），通常较短但阻塞绘制 |

## 分析

Render 阶段是 React 的**纯计算阶段**，工作内容是从根节点开始对每个 Fiber 节点执行 `beginWork`（向下深入，调用组件、处理 Hooks、产生子 Fiber）和 `completeWork`（向上回溯，创建/更新 DOM 实例、收集 subtreeFlags），最终产出一棵带有副作用标记（flags）的 workInProgress 树。由于这个过程是纯计算、没有可观察的副作用，React 可以随时中断并重新开始，这正是并发模式的基础。

Commit 阶段接收 render 阶段产出的 `finishedWork` 树，分三个子阶段顺序执行：
1. **beforeMutation**（`commitBeforeMutationEffects`）：读取 snapshot、调度 `useEffect`（异步，通过 `scheduleCallback` 加入微任务队列）
2. **mutation**（`commitMutationEffects`）：真正执行 DOM 插入/更新/删除，执行 `useLayoutEffect` 的 cleanup，更新 ref 为 null
3. **layout**（`commitLayoutEffects`）：执行 `useLayoutEffect` 的 setup，执行 `componentDidMount/Update`，更新 ref

Commit 阶段不可中断的原因：此时 DOM 处于中间状态，外部观察者（用户、测试工具）必须看到一致的 UI，不能让浏览器在"半更新"状态下绘制。因此 React 在 commit 期间持有独占锁（`executionContext |= CommitContext`）。

Render 阶段的函数可能被多次调用（如并发模式下中断重试）是一个关键副作用约束：**render 函数（函数组件体、getDerivedStateFromProps）必须是纯函数**，否则重复执行会产生不一致。React 严格模式（Strict Mode）在开发环境中主动双调用 render 函数，就是为了暴露此类问题。

## 结论

- **理解副作用执行顺序**：牢记 useLayoutEffect 在 commit-layout 子阶段同步执行，useEffect 在 commit 之后异步执行。
- **优化 render 性能**：render 阶段可被切片，优化重点是减少不必要的组件调用（memo / bailout）；commit 阶段无法切片，优化重点是减少 DOM 操作数量。
- **调试时序问题**：某个状态在 DOM 更新前后读到的值不一致，要区分是 render 阶段的 state 计算问题，还是 commit 阶段 ref 更新时机问题。

## 相关概念

- [[comparisons/react/useeffect-vs-uselayouteffect]]：两种 effect 在 commit 不同子阶段的执行时机
- [[comparisons/react/sync-vs-concurrent]]：render 阶段的可中断性如何由渲染模式决定
- [[comparisons/react/mount-vs-update]]：render 和 commit 阶段在首次挂载和更新时的差异
- [[comparisons/react/fiber-vs-vdom]]：render 阶段产出的 Fiber 树结构
