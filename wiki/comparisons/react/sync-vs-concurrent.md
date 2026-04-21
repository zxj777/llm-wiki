---
title: 同步模式 vs 并发模式
type: comparison
created: 2026-04-21
updated: 2026-04-21
tags: [react, concurrent]
status: active
sources: []
---

# 同步模式 vs 并发模式

## 对比维度

| 维度 | 同步模式（Legacy） | 并发模式（Concurrent） |
|------|-------------------|----------------------|
| 入口 API | `ReactDOM.render()` | `ReactDOM.createRoot().render()` |
| 工作循环 | `workLoopSync`（无 shouldYield 检查） | `workLoopConcurrent`（每节点检查 `shouldYield()`） |
| 可中断性 | ❌ 一次性同步完成整棵树 | ✅ 可中断，让出主线程后下帧继续 |
| 时间切片 | ❌ 不支持 | ✅ 每个时间片 ≤5ms（Scheduler 驱动） |
| Suspense 完整支持 | ⚠️ 仅 lazy 加载，不支持数据 Suspense | ✅ 完整支持（数据获取、Selective Hydration） |
| startTransition | ❌ 无效（降级为同步） | ✅ 将更新标记为低优先级 Transition Lane |
| 副作用调用次数 | 每次更新精确执行一次 | 可能因中断重试而多次调用 render 函数 |
| Strict Mode 双调用 | ✅ 开发环境双调用 render | ✅ 开发环境双调用 render（更严格） |
| 兼容性 | 兼容 React 16 生命周期旧代码 | 不兼容旧版 `UNSAFE_` 生命周期（行为不可预测） |
| 适用场景 | 渐进迁移、旧代码库 | 新项目、需要流畅响应的交互密集型应用 |

## 分析

同步模式（Legacy Mode）的工作循环 `workLoopSync` 是一个简单的 while 循环，持续处理工作单元直到 workInProgress 为 null。整个过程在一次 JS 任务中完成，浏览器无法在中途渲染或响应用户输入。对于小应用和简单组件树，这没有问题；但当树很深或组件计算量大时，单次 render 可能超过 16ms，导致掉帧。

并发模式（Concurrent Mode，React 18 默认）的 `workLoopConcurrent` 在每次 `performUnitOfWork` 后调用 `shouldYield()`，检查是否超过时间片预算（通常 5ms）。若超过，则将当前进度（workInProgress 指针）保留，通过 Scheduler 调度下一帧继续。这样主线程每帧都有机会处理用户输入、动画等高优先级任务，极大提升了复杂应用的响应性。

并发模式引入的核心能力：
- **startTransition**：将 UI 更新标记为"可打断的低优先级"，高优先级更新（如输入）可插队。
- **useDeferredValue**：推迟某个值的更新，用旧值先渲染，新值在后台准备好后再切换。
- **Suspense 数据获取**：组件可以在等待异步数据时挂起，React 显示 fallback，数据就绪后恢复渲染。
- **Selective Hydration**：SSR 场景下，用户交互的组件优先 hydrate，其余部分延后。

并发模式的代价是：render 函数可能被多次调用（中断重试），因此组件函数体必须是幂等的纯函数。`UNSAFE_componentWillMount` 等旧生命周期在并发模式下行为不可预测，React 18 已发出弃用警告。

## 结论

- **新项目**：直接使用 `createRoot` + 并发模式，配合 `startTransition` 优化用户体验。
- **旧项目迁移**：可先保持 `ReactDOM.render` 同步模式，逐步清理 `UNSAFE_` 生命周期后再切换 `createRoot`。
- **纯展示/静态页面**：同步模式足够，不必为无交互的内容引入并发复杂性。
- **高频交互（搜索、拖拽、动画）**：强烈推荐并发模式 + `startTransition`，避免输入卡顿。

## 相关概念

- [[comparisons/react/render-vs-commit]]：并发模式对 render 阶段可中断性的具体实现
- [[comparisons/react/lanes-vs-expiration-time]]：并发模式下优先级调度的 Lanes 模型
- [[comparisons/react/fiber-vs-vdom]]：Fiber 链表结构是可中断性的基础
