---
title: Fiber 架构
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, fiber, architecture]
status: active
sources: [raw/acdlite-react-fiber-architecture.md, raw/dan-abramov-react-as-ui-runtime.md, raw/kasong-react-source-book.md]
---

# Fiber 架构

## 定义

Fiber 是 React 16 引入的核心内部架构，是对 JavaScript 调用栈的重新实现。一个 Fiber 就是一个**虚拟栈帧**，也是 React 的**最小工作单元**。在 Fiber 架构之前，React 使用递归（Stack Reconciler）同步遍历整棵组件树，无法中断；Fiber 把这个过程拆解成可暂停、可恢复的离散单元，使 React 具备了并发能力。

## 工作原理

### FiberNode 数据结构

每个组件实例（函数组件、类组件、DOM 节点等）在内存中对应一个 `FiberNode` 对象，关键字段如下：

```js
{
  // 标识
  type,          // 组件类型（函数、类、字符串 'div' 等）
  key,           // reconciliation 用的 key

  // 链表树指针（见 [[concepts/react/fiber-tree]]）
  child,         // 第一个子 fiber
  sibling,       // 下一个兄弟 fiber
  return,        // 父 fiber

  // Props / State
  pendingProps,  // 本次渲染开始时的 props（beginWork 时设置）
  memoizedProps, // 上次渲染完成后的 props（completeWork 时设置）
  memoizedState, // 上次渲染完成后的 state（或 hooks 链表头）
  updateQueue,   // 待处理的 update 队列 / effect 列表

  // 副作用
  flags,         // 位掩码，标记需要执行的 DOM 操作（Placement/Update/Deletion 等）
  lanes,         // 该 fiber 携带的更新优先级（位掩码）

  // 实例
  stateNode,     // 类组件实例 / 真实 DOM 节点

  // 双缓冲
  alternate,     // 指向另一棵树中对应的 fiber（current ↔ workInProgress）
}
```

`pendingProps` 在 `beginWork` 开始时赋值，`memoizedProps` 在 `completeWork` 结束时赋值。当两者相等时，React 可以直接复用上次的输出（bailout 优化）。

### beginWork / completeWork 循环

[[concepts/react/work-loop]] 以深度优先顺序驱动 Fiber 树的遍历：

1. **beginWork**（`ReactFiberBeginWork.js`）：处理当前 fiber，对子元素执行 reconciliation，返回第一个子 fiber（或 null）。
2. **completeWork**（`ReactFiberCompleteWork.js`）：fiber 没有子节点（或子节点已全部完成）时调用，对 `HostComponent`（原生 DOM 元素）创建/更新真实 DOM 节点，并把当前 fiber 的 `flags` 冒泡到父节点。

### 双缓冲

React 同时维护两棵 Fiber 树：
- **current 树**：当前显示在屏幕上的 UI 对应的树。
- **workInProgress 树**：正在后台构建的新树，构建完成后通过 `root.current = finishedWork` 原子切换。

两棵树中对应的节点通过 `alternate` 字段互相引用，允许 React 在 workInProgress 树上自由修改而不影响当前显示。

## 优势与局限

- ✅ **可中断/恢复**：work loop 在 concurrent 模式下每个工作单元后调用 `shouldYield()`，可随时暂停并在下一帧继续。
- ✅ **优先级调度**：每个 fiber 携带 `lanes` 字段，高优先级更新（如用户输入）可以插队，低优先级更新（如数据加载后的过渡动画）推迟处理。
- ✅ **双缓冲稳定渲染**：新树在内存中构建完毕后才切换，用户看不到中间状态。
- ✅ **工作复用**：`pendingProps === memoizedProps` 时可跳过整棵子树（bailout），避免重复计算。
- ❌ **实现复杂度高**：链表树指针 + 双缓冲 + 位掩码优先级，源码远比 Stack Reconciler 难以理解和调试。
- ❌ **内存占用更大**：每个组件节点对应一个 FiberNode 对象，加上 alternate，内存用量约是 Stack Reconciler 的两倍。

## 应用场景

Fiber 架构是 React 16+ 所有高级特性的基础：

- **[[concepts/react/concurrent-mode]]（并发模式）**：依赖 Fiber 的可中断性实现时间切片和优先级抢占。
- **Suspense**：组件 throw 一个 Promise，Fiber 捕获后展示 fallback，Promise resolve 后重新渲染。
- **Time Slicing**：把渲染工作分散到多帧，避免长任务阻塞主线程。
- **`startTransition` / `useDeferredValue`**：利用 Fiber lanes 把低优先级更新标记为 TransitionLane，让高优先级更新先完成。

## 相关概念

- [[concepts/react/fiber-tree]]：Fiber 树结构（child/sibling/return 三指针）
- [[concepts/react/work-loop]]：Work Loop（工作循环）
- [[concepts/react/render-phase]]：Render 阶段
- [[concepts/react/commit-phase]]：Commit 阶段
- [[concepts/react/double-buffering]]：双缓冲
