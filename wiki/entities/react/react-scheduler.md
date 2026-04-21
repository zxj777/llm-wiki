---
title: react-scheduler 包
type: entity
created: 2026-04-21
updated: 2026-04-21
tags: [react, package, scheduler]
status: active
sources: []
---

# react-scheduler 包

## 概述

`react-scheduler`（`packages/scheduler/`）是一个**独立的任务调度器**，与 React 核心完全解耦——它甚至可以在非 React 环境中单独使用。其核心职责是：在浏览器空闲时执行低优先级任务，在高优先级任务到来时中断低优先级任务，从而实现协作式多任务（cooperative multitasking）。

reconciler 在需要异步调度渲染任务时调用 `scheduleCallback`，Scheduler 负责决定何时将控制权还给浏览器、何时继续执行渲染任务。

## 核心机制

### MessageChannel 异步调度

Scheduler **不使用 `setTimeout(fn, 0)`**（最小延迟 4ms），而是使用 `MessageChannel` 的 `postMessage` 在当前宏任务结束后立即触发下一个宏任务，延迟约 0~1ms，同时让浏览器有机会处理用户输入和渲染。

```javascript
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null); // 触发下一个宏任务
}
```

### 时间切片（Time Slicing）

每次宏任务开始时记录 `startTime`，执行任务前调用 `shouldYield()` 检查是否超时：

```javascript
const frameInterval = 5; // 默认 5ms 时间片

function shouldYield() {
  const currentTime = getCurrentTime();
  return currentTime >= deadline; // deadline = startTime + frameInterval
}
```

work loop 在每处理完一个 fiber 后调用 `shouldYield()`，超时则暂停并将控制权还给浏览器。

### 最小堆任务队列

Scheduler 维护两个最小堆（`SchedulerMinHeap.js`）：
- **`taskQueue`**：已过期或立即执行的任务，按 `expirationTime` 排序
- **`timerQueue`**：延迟执行的任务（`options.delay > 0`），按 `startTime` 排序

每次执行 `performWorkUntilDeadline` 时，先将 `timerQueue` 中到期的任务移入 `taskQueue`，再从 `taskQueue` 取堆顶任务执行。

## 优先级映射

| 优先级常量 | 值 | 过期时间 | 典型场景 |
|-----------|---|---------|---------|
| `ImmediatePriority` | 1 | -1ms（立即过期） | 同步任务、flushSync |
| `UserBlockingPriority` | 2 | 250ms | 用户交互（点击、输入） |
| `NormalPriority` | 3 | 5000ms | 普通渲染更新 |
| `LowPriority` | 4 | 10000ms | 数据预加载 |
| `IdlePriority` | 5 | `maxSigned31BitInt`（永不过期） | 后台分析、日志 |

过期时间 = 任务入队时间 + 优先级对应的超时时长。已过期的任务会被同步执行（不再让出控制权）。

## 关键 API

```javascript
// 调度一个任务，返回 task 对象
scheduleCallback(priorityLevel, callback, options?)
// options: { delay?: number }  延迟 delay ms 后才开始计时

// 取消一个已调度的任务（将 task.callback 置为 null）
cancelCallback(task)

// 当前任务是否应该让出控制权（在 work loop 的每个 fiber 之间调用）
shouldYield() → boolean

// 获取当前时间（performance.now() 或 Date.now() fallback）
getCurrentTime() → number

// 在当前优先级上下文中运行函数（用于嵌套调度）
runWithPriority(priorityLevel, fn)

// 获取/设置当前调度优先级
getCurrentPriorityLevel() → SchedulerPriority
```

## 核心文件

| 文件 | 职责 |
|------|------|
| `Scheduler.js` | 主调度逻辑：`scheduleCallback`、`performWorkUntilDeadline`、时间切片 |
| `SchedulerMinHeap.js` | 最小堆实现：`push`、`pop`、`peek`，用于 taskQueue 和 timerQueue |
| `SchedulerPriorities.js` | 5 个优先级常量定义 |
| `SchedulerHostConfig.js` | 平台适配：`MessageChannel` / `setTimeout` fallback |

## 关联

- [[concepts/react/cooperative-scheduling]]：实现协作式调度
- [[concepts/react/time-slicing]]：实现时间切片（5ms 时间片）
- [[concepts/react/work-loop]]：Scheduler 驱动 reconciler 的 work loop
- [[entities/react/react-reconciler]]：reconciler 通过 `scheduleCallback` 调度渲染任务
- [[concepts/react/lanes-model]]：Scheduler 优先级与 React Lanes 优先级的映射关系
