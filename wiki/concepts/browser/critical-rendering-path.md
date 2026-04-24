---
title: "关键渲染路径"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, performance, rendering, frontend]
status: active
sources: []
---

# 关键渲染路径

## 定义
关键渲染路径（Critical Rendering Path, CRP）是指浏览器从接收 HTML 到首次将像素绘制到屏幕所经历的最短依赖链。优化 CRP 的目标是尽快完成 First Contentful Paint（FCP）和 Largest Contentful Paint（LCP），降低用户感知的"白屏时间"。CRP 关注的是哪些资源会**阻塞渲染**，以及如何通过资源加载策略、代码拆分、内联与预加载来缩短这条路径。

## 工作原理
浏览器渲染首屏的最短路径需要：完整的 DOM + 关键 CSSOM + （可选）非阻塞 JS。其中**渲染阻塞资源**主要包括：
- 同步 `<script>`：会暂停 HTML 解析，直到下载并执行完成
- `<link rel="stylesheet">`：阻塞渲染（也阻塞后续同步 JS 执行）
- `@import` 引入的 CSS：串行加载，更糟糕

**script 加载策略**：
```html
<script src="a.js"></script>          <!-- 阻塞解析 -->
<script src="a.js" defer></script>    <!-- 并行下载，DOM 解析完后按顺序执行 -->
<script src="a.js" async></script>    <!-- 并行下载，下载完立即执行（顺序不保证） -->
<script type="module" src="a.js"></script> <!-- 默认 defer -->
```

| 属性 | 下载 | 执行时机 | 顺序保证 |
|------|------|---------|---------|
| 无 | 阻塞 HTML | 下载完立即 | 是 |
| defer | 不阻塞 | DOMContentLoaded 前 | 是 |
| async | 不阻塞 | 下载完立即 | 否 |

**CSS 优化**：
- 内联首屏关键 CSS（Critical CSS）减少额外请求
- 非关键 CSS 用 `media` 查询或 `onload` 切换：
  ```html
  <link rel="stylesheet" href="print.css" media="print">
  <link rel="preload" href="rest.css" as="style" onload="this.rel='stylesheet'">
  ```
- 拆分 CSS 文件，按路由/组件加载

**预加载提示**：
- `<link rel="preload">`：当前页面将立即用到的关键资源
- `<link rel="prefetch">`：未来导航可能用到
- `<link rel="preconnect">`：提前完成 DNS+TCP+TLS 握手
- `<link rel="dns-prefetch">`：仅 DNS 预解析

**度量**：Lighthouse、WebPageTest、Chrome DevTools 的 Coverage 工具能识别未使用的 CSS/JS，配合 PerformanceObserver 监控 FCP/LCP。

## 优势与局限
- ✅ 优化 CRP 显著降低首屏白屏与跳出率
- ✅ 简单改造（defer/preload）即可见效
- ✅ 与 Core Web Vitals 直接相关
- ❌ 内联过多 CSS 会膨胀 HTML 与缓存粒度
- ❌ async script 顺序不可控，依赖性强的不适用
- ❌ 过度 preload 反而抢占带宽，影响其他资源

## 应用场景
- **首屏优化**：电商落地页、博客文章页 LCP 优化
- **SEO 改进**：CWV 是 Google 排名因素之一
- **A/B 实验加载**：用 async + 防闪烁策略
- **PWA 启动**：配合 Service Worker 预缓存关键资源

## 相关概念
- [[concepts/browser/rendering-pipeline]]: CRP 是流水线的"首屏子路径"
- [[concepts/performance/core-web-vitals]]: 衡量 CRP 优化效果的核心指标
