---
title: 并发模式与 Scheduler
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, concurrent, scheduler, frontend]
status: active
sources: []
---

# 并发模式与 Scheduler

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 React 并发模式如何通过 Scheduler 实现时间切片、任务中断与恢复，以及 `MessageChannel` 在其中扮演的角色。

## 入口函数/文件

- `packages/scheduler/src/forks/Scheduler.js` — `scheduleCallback` / `workLoop`
- `packages/react-reconciler/src/ReactFiberWorkLoop.js` — `performConcurrentWorkOnRoot`

## 调用链路

```
# 开启并发模式
ReactDOM.createRoot(container)  # 传入 ConcurrentMode flag

# 调度任务
ensureRootIsScheduled(root)
  → scheduleCallback(schedulerPriority, performConcurrentWorkOnRoot)
    → newTask = { callback, priorityLevel, startTime, expirationTime }
    → push(taskQueue, newTask)           # 最小堆，按 expirationTime 排序
    → requestHostCallback(flushWork)
      → schedulePerformWorkUntilDeadline()
        → MessageChannel.port.postMessage()  # 宏任务，让出主线程

# 执行任务（下一个宏任务）
MessageChannel.onmessage → performWorkUntilDeadline()
  → flushWork(hasTimeRemaining, currentTime)
    → workLoop(hasTimeRemaining, currentTime)   # Scheduler 的 workLoop
      → while (currentTask && !shouldYieldToHost())
        → currentTask.callback()  # = performConcurrentWorkOnRoot
          → renderRootConcurrent(root, lanes)
            → workLoopConcurrent()              # Reconciler 的 workLoop
              → while (workInProgress && !shouldYield())
                → performUnitOfWork(workInProgress)
              → 如果被中断：返回 RootInProgress
          → 如果渲染完成：commitRoot(root)
          → 如果被打断：返回 continuationCallback  # Scheduler 继续调度
      → shouldYieldToHost()
        → currentTime >= deadline  # deadline = startTime + 5ms（时间切片）
```

## 涉及核心概念

- [[concepts/react/concurrent-mode]]
- [[concepts/react/cooperative-scheduling]]
- [[concepts/react/time-slicing]]
- [[concepts/react/work-loop]]
- [[concepts/react/lanes-model]]

## 涉及实体

- [[entities/react/react-scheduler]]
- [[entities/react/react-reconciler]]

## 常见问题

- **时间切片的 5ms 是固定的吗？如何调整？**
  默认 `frameInterval = 5ms`（`packages/scheduler/src/forks/Scheduler.js`）。React 团队认为这是在 120fps（~8ms/帧）下为 JS 预留的合理时间，且不再动态自适应（旧版曾用 `requestAnimationFrame` 计算帧率，后改为固定值以降低复杂度）。可通过私有 API `unstable_forceFrameRate(fps)` 调整：`fps <= 0 || fps > 125` 时恢复默认，否则 `frameInterval = Math.floor(1000 / fps)`。该 API 不建议在生产中使用。

- **`shouldYield` 在哪里检查？检查频率如何？**
  在 Reconciler 的 `workLoopConcurrent` 的 `while` 循环条件处调用，即每处理完一个 fiber 单元（`performUnitOfWork`）后检查一次，实现为 `performance.now() >= deadline`（deadline = 任务开始时间 + 5ms）。由于大多数 fiber 处理在亚毫秒级完成，实际上通常需要处理几十到几百个 fiber 才会触发一次真正让出，性能开销可忽略。

- **任务被中断后，workInProgress 树的状态如何保存？**
  workInProgress 是全局指针，中断后其引用保留，已完成 completeWork 的 fiber 节点完好保存在 return/sibling 链表中。Scheduler 的 `currentTask.callback` 返回非 null 的 `continuationCallback` 时，Scheduler 将任务重新入队而不 pop，下次 `performWorkUntilDeadline` 再次调用 `performConcurrentWorkOnRoot`，从 `workInProgress` 断点处继续向下遍历，零数据丢失。

- **Scheduler 的优先级与 React 的 Lanes 是如何映射的？**
  两者各自独立，通过 `lanesToSchedulerPriority` 转换：`SyncLane` → `ImmediatePriority`（跳过 Scheduler 同步执行）；`InputContinuousLane` → `UserBlockingPriority`（250ms 超时）；`DefaultLane` / `TransitionLane` → `NormalPriority`（5000ms 超时）；`IdleLane` → `IdlePriority`（无超时）。Lanes 是 React 内部细粒度位掩码，Scheduler 优先级是粗粒度 5 档系统，协同控制调度时序。

## 延伸阅读

- [[topics/react/lanes]]：Lanes 优先级模型
- [[comparisons/react/sync-vs-concurrent]]：同步模式与并发模式对比
- [[concepts/react/time-slicing]]：时间切片详解
