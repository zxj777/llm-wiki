---
title: "迭代器与生成器"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, iterator, generator, async, frontend]
status: active
sources: []
---

# 迭代器与生成器

## 定义
**迭代器（Iterator）**是一种统一遍历协议：任何实现了 `next()` 方法、返回 `{ value, done }` 的对象都是迭代器；任何实现了 `[Symbol.iterator]()` 并返回迭代器的对象都是**可迭代对象（Iterable）**。**生成器（Generator）**是用 `function*` 定义的特殊函数，调用后返回一个同时满足迭代器与可迭代协议的生成器对象，可通过 `yield` 暂停/恢复执行。两者共同提供了惰性求值、自定义遍历、协程、异步序列等能力。

## 工作原理
**迭代协议**：
```js
const it = {
  i: 0,
  next() { return this.i < 3 ? { value: this.i++, done: false } : { value: undefined, done: true }; },
  [Symbol.iterator]() { return this; },
};
for (const v of it) console.log(v); // 0 1 2
```

`for...of`、解构 `[a, b] = obj`、`...spread`、`Array.from`、`Promise.all`、`new Map(iterable)` 等都基于迭代协议。Array、String、Map、Set、TypedArray、arguments、NodeList 等均原生可迭代。

**生成器**：
```js
function* counter() {
  let i = 0;
  while (true) yield i++;
}
const c = counter();
c.next(); // { value: 0, done: false }
c.next(); // { value: 1, done: false }
```

`yield` 暂停函数执行，将值交给调用方；`next(arg)` 恢复执行并把 `arg` 作为上一个 `yield` 表达式的返回值，从而实现双向通信（协程）。`return()` 提前终止，`throw()` 在生成器内抛错。

**惰性求值**示例：
```js
function* take(iter, n) {
  for (const x of iter) {
    if (n-- <= 0) return;
    yield x;
  }
}
[...take(counter(), 5)]; // [0,1,2,3,4]
```

**异步迭代器**：`async function*` 定义异步生成器，`yield` 出 Promise；消费端用 `for await...of`，常用于流式数据。

```js
async function* lines(stream) {
  for await (const chunk of stream) {
    for (const line of chunk.toString().split('\n')) yield line;
  }
}
```

历史意义：在 async/await 标准化之前，社区用 Generator + Promise 自动机（如 co 库）模拟 async/await——`yield` 一个 Promise，由调度器在 resolve 后调用 `next(value)` 恢复，这正是 async/await 的语义本质。

## 优势与局限
- ✅ 统一遍历协议，与各种集合无缝协作
- ✅ 惰性求值支持无限序列与流处理
- ✅ 生成器实现轻量协程，简化状态机
- ✅ 异步迭代天然契合流式 API（fetch、Node Streams、SSE）
- ❌ 生成器调试栈不如普通函数直观
- ❌ 性能略低于普通循环（多了状态机开销）
- ❌ 双向通信语义需要练习才能用熟

## 应用场景
- **自定义集合**：树/图遍历提供 `[Symbol.iterator]`
- **分页/滚动加载**：异步迭代器封装"还有下一页就 yield"
- **AI 流式响应**：`for await...of stream` 消费 SSE/WebSocket 流
- **状态机**：Redux-saga 用 Generator 描述异步流程

## 相关概念
- [[concepts/js/async-programming]]: async/await 是 Generator + Promise 的特化
- [[concepts/js/event-loop]]: 异步迭代器的调度依赖事件循环
