---
title: 框架原理
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [framework, react, vue, frontend]
status: active
sources: []
---

# 框架原理

## 概述

前端框架的本质是「描述 UI 与状态的关系，并自动维护两者的一致性」。围绕这一目标，业界演化出两大主流范式：**Virtual DOM + 调和**（React、Vue 2/3）与**细粒度响应式 / Signals**（Solid、Vue 3 Reactivity、Angular Signals、Svelte 5 Runes）。两者在心智模型、运行时开销、编译优化上各有取舍。

除核心调度模型外，框架还需要回答路由、状态管理、组件模型、跨端渲染（SSR/SSG/Edge）等问题。理解这些抽象的设计动机与边界条件，比记住 API 更重要——它决定了你能否在新框架出现时快速迁移、能否在性能瓶颈出现时定位到正确的层次。

## 核心概念

- [[concepts/framework/virtual-dom]]: VDOM 数据结构与 diff 算法
- [[concepts/framework/reactivity-system]]: 依赖追踪、effect、Signal
- [[concepts/framework/compile-vs-runtime]]: Svelte/Solid 的编译时优化 vs React 的运行时调度
- [[concepts/framework/router-internals]]: History API、嵌套路由、数据加载
- [[concepts/framework/state-management]]: Flux/Redux、Atom（Jotai/Recoil）、Signal
- [[concepts/framework/component-model]]: 组件、Slot、Composition
- [[concepts/framework/ssr-csr-ssg]]: 渲染模式与 Hydration
- [[concepts/framework/micro-frontend]]: Module Federation、qiankun

## 关联体系

- React 源码深度分析已有独立体系：[[topics/react/source-code]]（Fiber、调度器、Hooks 实现等）
- 工程化层：[[topics/fullstack/engineering]]（构建、Module Federation）
- 性能层：[[topics/fullstack/performance]]（基于框架特性的优化）

## 推荐学习路径

**初级**
1. 选定一个主流框架（React/Vue），完成一个 SPA 项目
2. 理解组件、Props、State、生命周期/Hooks 基本概念
3. 路由与基本状态管理

**进阶**
1. [[concepts/framework/virtual-dom]] + [[concepts/framework/reactivity-system]] 对比
2. [[concepts/framework/state-management]]：Redux 思想 → Atom → Signal 演进
3. [[concepts/framework/ssr-csr-ssg]]：Next.js / Nuxt / Remix 的差异
4. [[concepts/framework/router-internals]]：嵌套路由与 Loader/Action 模式

**深入**
1. [[topics/react/source-code]] 系列：Fiber、调度、Hooks 内部实现
2. [[concepts/framework/compile-vs-runtime]]：Svelte/Solid 编译产物分析
3. [[concepts/framework/micro-frontend]]：Module Federation 与运行时隔离
4. RSC（React Server Components）与 Streaming SSR

## 开放问题

- React Server Components 是否会成为主流，传统 CSR 框架的定位将如何？
- 在 Signals 范式下，VDOM 还有不可替代的价值吗？
