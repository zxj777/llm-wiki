---
title: workInProgress 树
type: entity
created: 2026-04-21
updated: 2026-04-21
tags: [react, fiber, concurrent]
status: active
sources: []
---

# workInProgress 树

## 概述

**workInProgress 树**（简称 WIP 树）是 React 在每次 render 阶段构建的新 Fiber 树，与代表当前屏幕内容的 **current 树**并行存在。这种双树设计实现了**双缓冲**机制：React 在 WIP 树上进行所有计算和变更，计算完成后才一次性切换，避免用户看到中间状态。

并发模式（Concurrent Mode）下，WIP 树的构建可以被高优先级任务中断——current 树始终完整，用户看到的内容不受影响；中断后可以从头或从中间节点重新构建 WIP 树。

## 创建机制

WIP 树通过 `createWorkInProgress` 函数创建，该函数实现了**节点复用策略**以减少内存分配：

```javascript
// packages/react-reconciler/src/ReactFiber.js
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    // 首次渲染或上次 WIP 被 GC：创建新节点
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    );
    workInProgress.stateNode = current.stateNode;

    // 建立双向 alternate 指针
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用上次的 WIP 节点（上次渲染结束后变成了 current.alternate）
    workInProgress.pendingProps = pendingProps;

    // 清理上次渲染留下的副作用标记
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }

  // 从 current 复制其余字段
  workInProgress.type = current.type;
  workInProgress.lanes = current.lanes;
  workInProgress.childLanes = current.childLanes;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.child = current.child;
  workInProgress.ref = current.ref;

  return workInProgress;
}
```

## 生命周期

```
1. 触发更新（setState / dispatchAction）
   → scheduleUpdateOnFiber → ensureRootIsScheduled
   → scheduleCallback(renderRootConcurrent / renderRootSync)

2. render 阶段开始
   → prepareFreshStack：为 root fiber 调用 createWorkInProgress，创建 WIP 树根节点
   → workInProgressRoot = root
   → workInProgress = root.current.alternate（WIP 根）

3. work loop：深度优先遍历
   → performUnitOfWork(workInProgress)
     → beginWork：处理当前 fiber，返回子 fiber（或 null）
     → completeUnitOfWork：fiber 无子节点时向上归并，处理兄弟节点
   → 每处理完一个 fiber，检查 shouldYield()（并发模式）

4. render 阶段完成
   → root.finishedWork = workInProgress（WIP 根）

5. commit 阶段
   → commitRoot(root)
   → root.current = finishedWork  ← 树切换！WIP 变为新的 current
   → 旧的 current 成为新 current 的 alternate（下次渲染复用）
```

## 与 current 树的关系

| 属性 | current 树 | workInProgress 树 |
|------|-----------|------------------|
| 代表内容 | 当前屏幕显示的 UI | 正在计算的新 UI |
| 访问方式 | `root.current` | `root.current.alternate` |
| 切换时机 | commit 阶段结束后 | — |
| alternate 指向 | workInProgress 根 | current 根 |
| 存在时间 | 始终存在 | 仅 render 阶段 |

两棵树中对应位置的 fiber 通过 `alternate` 字段互相引用：
- `current.alternate === workInProgress`
- `workInProgress.alternate === current`

## bailout 优化

work loop 遍历 WIP 树时，如果某个 fiber 满足以下条件，可以**跳过**重新渲染（bailout）：
1. `fiber.pendingProps === fiber.memoizedProps`（props 未变）
2. `fiber.lanes === NoLanes`（无待处理更新）
3. 上下文（Context）未变化

bailout 时直接复用 current 树中对应 fiber 的子节点，不创建新的 WIP 子节点，大幅减少工作量。

## 关联

- [[concepts/react/double-buffering]]：WIP 树是双缓冲机制的体现
- [[concepts/react/fiber-tree]]：Fiber 树的结构与遍历方式
- [[entities/react/fiber-node]]：`fiber.alternate` 连接两棵树；`createWorkInProgress` 创建 WIP 节点
- [[concepts/react/work-loop]]：work loop 驱动 WIP 树的深度优先构建
- [[comparisons/react/current-tree-vs-workinprogress]]：两棵树的详细对比
- [[concepts/react/lanes-model]]：lanes 决定哪些 fiber 需要创建 WIP 节点
