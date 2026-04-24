---
title: JavaScript & TypeScript
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, typescript, frontend]
status: active
sources: []
---

# JavaScript & TypeScript

## 概述

JavaScript 是前端领域的事实标准语言，也是 Node.js 后端的运行语言，因此在全栈工程中地位独一无二。它的设计中混杂了原型继承、函数式、事件驱动、动态类型等多种范式，理解其底层机制（事件循环、作用域、原型链、垃圾回收）是判断框架行为、排查线上 bug、做性能优化的前提。

TypeScript 在不改变运行时语义的前提下，引入结构化静态类型系统，解决了大型 JS 项目中的协作与重构痛点。它已成为现代前端工程的默认选择，掌握类型推导、泛型、条件类型、模板字面量类型等高级特性，能显著提升 API 设计能力。

## 核心概念

- [[concepts/js/event-loop]]: 单线程 + 任务队列 + 微任务的执行模型
- [[concepts/js/closures]]: 闭包与作用域捕获，常见内存泄漏模式
- [[concepts/js/prototype-chain]]: 原型继承与 `__proto__` / prototype 区别
- [[concepts/js/async-programming]]: 回调地狱 → Promise → async/await 演进
- [[concepts/js/module-system]]: CommonJS / ESM / UMD 互操作
- [[concepts/js/typescript-type-system]]: 结构化类型、类型推导、泛型
- [[concepts/js/garbage-collection]]: 标记清除、分代回收、逃逸分析
- [[concepts/js/this-binding]]: 默认/隐式/显式/new 四种绑定规则
- [[concepts/js/scope-hoisting]]: var/let/const、TDZ、函数提升
- [[concepts/js/iterators-generators]]: 协议、惰性求值、yield*
- [[concepts/js/proxy-reflect]]: 元编程与响应式系统底层
- [[concepts/js/weakref-finalization]]: 弱引用与终结器（缓存、订阅清理）

## 关联板块

- 浏览器执行环境：[[topics/fullstack/browser-network]]
- 框架对底层语言特性的运用：[[topics/fullstack/framework]]
- Node.js 服务端：[[topics/fullstack/nodejs]]

## 推荐学习路径

**初级**
1. ES6+ 语法（解构、箭头函数、模板字符串、Class）
2. [[concepts/js/scope-hoisting]] 与 [[concepts/js/this-binding]] 常见陷阱
3. Promise 基础与 async/await

**进阶**
1. [[concepts/js/event-loop]] + [[concepts/js/async-programming]] 串讲
2. [[concepts/js/closures]]、[[concepts/js/prototype-chain]] 深入
3. [[concepts/js/typescript-type-system]] 中级（条件类型、infer、模板字面量）

**深入**
1. [[concepts/js/proxy-reflect]] + [[concepts/js/iterators-generators]] 元编程
2. [[concepts/js/garbage-collection]] 与内存性能调优
3. [[concepts/js/weakref-finalization]] 在大型应用中的运用
4. 阅读 V8 / TC39 提案，跟踪语言演进

## 开放问题

- TC39 的 Pipeline、Records & Tuples 等提案落地后，JS 范式会怎样转变？
- TypeScript 的类型层正在膨胀（如 type-level 编程），它的复杂度边界在哪里？
