---
title: "WeakRef 与 FinalizationRegistry"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, memory, weakref, frontend]
status: active
sources: []
---

# WeakRef 与 FinalizationRegistry

## 定义
**WeakRef** 是 ES2021 引入的弱引用包装器，允许持有一个对象引用而**不阻止该对象被垃圾回收**。**FinalizationRegistry** 与之配套，可在对象被回收后触发清理回调。它们是 JS 中少见的"暴露 GC 行为"的 API，主要用于实现缓存、资源关联追踪等高级场景。但因 GC 时机不可预测，规范明确建议**避免在程序逻辑中依赖回调时机**。

## 工作原理
**WeakRef**：
```js
let user = { name: 'A' };
const ref = new WeakRef(user);

// 任意时刻尝试获取
const obj = ref.deref();
if (obj) console.log(obj.name);
else console.log('已被回收');

user = null; // 移除强引用
// 之后某次 GC 后，ref.deref() 可能返回 undefined
```

`deref()` 返回原对象或 `undefined`。规范规定，在同一个"同步执行段"（一次微任务跑完前）内，多次 `deref()` 必须返回一致结果，避免逻辑撕裂。

**FinalizationRegistry**：
```js
const registry = new FinalizationRegistry((heldValue) => {
  console.log('cleanup:', heldValue);
});

(function () {
  const big = new Array(1e6);
  registry.register(big, 'big-array', big); // 第三参数是 unregister token
})();
// 当 big 被回收后（时机不定），回调会被触发
```

**vs WeakMap / WeakSet**：
- `WeakMap`/`WeakSet` 的键是弱引用，但**不能枚举**，也无法获取键本身——主要用于"挂载隐藏数据到对象"
- `WeakRef` 允许显式取出引用，更灵活但更危险
- 三者都不阻止 GC，但语义不同

**典型缓存模式**：
```js
class WeakCache {
  #map = new Map();
  set(key, value) {
    this.#map.set(key, new WeakRef(value));
    new FinalizationRegistry(() => this.#map.delete(key)).register(value, null);
  }
  get(key) {
    const ref = this.#map.get(key);
    return ref?.deref();
  }
}
```

**注意事项**（来自 TC39 规范）：
1. 回调可能**永远不被调用**（程序结束、对象进入循环引用与不可达根之外的 GC 边界）
2. 回调时机受 GC 策略、增量标记、压力等影响
3. 不要在回调中复活对象或执行关键业务
4. 调试时可在 DevTools 中触发 GC 验证行为

## 优势与局限
- ✅ 实现"软缓存"：内存压力大时自动释放
- ✅ 追踪对象生命周期，触发外部资源释放
- ✅ 弥补 WeakMap/WeakSet 不能取值的限制
- ❌ GC 时机不可预测，不能用于业务关键逻辑
- ❌ 滥用易导致逻辑非确定性，难以测试
- ❌ 回调可能完全不触发，资源释放需有兜底
- ❌ 较新 API，老环境需 fallback

## 应用场景
- **DOM 节点缓存**：避免持有 detached DOM
- **大对象缓存**：图片、解码结果，允许内存压力下回收
- **追踪 WASM/Native 资源**：在 JS 对象回收后释放对应原生句柄
- **库内部去重**：用 WeakRef Map 避免重复包装同一对象

## 相关概念
- [[concepts/js/garbage-collection]]: WeakRef 行为完全依赖 GC 实现
