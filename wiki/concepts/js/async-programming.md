---
title: "异步编程"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, async, promise, frontend]
status: active
sources: []
---

# 异步编程

## 定义
异步编程是 JavaScript 处理 I/O、定时器、网络等非阻塞操作的核心范式。由于 JS 是单线程的，必须将耗时任务以异步方式提交给宿主环境（浏览器/Node），并通过回调（Callback）、Promise、async/await 等机制在结果就绪时继续执行后续逻辑。异步编程的演进史可概括为：Callback → Promise → async/await → 异步迭代器，目的是消除"回调地狱"、提供线性可读的代码并完善错误传播。

## 工作原理
**Promise** 是一个表示未来值的对象，具有三种状态：`pending`、`fulfilled`、`rejected`，状态转移不可逆。`then` 注册成功回调并返回新的 Promise，从而支持链式调用；错误沿链传播，可由 `catch` 统一处理。Promise 回调通过事件循环的微任务队列执行。

```js
fetch('/api/user')
  .then(res => res.json())
  .then(user => render(user))
  .catch(err => showError(err))
  .finally(() => hideLoading());
```

**async/await** 是基于 Promise 的语法糖：`async` 函数总是返回 Promise，`await` 暂停函数执行直到 Promise resolve，并把结果作为表达式值。底层等价于 `.then` 链，但代码呈线性结构，配合 `try/catch` 处理异常更自然。

```js
async function loadUser() {
  try {
    const res = await fetch('/api/user');
    const user = await res.json();
    return user;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
```

**并发原语**：
- `Promise.all([...])`：全部成功才 resolve，任一失败立即 reject
- `Promise.allSettled([...])`：等待全部结束，返回每个的状态
- `Promise.race([...])`：第一个 settle 决定结果（用于超时）
- `Promise.any([...])`：第一个 fulfilled 决定结果，全部失败则 AggregateError

并发控制（限制最大并发数）通常用一个简单的"信号量 + 队列"或第三方库 `p-limit` 实现，避免一次性发起过多请求耗尽资源。

## 优势与局限
- ✅ async/await 让异步代码读起来像同步
- ✅ 错误传播链路清晰，统一 catch
- ✅ Promise 组合子使复杂并发模式可声明式表达
- ❌ 忘记 `await` 会导致 Promise 悬挂、错误丢失
- ❌ async 函数中的 `await` 串行化，需主动用 `Promise.all` 并行
- ❌ 与回调 API 混用时需手动 promisify

## 应用场景
- **数据加载**：HTTP 请求、数据库查询
- **并行任务**：批量请求、批量文件处理
- **流程编排**：登录→拉用户→拉权限→渲染
- **超时与重试**：`Promise.race` + 重试包装器

## 相关概念
- [[concepts/js/event-loop]]: Promise 回调通过微任务调度
- [[concepts/js/iterators-generators]]: async/await 可视为 Generator + Promise 的特化
