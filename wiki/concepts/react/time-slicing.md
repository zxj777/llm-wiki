---
title: 时间切片（Time Slicing）
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, concurrent, performance]
status: active
sources: []
---

# 时间切片（Time Slicing）

## 定义

时间切片（Time Slicing）是 React Scheduler 将长时间渲染任务切分为多个短片段（默认 5ms）的技术，让浏览器得以在片段之间处理用户输入和绘制，从而避免长时间占用主线程导致的卡顿。时间切片是 [[concepts/react/concurrent-mode|并发模式]] 的基础设施，使 React 的渲染从"不可中断"变为"协作式"。

## 工作原理

### MessageChannel：触发宏任务

Scheduler 使用 **MessageChannel** 来调度每个时间切片：

```js
// packages/scheduler/src/forks/Scheduler.js（简化）
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null);  // 触发宏任务
}
```

每次时间切片开始时，`port.postMessage(null)` 发送消息，浏览器在当前宏任务完成后处理这条消息，调用 `performWorkUntilDeadline`。

### 为什么用 MessageChannel 而非其他 API？

| API | 问题 |
|-----|------|
| `setTimeout(fn, 0)` | 最小延迟约 4ms（HTML 规范），且嵌套 setTimeout 后延迟更大；无法保证在浏览器绘制前执行 |
| `requestAnimationFrame` | 执行时机与帧率绑定（约 16ms），频率不稳定；后台标签页暂停 |
| `requestIdleCallback` | 延迟不可控，低优先级任务可能被长时间推迟；兼容性差 |
| **MessageChannel** | ✅ 宏任务，在 rAF 和 paint 之前执行；最小延迟接近 0；跨浏览器一致 |

MessageChannel 的 `postMessage` 产生的是**宏任务**，会在当前宏任务结束后、浏览器绘制之前执行，且不受 4ms 最小延迟限制。

### 5ms 时间片

Scheduler 默认时间片长度为 **5ms**（`frameInterval = 5`）：

```js
// packages/scheduler/src/forks/Scheduler.js
let frameInterval = 5;  // 毫秒

function performWorkUntilDeadline() {
  const currentTime = getCurrentTime();
  // 设置 deadline：当前时间 + 5ms
  deadline = currentTime + frameInterval;
  // 执行工作
  const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
  if (hasMoreWork) {
    // 还有工作，调度下一个时间切片
    schedulePerformWorkUntilDeadline();
  }
}
```

### `shouldYield()`：检查是否超时

React work loop 在每处理完一个 fiber 后调用 `shouldYield()` 检查是否应该让出控制权：

```js
// packages/scheduler/src/forks/Scheduler.js
export function shouldYield() {
  const currentTime = getCurrentTime();  // performance.now()
  if (currentTime >= deadline) {
    // 超过 deadline，需要让出
    if (needsPaint || scheduling.isInputPending?.()) {
      return true;  // 有绘制需求或用户输入，立即让出
    }
    // 超时但没有紧急任务，允许继续一小段
    return currentTime >= maxYieldInterval;
  }
  return false;
}
```

`scheduling.isInputPending()`（Chrome 实验性 API）可以检测是否有待处理的用户输入事件，在有输入时即使未超过 deadline 也可以提前让出。

### Work Loop 的暂停与恢复

```js
// packages/react-reconciler/src/ReactFiberWorkLoop.js（简化）
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);  // 处理一个 fiber
  }
  // shouldYield() 返回 true → 退出循环，workInProgress 保留现场
}
```

当 `shouldYield()` 返回 true 时，work loop 暂停，`workInProgress` 指针保留当前位置。控制权返回给浏览器后，Scheduler 在下一个宏任务中继续从 `workInProgress` 恢复渲染。

### 完整调度流程

```
React 触发更新
    ↓
scheduleCallback(priority, performConcurrentWorkOnRoot)
    ↓
Scheduler 将任务加入优先级队列（小根堆）
    ↓
MessageChannel.postMessage → 宏任务
    ↓
performWorkUntilDeadline（deadline = now + 5ms）
    ↓
workLoopConcurrent：逐个处理 fiber，每个 fiber 后 shouldYield()
    ↓
shouldYield() = true → 暂停
    ↓
浏览器处理输入/绘制
    ↓
下一个 MessageChannel 宏任务 → 继续
```

## 优势与局限

- ✅ **消除卡顿**：将长任务拆分，浏览器每 5ms 有机会响应用户输入，帧率更稳定
- ✅ **优先级感知**：Scheduler 支持多种优先级，高优先级任务（用户输入）可以抢占低优先级渲染
- ✅ **无需改变组件代码**：时间切片对应用代码透明，组件不需要任何修改
- ❌ **overhead**：频繁的 `shouldYield()` 检查和任务调度本身有开销，对简单更新可能适得其反
- ❌ **commit 阶段不可中断**：时间切片只作用于 render 阶段，commit 阶段仍是同步不可中断的
- ❌ **5ms 切片可能仍太长**：在低端设备上，即使 5ms 也可能影响 120fps 体验（约 8ms/帧）

## 应用场景

- 大型列表渲染、复杂数据可视化等 CPU 密集型更新
- 配合 `startTransition` 标记低优先级更新，让高优先级交互（输入、点击）优先响应
- 分析工具（React DevTools Profiler）中可以看到时间切片的暂停和恢复行为

## 相关概念

- [[concepts/react/concurrent-mode]]：并发模式（时间切片是并发模式的核心基础设施）
- [[concepts/react/work-loop]]：Work Loop（`workLoopConcurrent` 实现时间切片感知的循环）
- [[concepts/react/cooperative-scheduling]]：协作式调度（Scheduler 的优先级队列和任务抢占）
- [[concepts/react/double-buffering]]：双缓冲（时间切片中断时 workInProgress 树保持中间状态）
