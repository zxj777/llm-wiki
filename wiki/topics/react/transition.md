---
title: Transition 与降级渲染
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, transition, concurrent, performance, frontend]
status: active
sources: []
---

# Transition 与降级渲染

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 `startTransition` 和 `useDeferredValue` 如何将更新标记为低优先级，以及当高优先级更新到来时如何打断 Transition 并保持 UI 响应。

## 入口函数/文件

- `packages/react/src/ReactStartTransition.js` — `startTransition`
- `packages/react-reconciler/src/ReactFiberHooks.js` — `useDeferredValue`、`useTransition`
- `packages/react-reconciler/src/ReactFiberLane.js` — TransitionLane 定义

## 调用链路

```
# startTransition 完整链路
startTransition(scope)
  → ReactCurrentBatchConfig.transition = {}     # 进入 transition 上下文
  → setCurrentUpdatePriority(TransitionLane)    # 设置当前优先级为低优先级
  → scope()                                     # 执行回调
    → setState(newValue)
    → requestUpdateLane(fiber)
      → 检测到 transition 上下文（ReactCurrentBatchConfig.transition !== null）
      → 分配 TransitionLane（0b0000000001111111111111111000000000 中的某一位）
    → scheduleUpdateOnFiber(root, fiber, TransitionLane)
  → ReactCurrentBatchConfig.transition = null   # 退出 transition 上下文

# 调度执行
ensureRootIsScheduled(root)
  → TransitionLane → NormalPriority（比 UserBlockingPriority 低）
  → scheduleCallback(NormalPriority, performConcurrentWorkOnRoot)

# 高优先级更新打断 Transition（抢占）
用户输入事件（keydown/click）到来
  → scheduleUpdateOnFiber(root, fiber, SyncLane 或 InputContinuousLane)
  → ensureRootIsScheduled(root) 发现更高优先级任务
  → workLoop 在下一个 shouldYield() 检查点中断当前 Transition 渲染
  → Scheduler 执行高优先级任务（用户输入渲染）
  → 高优先级渲染 commit 完成后，重新调度 TransitionLane 任务（从头 render）

# useTransition 内部
useTransition()
  → [isPending, startTransition]
  → isPending：通过内部 useState 追踪，TransitionLane 未完成时为 true
  → startTransition：绑定到当前 fiber 的 dispatch

# useDeferredValue 完整链路
mountDeferredValue(value)
  → 存储初始值，返回 value（无延迟）

updateDeferredValue(value)
  → prevValue = hook.memoizedState
  → if prevValue !== value（值变化了）：
    → startTransition(() => dispatch(setValue(value)))  # 低优先级更新
    → 当前高优先级渲染中：继续返回 prevValue（旧值）
    → Transition 渲染完成后：hook.memoizedState = value，返回新值
  → if prevValue === value：直接返回 value
```

## 涉及核心概念

- [[concepts/react/lanes-model]]
- [[concepts/react/concurrent-mode]]
- [[concepts/react/cooperative-scheduling]]
- [[concepts/react/time-slicing]]

## 涉及实体

- [[entities/react/react-reconciler]]
- [[entities/react/react-scheduler]]

## 常见问题

- **`startTransition` 和 `setTimeout(() => setState(...), 0)` 有什么本质区别？**
  setTimeout 完全绕过 React 调度系统，其内部的 setState 以 DefaultLane 优先级执行，无法被后续高优先级更新打断，也无法获得 `isPending` 状态；startTransition 使用 TransitionLane，与 Scheduler 深度集成，支持被高优先级更新抢占，能提供明确的 pending 状态，且 React 能感知哪些 setState 属于同一个 transition 批次。

- **Transition 被打断后，React 是从头开始渲染还是从断点恢复？**
  从头重新 render（re-render from root），但不是完全从零——React 保留 workInProgress Fiber 树（双缓冲），重新渲染时对 props/state 未变的节点执行 bailout，跳过其 beginWork 计算。当前已完成的未 commit 的渲染工作会被丢弃（workInProgress 树重置），高优先级任务完成后重新发起 Transition 的 scheduleCallback。

- **`useDeferredValue` 和 `startTransition` 的使用场景分别是什么？**
  `startTransition` 适合在事件处理器中主动标记"这次 setState 不紧急"，控制权在更新发起方（如搜索框 onChange 触发列表渲染）；`useDeferredValue` 适合在子组件中将接收到的 prop 标记为可延迟，控制权在消费方，无需修改父组件逻辑。配合 `React.memo` 使用效果最佳：memo 包裹的子组件在旧值阶段被跳过，新值渲染完成后才切换。

- **Transition 期间，旧值还是新值显示给用户？**
  Transition 渲染期间（`isPending = true`），`current` 树对应的旧 DOM 保持不变，用户看到旧 UI；新 UI 在 `workInProgress` 树后台渲染；渲染完成后 commit 阶段一次性切换，用户不会看到中间状态。`useDeferredValue` 在高优先级渲染中返回旧值，遵循同样的逻辑。

## 延伸阅读

- [[topics/react/lanes]]：TransitionLane 的优先级模型
- [[topics/react/concurrent-scheduler]]：并发调度与任务打断
- [[topics/react/suspense]]：Transition 与 Suspense 的协同
