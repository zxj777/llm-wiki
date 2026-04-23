---
title: "React as a UI Runtime"
type: source
created: 2026-04-21
updated: 2026-04-23
tags: [react, runtime, reconciliation, host-config, hooks]
status: active
sources: [raw/react/dan-abramov-react-as-ui-runtime.md]
---

# React as a UI Runtime

> 作者：Dan Abramov
> 原文：https://overreacted.io/react-as-a-ui-runtime/

## 核心论点

- React 本质是一个 UI **运行时**，而不仅仅是一个库；它管理 host tree 的创建、更新和销毁
- React 的两个核心假设：host tree 的**稳定性**与**规律性**
- reconciliation 的核心规则：同位置同类型 → 复用 host instance；类型变化 → 销毁重建
- Hooks 的 static use order 约束来源于 fiber 上的**链表结构**存储机制

## 关键概念

- [[concepts/react/host-config]]: host tree、host instances、渲染环境与 renderer 的关系
- [[concepts/react/reconciliation]]: host instance 的复用规则，element 类型匹配
- [[concepts/react/fiber-tree]]: fiber "call tree" 与普通 call stack 的区别
- [[concepts/react/hooks-internals]]: static use order 与 fiber 链表
- [[concepts/react/context-propagation]]: context 作为子树广播机制
- [[concepts/react/effect-list]]: useEffect 的执行时机（绘制后异步）
- [[concepts/react/render-phase]]: render（纯计算）与 commit（DOM 更新）分离保证一致性
- [[concepts/react/bailout-optimization]]: React.memo 的 props 比较机制

## 摘要

**Host Tree 模型：** React 程序输出一棵随时间变化的树（DOM、iOS View、PDF 等）。React 的核心职责是在响应事件时，高效地将 host tree 同步到最新的 React element tree。React 适用于 stable + regular 的 UI 场景，不适合完全随机变化的输出（如 3D 管道屏保）。

**Reconciliation 规则：** React element 是不可变的"快照"，React 比较相邻两次渲染的元素树来决定如何操作 host instance。关键规则：同一位置的同类型元素 → 复用（只更新 props），类型变化 → 销毁旧实例并创建新实例。这就是为什么条件渲染的位置很重要——用 null 占位而不是省略，可以保持其他子元素的位置稳定。

**Call Tree vs Call Stack：** 普通函数调用栈在函数返回后被销毁。React 的 fiber "call tree" 持久存在内存中，这是 React 能维护组件 state 的原因——state 跟 fiber 节点绑定，跟 fiber 在树中的位置关联。

**Hooks 的链表本质：** 每个 fiber 节点上有一个 hook 链表，第一次渲染时按调用顺序建立链表节点，后续渲染按同样顺序逐个读取。这就是"不能在条件语句里调用 Hook"规则的底层原因。

**Effects 的时机：** useEffect 在浏览器绘制完成后异步执行（与 commit phase 的 layout effect 不同）。Effects 不是"响应式订阅"，每次渲染默认都会触发（除非通过依赖数组优化）。

## 引用片段

> React programs usually output a tree that may change over time. We call it a "host tree" because it is part of the host environment outside React.

> If an element type in the same place in the tree "matches up" between the previous and next renders, React reuses the existing host instance.

> React maintains its own "call tree" (the fiber tree) in memory. Unlike the call stack which gets destroyed when a function returns, the fiber tree persists to maintain local state.

> Hooks must be called in the same order every render — this is how React associates hook calls with their internal state slots (a linked list on the fiber).
