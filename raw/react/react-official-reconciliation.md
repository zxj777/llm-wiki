---
title: "Reconciliation — React 官方文档"
author: React Team
source_url: https://legacy.reactjs.org/docs/reconciliation.html
fetched: 2026-04-21
tags: [react, reconciliation, diff, keys]
---

# Reconciliation

React 提供声明式 API，通过 Diffing 算法高效地更新 UI。

## 动机

将一棵树转换为另一棵树的最优算法复杂度为 O(n³)。对于 1000 个节点需要 10 亿次比较，代价太高。

React 基于两个假设实现了 **O(n)** 启发式算法：
1. 不同类型的元素会产生不同的树
2. 开发者可以通过 `key` prop 提示哪些子元素在不同渲染间是稳定的

## Diffing 算法

### 不同类型的元素
- 不同类型 → 拆掉旧树，从头构建新树
- 旧 DOM 节点被销毁，`componentWillUnmount` 触发
- 新 DOM 节点插入，`componentDidMount` 触发
- 旧树下的所有子组件都会 unmount，**state 会丢失**

### 相同类型的 DOM 元素
- 保留同一底层 DOM 节点
- 只更新**变化的属性**（className、style 中的具体属性等）
- 然后递归处理子节点

### 相同类型的组件元素
- 组件实例保持不变，state 被保留
- 更新 props，调用 `componentDidUpdate`
- 调用 `render()`，递归 diff 新旧结果

### 子节点的递归
- 默认逐个比较子节点
- 在列表末尾添加节点：高效 ✅
- 在列表头部添加节点：低效 ❌（React 会 mutate 所有子节点）

### Keys
- `key` 用于在新旧树中匹配子节点
- Key 应该是**稳定、可预期、唯一**的（仅在兄弟节点间唯一）
- 使用数组 index 作为 key 在有排序时会造成状态混乱
- `Math.random()` 作为 key 会导致大量不必要的重建

## 权衡
- reconciliation 是实现细节，理论上每次都重渲染全部组件结果也一样
- "rerender" ≠ unmount + remount，只应用必要的差异
- 不匹配的假设会导致性能下降

## 注意事项
- 不同类型但输出相似的组件，考虑合并为同一类型
- Key 不稳定（如 Math.random()）会导致不必要的重建和 state 丢失
