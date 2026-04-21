---
title: 批量更新机制
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, batching, state, frontend]
status: active
sources: []
---

# 批量更新机制

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 React 如何将多次 `setState` 合并为一次重渲染，React 18 的自动批处理（Auto Batching）如何工作，以及 `flushSync` 如何强制同步渲染。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberWorkLoop.js` — `executionContext` / `batchedUpdates`
- `packages/react-dom/src/client/ReactDOMUpdateBatching.js`

## 调用链路

```
# React 17 及以前：事件处理内批处理
用户点击 → dispatchEvent
  → batchedUpdates(fn, nativeEvent)
    → executionContext |= BatchedContext  # 标记批处理上下文
    → fn()  # 执行事件处理函数
      → setState(a)  # scheduleUpdateOnFiber → 检测到 BatchedContext，不立即渲染
      → setState(b)  # 同上
    → executionContext &= ~BatchedContext
    → flushSyncCallbackQueue()  # 统一执行，只渲染一次

# React 18：自动批处理（Auto Batching）
# setTimeout / Promise / 原生事件 中的多次 setState 也会批处理
scheduleUpdateOnFiber(root, fiber, lane)
  → ensureRootIsScheduled(root)
  → 如果 lane 是 SyncLane：
    → 不在 executionContext 中：scheduleMicrotask(flushSyncCallbackQueue)
    # 微任务中统一刷新，实现批处理

# flushSync（强制同步）
flushSync(fn)
  → executionContext |= SyncContext
  → fn()  # 内部的 setState 立即触发同步渲染
  → executionContext &= ~SyncContext
  → flushSyncCallbackQueue()

# unstable_batchedUpdates（React 17 兼容 API）
unstable_batchedUpdates(callback)
  → batchedUpdates(callback)
  → 手动开启批处理上下文
```

## 涉及核心概念

- [[concepts/react/work-loop]]
- [[concepts/react/concurrent-mode]]
- [[concepts/react/lanes-model]]

## 涉及实体

- [[entities/react/react-reconciler]]
- [[entities/react/react-dom]]

## 常见问题

- **React 17 中，在 `setTimeout` 里多次 `setState` 会各自触发一次渲染吗？**
  是的。React 17 批处理依赖 `executionContext |= BatchedContext`，只在 React 合成事件处理（`batchedUpdates` 包裹）内有效。`setTimeout` 回调直接由浏览器调用，没有 `BatchedContext`，每次 `scheduleUpdateOnFiber` 检测到非批处理上下文后立即调 `flushSyncCallbackQueue`，每次 setState 独立触发同步渲染。可用 `unstable_batchedUpdates(() => { setState(a); setState(b); })` 手动包裹强制批处理。

- **React 18 的自动批处理是如何实现的？**
  React 18 中所有非 `flushSync` 更新统一通过 `ensureRootIsScheduled` 调度：SyncLane 更新用 `scheduleMicrotask`（`Promise.resolve().then(flushSyncCallbackQueue)`）在微任务中批量刷新；其他优先级通过 Scheduler 的 MessageChannel 宏任务处理。多次 setState 发生在同一同步代码块内，全部在微任务/宏任务执行前完成入队，统一渲染一次，覆盖 setTimeout、Promise、原生事件等所有场景。

- **`flushSync` 会打破并发模式的哪些保证？**
  三点：（1）绕过 Scheduler，跳过时间切片，直接调 `performSyncWorkOnRoot`，可能阻塞主线程；（2）打断当前正在进行的并发渲染（挂起），先完成 flushSync 渲染再恢复；（3）`flushSync` 内的 transition 更新被降级为同步执行，失去并发中断能力。典型使用场景：需要在读取 DOM 布局（`getBoundingClientRect`）之前先同步更新 DOM，避免读到旧布局数据。

- **`unstable_batchedUpdates` 在 React 18 中还有必要吗？**
  对于 React 18 并发模式（`createRoot`）几乎不再需要——自动批处理已覆盖所有场景。但两种情况仍可能有用：（1）legacy 模式（`ReactDOM.render`）在 React 18 中仍以旧行为运行，仍需手动批处理；（2）与第三方状态管理库（如 Redux `subscribe` 回调）集成时，这些库触发更新不在 React 调度上下文中，可作为保险。标准 React 18 并发模式下可以安全移除。

## 延伸阅读

- [[topics/react/state-update]]：状态更新的基础流程
- [[topics/react/concurrent-scheduler]]：并发模式下的调度
- [[topics/react/transition]]：Transition 与批处理的关系
