---
title: 双缓冲（Double Buffering）
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, fiber, concurrent]
status: active
sources: [raw/acdlite-react-fiber-architecture.md]
---

# 双缓冲（Double Buffering）

## 定义

双缓冲是 React 同时维护两棵 Fiber 树的机制，保证渲染中断时用户始终看到稳定的 UI。React 维护两棵 [[concepts/react/fiber-architecture|Fiber]] 树：**current 树**（当前已渲染到屏幕上的树）和 **workInProgress 树**（正在后台构建的新树）。两棵树通过 `fiber.alternate` 指针相互连接，任何时刻都只有一棵树对用户可见。

## 工作原理

### current 树 vs workInProgress 树

- **current 树**：`root.current` 指向的树，是上一次 commit 完成后的稳定快照，始终可以安全地展示给用户。
- **workInProgress 树**：render 阶段正在构建的新树。React 在这里进行所有的 diff 和计算，完成之前对用户不可见。

### alternate 指针

每个 Fiber 节点都有一个 `alternate` 字段，指向另一棵树中对应的节点：

```js
// 简化示意
currentFiber.alternate === workInProgressFiber  // true
workInProgressFiber.alternate === currentFiber  // true
```

React 在创建 workInProgress 节点时会尽量复用 current 节点（通过 `createWorkInProgress`），避免重复分配内存。如果某个节点没有对应的 alternate，才会新建。

### commit 时切换指针

workInProgress 树构建并通过 render 阶段后，在 commit 阶段将副作用提交到 DOM。提交完成后，React 只需将 `root.current` 指针指向 workInProgress 树，原来的 current 树则变成下次渲染可复用的 alternate 树：

```js
// packages/react-reconciler/src/ReactFiberWorkLoop.js（简化）
root.current = finishedWork;  // 切换！workInProgress 树成为新的 current 树
```

这一切换是原子操作，用户始终看到完整的 UI，不会看到中间状态。

### 类比：视频播放的双缓冲

视频播放器通常使用双缓冲技术：一块缓冲区正在显示当前帧，另一块在后台解码下一帧。解码完成后，一次性切换显示缓冲区，避免撕裂感（tearing）。React 的双缓冲与此完全类似：workInProgress 树在"后台"构建，commit 后一次性切换 `root.current`，用户不会看到半渲染状态。

### 与并发模式的关系

在 [[concepts/react/concurrent-mode|并发模式]] 下，render 阶段可以被中断和恢复。双缓冲机制是中断安全的关键：即使 workInProgress 树构建到一半被中断，current 树依然完好，React 可以随时从 current 树重新开始构建新的 workInProgress 树（或从上次中断点恢复）。

## 优势与局限

- ✅ **渲染中断安全**：current 树始终稳定，即使 workInProgress 构建失败也不影响显示
- ✅ **内存复用**：通过 alternate 机制，两棵树的节点交替复用，减少 GC 压力
- ✅ **无撕裂（tearing free）**：commit 是同步的，用户不会看到半渲染 UI
- ❌ **内存双倍**：同时维护两棵树，内存占用比单树方案更高
- ❌ **树切换后 alternate 引用过期**：保留 alternate 指针的外部代码可能持有过时节点

## 应用场景

- [[concepts/react/concurrent-mode|并发模式]] 下的可中断渲染
- `startTransition` 触发的低优先级更新：可以在 workInProgress 树上构建新 UI，同时 current 树继续响应高优先级交互
- React DevTools 利用 current/alternate 区分"已提交"和"正在渲染"的状态

## 相关概念

- [[concepts/react/fiber-architecture]]：Fiber 架构（Fiber 节点是双缓冲的基本单元）
- [[concepts/react/concurrent-mode]]：并发模式（双缓冲是并发安全的基础）
- [[concepts/react/effect-list]]：副作用链表（commit 阶段在切换 current 前处理）
- [[concepts/react/bailout-optimization]]：Bailout 优化（复用 alternate 节点时可跳过重渲染）
