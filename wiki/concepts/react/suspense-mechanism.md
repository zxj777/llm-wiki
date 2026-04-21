---
title: Suspense 机制
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, suspense, async]
status: active
sources: []
---

# Suspense 机制

## 定义

Suspense 机制是 React 处理异步渲染的核心，通过捕获组件抛出的 Promise 来实现"等待"语义。当组件需要等待异步数据时，抛出一个 Promise；React 捕获后展示 `fallback` UI，待 Promise resolve 后再重新渲染该组件。这使得异步数据加载能够像同步代码一样被组织和表达。

## 工作原理

### 核心流程：throw promise → 捕获 → fallback → 重渲染

```
组件 render 时抛出 promise
    ↓
throwException() 捕获（render 阶段）
    ↓
沿 fiber.return 向上找最近的 SuspenseComponent fiber
    ↓
将该 Suspense 标记为需要渲染 fallback
    ↓
unwindWork() 反向展开，回到 Suspense boundary
    ↓
渲染 fallback 子树
    ↓
promise.then() → 调度重新渲染（retryLane）
    ↓
重新渲染被 Suspense 包裹的主内容
```

### `throwException`：捕获 Promise

在 [[concepts/react/render-phase|render 阶段]] 的工作循环中，如果组件抛出异常，`performUnitOfWork` 捕获后调用 `throwException`：

```js
// packages/react-reconciler/src/ReactFiberThrow.js（简化）
function throwException(root, returnFiber, sourceFiber, value, rootRenderLanes) {
  if (value !== null && typeof value === 'object' && typeof value.then === 'function') {
    // 是 Promise（thenable）
    const wakeable = value;
    // 向上找最近的 Suspense boundary
    let workInProgress = returnFiber;
    do {
      if (workInProgress.tag === SuspenseComponent) {
        // 找到了！在此 Suspense fiber 上附加 ping 监听
        const wakeables = workInProgress.updateQueue ?? new Set();
        wakeables.add(wakeable);
        workInProgress.updateQueue = wakeables;
        // 注册 promise resolve 后的回调
        attachPingListener(root, wakeable, rootRenderLanes);
        return;
      }
      workInProgress = workInProgress.return;
    } while (workInProgress !== null);
  }
  // 不是 Promise → 走错误处理流程（见 error-propagation）
}
```

### SuspenseComponent Fiber 的 memoizedState

Suspense fiber 的 `memoizedState` 用来区分当前是否在展示 fallback：

- **正常渲染（无 fallback）**：`memoizedState === null`
- **展示 fallback 时**：`memoizedState = { dehydrated: null, treeContext: ..., retryLane: ... }`

commit 阶段根据此状态决定展示主内容还是 fallback。

### Promise resolve 后重新调度

当 Promise resolve 时，`attachPingListener` 注册的回调触发 `pingSuspendedRoot`，将挂起的渲染以 `retryLane` 重新调度，React 重新 render 之前 throw 的组件。如果这次 render 成功（数据已就绪），则正常渲染主内容并隐藏 fallback。

### `use(promise)`（React 18）

React 18 引入的 `use()` Hook 是在组件中直接使用异步数据的语法糖，本质上仍是 throw promise：

```js
// React 内部实现（简化）
function use(usable) {
  if (usable.status === 'fulfilled') {
    return usable.value;
  } else if (usable.status === 'rejected') {
    throw usable.reason;
  } else if (usable.status === 'pending') {
    throw usable;  // throw promise，触发 Suspense
  } else {
    // 首次调用，给 promise 挂上 status 属性
    usable.status = 'pending';
    usable.then(
      (v) => { usable.status = 'fulfilled'; usable.value = v; },
      (e) => { usable.status = 'rejected'; usable.reason = e; },
    );
    throw usable;
  }
}
```

与之前的数据获取库（如 SWR、React Query）通过外部缓存+抛出 Promise 的方式相比，`use()` 是官方支持的原语。

### Selective Hydration 与 Suspense 的结合

React 18 的 [[concepts/react/hydration|Selective Hydration]] 深度依赖 Suspense：

- 服务端使用 `renderToPipeableStream` 流式渲染时，Suspense boundary 内的内容可以延迟流式传输
- 客户端 `hydrateRoot` 时，每个 Suspense boundary 独立水合，不阻塞其他部分
- 用户与尚未水合的 Suspense boundary 交互时，React 优先水合该边界（Interaction-based Priority Hydration）

## 优势与局限

- ✅ **声明式异步**：用同步的代码风格处理异步数据，组件逻辑更清晰
- ✅ **自动 fallback**：无需手动管理 loading 状态变量
- ✅ **并发友好**：与 [[concepts/react/concurrent-mode|并发模式]] 深度集成，支持 `startTransition` 避免 loading 闪烁
- ✅ **嵌套 Suspense**：可精细控制不同部分的加载粒度
- ❌ **仅捕获 render 阶段的 throw**：事件处理器中的 Promise 不会被 Suspense 捕获
- ❌ **需要数据库配合**：数据获取库需要实现"缓存 + throw promise"模式才能与 Suspense 协作
- ❌ **waterfall 风险**：嵌套的 Suspense 边界如果数据串行请求，会产生瀑布式延迟

## 应用场景

- 懒加载组件：`React.lazy(() => import('./Component'))` 配合 `<Suspense fallback={<Spinner />}>`
- 数据获取：配合 `use(fetchData())` 或支持 Suspense 的数据库（Relay、SWR experimental）
- 流式 SSR：`renderToPipeableStream` + Suspense 实现按需流式传输 HTML
- Selective Hydration：优化大型页面的水合性能

## 相关概念

- [[concepts/react/fiber-architecture]]：Fiber 架构（SuspenseComponent 是特殊的 fiber tag）
- [[concepts/react/concurrent-mode]]：并发模式（Suspense 与 `startTransition` 配合避免 fallback 闪烁）
- [[concepts/react/error-propagation]]：错误传播（类似的 throw → throwException → unwindWork 流程）
- [[concepts/react/hydration]]：Hydration（Selective Hydration 依赖 Suspense boundary）
- [[concepts/react/render-phase]]：Render 阶段（throw 在 render 阶段被捕获）
