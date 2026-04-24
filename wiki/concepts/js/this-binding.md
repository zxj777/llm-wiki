---
title: "this 绑定规则"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, this, context, frontend]
status: active
sources: []
---

# this 绑定规则

## 定义
`this` 是 JavaScript 函数执行时的上下文引用，其值在**函数被调用时**确定，而不是在定义时。`this` 的取值由调用方式决定，遵循一组优先级明确的绑定规则。理解 `this` 是写正确的 OOP 代码、回调、事件处理与框架内部机制的基础。箭头函数则打破了这套规则——它没有自己的 `this`，而是从词法作用域继承。

## 工作原理
按优先级从高到低，函数调用时的 `this` 绑定有四种规则：

**1. `new` 绑定**：用 `new` 调用构造函数时，`this` 指向新创建的对象。
```js
function Foo() { this.x = 1; }
const f = new Foo(); // this === f
```

**2. 显式绑定**：通过 `call`、`apply`、`bind` 显式指定。
```js
function greet() { return `Hi, ${this.name}`; }
greet.call({ name: 'A' }); // 'Hi, A'
const bound = greet.bind({ name: 'B' });
bound(); // 'Hi, B'，bind 返回的函数 this 永久绑定
```

**3. 隐式绑定**：作为对象方法调用时，`this` 指向调用者。
```js
const obj = { name: 'C', say() { return this.name; } };
obj.say(); // 'C'
const fn = obj.say;
fn(); // undefined（严格模式）/ globalThis.name（非严格） —— 隐式绑定丢失
```

**4. 默认绑定**：直接调用函数。严格模式下 `this` 为 `undefined`，非严格模式指向 `globalThis`（浏览器中是 `window`）。

**箭头函数特殊**：不参与上述规则，`this` 来自定义所在的词法作用域，且不能被 `call/apply/bind` 改变。

```js
class Timer {
  constructor() { this.sec = 0; }
  start() {
    setInterval(() => { this.sec++; }, 1000); // 箭头函数继承 start 的 this
  }
}
```

**常见陷阱**：
- 回调中的 this 丢失：`setTimeout(obj.method, 0)` 等价于 `setTimeout(function(){ obj.method() }, 0)` 中的 method 已脱离对象
- DOM 事件回调中 `this` 是触发元素（除非用箭头函数）
- React Class 组件中需要 `this.handler = this.handler.bind(this)` 或使用箭头方法

## 优势与局限
- ✅ 灵活，同一函数可被多对象复用
- ✅ 配合原型链实现高效方法共享
- ✅ 箭头函数解决了回调中 this 丢失的痛点
- ❌ 隐式绑定易丢失，初学者难以预测
- ❌ 多种绑定规则交织增加认知成本
- ❌ 严格 vs 非严格模式行为差异

## 应用场景
- **OOP 编程**：方法访问实例数据
- **事件处理**：绑定 handler 时保持组件上下文
- **API 设计**：链式调用通常 `return this`
- **库实现**：jQuery 风格的隐式上下文 / React Class 组件

## 相关概念
- [[concepts/js/closures]]: 箭头函数借助闭包捕获词法 this
- [[concepts/js/prototype-chain]]: 原型方法的 this 通常指向调用实例
