---
title: React 源码阅读总入口
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, frontend]
status: active
sources: [raw/kasong-react-source-book.md]
---

# React 源码阅读总入口

## 概述

React 源码采用 monorepo 结构，核心包如下：

- `packages/react`：对外暴露的 React API（createElement、hooks 类型等），极薄的一层
- `packages/react-dom`：浏览器渲染器，实现 host config，调用 reconciler
- `packages/react-reconciler`：核心调度与协调逻辑（Fiber、workLoop、diff、commit）
- `packages/scheduler`：任务调度器，基于 MessageChannel 实现时间切片

## 推荐阅读顺序

### 初学者路径（了解 React 是怎么跑起来的）

1. **[[topics/react/initial-render]]** — 首次渲染全链路（入口：`ReactDOM.createRoot().render()`）
2. **[[concepts/react/fiber-architecture]]** — 理解 Fiber 节点结构（`ReactFiber.js`）
3. **[[concepts/react/work-loop]]** — workLoopSync / workLoopConcurrent
4. **[[topics/react/state-update]]** — useState 触发更新（`dispatchSetState`）
5. **[[topics/react/effect-system]]** — useEffect 执行时机（`commitPassiveMountEffects`）

### 进阶路径（理解并发与调度）

1. **[[topics/react/lanes]]** — Lanes 优先级位运算（`ReactFiberLane.js`）
2. **[[topics/react/concurrent-scheduler]]** — Scheduler 时间切片（`MessageChannel + shouldYield`）
3. **[[topics/react/transition]]** — startTransition 与 TransitionLane 抢占
4. **[[topics/react/batching]]** — 批量更新机制（React 18 automatic batching）
5. **[[topics/react/suspense]]** — Suspense + thenable 的 unwind 机制

### 深入路径（高阶场景与架构）

1. **[[topics/react/ssr-hydration]]** — renderToPipeableStream + hydrateRoot + Selective Hydration
2. **[[topics/react/error-boundary]]** — throwException + unwindWork + componentDidCatch
3. **[[topics/react/package-architecture]]** — monorepo 设计与 renderer 解耦
4. **[[topics/react/custom-renderer]]** — 基于 ReactReconciler 构建自定义渲染器
5. **[[topics/react/reconciliation]]** — Diff 算法（`ReactChildFiber.js`）

## 关键源文件地图

```
packages/react-reconciler/src/
├── ReactFiberWorkLoop.js          # ★ Work Loop 核心（performConcurrentWorkOnRoot 等）
├── ReactFiberBeginWork.js         # ★ beginWork：各类型 fiber 的 render 入口
├── ReactFiberCompleteWork.js      # ★ completeWork：render 完成、调用 hostConfig 创建实例
├── ReactFiberCommitWork.js        # ★ commit 三阶段（Before Mutation / Mutation / Layout）
├── ReactFiberHooks.js             # ★ 所有 Hooks 的 mount/update 实现（mountState 等）
├── ReactChildFiber.js             # ★ Reconciliation/Diff 算法（reconcileChildFibers）
├── ReactFiberLane.js              # Lanes 位运算、优先级工具函数
├── ReactFiberScheduler.js         # ensureRootIsScheduled，连接 Scheduler 和 Work Loop
├── ReactFiberThrow.js             # throwException：错误和 Suspense 的 throw 处理
├── ReactFiberUnwindWork.js        # unwindWork：错误/Suspense 的 unwind 回退
├── ReactFiberHydrationContext.js  # Hydration 上下文（tryToClaimNextHydratableInstance）
├── ReactFiberContext.js           # Context 传播（pushProvider/popProvider）
└── ReactFiberSuspenseComponent.js # Suspense 组件处理（mountSuspenseComponent 等）

packages/scheduler/src/
├── Scheduler.js                   # ★ scheduleCallback / cancelCallback / shouldYield
└── SchedulerMinHeap.js            # 最小堆实现（任务队列）

packages/react-dom/src/
├── client/ReactDOMRoot.js         # createRoot / hydrateRoot 入口
├── events/ReactDOMEventListener.js # 事件委托、dispatchEvent
└── server/ReactDOMFizzServer.js   # renderToPipeableStream 入口（React 18 流式 SSR）

packages/react/src/
├── ReactHooks.js                  # 用户侧 hooks 入口（调用 dispatcher）
├── ReactStartTransition.js        # startTransition 实现
└── ReactCurrentDispatcher.js      # Dispatcher injection 接口
```

## React 18 vs React 16/17 的重要差异

| 特性 | React 16/17 | React 18 |
|------|-------------|----------|
| 默认渲染模式 | Legacy（同步）| Concurrent（并发）|
| 批量更新 | 仅在 React 事件处理器内 | 自动批量（包括 setTimeout/Promise）|
| 流式 SSR | `renderToString`（字符串）| `renderToPipeableStream`（Node.js Stream）|
| Hydration | 全量同步水合 | Selective Hydration（Suspense 边界延迟水合）|
| Strict Mode Effect | 无双重 effect | mount → unmount → mount（StrictEffectsMode）|
| 并发特性 API | 无（实验性）| `startTransition`、`useDeferredValue`、`useTransition` 正式发布 |
| 根节点 API | `ReactDOM.render(element, container)` | `createRoot(container).render(element)` |
| 错误未捕获处理 | 直接抛出到全局 | `onRecoverableError` 回调 |

