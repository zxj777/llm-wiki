---
title: Work Loop（工作循环）
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, scheduler, concurrent]
status: active
sources: []
---

# Work Loop（工作循环）

## 定义

Work Loop 是驱动 React [[concepts/react/fiber-architecture]] 遍历的核心循环，位于 `packages/react-reconciler/src/ReactFiberWorkLoop.js`。它以深度优先顺序依次处理 Fiber 树中的每一个节点（工作单元），是 [[concepts/react/render-phase]] 的引擎。

## 工作原理

### 两种 Work Loop

React 提供两套 work loop 实现，对应两种渲染模式：

**同步模式（Legacy / Blocking）**

```js
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

不检查是否需要让出主线程，一旦开始必须跑完整棵树。适用于 `ReactDOM.render()` 触发的渲染。

**并发模式（Concurrent）**

```js
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

每个工作单元处理完后调用调度器的 `shouldYield()`，若当前时间片（默认 5ms）已耗尽则退出循环，等待下一帧再继续。这是 [[concepts/react/concurrent-mode]] 的核心机制。

### performUnitOfWork

```js
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate; // current 树中的对应节点
  const next = beginWork(current, unitOfWork, renderLanes);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;

  if (next === null) {
    // 没有子节点，该 fiber 处理完毕
    completeUnitOfWork(unitOfWork);
  } else {
    // 有子节点，继续向下
    workInProgress = next;
  }
}
```

`performUnitOfWork` 的职责：
1. 调用 `beginWork` 处理当前 fiber 并获取第一个子 fiber。
2. 若有子节点，把 `workInProgress` 指向子节点，下轮循环继续向下。
3. 若无子节点，调用 `completeUnitOfWork` 向上收集结果，并寻找下一个兄弟节点。

### beginWork（`ReactFiberBeginWork.js`）

`beginWork(current, workInProgress, renderLanes)` 根据 `workInProgress.tag`（组件类型）分发处理：

- `FunctionComponent` → 调用函数组件，执行所有 hooks
- `ClassComponent` → 调用 `render()` 方法
- `HostComponent`（如 `div`）→ 处理 props，reconcile 子节点
- `HostRoot` → 处理 root 容器

**bailout 优化**：若 `current !== null` 且 `pendingProps === memoizedProps` 且该 fiber 的 lanes 不包含本次渲染的 `renderLanes`，则可以跳过整棵子树（返回 null 或复用现有子树）。

### completeUnitOfWork / completeWork（`ReactFiberCompleteWork.js`）

当一个 fiber 没有子节点（或子树全部完成）时：

1. `completeWork` 对 `HostComponent` 创建真实 DOM 节点（mount 时）或计算 DOM 属性变更（update 时）。
2. 把当前 fiber 的 `flags`（副作用标记）**冒泡**到父节点的 `subtreeFlags`，形成副作用链，供 commit 阶段使用。
3. 若存在兄弟节点（`sibling`），把 `workInProgress` 指向兄弟，继续向下处理兄弟子树；否则沿 `return` 指针上溯，继续完成父节点。

### 遍历顺序示意

```
App
├─ Header
└─ Main
   └─ List

遍历顺序：
beginWork(App) → beginWork(Header) → completeWork(Header)
→ beginWork(Main) → beginWork(List) → completeWork(List)
→ completeWork(Main) → completeWork(App)
```

## 优势与局限

- ✅ **并发模式可中断**：`workLoopConcurrent` 通过 `shouldYield()` 实现协作式让出，使高优先级任务（用户输入）能插队。
- ✅ **增量渲染**：把渲染拆成小工作单元，避免长任务阻塞浏览器绘制。
- ❌ **同步模式不可中断**：`workLoopSync` 一旦开始必须完成整棵树，在大型组件树中仍可能造成卡顿。
- ❌ **调试复杂**：非线性的链表遍历 + 双缓冲使调用栈难以追踪，断点调试体验较差。

## 应用场景

所有 React 渲染都通过 work loop 驱动，无论是初始挂载还是后续更新。两种模式的选择由根节点的 `mode` 字段决定：`ConcurrentMode` 使用 `workLoopConcurrent`，否则使用 `workLoopSync`。

## 相关概念

- [[concepts/react/fiber-architecture]]：Fiber 架构（工作单元定义）
- [[concepts/react/cooperative-scheduling]]：协作式调度（shouldYield 实现）
- [[concepts/react/time-slicing]]：时间切片
- [[concepts/react/concurrent-mode]]：并发模式
