---
title: Bailout 优化
type: concept
created: 2026-04-21
updated: 2026-04-23
tags: [react, performance, memo]
status: active
sources: [raw/react/dan-abramov-react-as-ui-runtime.md]
---

# Bailout 优化

## 定义

Bailout 是 React 在 render 阶段跳过不需要重渲染的子树的优化机制。当 React 判断一个 Fiber 节点的输入（props、context、state）没有发生变化时，它会跳过该节点及其整个子树的重新计算，直接复用上次的渲染结果，从而节省大量 CPU 时间。

## 工作原理

### 触发条件：`bailoutOnAlreadyFinishedWork`

在 [[concepts/react/render-phase|render 阶段]] 的 `beginWork` 函数中，React 对每个 Fiber 节点检查三个条件：

1. **Props 未变化**：`workInProgress.pendingProps === current.memoizedProps`
2. **无 Context 变化**：`checkDidScheduleUpdateOrContext` 返回 false（fiber 的 `dependencies` 链表中没有被更新的 context）
3. **无 Pending Work**：该 fiber 的 `lanes` 中没有当前渲染批次的 lane

三个条件全部满足时，调用 `bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)`：

```js
// packages/react-reconciler/src/ReactFiberBeginWork.js（简化）
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
  // 检查子树是否也没有工作
  if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
    // 整个子树都可以跳过
    return null;
  }
  // 子树还有工作，克隆子 fiber 但不重新渲染当前节点
  cloneChildFibers(current, workInProgress);
  return workInProgress.child;
}
```

关键：如果子树的 `childLanes` 也不包含当前 lane，则返回 `null`，整棵子树被完全跳过。

### `cloneChildFibers`

当当前节点可以 bailout 但子树仍有工作时，React 调用 `cloneChildFibers` 克隆子 fiber（复用 alternate），而非重新渲染。这样子树中真正需要更新的节点仍会被处理，而不需要更新的节点继续复用。

### `React.memo` 的实现

`React.memo` 包裹的组件在 `updateSimpleMemoComponent` 中处理：

```js
function updateSimpleMemoComponent(current, workInProgress, Component, nextProps, renderLanes) {
  if (current !== null) {
    const prevProps = current.memoizedProps;
    if (
      shallowEqual(prevProps, nextProps) &&        // 浅比较 props
      current.ref === workInProgress.ref            // ref 未变
    ) {
      didReceiveUpdate = false;
      // 触发 bailout
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
  }
  return updateFunctionComponent(/* ... */);
}
```

`shallowEqual` 对 props 的每个 key 做 `Object.is` 比较，引用类型只比较引用地址。

### `useMemo` 的实现

`useMemo` 的结果存储在 hook 的 `memoizedState` 中，deps 数组存储在同一个 hook 对象里：

```js
// mount 阶段
function mountMemo(nextCreate, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

// update 阶段
function updateMemo(nextCreate, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  if (prevState !== null && nextDeps !== null) {
    if (areHookInputsEqual(nextDeps, prevState[1])) {
      return prevState[0];  // deps 未变，直接返回缓存值
    }
  }
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}
```

### `useCallback` 的实现

`useCallback` 与 `useMemo` 几乎相同，区别在于存储的是 callback 本身而非调用结果：

```js
// useCallback(fn, deps) 等价于 useMemo(() => fn, deps)
hook.memoizedState = [callback, nextDeps];  // 存 callback，不调用
```

### `areHookInputsEqual`

这是 `useMemo` 和 `useCallback` 共用的 deps 比较函数：

```js
function areHookInputsEqual(nextDeps, prevDeps) {
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) {
      return false;
    }
  }
  return true;
}
```

使用 `Object.is` 语义（`NaN === NaN` 为 true，`+0 !== -0`）。

## 优势与局限

- ✅ **大幅减少 render 次数**：对于大型组件树，bailout 可以跳过绝大多数节点
- ✅ **子树级跳过**：不仅跳过当前节点，也通过 `childLanes` 跳过整棵子树
- ✅ **自动生效**：state/props/context 未变时自动触发，无需手动干预
- ❌ **`React.memo` 浅比较的局限**：对象/数组的引用比较，父组件每次渲染都传入新字面量会导致 memo 失效
- ❌ **Context 变化穿透 memo**：[[concepts/react/context-propagation|Context 传播]] 会绕过 `React.memo`，因为 context 检查在浅比较之前
- ❌ **过早优化风险**：`useMemo`/`useCallback` 本身有开销（deps 比较 + hook 存储），简单计算不值得缓存

## 应用场景

- 大型列表中用 `React.memo` 包裹列表项，避免父组件更新时全量重渲染
- 用 `useMemo` 缓存昂贵的派生计算（如大数组的 filter/sort）
- 用 `useCallback` 稳定回调引用，与 `React.memo` 配合使用
- `startTransition` 触发的低优先级渲染：已完成的高优先级 fiber 可以 bailout，只重渲染低优先级部分

## 相关概念

- [[concepts/react/render-phase]]：Render 阶段（`beginWork` 中触发 bailout）
- [[concepts/react/fiber-architecture]]：Fiber 架构（`lanes`、`childLanes` 是 bailout 判断的基础）
- [[concepts/react/context-propagation]]：Context 传播（Context 变化会绕过 bailout）
- [[concepts/react/double-buffering]]：双缓冲（`cloneChildFibers` 复用 alternate 树节点）
- [[concepts/react/hooks-internals]]：Hooks 底层机制（`useMemo`/`useCallback` 的 hook 链表实现）
