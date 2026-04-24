---
title: "事件循环"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, runtime, async, frontend]
status: active
sources: []
---

# 事件循环

## 定义
事件循环（Event Loop）是 JavaScript 运行时实现单线程异步并发的核心机制。它通过一个持续运行的循环，协调"调用栈（Call Stack）"、"任务队列（Task Queue / Macrotask Queue）"和"微任务队列（Microtask Queue）"之间的执行顺序，使得 JS 在不阻塞主线程的前提下处理 I/O、定时器、Promise 回调、UI 事件等异步任务。事件循环的具体实现存在于宿主环境（浏览器、Node.js）中，而不是 ECMAScript 规范本身，但行为高度一致。

## 工作原理
事件循环的基本步骤是：
1. 从调用栈中执行同步代码，直到栈清空。
2. 清空所有微任务（Microtask）队列——执行 `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver` 注册的回调。
3. 从宏任务（Macrotask）队列中取出**一个**任务执行——常见来源包括 `setTimeout`/`setInterval`、I/O 回调、`MessageChannel`、`postMessage`、UI 事件。
4. 再次清空微任务队列。
5. 浏览器在合适时机进行渲染（rAF → Style → Layout → Paint）。
6. 回到第 3 步循环。

关键点：**每执行完一个宏任务，都会清空整个微任务队列**，这意味着微任务的优先级远高于宏任务。同时，微任务在执行期间产生的新微任务也会被立即处理，这可能导致"微任务饥饿"——长时间阻塞渲染和宏任务。

```js
console.log('1'); // 同步
setTimeout(() => console.log('2'), 0); // 宏任务
Promise.resolve().then(() => console.log('3')); // 微任务
queueMicrotask(() => console.log('4')); // 微任务
console.log('5'); // 同步
// 输出: 1 5 3 4 2
```

```js
// async/await 本质上是 Promise + 微任务
async function foo() {
  console.log('A');
  await null; // 等价于 Promise.resolve().then(...)
  console.log('B'); // 进入微任务
}
foo();
console.log('C');
// 输出: A C B
```

Node.js 的事件循环更复杂，分为 timers / pending callbacks / poll / check / close 等多个阶段，`process.nextTick` 优先级高于 Promise 微任务。

## 优势与局限
- ✅ 单线程模型简化并发心智，无需处理锁与竞态
- ✅ 异步非阻塞，适合 I/O 密集场景
- ✅ 微任务保证 Promise 回调及时执行
- ❌ CPU 密集任务会阻塞主线程，需借助 Web Worker
- ❌ 微任务嵌套不当易导致渲染掉帧
- ❌ 不同宿主环境（浏览器 vs Node）行为略有差异，跨平台需谨慎

## 应用场景
- **任务调度**：使用 `queueMicrotask` 让回调在当前同步代码后立即执行
- **避免长任务卡顿**：将大计算切分到多个宏任务（`setTimeout(0)` 或 `MessageChannel`）
- **批处理**：Vue/React 的更新调度依赖微任务批量收集状态变更
- **面试与调试**：理解输出顺序、定位"为什么 setTimeout 0 没立即执行"等问题

## 相关概念
- [[concepts/js/async-programming]]: 异步编程模型建立在事件循环之上
- [[concepts/browser/rendering-pipeline]]: 渲染时机与事件循环紧密耦合
