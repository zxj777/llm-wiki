---
title: React 包架构与 renderer 解耦
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, architecture, packages, frontend]
status: active
sources: []
---

# React 包架构与 renderer 解耦

## 所属主题

[[topics/react/source-code]]

## 阅读目标

理解 React monorepo 的包拆分设计哲学：reconciler 与 renderer 为何解耦，各包职责边界在哪里，以及为什么 Hooks 必须在顶层调用（链表顺序依赖）。

## 入口函数/文件

- `packages/` 目录整体结构
- `packages/shared/` — 跨包共享的常量和工具
- `packages/react-reconciler/src/ReactFiberReconciler.js` — 向上暴露给 renderer 的接口
- `packages/react/src/ReactCurrentDispatcher.js` — Dispatcher injection 机制

## 调用链路（设计概述）

```
# 包依赖关系（单向）
react → （不依赖任何渲染包）
  → 只持有 ReactCurrentDispatcher.current（引用，无实现）
  → 只持有 ReactCurrentBatchConfig、ReactCurrentOwner 等 shared state

react-reconciler → react（读取 dispatcher 引用）
  → react-reconciler 在渲染时注入 dispatcher 实现：
    ReactCurrentDispatcher.current = HooksDispatcherOnMount  # 挂载时
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate # 更新时
  → 用户调用 useState() 时：
    → ReactCurrentDispatcher.current.useState(initialState)
    → 实际执行 reconciler 中的 mountState / updateState

react-dom → react-reconciler（调用 createContainer/updateContainer）
  → 实现 hostConfig（createInstance = document.createElement 等）
  → 在构建时（不是运行时），hostConfig 通过 rollup 内联到 react-reconciler 中
  → 因此 react-dom 最终 bundle = react-reconciler + hostConfig 实现

scheduler → （完全独立，不依赖 react 任何包）
  → react-reconciler 通过 import 使用 scheduler
  → 可独立安装使用：import { scheduleCallback } from 'scheduler'

# 包职责边界
packages/react/
  ├── createElement / cloneElement / createContext / forwardRef / memo
  ├── 所有 Hook 的类型声明（实现在 reconciler）
  └── ReactCurrentDispatcher（injection 接口）

packages/react-reconciler/
  ├── Fiber 数据结构（ReactFiber.js）
  ├── Work Loop（ReactFiberWorkLoop.js）
  ├── Hook 实现（ReactFiberHooks.js）
  ├── Reconciliation/Diff（ReactChildFiber.js）
  ├── Commit 三阶段（ReactFiberCommitWork.js）
  ├── Lanes 优先级（ReactFiberLane.js）
  └── Error Boundary / Suspense / Context

packages/scheduler/
  ├── MessageChannel 宏任务（scheduleCallback）
  ├── 最小堆任务队列（peek/push/pop）
  └── shouldYield（时间切片检测）

packages/react-dom/
  ├── hostConfig 实现（createInstance → document.createElement）
  ├── 事件系统（ReactDOMEventListener + SyntheticEvent）
  ├── createRoot / hydrateRoot / render（legacy）
  └── react-dom/server（renderToPipeableStream）

packages/react-native-renderer/
  └── 与 react-dom 实现相同的 hostConfig 接口，宿主操作通过 Native Modules 实现

# 为什么 react 和 react-dom 分包？
1. 平台无关性：react 包可在 react-native、react-three-fiber 等平台复用
2. 包体积优化：服务端只需 react + react-dom/server，不需要 DOM 操作代码
3. 未来扩展：新 renderer 只需实现 hostConfig，无需改动 react 或 reconciler

# Injection 机制（解耦手段）
# react 包不 import react-reconciler，但两者共享同一个 dispatcher 对象引用
# 通过 __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED 传递
React.__SECRET_INTERNALS.ReactCurrentDispatcher = { current: null }
  → reconciler 在 renderWithHooks 开始时设置 .current = HooksDispatcherOnMount/Update
  → reconciler 在 renderWithHooks 结束后重置 .current = ContextOnlyDispatcher
  → 在 render 函数外部调用 hooks：.current === ContextOnlyDispatcher → 抛出错误
```

## 涉及核心概念

- [[concepts/react/host-config]]
- [[concepts/react/fiber-architecture]]
- [[concepts/react/hooks-internals]]

## 涉及实体

- [[entities/react/react-reconciler]]
- [[entities/react/react-dom]]
- [[entities/react/react-scheduler]]

## 常见问题

- **为什么 `react` 包本身不包含任何渲染逻辑？**
  设计目标是让同一个 `react` 包能在所有平台复用（browser/native/canvas/terminal）。渲染逻辑封装在 renderer 包中（react-dom、react-native-renderer 等），通过 `ReactCurrentDispatcher` 注入机制在运行时绑定；`react` 包只提供 API 外壳和共享状态，不依赖任何渲染实现，因此可以作为 peer dependency 被多个 renderer 共享。

- **`react-reconciler` 如何在构建时与 renderer 绑定？**
  通过 Rollup 构建时的"包替换"机制：react-dom 的构建脚本将 `ReactFiberHostConfig.js`（hostConfig 接口占位）替换为 `ReactDOMHostConfig.js`（实际 DOM 实现），最终打包到同一个 bundle 中。这意味着 react-dom 的 bundle 包含了完整的 reconciler + DOM hostConfig，没有运行时的动态 import 开销，也是 react-dom 包体积远大于 react 包的原因。

- **多个 React 实例（两个 react 包）为什么会导致 hooks 报错？**
  当项目中存在两个 `react` 实例时，renderer（react-dom）引用的是实例 A 的 `ReactCurrentDispatcher`，但用户代码（某个依赖）引用的是实例 B 的 `ReactCurrentDispatcher`。reconciler 将 dispatcher 注入到实例 A 的引用，但用户 hooks 通过实例 B 的引用读取，得到 null（`ContextOnlyDispatcher`），导致"Hooks can only be called inside of the body of a function component"错误。解决方案：在 webpack/vite 中将 `react` 和 `react-dom` alias 到同一个文件。

- **为什么 React Hooks 规则（必须在顶层调用）是必须的？**
  Hooks 的状态通过**链表**存储在 fiber 节点的 `memoizedState` 字段上，每次渲染时按照调用顺序依次读取链表节点（mount 时创建节点，update 时按序遍历）。如果在条件语句或循环中调用 hooks，会导致链表节点的顺序在不同渲染间不一致——`updateState()` 按链表顺序读取第 N 个节点，但这个节点可能对应不同的 hook，产生状态混乱。这不是技术限制，而是链表实现的设计约束（相比使用 Map/Key 存储，链表实现更轻量）。

## 延伸阅读

- [[topics/react/custom-renderer]]：基于 react-reconciler 构建自定义渲染器
- [[concepts/react/host-config]]：hostConfig 接口详解
- [[entities/react/react-reconciler]]：reconciler 包的核心职责
