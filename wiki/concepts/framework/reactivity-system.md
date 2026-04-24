---
title: "响应式系统"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [framework, reactivity, vue, mobx, frontend]
status: active
sources: []
---

# 响应式系统

## 定义

响应式系统（Reactivity System）是一种让数据变化自动驱动副作用（如视图更新、计算派生值）执行的机制。开发者只需声明"数据"和"依赖数据的逻辑"，框架在数据被读取时自动**收集依赖**，在数据被写入时自动**触发更新**，从而免去手动调用 `setState` 或事件订阅的繁琐。Vue、MobX、Solid、Preact Signals 等框架都基于响应式实现，与 React 的"显式触发 + 重新渲染"形成对比。

## 工作原理

响应式的核心是把普通对象包装成"可观察"对象，并在三个时机做拦截：**读取时收集依赖**（track）、**写入时触发副作用**（trigger）、**副作用执行时建立关联**（effect）。

Vue 2 使用 `Object.defineProperty` 递归劫持对象每一个属性的 getter/setter，缺点明显：

- 无法监听属性的新增/删除（需要 `Vue.set`）
- 无法监听数组索引修改和 `length` 变化（需要重写 7 个数组方法）
- 初始化时必须深度遍历，性能差

Vue 3 和 MobX 5+ 改用 ES6 **Proxy**，可以拦截整个对象上的所有操作，包括属性新增、删除、`in`、`delete`，且只在访问时才递归代理嵌套对象，惰性求值更高效。

```js
const targetMap = new WeakMap();
let activeEffect = null;

function reactive(obj) {
  return new Proxy(obj, {
    get(t, k) { track(t, k); return Reflect.get(t, k); },
    set(t, k, v) { Reflect.set(t, k, v); trigger(t, k); return true; },
  });
}

function effect(fn) {
  activeEffect = fn; fn(); activeEffect = null;
}
```

`track` 把当前正在执行的 effect 注册到 `targetMap[obj][key]` 这个集合里；`trigger` 在 set 时把该集合中所有 effect 重新执行一遍。这样就形成了"读取时记账，写入时通知"的闭环。`computed` 是带缓存的 effect，依赖未变时直接返回上次结果；`watch` 是显式订阅特定数据的 effect。

MobX 沿用同样思路，但强调 `observable + action + computed` 的范式，写操作必须包在 action 里以批量触发更新。**Signal 模式**（Solid、Preact Signals、Angular Signals）则把响应式粒度细化到单个值：每个 Signal 就是一个独立的 getter/setter，没有 VDOM Diff，更新时直接定位到使用该 Signal 的 DOM 节点。

```js
const count = signal(0);
effect(() => console.log(count.value));
count.value++;
```

## 优势与局限

- ✅ 心智模型简单：改数据，UI 自动更新
- ✅ 精确依赖追踪，避免无关组件重渲染
- ✅ 计算属性自动缓存，派生数据声明式
- ❌ 调试链路隐式，"为什么这个值变了"需借助 DevTools
- ❌ Proxy 在某些低端环境（如老 IE）不支持，无法 polyfill
- ❌ 过度细粒度可能导致大量微小更新，反而成为瓶颈

## 应用场景

- Vue 3 的 `ref` / `reactive` / `computed` / `watch`
- MobX 在 React 中替代 Redux 做状态管理
- Solid / Preact Signals 等无 VDOM 的细粒度响应式框架
- 状态管理库内部实现（Pinia、Zustand 的部分能力）

## 相关概念

- [[concepts/js/proxy-reflect]]: Vue 3 响应式底层依赖的 Proxy / Reflect API
- [[concepts/framework/virtual-dom]]: VDOM 与响应式是两条不同的更新驱动路线，Vue 把两者结合
- [[concepts/framework/state-management]]: 响应式系统是许多状态管理库的实现基础
