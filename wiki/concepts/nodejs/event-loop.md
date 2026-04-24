---
title: "Node.js 事件循环"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, event-loop, libuv, async, backend]
status: active
sources: []
---

# Node.js 事件循环

## 定义

Node.js 事件循环是基于 libuv 实现的异步 I/O 调度机制，让单线程的 JS 能高效处理大量并发 I/O。它将不同类型的回调放入不同阶段队列中按固定顺序轮询执行，与浏览器事件循环宏微任务模型有相似处也有显著区别（如 `setImmediate`、`process.nextTick` 是 Node 独有）。理解事件循环是写出高性能、可预测后端代码的基础。

## 工作原理

libuv 事件循环包含 6 个主要阶段，按顺序循环：

1. **timers**：执行到期的 `setTimeout` / `setInterval` 回调
2. **pending callbacks**：执行某些系统操作（如 TCP 错误）的回调
3. **idle, prepare**：内部使用
4. **poll**：等待并执行 I/O 回调（核心阶段，可阻塞等待）
5. **check**：执行 `setImmediate` 回调
6. **close callbacks**：执行 `socket.on('close')` 等

**两个特殊队列**优先级高于上述阶段：
- `process.nextTick` 队列：每个阶段之间、微任务前清空
- Promise microtask 队列：紧随其后清空

```js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('sync');
// 输出顺序：sync → nextTick → promise → timeout/immediate（顺序在主模块中不确定）
```

**`setTimeout(fn, 0)` vs `setImmediate`**：在 I/O 回调内部，`setImmediate` 一定先于 `setTimeout(0)` 执行（因为 poll 之后立即进入 check）；在主模块顶层则取决于 timers 阶段进入耗时与 1ms 最小延时舍入，结果不稳定。

**`process.nextTick` 的危险**：优先级最高且会"插队"在阶段之间不断执行，递归调用 `nextTick` 会饿死 I/O，导致服务器假死。

**CPU 密集任务**会阻塞事件循环：如同步加密、JSON 解析大对象、复杂正则。解决方案：拆解任务（`setImmediate` 让出）、用 `worker_threads` 把 CPU 任务交给独立线程，或用 C++ Addon。

```js
const { Worker } = require('worker_threads');
new Worker('./cpu.worker.js', { workerData: payload });
```

## 优势与局限

- ✅ 单线程模型简化并发心智
- ✅ 高 I/O 吞吐，连接成本低
- ✅ libuv 跨平台抽象成熟
- ❌ CPU 密集任务会阻塞所有请求
- ❌ `nextTick` 滥用会导致饥饿
- ❌ 阶段顺序不易理解，调试微妙

## 应用场景

- 高并发 HTTP API、网关、BFF
- WebSocket / 长连接服务
- 命令行工具与构建系统
- 实时日志/事件管道

## 相关概念

- [[concepts/js/event-loop]]: 浏览器事件循环模型对比
- [[concepts/nodejs/streams]]: 基于事件循环的流式 I/O
