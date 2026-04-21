---
title: 协作式调度
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, scheduler, concurrency]
status: active
sources: []
---

# 协作式调度

## 定义

协作式调度（Cooperative Scheduling）是 React Scheduler（`packages/scheduler`）采用的调度策略。与操作系统的抢占式调度不同，协作式调度依赖任务**主动让出**主线程，而非被强制中断。React 通过在每个工作单元后检查 `shouldYield()`，在时间片耗尽时主动退出 work loop，把主线程控制权还给浏览器。

## 工作原理

### 为什么不用 setTimeout

早期 React 用 `setTimeout(fn, 0)` 实现异步调度，但 `setTimeout` 在嵌套调用时有最小 1ms 延迟（部分浏览器甚至 4ms），且受"计时器节流"影响，精度不足。

React Scheduler 改用 **`MessageChannel`**：

```js
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline; // 消息接收时执行任务

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null); // 发消息，触发下一个宏任务（比 setTimeout 更快）
}
```

`MessageChannel` 的 `onmessage` 回调在**宏任务队列**中执行，延迟远小于 `setTimeout(fn, 0)`，且不受计时器节流影响，适合高频调度。

### 时间切片（5ms 时间片）

```js
let deadline = 0;
const frameYieldMs = 5; // 默认 5ms 时间片

function performWorkUntilDeadline() {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    deadline = currentTime + frameYieldMs; // 设置本次时间片截止时间

    try {
      const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
      if (!hasMoreWork) {
        // 任务完成，清理
        scheduledHostCallback = null;
      } else {
        // 还有工作，调度下一次
        schedulePerformWorkUntilDeadline();
      }
    } catch (error) {
      schedulePerformWorkUntilDeadline();
      throw error;
    }
  }
}

function shouldYield() {
  return getCurrentTime() >= deadline; // 超过截止时间则让出
}
```

[[concepts/react/work-loop]] 的 `workLoopConcurrent` 在每个工作单元后调用 `shouldYield()`，若返回 `true` 则退出循环，等待下次 `MessageChannel` 回调再继续。

### 最小堆任务队列

Scheduler 内部用**最小堆（min-heap）**管理所有待调度任务，按任务的**过期时间（expirationTime）**排序：

```js
// 任务结构
const task = {
  id,
  callback,        // 任务函数
  priorityLevel,   // 优先级
  startTime,       // 开始时间
  expirationTime,  // = startTime + timeout（按优先级决定 timeout）
  sortIndex,       // 排序键（未开始的任务用 startTime，已就绪的用 expirationTime）
};
```

每次 `performWorkUntilDeadline` 开始时，从堆顶取出过期时间最早的任务执行，保证高优先级任务优先处理。

### 优先级与超时时间映射表

| Scheduler 优先级 | 常量名 | timeout（超时时间） | 说明 |
|-----------------|--------|-------------------|------|
| 1 | `ImmediatePriority` | -1ms | 立即过期，同步执行 |
| 2 | `UserBlockingPriority` | 250ms | 用户交互（点击、输入） |
| 3 | `NormalPriority` | 5000ms | 普通更新（默认） |
| 4 | `LowPriority` | 10000ms | 低优先级工作 |
| 5 | `IdlePriority` | `maxSigned31BitInt`（永不超时） | 空闲时工作 |

超时时间决定任务何时"过期"。过期的任务会被标记为 `expiredLanes`，下次渲染时强制同步处理（即使 `shouldYield()` 为 true 也不让出），防止饥饿（starvation）。

### 与 React Lanes 的协作

```
用户交互
  └─ requestUpdateLane() → SyncLane / InputContinuousLane
       └─ scheduleUpdateOnFiber()
            └─ ensureRootIsScheduled()
                 └─ lanesToEventPriority(lanes) → Scheduler 优先级
                      └─ scheduleCallback(priority, performConcurrentWorkOnRoot)
                           └─ 加入最小堆，等待调度
```

React 的 [[concepts/react/lanes-model]] 优先级通过 `lanesToEventPriority` 映射为 Scheduler 优先级，再决定任务在最小堆中的位置（即执行顺序）。

## 优势与局限

- ✅ **高精度调度**：`MessageChannel` 比 `setTimeout` 延迟更低，调度粒度更细。
- ✅ **防饥饿**：过期任务强制升级为同步执行，低优先级任务不会被无限推迟。
- ✅ **浏览器无关**：协作式调度不依赖浏览器 API（如 `requestAnimationFrame`），在 Node.js/SSR 环境中也可运行。
- ❌ **5ms 颗粒度**：时间片粒度是 5ms，单个工作单元（fiber 处理）超过 5ms 仍会阻塞，时间切片不能替代组件本身的性能优化。
- ❌ **协作依赖主动让出**：若某任务回调本身耗时过长（如同步 I/O、死循环），Scheduler 无法强制中断，仍会阻塞主线程。

## 应用场景

协作式调度是 [[concepts/react/concurrent-mode]] 的底层支撑，所有 React 并发特性（`startTransition`、`useDeferredValue`、Suspense 重试）都通过 Scheduler 的任务队列和时间切片实现。也可通过 `scheduler` 包直接使用，在非 React 场景中调度长任务。

## 相关概念

- [[concepts/react/work-loop]]：Work Loop（shouldYield 的消费方）
- [[concepts/react/time-slicing]]：时间切片
- [[concepts/react/concurrent-mode]]：并发模式
