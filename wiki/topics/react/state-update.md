---
title: 状态更新流程
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, state, hooks, frontend]
status: active
sources: []
---

# 状态更新流程

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚调用 `useState` 的 setter 或 `this.setState` 后，React 如何触发重新渲染，以及更新是如何被收集、调度和执行的。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberHooks.js` — `dispatchSetState`（函数组件）
- `packages/react-reconciler/src/ReactFiberClassComponent.js` — `enqueueSetState`（类组件）

## 调用链路

```
# 函数组件路径
setState(newValue)
  → dispatchSetState(fiber, queue, action)
  → enqueueUpdate(fiber, update, lane)     # 将 update 挂到 updateQueue
  → scheduleUpdateOnFiber(root, fiber, lane)
  → ensureRootIsScheduled(root)
    → scheduleCallback(schedulerPriority, performConcurrentWorkOnRoot)
  → workLoop()
    → performUnitOfWork(workInProgress)
      → beginWork → updateFunctionComponent
        → renderWithHooks(current, workInProgress)
          → useState → useReducer → updateReducer
            → processUpdateQueue(workInProgress, props, instance)  # 处理队列，计算新 state
        → reconcileChildren()   # diff 子 fiber
      → completeWork()
  → commitRoot()
    → commitMutationEffects()   # 更新 DOM

# 类组件路径
this.setState(partialState)
  → enqueueSetState(inst, payload, callback)
  → scheduleUpdateOnFiber(root, fiber, lane)
  → ... 同上
```

## 涉及核心概念

- [[concepts/react/fiber-architecture]]
- [[concepts/react/work-loop]]
- [[concepts/react/hooks-internals]]
- [[concepts/react/lanes-model]]
- [[concepts/react/reconciliation]]

## 涉及实体

- [[entities/react/update-queue]]
- [[entities/react/fiber-node]]
- [[entities/react/react-hooks]]
- [[entities/react/react-reconciler]]

## 常见问题

- **`useState` 和 `useReducer` 底层是同一套逻辑吗？**
  是的。`useState` 在源码中实现为 `useReducer(basicStateReducer, initialState)`，`basicStateReducer` 就是 `(state, action) => typeof action === 'function' ? action(state) : action`。mount 时调 `mountState` → `mountReducer`，update 时调 `updateState` → `updateReducer`，两者共用同一套 `processUpdateQueue` 逻辑来计算最终 state。

- **多次 `setState` 为什么只触发一次重渲染？**
  批处理（batching）机制。在 React 事件处理函数内 `executionContext` 含 `BatchedContext`，`scheduleUpdateOnFiber` 检测到后不立即渲染，将 update 加入 updateQueue 链表。事件处理完毕后 `flushSyncCallbackQueue` 统一执行，一次 `performSyncWorkOnRoot` 在 `processUpdateQueue` 中按链表顺序处理所有 update，计算出最终 state 再渲染。React 18 通过微任务实现更广泛的自动批处理。

- **更新队列（UpdateQueue）是链表还是数组？**
  是循环链表。每次 `enqueueUpdate` 将新的 Update 对象追加到 `fiber.updateQueue.shared.pending` 单向循环链表末尾。render 阶段 `processUpdateQueue` 将 `pending` 链表剪断、合并到 `firstBaseUpdate..lastBaseUpdate` 链表，按序遍历计算新 state。链表结构支持并发模式下的 update 回放——低优先级 update 在高优先级渲染中暂存，之后重放，保证最终结果与调度顺序无关。

- **如何区分 mount 时和 update 时的 hooks 调用？**
  通过 `ReactCurrentDispatcher.current` 指向不同的 dispatcher 实现。mount 时设置 `HooksDispatcherOnMount`（`useState = mountState`），update 时设置 `HooksDispatcherOnUpdate`（`useState = updateState`）。`renderWithHooks` 在执行组件函数前根据 `current === null` 切换 dispatcher，执行完毕后恢复为 `ContextOnlyDispatcher`（在 render 阶段外调用 hooks 时抛出错误）。

## 延伸阅读

- [[topics/react/batching]]：批量更新如何合并多次 setState
- [[topics/react/lanes]]：lane 如何决定更新优先级
- [[topics/react/concurrent-scheduler]]：并发模式下的调度机制
