---
title: Fiber vs Virtual DOM
type: comparison
created: 2026-04-21
updated: 2026-04-21
tags: [react, fiber, vdom]
status: active
sources: []
---

# Fiber vs Virtual DOM

## 对比维度

| 维度 | Virtual DOM（传统 / Stack Reconciler） | Fiber |
|------|----------------------------------------|-------|
| 数据结构 | 普通 JS 对象，`{ type, props, children[] }` | 链表树节点，含 `child / sibling / return` 三指针 |
| 可中断性 | ❌ 递归遍历，不可中断 | ✅ 循环逐节点处理，随时可让出线程 |
| 优先级调度 | ❌ 无，所有更新同等优先级 | ✅ Lanes 位掩码，支持多优先级并发 |
| 内存占用 | 轻量，字段少（type / props / key 等） | 较重，每节点约 30+ 字段（flags / lanes / memoizedState / updateQueue 等） |
| 遍历方式 | DFS 递归（调用栈驱动） | 循环 + 显式链表（workLoop 驱动） |
| 信息量 | 仅描述 UI 结构，无副作用信息 | 携带副作用（flags）、状态（memoizedState）、更新队列 |
| 双缓冲支持 | ❌ 不内建，每次全量重建 | ✅ current / workInProgress 双树，alternate 指针复用节点 |

## 分析

传统 VDOM（React 15 Stack Reconciler、Vue 2）是对 UI 结构的轻量快照，核心用途是 diff —— 比较两棵 VDOM 树并输出最小变更集。它用普通数组存 children，Reconciler 通过递归实现 DFS，一旦开始便无法中断。对于小型应用，这种方式简单高效；但在组件树很深、帧时间内无法完成遍历时，会导致掉帧（jank）。

Fiber 不是对 VDOM 的替代，而是对 **Reconciler 工作方式**的重新设计。每个 Fiber 节点是一个"工作单元（unit of work）"，React 通过 `workLoop` 循环逐个处理节点，每处理完一个就检查 `shouldYield()`，判断是否超过 5ms 时间片。如果超过，则暂停并将控制权还给浏览器，下一帧再继续。这使得高优先级任务（如用户输入）可以打断低优先级的 render 工作。

Fiber 节点的字段远超普通 VDOM：`flags` 记录需要的 DOM 操作类型（Placement / Update / Deletion），`lanes` 标记挂起的更新优先级，`memoizedState` 存储 Hook 链表，`updateQueue` 存储待处理的 state 更新。这些信息在 commit 阶段直接使用，避免重复计算。双缓冲（双树）机制让 React 可以在后台安全构建新树，而不影响当前显示，commit 时只需原子性切换指针。

## 结论

- **理解 diff 概念、学习 VDOM 原理**：关注 VDOM，它是框架无关的抽象思想。
- **分析 React 内部机制、调试性能问题**：关注 Fiber，Fiber 节点的 `flags`、`lanes` 直接决定 React 的行为。
- **两者不是非此即彼**：Fiber 树的节点同时扮演了"工作单元"和"VDOM 节点"两个角色，React 在 `createFiber` 时就将两者合并。

## 相关概念

- [[comparisons/react/current-tree-vs-workinprogress]]：Fiber 双缓冲机制的具体实现
- [[comparisons/react/sync-vs-concurrent]]：可中断性如何影响渲染模式选择
- [[comparisons/react/render-vs-commit]]：Fiber 在两个阶段的不同角色
- [[comparisons/react/lanes-vs-expiration-time]]：Fiber 中优先级调度的演进
