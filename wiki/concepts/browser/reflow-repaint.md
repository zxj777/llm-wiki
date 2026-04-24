---
title: "回流与重绘"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, rendering, performance, layout, frontend]
status: active
sources: []
---

# 回流与重绘

## 定义
**回流（Reflow / Layout）** 指浏览器重新计算元素几何位置与尺寸的过程；**重绘（Repaint）** 指在不改变几何信息的前提下更新视觉样式（颜色、可见性等）；**合成（Composite）** 仅重组合已有图层的过程。三者所触发的渲染流水线长度依次递减——回流最贵，合成最便宜。理解三者触发条件是动画与交互性能优化的关键。

## 工作原理
**触发等级**：

**1. Reflow（最贵）**：改变几何属性，必须重新走 Layout → Paint → Composite。常见触发：
- 修改 `width/height/padding/margin/border/top/left/font-size`
- 增删 DOM 节点
- 读取 `offsetTop/offsetWidth/scrollTop/clientWidth/getBoundingClientRect/getComputedStyle`（强制同步布局）
- 视口尺寸变化（window resize）
- 字体加载完成

**2. Repaint**：仅改变视觉属性，跳过 Layout，从 Paint 开始：
- `color/background-color/visibility/box-shadow/outline`

**3. Composite-only（最廉价）**：仅作用于合成层：
- `transform`（translate/scale/rotate/skew）
- `opacity`
- `filter`（部分）
- 由合成线程独立处理，不阻塞主线程

**强制同步布局（Forced Synchronous Layout / Layout Thrashing）**：
```js
// ❌ 反复触发
for (const el of items) {
  el.style.width = el.offsetWidth + 10 + 'px'; // 写后立即读，强制 Layout
}

// ✅ 读写分离
const widths = items.map(el => el.offsetWidth);
items.forEach((el, i) => el.style.width = widths[i] + 10 + 'px');
```

**合成层提升**：
```css
.animated {
  transform: translateZ(0);   /* 触发新的合成层（老 hack） */
  will-change: transform;     /* 标准方式：提示浏览器即将变化 */
}
```
合成层动画完全由 GPU 处理，主线程繁忙也不掉帧。但层数过多会增加显存与合成成本，需克制。

**批量优化技巧**：
- **DocumentFragment**：批量插入节点只触发一次回流
  ```js
  const frag = document.createDocumentFragment();
  for (const item of data) frag.appendChild(makeNode(item));
  list.appendChild(frag);
  ```
- **Virtual DOM diff**：React/Vue 收集变更后批量提交
- **requestAnimationFrame**：将 DOM 写操作集中到下一帧前
- **CSS 类切换**：用单个 className 切换替代多次 style 设置
- **离屏处理**：先 `display:none` → 改样式 → 再显示

## 优势与局限
- ✅ 合成层动画可达 60fps（甚至 120fps）
- ✅ 现代浏览器自动批合并大部分修改
- ✅ rAF 与 transform 提供高性能动画路径
- ❌ 强制同步布局是隐蔽性能杀手
- ❌ 合成层滥用导致内存爆涨
- ❌ 回流会级联影响子树与兄弟节点

## 应用场景
- **滚动列表**：用 transform 而非 top 实现位移
- **拖拽**：拖拽元素提升为合成层
- **大量 DOM 更新**：DocumentFragment + 一次 append
- **DevTools 调试**：Performance 面板查看 "Recalculate Style"、"Layout"、"Paint" 触发频率

## 相关概念
- [[concepts/browser/rendering-pipeline]]: 回流/重绘是流水线的局部触发
- [[concepts/performance/virtual-scrolling]]: 用最少 DOM 应对大量数据
