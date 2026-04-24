---
title: "作用域与变量提升"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, scope, hoisting, frontend]
status: active
sources: []
---

# 作用域与变量提升

## 定义
作用域（Scope）规定了变量与函数的可见范围。JavaScript 采用**词法作用域（Lexical Scope）**：作用域由代码书写位置决定，与调用位置无关。变量提升（Hoisting）是 JS 引擎在执行前的**编译阶段**将变量与函数声明"提升"到所在作用域顶部的现象——但只是声明被提升，赋值仍按代码顺序执行。`let/const` 引入了**暂时性死区（TDZ）**修正了 `var` 提升带来的诸多问题。

## 工作原理
**作用域分类**：
- **全局作用域**：脚本顶层，挂在 `globalThis` 上（`var` 与函数声明）
- **函数作用域**：`var` 与 `function` 声明的最小可见单元
- **块级作用域**：`{}` 内由 `let/const/class` 声明的变量

**作用域链**：函数创建时记录其所在的作用域，执行时从内向外查找标识符，未找到则抛 `ReferenceError`。这条链是闭包的基础。

**var 提升**：
```js
console.log(a); // undefined，不是 ReferenceError
var a = 1;
// 引擎实际执行：
// var a;
// console.log(a);
// a = 1;
```

**函数声明整体提升**（声明 + 函数体），优先于 var：
```js
foo(); // 'hi'
function foo() { console.log('hi'); }
```

**函数表达式 / 箭头函数不提升**（实际是 var/let/const 提升其变量名）：
```js
bar(); // TypeError: bar is not a function
var bar = function () {};
```

**let/const 与 TDZ**：
```js
console.log(x); // ReferenceError: Cannot access 'x' before initialization
let x = 1;
// 从作用域开始到 let 声明前的区间称为 TDZ，访问会抛错
```

`let/const` 仍会被"提升"到块顶部，但在 TDZ 内不可访问，避免了 `var` 的隐式 undefined 行为。`const` 还要求声明时必须初始化，且引用不可重新赋值（但对象属性可变）。

**块级作用域示例**：
```js
for (let i = 0; i < 3; i++) {
  // 每次迭代创建新的 i 绑定
  setTimeout(() => console.log(i), 0); // 0 1 2
}
console.log(typeof i); // 'undefined'，i 不在外层
```

## 优势与局限
- ✅ 词法作用域使程序行为可静态分析
- ✅ 块级作用域降低命名冲突与意外覆盖
- ✅ TDZ 强制"先声明后使用"，减少 bug
- ❌ var 提升历史包袱仍存在于老代码
- ❌ 多层嵌套作用域增加查找成本（虽小）
- ❌ 全局命名污染仍是浏览器环境隐患

## 应用场景
- **代码组织**：用块级作用域隔离临时变量
- **循环异步**：`for (let ...)` 替代 IIFE 闭包技巧
- **常量管理**：`const` 表达不变契约
- **代码评审**：识别提升导致的潜在 bug

## 相关概念
- [[concepts/js/closures]]: 闭包依赖词法作用域链
- [[concepts/js/this-binding]]: 与作用域并列的两套上下文规则
