---
title: 性能优化
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [performance, optimization, frontend, web-vitals]
status: active
sources: []
---

# 性能优化

## 概述

性能优化的目标不是「让所有东西更快」，而是**在关键交互路径上把用户感知的延迟降到可接受范围内**。Google 提出的 Core Web Vitals（LCP / INP / CLS）已成为衡量 Web 体验的事实标准，也直接影响 SEO 排名。

性能优化是一项系统工程：从网络层（CDN、HTTP/3、缓存）、加载层（懒加载、预加载、Bundle 拆分）、渲染层（避免重排、虚拟滚动、Web Worker 卸载）、内存层（对象池、WeakMap、避免泄漏）层层推进。任何优化都应基于度量（RUM / Lighthouse / Performance Observer）而非直觉。

## 核心概念

- [[concepts/performance/core-web-vitals]]: LCP、INP、CLS 指标定义与优化
- [[concepts/performance/lazy-loading]]: 路由级、组件级、图片懒加载
- [[concepts/performance/virtual-scrolling]]: 长列表渲染优化
- [[concepts/performance/image-optimization]]: WebP/AVIF、响应式图片、CDN
- [[concepts/performance/bundle-optimization]]: Tree shaking、按需加载、包体积分析
- [[concepts/performance/memory-optimization]]: 泄漏排查、对象复用、WeakRef
- [[concepts/performance/web-worker]]: 主线程卸载、SharedWorker、Worker 通信
- [[concepts/performance/prefetch-preload]]: 资源提示与优先级

## 关联板块

- 浏览器与网络：[[topics/fullstack/browser-network]]（性能优化的物理基础）
- 框架原理：[[topics/fullstack/framework]]（框架本身的性能特性）
- 工程化：[[topics/fullstack/engineering]]（构建产物的体积与拆分）

## 推荐学习路径

**初级**
1. Lighthouse 跑分并理解每项指标含义
2. 图片懒加载、路由懒加载基础
3. 网络面板分析瀑布图

**进阶**
1. [[concepts/performance/core-web-vitals]]：基于 web-vitals 库做 RUM
2. [[concepts/performance/bundle-optimization]]：用 source-map-explorer 分析包体积
3. [[concepts/performance/lazy-loading]] + [[concepts/performance/prefetch-preload]] 组合
4. [[concepts/performance/virtual-scrolling]]：解决长列表卡顿

**深入**
1. [[concepts/performance/web-worker]]：把 CPU 密集任务卸载到 Worker
2. [[concepts/performance/memory-optimization]]：DevTools Memory 面板深度调优
3. 自建性能监控：从 Performance Observer 到链路追踪
4. 服务端流式渲染、Edge SSR 的性能模型

## 开放问题

- INP 取代 FID 后，对 React 等运行时密集框架提出了哪些新挑战？
- 在低端设备占比仍高的市场，如何制定差异化的性能预算？
