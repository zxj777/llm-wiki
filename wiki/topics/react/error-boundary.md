---
title: 错误边界机制
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, error-boundary, frontend]
status: active
sources: []
---

# 错误边界机制

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 React 错误边界如何捕获子树渲染错误，`getDerivedStateFromError` 和 `componentDidCatch` 的调用时机，以及错误如何沿 Fiber 树向上传播。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberThrow.js` — `throwException`
- `packages/react-reconciler/src/ReactFiberUnwindWork.js` — `unwindWork`
- `packages/react-reconciler/src/ReactFiberCommitWork.js` — `commitRootImpl`、`captureCommitPhaseError`

## 调用链路

```
# render 阶段：捕获错误（throwException）
performUnitOfWork(workInProgress)
  → beginWork 中发生 JS 异常（非 thenable）
  → workLoopSync / workLoopConcurrent 捕获异常
  → handleThrow(root, thrownValue)
    → throwException(root, returnFiber, sourceFiber, thrownValue, rootRenderLanes)
      → 判断 thrownValue 不是 thenable（不是 Suspense，是真正的 Error）
      → createCapturedValueAtFiber(thrownValue, sourceFiber)  # 封装 error + componentStack
      → 向上遍历 fiber 树（沿 returnFiber 链）
        → 找到 ClassComponent 且 isClassWithErrorBoundary(Component) = true
          （即有 getDerivedStateFromError 或 componentDidCatch 的类组件）
        → 找到 ErrorBoundary fiber
      → 调用 getDerivedStateFromError(error)
        → 返回新 state（用于渲染 fallback UI）
      → enqueueCapturedUpdate(errorBoundaryFiber, update)
        # update.payload = getDerivedStateFromError(error) 的返回值
      → errorBoundaryFiber.flags |= ShouldCapture  # 标记需要捕获

# unwind 阶段：回退到 ErrorBoundary
unwindUnitOfWork(unitOfWork)
  → 从错误 fiber 沿 return 向上调用 unwindWork()
  → case ClassComponent（ErrorBoundary）：
    → flags & ShouldCapture → true
    → 清除 ShouldCapture，设置 DidCapture
    → 返回 ErrorBoundary fiber（作为新的 workInProgress 起点）
  → React 重新从 ErrorBoundary 渲染子树（此时 state 已更新 → 返回 fallback）

# commit 阶段：调用 componentDidCatch
commitRootImpl()
  → commitLayoutEffects(finishedWork, root, committedLanes)
    → commitLifeCycles(finishedRoot, current, finishedWork, commitTime)
      → case ClassComponent（ErrorBoundary，flags & DidCapture）：
        → instance.componentDidCatch(error, errorInfo)
          # errorInfo.componentStack：出错组件的 fiber 调用栈
          # 此时 fallback 已渲染到 DOM，componentDidCatch 可安全上报错误

# commit 阶段：捕获 commit 阶段自身的错误
captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error)
  → 向上找 ErrorBoundary → 触发新一轮更新 → 渲染 fallback
  # commit 阶段 useLayoutEffect/componentDidMount 中抛出的错误走此路径

# 未捕获错误（无 ErrorBoundary）
throwException 找不到 ErrorBoundary
  → React 18：调用 onRecoverableError 回调
  → 重新抛出到全局 → 触发 window.onerror / unhandledrejection
```

## 涉及核心概念

- [[concepts/react/error-propagation]]
- [[concepts/react/fiber-tree]]
- [[concepts/react/render-phase]]
- [[concepts/react/commit-phase]]

## 涉及实体

- [[entities/react/fiber-node]]
- [[entities/react/react-reconciler]]

## 常见问题

- **函数组件为什么不能直接成为 ErrorBoundary（React 19 以前）？**
  ErrorBoundary 需要 `getDerivedStateFromError`（render 阶段同步调用，返回新 state 驱动 fallback 渲染）和 `componentDidCatch`（commit 阶段调用，执行副作用如错误上报）。函数组件没有对应的 Hook 能在 render 阶段同步拦截错误并修改组件自身 state——`useEffect` 是异步的，无法在同一 render 周期内完成"捕获错误 → 渲染 fallback"的闭环。React 19 实验性地引入了函数组件的错误边界能力。

- **`getDerivedStateFromError` 和 `componentDidCatch` 分别在哪个阶段调用？**
  `getDerivedStateFromError` 在 **render 阶段**（`throwException` 内）同步调用，用于计算 fallback 需要的 state，React 据此重新渲染 ErrorBoundary（返回 fallback UI）；`componentDidCatch` 在 **commit 阶段**（`commitLayoutEffects` 内）调用，此时 fallback 已经渲染到 DOM，可以安全地执行副作用（如发送错误日志），但不能用于更新 UI。

- **错误边界能捕获异步错误（setTimeout / Promise）吗？**
  不能。ErrorBoundary 只能捕获 **render 阶段**（beginWork/completeWork）和 **commit 阶段**（commitLayoutEffects/commitLifeCycles）中同步抛出的错误；setTimeout 回调、原生事件处理器、Promise rejection 中的错误发生在 React 工作循环之外，`throwException` 无法捕获。需要用 `window.addEventListener('error', ...)` 或 `unhandledrejection` 拦截后，手动调用 ErrorBoundary 的 setState 来展示 fallback。

- **嵌套的错误边界如何工作？**
  `throwException` 沿 fiber 树向上找到**最近的** ErrorBoundary 捕获错误。若最近 ErrorBoundary 的 fallback 渲染时也抛出错误，React 继续向上找更外层的 ErrorBoundary；若到达根节点仍无 ErrorBoundary，应用崩溃（React 18 会先 unmount 整个树再尝试重新渲染一次，仍失败则抛出到全局）。

## 延伸阅读

- [[concepts/react/error-propagation]]：错误传播详细机制
- [[topics/react/suspense]]：Suspense 与错误边界的相似 unwind 机制
- [[topics/react/strict-mode]]：Strict Mode 下的错误检测
