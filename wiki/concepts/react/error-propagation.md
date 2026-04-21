---
title: 错误传播与捕获
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, error-boundary]
status: active
sources: []
---

# 错误传播与捕获

## 定义

Error Propagation（错误传播）是 React 在渲染过程中捕获组件抛出的错误，并沿 Fiber 树向上传递，直到找到最近的 Error Boundary（错误边界）进行处理的机制。Error Boundary 是实现了 `getDerivedStateFromError` 或 `componentDidCatch` 的 class 组件，负责渲染错误 fallback UI 并上报错误。

## 工作原理

### Render 阶段的错误捕获

在 [[concepts/react/render-phase|render 阶段]] 的工作循环中，React 用 try-catch 包裹每个 fiber 的 `beginWork` 调用：

```js
// packages/react-reconciler/src/ReactFiberWorkLoop.js（简化）
try {
  performUnitOfWork(unitOfWork);
} catch (thrownValue) {
  handleThrow(root, thrownValue);
}
```

`handleThrow` 区分两类情况：
- **thenable（Promise）**：转入 [[concepts/react/suspense-mechanism|Suspense 机制]] 的 `throwException`
- **普通错误（Error）**：进入错误传播流程

### `throwException`：向上寻找 Error Boundary

```js
function throwException(root, returnFiber, sourceFiber, value, rootRenderLanes) {
  // 标记 sourceFiber 为 Incomplete
  sourceFiber.flags |= Incomplete;

  let workInProgress = returnFiber;
  do {
    if (workInProgress.tag === ClassComponent) {
      const ctor = workInProgress.type;
      // 检查是否有错误处理能力
      if (typeof ctor.getDerivedStateFromError === 'function' ||
          typeof workInProgress.stateNode.componentDidCatch === 'function') {
        // 找到 Error Boundary！
        // 调用 getDerivedStateFromError，将返回值 enqueue 为新 state
        const derivedState = ctor.getDerivedStateFromError(value);
        enqueueSetState(workInProgress, derivedState);
        return;
      }
    }
    workInProgress = workInProgress.return;
  } while (workInProgress !== null);
  // 没有找到 Error Boundary → 根节点错误，React 将卸载整个树
}
```

### `unwindWork`：反向展开

找到 Error Boundary 后，React 调用 `unwindWork` 从出错的 fiber 一直向上反向遍历，清理中间状态：

```js
function unwindWork(current, workInProgress, renderLanes) {
  switch (workInProgress.tag) {
    case ClassComponent: {
      // 如果是 Error Boundary，返回该 fiber（停止 unwind）
      if (isErrorBoundary(workInProgress)) return workInProgress;
      return null;
    }
    case SuspenseComponent:
      // 清理 Suspense 相关状态
      // ...
    default:
      return null;
  }
}
```

unwind 到达 Error Boundary fiber 后，React 以该 fiber 为根重新开始 render，这次 render 使用 `getDerivedStateFromError` 返回的新 state，组件渲染出错误 fallback UI。

### `getDerivedStateFromError` vs `componentDidCatch`

| | `getDerivedStateFromError` | `componentDidCatch` |
|---|---|---|
| **调用时机** | Render 阶段（同步） | Commit 阶段（DOM 已更新后） |
| **用途** | 返回新 state 用于渲染 fallback UI | 上报错误（日志服务、Sentry 等） |
| **是否可 setState** | 通过返回值（纯函数） | 可调用 `setState` |
| **是否能访问 this** | 否（静态方法） | 是 |

```js
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    // render 阶段调用，返回新 state
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // commit 阶段调用，适合上报
    logErrorToService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return <h1>出错了</h1>;
    return this.props.children;
  }
}
```

### Commit 阶段的错误处理

Commit 阶段（`useLayoutEffect`、DOM mutation）中抛出的错误也可以被捕获，但处理路径略有不同：

- `commitRootImpl` 内部有 try-catch
- commit 阶段的错误会重新触发一次渲染，将错误交给最近的 Error Boundary
- `useEffect`（PassiveEffect）中的错误在 `flushPassiveEffects` 时捕获，同样向上找 Error Boundary

### 未被捕获的错误

如果错误传播到根节点（没有 Error Boundary 拦截）：

- React 18 开发模式：调用 `reportGlobalError`，触发 `window.onerror` 或 `window.addEventListener('error')`
- React 会卸载整个组件树（unmount root），防止用户看到损坏的 UI
- **函数组件不能作为 Error Boundary**（因为无法用 Hooks 实现 `getDerivedStateFromError` 的 render 阶段同步语义）

## 优势与局限

- ✅ **优雅降级**：局部错误不影响整个应用，Error Boundary 展示 fallback，其他部分正常工作
- ✅ **错误上报钩子**：`componentDidCatch` 提供 `componentStack`，方便定位出错的组件路径
- ✅ **自动 unwind**：React 自动清理中间渲染状态，无需手动处理
- ❌ **只捕获 render/commit 阶段的错误**：事件处理器、`setTimeout`、异步代码中的错误不会被 Error Boundary 捕获
- ❌ **必须用 class 组件**：`getDerivedStateFromError` 目前无法用函数组件实现
- ❌ **Error Boundary 自身的错误无法自己捕获**：Error Boundary 内部报错会冒泡到上层的 Error Boundary

## 应用场景

- 应用顶层放置全局 Error Boundary，防止白屏
- 页面各功能区域放置局部 Error Boundary，实现细粒度的错误隔离
- 配合错误监控服务（Sentry、Datadog）在 `componentDidCatch` 中上报错误

## 相关概念

- [[concepts/react/render-phase]]：Render 阶段（`throwException` 在 render 阶段触发）
- [[concepts/react/fiber-architecture]]：Fiber 架构（错误沿 `fiber.return` 向上传播）
- [[concepts/react/suspense-mechanism]]：Suspense 机制（类似的 throw → throwException → unwindWork 流程）
- [[concepts/react/effect-list]]：副作用链表（commit 阶段的错误也通过此机制处理）
