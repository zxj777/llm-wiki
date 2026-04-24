---
title: "Core Web Vitals"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [performance, web-vitals, lcp, fid, cls, frontend]
status: active
sources: []
---

# Core Web Vitals

## 定义

Core Web Vitals 是 Google 提出的衡量真实用户体验的关键性能指标集合，目前由三个核心指标组成：LCP（Largest Contentful Paint，最大内容绘制）、INP（Interaction to Next Paint，交互到下次绘制，2024 年起取代 FID）、CLS（Cumulative Layout Shift，累计布局偏移）。它们分别度量页面的加载速度、交互响应性与视觉稳定性，被纳入 Google 搜索排名信号，是衡量前端质量的事实标准。

## 工作原理

**LCP**：页面视口中最大可见元素（通常是 Hero 图、标题或视频封面）完成渲染的时间，目标 < 2.5s。影响因素包括服务器响应（TTFB）、阻塞渲染的 CSS/JS、资源加载优先级、字体加载等。优化手段：CDN 加速、预加载关键资源（`<link rel="preload">`）、压缩图片、避免大型 hydration。

**INP**：度量页面整个生命周期内用户交互（点击/键盘/触摸）到下一帧绘制的延迟，取较高百分位值，目标 < 200ms。比 FID 更全面，覆盖所有交互而非仅首次。瓶颈通常是长任务（>50ms 的 JS 执行）阻塞主线程。优化：拆分长任务（`scheduler.yield()`）、使用 Web Worker、减少 hydration 成本、防抖节流。

**CLS**：累积所有非用户触发的布局偏移分数（impact fraction × distance fraction），目标 < 0.1。常见原因：图片/视频未指定 `width`/`height`、广告动态插入、Web Font 切换（FOIT/FOUT）、异步加载组件撑开高度。

```html
<!-- 防止 CLS：显式尺寸 + font-display -->
<img src="hero.jpg" width="1200" height="600" alt="" />
<style>
  @font-face { font-family: 'Inter'; font-display: optional; }
</style>
```

```js
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

测量工具链：Chrome DevTools Performance 面板（实验室数据）、Lighthouse、PageSpeed Insights、CrUX 报告（真实用户数据 RUM）、`web-vitals.js` 上报到自有监控。

## 优势与局限

- ✅ 量化用户体验，可横向比较
- ✅ 同时覆盖加载、交互、稳定性三个维度
- ✅ 与 SEO 排名直接挂钩
- ❌ 实验室数据与真实数据可能差异巨大
- ❌ INP 难以在开发阶段稳定复现
- ❌ 仅覆盖部分体验，仍需配合 TTFB、FCP 等

## 应用场景

- 电商落地页：LCP 直接影响转化率
- SEO 驱动的内容站点：作为搜索排名信号
- 大型 SPA 应用：监控 hydration 与交互卡顿
- 性能预算与 CI 性能回归门禁

## 相关概念

- [[concepts/browser/critical-rendering-path]]: LCP 优化的底层依据
- [[concepts/performance/lazy-loading]]: 改善 LCP 与 INP 的关键手段
- [[concepts/performance/image-optimization]]: 图片是 LCP 元素的常见类型
