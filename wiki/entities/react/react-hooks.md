---
title: React Hooks 实现
type: entity
created: 2026-04-21
updated: 2026-04-21
tags: [react, hooks]
status: active
sources: []
---

# React Hooks 实现

## 概述

React Hooks 是函数组件的状态和副作用机制，全部实现在 `packages/react-reconciler/src/ReactFiberHooks.js`。Hooks 的状态以**链表**形式存储在对应 fiber 节点的 `memoizedState` 字段上，每次渲染时按固定顺序遍历链表（这就是为什么 Hooks 不能在条件语句中调用）。

## Dispatcher 机制

Hooks 的实现通过**全局 dispatcher 对象**实现 mount 与 update 的分离。`ReactCurrentDispatcher.current` 在不同阶段指向不同的 dispatcher：

| 阶段 | Dispatcher | 说明 |
|------|-----------|------|
| 首次渲染（mount） | `HooksDispatcherOnMount` | 创建新的 hook 节点并追加到链表 |
| 更新渲染（update） | `HooksDispatcherOnUpdate` | 按顺序读取已有 hook 节点 |
| 渲染外调用 | `ContextOnlyDispatcher` | 所有方法抛出错误（防止在渲染外调用） |
| Re-render（同一次渲染中触发更新） | `HooksDispatcherOnRerender` | 处理 render 阶段更新 |

### renderWithHooks

调用函数组件的入口函数，负责在调用前后切换 dispatcher：

```javascript
function renderWithHooks(current, workInProgress, Component, props, ...) {
  // 设置当前正在渲染的 fiber（全局变量 currentlyRenderingFiber）
  currentlyRenderingFiber = workInProgress;

  // 根据是否首次渲染切换 dispatcher
  ReactCurrentDispatcher.current =
    current === null || current.memoizedState === null
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;

  // 调用函数组件
  const children = Component(props, secondArg);

  // 重置状态
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
  currentlyRenderingFiber = null;
  currentHook = null;
  workInProgressHook = null;

  return children;
}
```

## Hook 节点数据结构

每个 hook 调用对应链表中的一个节点：

```javascript
type Hook = {
  memoizedState: any,    // hook 的当前状态值
                         //   useState: state 值
                         //   useEffect: effect 对象
                         //   useRef: { current: value }
                         //   useMemo: [value, deps]
                         //   useCallback: [callback, deps]
  baseState: any,        // 跳过某些更新后的基础 state（与优先级相关）
  baseQueue: Update | null, // 跳过的低优先级 update 链表
  queue: UpdateQueue | null, // 该 hook 自己的 update 环形链表
  next: Hook | null,     // 链表指针，指向下一个 hook
};
```

## 各 Hook 的 mount/update 实现

### useState / useReducer

```
mountState(initialState)
  → 创建 hook 节点
  → hook.memoizedState = hook.baseState = 初始 state
  → 创建 hook.queue（dispatch 函数挂在 queue 上）
  → 返回 [state, dispatch]

updateState()
  → 读取当前 hook 节点
  → processUpdateQueue：遍历 hook.queue，计算新 state
  → 如果新旧 state 相同（Object.is），标记 didReceiveUpdate = false（bailout）
  → 返回 [newState, dispatch]
```

### useEffect / useLayoutEffect / useInsertionEffect

```
mountEffect(create, deps)
  → 创建 hook 节点
  → 创建 effect 对象：{ tag, create, destroy, deps, next }
  → 将 effect 加入 fiber.updateQueue.lastEffect 环形链表
  → 给 fiber 打上 PassiveEffect flag（useEffect）或 HookLayout flag（useLayoutEffect）

updateEffect(create, deps)
  → 读取当前 hook 节点，获取上次的 deps
  → areHookInputsEqual(deps, prevDeps)：deps 未变 → 打 NoFlags，变了 → 打 HookHasEffect
  → effect.tag 中有 HookHasEffect 的才会在 commit 阶段执行
```

### useRef

```
mountRef(initialValue)
  → hook.memoizedState = { current: initialValue }
  → 返回同一个对象引用（不随渲染变化）

updateRef()
  → 直接返回 hook.memoizedState（同一对象）
```

### useMemo / useCallback

```
mountMemo(nextCreate, deps)
  → hook.memoizedState = [nextCreate(), deps]

updateMemo(nextCreate, deps)
  → 比较 deps → 相同返回缓存值，不同重新计算
  → hook.memoizedState = [newValue, deps]

mountCallback(callback, deps)
  → hook.memoizedState = [callback, deps]

updateCallback(callback, deps)
  → 比较 deps → 相同返回旧 callback，不同返回新 callback
```

### useContext

`useContext` 不使用 hook 链表节点，而是直接读取 context 当前值并订阅更新（通过 `readContext`）。context 变化时，订阅了该 context 的 fiber 会被标记需要重新渲染。

## 关联

- [[concepts/react/hooks-internals]]：Hooks 底层机制详解
- [[concepts/react/fiber-architecture]]：Hooks 状态存储在 Fiber 节点的 `memoizedState` 上
- [[entities/react/fiber-node]]：`fiber.memoizedState` 是 hooks 链表头节点
- [[entities/react/react-reconciler]]：Hooks 实现在 reconciler 包（`ReactFiberHooks.js`）中
- [[entities/react/update-queue]]：useReducer/useState 的 `hook.queue` 与 fiber 的 updateQueue 结构类似
- [[concepts/react/lanes-model]]：hook 更新也携带 lane 信息，支持优先级调度