## 阅读路径

### 入门层

- [[topics/react/initial-render]]：首次渲染全链路
- [[topics/react/state-update]]：状态更新流程（useState/setState）
- [[topics/react/effect-system]]：副作用系统（useEffect）

### 核心机制层

- [[topics/react/reconciliation]]：Reconciliation 与 Diff 算法
- [[topics/react/event-system]]：合成事件系统
- [[topics/react/context]]：Context 传播机制
- [[topics/react/ref-system]]：Ref 系统

### 并发层

- [[topics/react/concurrent-scheduler]]：并发模式与 Scheduler
- [[topics/react/lanes]]：Lanes 优先级模型
- [[topics/react/suspense]]：Suspense 与数据加载

### 性能优化层

- [[topics/react/bailout]]：Bailout 机制
- [[topics/react/batching]]：批量更新机制
- [[topics/react/transition]]：Transition 与降级渲染
- [[topics/react/profiler]]：Profiler API 与性能采样

### 高阶场景层

- [[topics/react/ssr-hydration]]：SSR 与 Hydration
- [[topics/react/error-boundary]]：错误边界机制
- [[topics/react/portals]]：Portals 渲染与事件冒泡
- [[topics/react/strict-mode]]：Strict Mode 内部机制

### 架构理解层

- [[topics/react/custom-renderer]]：自定义渲染器与 hostConfig
- [[topics/react/package-architecture]]：React 包架构与 renderer 解耦

## 核心概念

- [[concepts/react/fiber-architecture]]：Fiber 架构
- [[concepts/react/reconciliation]]：Reconciliation（协调）
- [[concepts/react/commit-phase]]：Commit 阶段
- [[concepts/react/render-phase]]：Render 阶段
- [[concepts/react/work-loop]]：Work Loop（工作循环）
- [[concepts/react/cooperative-scheduling]]：协作式调度
- [[concepts/react/concurrent-mode]]：并发模式（Concurrent Mode）
- [[concepts/react/lanes-model]]：Lanes 优先级模型
- [[concepts/react/hooks-internals]]：Hooks 底层机制
- [[concepts/react/fiber-tree]]：Fiber 树结构
- [[concepts/react/synthetic-events]]：合成事件（Synthetic Events）
- [[concepts/react/bailout-optimization]]：Bailout 优化
- [[concepts/react/time-slicing]]：时间切片（Time Slicing）
- [[concepts/react/double-buffering]]：双缓冲（Double Buffering）
- [[concepts/react/suspense-mechanism]]：Suspense 机制
- [[concepts/react/hydration]]：Hydration（水合）
- [[concepts/react/error-propagation]]：错误传播与捕获
- [[concepts/react/effect-list]]：副作用链表（Effect List）
- [[concepts/react/context-propagation]]：Context 传播
- [[concepts/react/host-config]]：Host Config（宿主配置）

## 核心实体

- [[entities/react/react-reconciler]]：react-reconciler 包
- [[entities/react/react-scheduler]]：react-scheduler 包
- [[entities/react/react-dom]]：react-dom 包
- [[entities/react/fiber-node]]：Fiber 节点数据结构
- [[entities/react/react-hooks]]：React Hooks 实现
- [[entities/react/work-in-progress-tree]]：workInProgress 树
- [[entities/react/update-queue]]：UpdateQueue 数据结构

## 重要对比

- [[comparisons/react/fiber-vs-vdom]]：Fiber vs Virtual DOM
- [[comparisons/react/render-vs-commit]]：Render 阶段 vs Commit 阶段
- [[comparisons/react/sync-vs-concurrent]]：同步模式 vs 并发模式
- [[comparisons/react/mount-vs-update]]：首次挂载 vs 更新流程
- [[comparisons/react/useeffect-vs-uselayouteffect]]：useEffect vs useLayoutEffect
- [[comparisons/react/memo-vs-usememo-vs-usecallback]]：React.memo vs useMemo vs useCallback
- [[comparisons/react/lanes-vs-expiration-time]]：Lanes 模型 vs Expiration Time
- [[comparisons/react/current-tree-vs-workinprogress]]：current 树 vs workInProgress 树

## 开放问题

- Fiber 链表遍历在中断续传时，如何保证状态一致性？
- Lanes 模型相比 Expiration Time 究竟解决了什么具体问题？
- Suspense 在并发模式下如何与 Transition 协同工作？
- react-server-components 如何与 reconciler 集成？
- Strict Mode 的双重调用机制为何不会引起真实副作用？
- hydrateRoot 在 selective hydration 场景下如何确定优先级？
