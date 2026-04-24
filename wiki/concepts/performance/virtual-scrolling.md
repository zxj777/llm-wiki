---
title: "虚拟列表"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [performance, virtual-scrolling, list, dom, frontend]
status: active
sources: []
---

# 虚拟列表

## 定义

虚拟列表（Virtual Scrolling / Windowing）是一种渲染大数据量列表的优化技术：只渲染可视区域内的少量 DOM 节点，列表外元素以"虚拟"占位方式存在，从而把 DOM 规模从 O(N) 降到 O(可视行数)。它解决了万级或十万级数据下首次挂载缓慢、滚动卡顿、内存膨胀等问题，是表格、聊天记录、Feed 流等场景的标配。

## 工作原理

核心思想：用一个高度等于"总高度"的容器营造完整滚动条，根据 `scrollTop` 计算应渲染的行索引区间，仅渲染该区间的真实 DOM，并用 `transform: translateY(...)` 把它们定位到正确位置。

**固定高度场景**计算简单：

```js
const totalHeight = items.length * itemHeight;
const startIndex = Math.floor(scrollTop / itemHeight);
const endIndex = Math.ceil((scrollTop + viewportHeight) / itemHeight);
const visible = items.slice(startIndex, endIndex + overscan);
const offsetY = startIndex * itemHeight;
```

模板：

```html
<div style="height: 800px; overflow: auto" onscroll="...">
  <div style="height: ${totalHeight}px; position: relative">
    <div style="transform: translateY(${offsetY}px)">
      <!-- 仅渲染 visible 行 -->
    </div>
  </div>
</div>
```

**可变高度**复杂得多：先用估算高度算出大致总高，渲染后通过 `ResizeObserver` 测量真实高度并缓存，逐步修正总高度与 offset。常见库实现"绑定测量 + 二分定位"。

`overscan`（前后多渲染几行）能缓解滚动时白屏。窗口外回收 DOM 时要小心保留状态（受控表单、动画）。

主流库：`react-window`（轻量，固定高度首选）、`react-virtuoso`（可变高度优秀）、`@tanstack/virtual`（框架无关 headless）、Vue 生态的 `vue-virtual-scroller`。

## 优势与局限

- ✅ DOM 数量恒定，性能与数据量解耦
- ✅ 首屏渲染与内存占用大幅降低
- ✅ 滚动帧率稳定
- ❌ Ctrl+F 浏览器查找、辅助技术访问受限
- ❌ 可变高度实现复杂，易出现"跳动"
- ❌ SEO 不友好（内容不在 DOM 里）

## 应用场景

- 后台数据表格（万行以上）
- 聊天/IM 消息历史
- 社交 Feed、商品瀑布流
- 大型选择器（地区/股票/字符列表）

## 相关概念

- [[concepts/browser/reflow-repaint]]: 虚拟列表减少 reflow 范围
- [[concepts/performance/lazy-loading]]: 与懒加载常配合使用
