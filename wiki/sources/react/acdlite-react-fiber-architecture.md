---
title: "React Fiber Architecture"
type: source
created: 2026-04-21
updated: 2026-04-23
tags: [react, fiber, architecture, internals]
status: active
sources: [raw/react/acdlite-react-fiber-architecture.md]
---

# React Fiber Architecture

> 作者：Andrew Clark（acdlite，React 核心团队成员）
> 原文：https://github.com/acdlite/react-fiber-architecture

## 核心论点

- Fiber 是 React 核心算法的重新实现，目标是支持增量渲染（incremental rendering）
- Fiber 将渲染工作拆分为可中断的"工作单元"，本质是对调用栈的重新实现
- Fiber 节点是 JavaScript 对象，相当于一个**虚拟栈帧**（virtual stack frame）
- reconciliation 与 rendering 是分离的两个阶段，使 React 可以适配多种渲染环境

## 关键概念

- [[concepts/react/fiber-architecture]]: Fiber 作为工作单元和虚拟栈帧
- [[concepts/react/fiber-tree]]: child/sibling/return 三指针构成链表树
- [[entities/react/fiber-node]]: type、key、pendingProps、memoizedProps、alternate、output 等字段
- [[concepts/react/double-buffering]]: current fiber 与 work-in-progress fiber 的 alternate 关系
- [[concepts/react/reconciliation]]: Diff 算法的两个核心假设
- [[concepts/react/work-loop]]: 调度器如何找到下一个工作单元

## 摘要

**为什么需要 Fiber？** 老的 React 使用递归同步处理整棵 VDOM 树，一旦开始就无法中断。这导致在动画、交互等对帧率敏感的场景下会出现掉帧。Fiber 通过将工作拆分为小单元，允许浏览器在每帧的空闲时间执行一部分工作，从而实现增量渲染。

**什么是 Fiber？** Fiber 是一个 JavaScript 对象，对应一个组件实例，本质上是对函数调用栈帧的模拟。`v = f(d)` 中每个函数调用对应一个 fiber。与真实调用栈不同，fiber 可以保存在内存中，以任意顺序和时机执行，这是实现调度的基础。

**Fiber 的核心字段：**
- `type/key`：描述对应的组件类型（函数/类/字符串）
- `child/sibling/return`：构成链表树，替代递归遍历
- `pendingProps/memoizedProps`：若相等则可复用上次输出（bailout 的基础）
- `alternate`：当前 fiber 与 work-in-progress fiber 互为 alternate（双缓冲）
- `output`：叶节点（host components）的渲染输出，逐层向上传递

**调度原则：** React 采用 pull-based 调度，框架决定何时执行什么优先级的工作；不同更新有不同优先级（动画 > 数据更新），高优先级工作可以打断低优先级工作。

## 引用片段

> Fiber is reimplementation of the stack, specialized for React components. You can think of a single fiber as a virtual stack frame.

> A fiber represents a unit of work.

> When the incoming pendingProps are equal to memoizedProps, it signals that the fiber's previous output can be reused, preventing unnecessary work.
