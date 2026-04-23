---
title: Render 阶段
type: concept
created: 2026-04-21
updated: 2026-04-23
tags: [react, render]
status: active
sources: [raw/react/kasong-react-source-book.md, raw/react/dan-abramov-react-as-ui-runtime.md]
---

# Render 阶段

## 定义

Render 阶段（也称 **reconciliation 阶段**）是 React 在内存中构建 `workInProgress` Fiber 树的过程。这一阶段**完全不产生任何 DOM 副作用**，仅计算出"需要做什么"并通过 `flags` 位掩码标记在各 fiber 节点上。在 Concurrent 模式下，render 阶段**完全可中断**，可在任意工作单元后暂停并在下一帧继续。

## 工作原理

### 入口函数

React 根据渲染模式选择不同的入口：

```
scheduleUpdateOnFiber()
  └─ ensureRootIsScheduled()
       ├─ renderRootSync()       // Legacy / Blocking 模式
       └─ renderRootConcurrent() // Concurrent 模式
            └─ workLoopSync() / workLoopConcurrent()
```

### Work Loop 驱动遍历

[[concepts/react/work-loop]] 以深度优先顺序依次调用每个 FiberNode 的 `beginWork` 和 `completeWork`，完成整棵 workInProgress 树的构建。

```
workLoopConcurrent:
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
```

若 `shouldYield()` 为 true（时间片耗尽），循环退出，`workInProgress` 指针保留当前位置，等待下一次调度后从断点继续。

### beginWork 处理各类 Fiber

`beginWork(current, workInProgress, renderLanes)`（`ReactFiberBeginWork.js`）根据 `workInProgress.tag` 分发：

| tag | 处理逻辑 |
|-----|---------|
| `FunctionComponent` | 调用函数体，执行 hooks（`renderWithHooks`） |
| `ClassComponent` | 调用 `render()` 方法 |
| `HostRoot` | 处理根容器 |
| `HostComponent`（`div` 等） | 处理 DOM props，reconcile 子节点 |
| `HostText` | 直接返回 null（叶节点） |
| `SuspenseComponent` | 捕获子树的 throw，展示 fallback |

**bailout 快路径**：若 `current !== null`（非首次挂载）且 `pendingProps === memoizedProps` 且该 fiber 的 lanes 与 `renderLanes` 无交集，React 跳过该 fiber 及其整棵子树，直接复用旧结果。

### completeWork 构建 DOM 节点

`completeWork(current, workInProgress, renderLanes)`（`ReactFiberCompleteWork.js`）在 fiber 没有子节点（或子树全部完成）时调用：

- **mount（首次挂载）**：为 `HostComponent` 调用 `createInstance`（即 `document.createElement`）创建真实 DOM 节点，并递归追加子节点，存入 `workInProgress.stateNode`。
- **update（后续更新）**：调用 `prepareUpdate` 比较新旧 props，生成需要更新的属性列表（`updatePayload`），存入 `workInProgress.updateQueue`，并标记 `Update` flag。
- **冒泡 flags**：把子树的 `subtreeFlags` 和当前 fiber 的 `flags` 合并到父 fiber 的 `subtreeFlags`，形成一棵"副作用汇总树"，commit 阶段据此定位需要操作的节点。

### 输出

render 阶段结束后，`root.finishedWork` 指向构建完成的 workInProgress 树根节点，该树上各节点的 `flags` 字段记录了所需的 DOM 操作（`Placement` / `Update` / `Deletion` / `ChildDeletion` 等）。**此时 DOM 还未发生任何变化。**

## 优势与局限

- ✅ **可中断**（Concurrent 模式）：使高优先级更新（用户输入）可以打断低优先级渲染，提升交互响应性。
- ✅ **无 DOM 副作用**：render 阶段是纯计算，即使中断也不会留下不一致的 DOM 状态。
- ✅ **bailout 优化**：未变化的子树可完全跳过，避免重复计算。
- ❌ **副作用可能多次执行**：Concurrent 模式下 render 阶段可能被重新执行（因优先级抢占），若函数组件有副作用（如在 render 期间写全局变量），会导致问题。React StrictMode 通过双调用函数组件来暴露此类问题。
- ❌ **同步模式不可中断**：Legacy 模式的 `workLoopSync` 无 `shouldYield` 检查，大型树仍可能阻塞主线程。

## 应用场景

render 阶段是所有 React 更新的第一步，无论是 `setState`、`useState` 的 dispatch、还是 context 变化触发的重渲染，都会进入 render 阶段，构建新的 workInProgress 树，再交由 [[concepts/react/commit-phase]] 真正修改 DOM。

## 相关概念

- [[concepts/react/commit-phase]]：Commit 阶段（render 阶段的后续）
- [[concepts/react/work-loop]]：Work Loop（render 阶段的驱动引擎）
- [[concepts/react/fiber-architecture]]：Fiber 架构
- [[concepts/react/reconciliation]]：Reconciliation（render 阶段中的 diff 过程）
