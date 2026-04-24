---
title: "垃圾回收机制"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, memory, gc, frontend]
status: active
sources: []
---

# 垃圾回收机制

## 定义
垃圾回收（Garbage Collection, GC）是 JavaScript 引擎自动管理内存的机制：识别不再被引用的对象并释放其占用的内存。开发者无需手动 `free`，但仍需理解 GC 原理以避免内存泄漏。现代 JS 引擎（V8、SpiderMonkey、JavaScriptCore）普遍采用**分代回收 + 标记清除/整理**的混合策略，并辅以增量、并发、并行优化，以降低 GC 暂停对主线程的影响。

## 工作原理
**两类基础算法**：
- **引用计数（Reference Counting）**：每个对象维护引用数，归零即回收。优点是即时；缺点是无法处理循环引用（A 引用 B，B 引用 A，外部已无引用却仍非零）。早期 IE 的 DOM 即受此困扰。
- **标记清除（Mark-Sweep）**：从 GC Root（全局对象、当前调用栈、闭包引用等）出发遍历可达对象并标记，未被标记的视为垃圾予以清除。可处理循环引用，是现代主流。

**V8 分代回收**：
- **新生代（Young Generation）**：约几 MB，用 **Scavenge / Cheney** 复制算法，分 from/to 两个 semi-space，存活对象复制到 to，存活两轮以上晋升老生代。优点是回收极快，适合"大多数对象生命周期很短"的假设。
- **老生代（Old Generation）**：使用 **Mark-Sweep / Mark-Compact**。Mark-Compact 在清除后整理碎片。
- **增量标记（Incremental Marking）**：将标记阶段拆成多个小步与 JS 执行交错，减少长 GC 暂停。
- **并发与并行 GC**：将部分工作放到后台线程，进一步降低主线程停顿。

```js
// 常见内存泄漏：意外的全局变量
function leak() { x = 'oops'; } // 缺 var/let，挂到 globalThis

// 闭包持有大对象
function attach() {
  const big = new Array(1e6).fill(0);
  document.getElementById('btn').onclick = () => console.log(big.length); // big 永远在
}

// 未清理的定时器与监听器
const id = setInterval(() => doSomething(node), 1000);
// 组件卸载后忘记 clearInterval(id) 与 node 一起泄漏
```

**排查工具**：Chrome DevTools 的 Memory 面板（Heap Snapshot、Allocation instrumentation、Allocation sampling）可快速定位 detached DOM、长存对象、闭包占用。

## 优势与局限
- ✅ 自动管理内存，避免手动 free 的常见错误
- ✅ 分代假设契合 JS 应用的对象生命周期分布
- ✅ 增量/并发降低主线程停顿
- ❌ 仍可能出现"暂停尖刺"导致掉帧
- ❌ 不可预测的回收时机增加调试难度
- ❌ 闭包、事件监听器、全局缓存仍是常见泄漏源

## 应用场景
- **长时运行应用**：SPA、Electron、Node 服务需关注内存增长曲线
- **性能调优**：减少短生命周期对象的分配以降低新生代回收压力
- **WebGL/Canvas**：大量临时对象（向量、矩阵）建议复用对象池
- **缓存设计**：使用 [[concepts/js/weakref-finalization]] 或 LRU 限制无界增长

## 相关概念
- [[concepts/js/closures]]: 闭包是常见的内存持有路径
- [[concepts/js/weakref-finalization]]: 弱引用允许 GC 回收被弱引的对象
