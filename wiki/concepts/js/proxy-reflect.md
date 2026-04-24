---
title: "Proxy 与 Reflect"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, proxy, reflect, metaprogramming, frontend]
status: active
sources: []
---

# Proxy 与 Reflect

## 定义
**Proxy** 是 ES2015 引入的元编程能力，允许创建一个对象的"代理"，拦截并自定义其基本操作（属性读写、函数调用、原型查询等）。`Reflect` 是与 Proxy 配套的内置对象，提供与默认行为一一对应的方法（`Reflect.get`、`Reflect.set`、`Reflect.has` 等），让 trap 内部可以方便地"调用原始行为"。两者共同构成了现代 JS 框架（Vue 3、Immer、MobX、Solid）实现响应式、不可变更新、ORM 等能力的底层机制。

## 工作原理
**Proxy 创建**：
```js
const target = { name: 'A', age: 18 };
const handler = {
  get(obj, key, receiver) {
    console.log('get', key);
    return Reflect.get(obj, key, receiver);
  },
  set(obj, key, value, receiver) {
    console.log('set', key, value);
    return Reflect.set(obj, key, value, receiver);
  },
};
const p = new Proxy(target, handler);
p.name; // 触发 get
p.age = 20; // 触发 set
```

**常用 trap**：
- `get(target, key, receiver)`：读属性
- `set(target, key, value, receiver)`：写属性
- `has(target, key)`：`in` 运算符
- `deleteProperty(target, key)`：`delete` 运算符
- `ownKeys(target)`：`Object.keys`、`for...in`
- `apply(target, thisArg, args)`：函数调用
- `construct(target, args, newTarget)`：`new` 调用
- `getPrototypeOf` / `setPrototypeOf`、`defineProperty`、`getOwnPropertyDescriptor` 等

**Reflect 的作用**：
1. 提供与 trap 一一对应的方法，让"调用默认行为"语义清晰
2. 替代 `Object.defineProperty` 等命令式 API，统一返回布尔值
3. 在 trap 中正确传递 `receiver`，确保继承链上的 getter/setter 行为正确

**Vue 3 响应式简化版**：
```js
function reactive(obj) {
  return new Proxy(obj, {
    get(t, k, r) { track(t, k); return Reflect.get(t, k, r); },
    set(t, k, v, r) {
      const ok = Reflect.set(t, k, v, r);
      trigger(t, k);
      return ok;
    },
  });
}
```

**vs Vue 2 的 `Object.defineProperty`**：
- 能拦截**新增/删除属性**（defineProperty 不能，需 `Vue.set`）
- 能代理**数组索引与 length**（defineProperty 对数组支持有限）
- 能代理 Map/Set
- 惰性代理嵌套对象，按需递归
- 缺点：IE 不支持（无法 polyfill），运行时开销略高

## 优势与局限
- ✅ 拦截语义全面，几乎可代理所有基本操作
- ✅ 配合 Reflect 使代码可读且行为正确
- ✅ 框架级能力的基础（响应式、ORM、虚拟对象）
- ❌ 不可被 polyfill，老浏览器无解
- ❌ 代理对象与原对象引用不等（`p !== target`），相等比较需注意
- ❌ 性能开销高于直接访问，热路径需谨慎
- ❌ 不能代理内置对象的私有 slot（如 Date 内部时间值需手动转发）

## 应用场景
- **响应式系统**：Vue 3、Solid、Valtio
- **不可变更新**：Immer 用 Proxy 录制修改，再生成新对象
- **数据校验**：在 set 中校验类型/范围
- **API mock 与日志**：拦截调用记录参数
- **路径访问 DSL**：`api.users[1].posts` 自动转为请求

## 相关概念
- [[concepts/js/prototype-chain]]: Proxy 的部分 trap 与原型链查找交互
- react fundamentals: 类似机制启发了部分 React 状态管理库
