---
title: "浏览器渲染流水线"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, rendering, layout, paint, frontend]
status: active
sources: []
---

# 浏览器渲染流水线

## 定义
浏览器渲染流水线（Rendering Pipeline）是指浏览器将 HTML、CSS、JavaScript 转化为屏幕像素的一系列阶段。完整流程包括：解析 HTML 构建 DOM → 解析 CSS 构建 CSSOM → 合成渲染树（Render Tree）→ 布局（Layout）→ 分层（Layer）→ 绘制（Paint）→ 合成（Composite）。理解这条流水线是定位性能问题、避免重排重绘、合理使用合成层提升的基础。

## 工作原理
**1. Parse HTML → DOM**：HTML Parser 边下载边解析，遇到 `<script>` 默认会暂停 DOM 构建（`async/defer` 可改变行为）。生成 DOM 树。

**2. Parse CSS → CSSOM**：CSS 是渲染阻塞资源，Parser 解析所有 `<link>`/`<style>` 生成 CSSOM 树。直到 CSSOM 构建完才能进入下一步。

**3. Render Tree（渲染树）= DOM + CSSOM**：合并两棵树，过滤掉 `display: none` 等不渲染节点，每个节点附带计算后样式。

**4. Layout（布局 / Reflow）**：根据视口与盒模型计算每个节点的几何信息（位置、尺寸）。这是 CPU 密集操作。

**5. Layer（分层）**：浏览器将渲染树拆分为多个图层（Layer）。触发独立合成层的常见条件：3D transform、`will-change`、`<video>`/`<canvas>`、`opacity` 动画、`position: fixed` 等。

**6. Paint（绘制）**：为每个图层生成"绘制指令列表"（DisplayList），并光栅化为位图（Raster）。

**7. Composite（合成）**：合成线程将各图层位图按顺序合成最终画面，交给 GPU 上屏。合成线程独立于主线程，因此即使主线程繁忙，已存在的合成层动画（transform/opacity）也能保持流畅。

```html
<!-- 触发合成层提升 -->
<div style="will-change: transform">动画元素</div>
<div style="transform: translateZ(0)">老式 hack</div>
```

**关键时间点**：
- FP（First Paint）：首次像素绘制
- FCP（First Contentful Paint）：首次有内容绘制
- LCP（Largest Contentful Paint）：最大内容绘制
- TTI（Time to Interactive）：可交互时间

**主线程活动顺序**（每帧理想 16.6ms）：JS → Style → Layout → Paint → Composite。改动只触发后段越靠后，性能越好。这就是 transform/opacity 动画优于 left/top 的原因。

## 优势与局限
- ✅ 分层合成允许 GPU 加速动画
- ✅ 增量更新：只重排受影响子树
- ✅ 浏览器自动调度，开发者无需手动管理
- ❌ JS 执行可阻塞流水线，需控制长任务
- ❌ 频繁触发 Layout/Paint 会掉帧
- ❌ 合成层过多会增加内存与合成成本

## 应用场景
- **性能调优**：用 DevTools Performance 面板看流水线各阶段耗时
- **动画优化**：优先使用 transform/opacity，避免 width/top
- **首屏优化**：减少阻塞 CSS、内联关键 CSS
- **懒渲染**：`content-visibility: auto` 跳过屏外元素 Layout/Paint

## 相关概念
- [[concepts/browser/reflow-repaint]]: 流水线的局部触发模式
- [[concepts/browser/critical-rendering-path]]: 首屏渲染的关键子路径
