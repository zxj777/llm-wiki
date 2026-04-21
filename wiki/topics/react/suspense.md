---
title: Suspense 与数据加载
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, suspense, async, frontend]
status: active
sources: []
---

# Suspense 与数据加载

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 `<Suspense>` 如何捕获子组件抛出的 Promise，如何展示 fallback，以及 Promise resolve 后如何恢复渲染；同时理解 React 18 的 `use(promise)` API。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberThrow.js` — `throwException`
- `packages/react-reconciler/src/ReactFiberUnwindWork.js` — `unwindWork`
- `packages/react-reconciler/src/ReactFiberSuspenseComponent.js`

## 调用链路

```
# Promise 被抛出
render 阶段：某个组件 throw promise（或 use(promise) 触发）
  → workLoopConcurrent 中 performUnitOfWork 抛出
  → handleThrow(root, thrownValue)
    → throwException(root, returnFiber, sourceFiber, thrownValue, lanes)
      → 判断 thrownValue 是否为 thenable（Promise）
      → 找到最近的 SuspenseComponent fiber（attachPingListener）
        → thenable.then(ping, ping)  # promise resolve 时触发重新调度
      → 标记 sourceFiber.flags |= DidCapture
      → 标记 SuspenseFiber.flags |= ShouldCapture

# unwind 阶段（回退处理）
unwindUnitOfWork(unitOfWork)
  → unwindWork(current, workInProgress, renderLanes)
    → case SuspenseComponent：
      → 返回 Suspense fiber，切换到渲染 fallback 模式

# 渲染 fallback
updateSuspenseComponent(current, workInProgress, renderLanes)
  → showFallback = true
  → 渲染 fallback 子树，隐藏 primary 子树（OffscreenComponent）

# Promise resolve 后重新触发
ping() → pingSuspendedRoot(root, wakeable, lanes)
  → markRootPinged(root, pingLanes)
  → ensureRootIsScheduled(root)  # 重新调度渲染
  → 再次渲染 primary 子树，此时数据已就绪
```

## 涉及核心概念

- [[concepts/react/suspense-mechanism]]
- [[concepts/react/fiber-architecture]]
- [[concepts/react/concurrent-mode]]
- [[concepts/react/lanes-model]]

## 涉及实体

- [[entities/react/react-reconciler]]
- [[entities/react/fiber-node]]

## 常见问题

- **Suspense 是如何捕获 Promise 的？用的是 try-catch 吗？**
  是 try-catch。`workLoopConcurrent` 外层包有 try-catch，捕获 `performUnitOfWork` 内组件 render 时 throw 的值。捕获后调 `handleThrow(root, thrownValue)` → `throwException`，判断 `thrownValue` 是否为 thenable（有 `.then`）：是则进入 Suspense 处理路径，向上查找最近的 SuspenseComponent fiber 并附加 ping listener；否则进入 Error Boundary 路径。`use(promise)` 本质上也是 throw thenable，由 React 内部封装状态检查。

- **fallback 和 primary children 是两棵子树吗？**
  是的。primary children 被包裹在 `OffscreenComponent` fiber 中（`mode="hidden"` 时隐藏），fallback 是 Suspense fiber 的另一分支子树。两者在 fiber 树中并存，通过 `OffscreenComponent` 的 mode 属性控制显隐。这样设计使 primary children 的 state 在 fallback 展示期间得以保留，promise resolve 后恢复渲染时无需重建 state，组件状态连续。

- **Selective Hydration 与 Suspense 是如何结合的？**
  React 18 SSR 中，`<Suspense>` 边界内的内容延迟水合。`hydrateRoot` 优先水合边界外内容；当用户点击 Suspense 内未水合的区域时，`ReactDOM.unstable_scheduleHydration(target)` 以高优先级调度该边界的水合，优先于其他低优先级水合任务。这样用户首次交互的区域快速响应，无需等待整页水合完毕，实现渐进式交互能力。

- **`use(promise)` 和手动 throw promise 有什么区别？**
  `use(promise)` 是 React 18 官方 API（`packages/react/src/ReactHooks.js`），内部封装了状态检查：promise pending 时执行 `throw promise`；fulfilled 时直接返回结果值；rejected 时重新 throw error（转交 Error Boundary）。手动 throw promise 缺少状态检查，每次渲染都 throw，无法感知 promise 已 resolve。另外 `use` 可以在条件语句和循环中调用，不受 hooks 顺序规则约束，因为它不依赖 hooks 链表，只是读取 promise 状态。

## 延伸阅读

- [[topics/react/ssr-hydration]]：Selective Hydration 与 Suspense 边界
- [[topics/react/error-boundary]]：错误边界与 Suspense 的相似机制
- [[concepts/react/suspense-mechanism]]：Suspense 详细机制
