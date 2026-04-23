---
title: "Reconciliation — React 官方文档"
type: source
created: 2026-04-21
updated: 2026-04-23
tags: [react, reconciliation, diff, keys, official]
status: active
sources: [raw/react/react-official-reconciliation.md]
---

# Reconciliation — React 官方文档

> 作者：React Team
> 原文：https://legacy.reactjs.org/docs/reconciliation.html

## 核心论点

- React 用启发式 O(n) 算法替代理论最优 O(n³) 树 diff，基于两个实用假设
- 两个假设：不同类型元素产生不同树；key 可以提示跨渲染的稳定子元素
- key 必须在兄弟节点间稳定、可预期、唯一；使用 index 或 Math.random() 作为 key 会引发问题

## 关键概念

- [[concepts/react/reconciliation]]: O(n) diff 算法的核心规则与假设
- [[topics/react/reconciliation]]: reconciliation 主题页
- [[concepts/react/fiber-tree]]: 树的同位置类型匹配规则

## 摘要

**为什么不用最优算法？** 理论上将一棵树转换为另一棵树的最优算法复杂度是 O(n³)。对 1000 个节点需要约 10 亿次比较，代价无法接受。React 基于两个实际中几乎总成立的假设，将复杂度降低到 O(n)。

**Diffing 规则详解：**
1. **不同类型的根元素**：完全重建整棵子树，旧实例 unmount，新实例 mount，state 丢失
2. **相同类型的 DOM 元素**：保留 DOM 节点，只更新变化的属性（包括 style 的具体属性）
3. **相同类型的组件元素**：保留实例（state 保留），更新 props，触发生命周期
4. **子节点递归**：默认按顺序逐一比较，在末尾添加高效，在头部添加低效

**Key 的作用：** 告诉 React 在同一父节点下，跨渲染的"同一概念"子节点是哪个。即使位置变了，相同 key 的节点会被匹配复用，而不是销毁重建。Key 应该来自数据的稳定 ID（如 `item.id`），不应使用数组 index（排序时造成 state 混乱）或 `Math.random()`（每次重建）。

**权衡：** reconciliation 是实现细节，"rerender" 不等于 unmount + remount，React 只应用实际变化的差异。当两个假设不成立时（如频繁改变组件类型），性能会下降。

## 引用片段

> React implements a heuristic O(n) algorithm based on two assumptions:
> 1. Two elements of different types will produce different trees.
> 2. The developer can hint at which child elements may be stable across different renders with a key prop.

> Keys should be stable, predictable, and unique. Unstable keys (like those produced by Math.random()) will cause many component instances and DOM nodes to be unnecessarily recreated.
