---
title: "闭包与作用域"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, scope, closure, frontend]
status: active
sources: []
---

# 闭包与作用域

## 定义
闭包（Closure）是指一个函数与其**词法作用域（Lexical Scope）**的组合，使得该函数即便在其定义环境外被调用，仍然能访问定义时所处作用域中的变量。JavaScript 采用静态/词法作用域：变量的可见性由代码书写位置决定，而非调用位置。闭包是这种作用域规则的自然产物，也是实现私有状态、模块封装、函数式编程模式（柯里化、记忆化）的基础。

## 工作原理
当函数被创建时，引擎会保存对其外层作用域（Lexical Environment）的引用。该函数无论何时执行，都通过这条作用域链向外查找变量，直到全局作用域或抛出 ReferenceError。如果函数被传出原始作用域（如返回、注册为回调），其引用的外层环境不会被 GC 回收，这就形成了闭包。

```js
function makeCounter() {
  let count = 0; // 私有状态
  return {
    inc: () => ++count,
    get: () => count,
  };
}
const c = makeCounter();
c.inc(); c.inc();
console.log(c.get()); // 2
```

闭包的内存代价：被闭包引用的整个词法环境都不会被释放，过度使用可能造成内存泄漏。常见模式包括：
- **模块模式**：用 IIFE 封装私有状态
- **柯里化**：`const add = a => b => a + b`，外层参数被内层闭包引用
- **记忆化**：闭包持有缓存对象

经典循环陷阱：

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 输出 3 3 3
}
// 解决方案 1: let（块级作用域，每次迭代一个绑定）
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 0 1 2
}
// 解决方案 2: IIFE 制造新作用域
for (var i = 0; i < 3; i++) {
  (j => setTimeout(() => console.log(j), 0))(i);
}
```

## 优势与局限
- ✅ 实现数据私有化与模块封装
- ✅ 支撑函数式编程范式（高阶函数、柯里化、组合）
- ✅ 保持回调状态，无需挂载到全局
- ❌ 易造成内存泄漏，闭包引用的对象不会被 GC
- ❌ 大量闭包会增加内存占用与作用域链查找开销
- ❌ 调试时作用域链较深，定位变量来源有难度

## 应用场景
- **状态封装**：计数器、缓存、观察者列表
- **事件处理**：保留事件触发时的上下文数据
- **防抖节流**：闭包持有 timer 引用与上次调用时间
- **React Hooks**：`useState/useEffect` 内部依赖闭包捕获 props/state

## 相关概念
- [[concepts/js/scope-hoisting]]: 作用域规则是闭包的基础
- [[concepts/js/garbage-collection]]: 闭包是常见内存泄漏来源
