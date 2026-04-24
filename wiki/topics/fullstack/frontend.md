---
title: 前端开发
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [frontend, javascript, browser, framework, performance]
status: active
sources: []
---

# 前端开发

## 概述

前端开发是连接用户与产品的最后一公里，核心任务是将业务逻辑、数据状态以可交互、可访问、高性能的方式呈现在浏览器（或其他渲染容器）中。现代前端不再只是「写页面」：它涉及语言层（JavaScript/TypeScript）、运行时（V8、浏览器内核）、网络协议（HTTP/2/3、WebSocket）、框架抽象（React、Vue、Svelte）、构建工具链（Vite、Webpack、Rspack）以及性能与可访问性等横切关注点。

理解前端的关键，是把「DOM/CSSOM 渲染、JS 执行、网络请求」三条主线串联起来，知道每一次用户输入到屏幕响应之间发生了什么。这条主线之上，框架解决了状态-视图同步问题，工程化解决了规模化协作问题，性能与监控解决了用户体验问题。

## 子领域

### 语言基础 [[topics/fullstack/javascript]]
- [[concepts/js/event-loop]]: 单线程异步模型与宏/微任务
- [[concepts/js/closures]]: 闭包与作用域链
- [[concepts/js/typescript-type-system]]: 结构化类型与类型推导
- [[concepts/js/async-programming]]: Promise / async-await / 错误传播

### 浏览器与网络 [[topics/fullstack/browser-network]]
- [[concepts/browser/rendering-pipeline]]: 从 HTML 到像素
- [[concepts/browser/http-evolution]]: HTTP/1.1 → HTTP/3
- [[concepts/browser/caching]]: 强缓存 / 协商缓存 / Service Worker
- [[concepts/browser/cors]]: 同源策略与跨域

### 框架原理 [[topics/fullstack/framework]]
- [[concepts/framework/virtual-dom]]: VDOM 与 diff 算法
- [[concepts/framework/reactivity-system]]: 响应式系统（Vue/Solid/Signal）
- [[concepts/framework/ssr-csr-ssg]]: 渲染策略权衡
- [[concepts/framework/state-management]]: 状态管理范式

### 性能优化 [[topics/fullstack/performance]]
- [[concepts/performance/core-web-vitals]]: LCP / INP / CLS
- [[concepts/performance/lazy-loading]]: 路由级与组件级懒加载
- [[concepts/performance/bundle-optimization]]: 体积裁剪
- [[concepts/performance/web-worker]]: 主线程卸载

## 关联板块

- 工程化：[[topics/fullstack/engineering]]（构建、Monorepo、CI/CD）
- 安全：[[topics/fullstack/security]]（XSS、CSP、CSRF）
- 框架深度：[[topics/react/source-code]]（React 源码独立体系）

## 推荐学习路径

**初级（0-1 年）**
1. HTML 语义化 + CSS 布局（Flex/Grid）+ 现代 JS（ES6+）
2. 浏览器调试工具与 DevTools 基本用法
3. 一个主流框架的入门（React 或 Vue）

**进阶（1-3 年）**
1. 深入 [[concepts/js/event-loop]]、[[concepts/js/closures]]、[[concepts/js/prototype-chain]]
2. 掌握 [[concepts/browser/rendering-pipeline]] 与 [[concepts/browser/caching]]
3. 学会用 Vite/Webpack 配置工程化项目，理解 [[concepts/engineering/tree-shaking]]
4. 系统学习 TypeScript 类型体操与状态管理

**深入（3+ 年）**
1. 阅读框架源码（推荐 [[topics/react/source-code]]）
2. 性能优化：基于 [[concepts/performance/core-web-vitals]] 做线上监控与回归
3. 跨端方向：SSR/Edge/Micro-Frontend / WebAssembly

## 开放问题

- React Server Components 普及后，传统的 CSR 框架还有多大生存空间？
- Signals 范式（Solid、Preact、Angular）会取代 VDOM 成为主流吗？
