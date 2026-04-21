---
title: Commit 阶段
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, dom, commit]
status: active
sources: [raw/kasong-react-source-book.md]
---

# Commit 阶段

## 定义

Commit 阶段是将 [[concepts/react/render-phase]] 的计算结果**应用到真实 DOM** 的过程。与 render 阶段不同，commit 阶段**不可中断**，必须同步完成，以保证用户看到的始终是完整一致的 UI 状态。入口函数是 `commitRoot`（`ReactFiberCommitWork.js`）。

## 工作原理

### 总体流程

```
commitRoot(root)
  │
  ├─1─ commitBeforeMutationEffects()   // DOM 变更前
  ├─2─ commitMutationEffects()         // DOM 变更
  │      └─ root.current = finishedWork  // 切换 current 树
  └─3─ commitLayoutEffects()           // DOM 变更后（同步）
         │
         └─ scheduleCallback(flushPassiveEffects)  // 异步调度 useEffect
```

### 子阶段一：commitBeforeMutationEffects

**时机**：DOM 变更之前（旧 DOM 还在）

**主要工作**：

- 对类组件调用 `getSnapshotBeforeUpdate(prevProps, prevState)`，捕获旧 DOM 信息（如滚动位置），返回值传给 `componentDidUpdate` 的第三个参数。
- 调用 `scheduleCallback` 异步调度所有 `useEffect` 的清理和执行（passive effects 调度）。

### 子阶段二：commitMutationEffects

**时机**：真正修改 DOM

**主要工作**（遍历 `finishedWork` 树，按 `flags` 分发）：

| flags | 操作 |
|-------|------|
| `Placement` | 插入新 DOM 节点（`parentNode.insertBefore` / `appendChild`） |
| `Update` | 更新 DOM 属性（应用 `updateQueue` 中的 `updatePayload`） |
| `Deletion` | 删除 DOM 节点，并递归卸载组件（调用 `componentWillUnmount` / `useLayoutEffect` cleanup） |
| `ChildDeletion` | 删除子树 |

**执行 `useLayoutEffect` cleanup**：在 `Update` flag 处理时，先执行旧 `useLayoutEffect` 的清理函数（destroy），为下一阶段执行新的 create 做准备。

**切换 current 树**：`commitMutationEffects` 完成后，执行：

```js
root.current = finishedWork;
```

这是双缓冲的原子切换时机：在此之前，current 树仍是旧树；在此之后，current 树变为新树。`componentWillUnmount` 在切换前调用（可以读到旧状态），`componentDidMount` 在切换后调用（可以读到新状态）。

### 子阶段三：commitLayoutEffects

**时机**：DOM 已更新，current 树已切换，但浏览器尚未绘制

**主要工作**：

- 对类组件调用 `componentDidMount`（首次挂载）或 `componentDidUpdate(prevProps, prevState, snapshot)`（更新）。
- 执行所有 `useLayoutEffect` 的 `create` 函数，将返回的 destroy 函数保存供下次清理使用。
- 调用 `ref` 回调或赋值 `ref.current`。

### useEffect 的异步执行（Passive Effects）

`useEffect` 不在 commit 的三个子阶段中执行，而是：

1. 在子阶段一（`commitBeforeMutationEffects`）中通过 `scheduleCallback(NormalPriority, flushPassiveEffects)` 调度。
2. 浏览器绘制完成后（下一个宏任务），`flushPassiveEffects` 执行：
   - 先运行所有旧 `useEffect` 的 destroy 函数（cleanup）。
   - 再运行所有新 `useEffect` 的 create 函数。

### 执行时序总结（文字版时序图）

```
render 阶段（可中断）
│  beginWork / completeWork 构建 workInProgress 树
│  标记 flags
▼
commitBeforeMutationEffects（同步）
│  getSnapshotBeforeUpdate
│  调度 useEffect（异步，还未执行）
▼
commitMutationEffects（同步）
│  DOM 插入 / 更新 / 删除
│  useLayoutEffect cleanup（旧）
│  root.current = finishedWork  ← current 树切换
▼
commitLayoutEffects（同步）
│  componentDidMount / componentDidUpdate
│  useLayoutEffect create（新）
│  ref 赋值
▼
浏览器绘制（paint）
▼
flushPassiveEffects（异步，下一宏任务）
   useEffect destroy（旧）
   useEffect create（新）
```

## 优势与局限

- ✅ **原子性**：commit 不可中断，保证用户看到的 UI 始终是一致的快照，不会出现半更新状态。
- ✅ **明确的生命周期顺序**：三个子阶段的执行顺序确保 `getSnapshotBeforeUpdate` 能读到旧 DOM，`componentDidMount` 能读到新 DOM。
- ❌ **不可中断**：大量 DOM 操作（如长列表全量更新）会在 commit 阶段阻塞主线程，无法被高优先级任务打断。
- ❌ **useLayoutEffect 同步执行**：`useLayoutEffect` 在 commit 阶段同步运行，若其中有耗时操作会延迟浏览器绘制，影响帧率。

## 应用场景

commit 阶段是 React 渲染流水线的最后一步，所有可见的 UI 变化都在这里真正发生。理解 commit 阶段的执行顺序对于正确使用 `useLayoutEffect` vs `useEffect`、`getSnapshotBeforeUpdate`、以及分析性能瓶颈至关重要。

## 相关概念

- [[concepts/react/render-phase]]：Render 阶段（commit 的前置步骤）
- [[concepts/react/effect-list]]：副作用链表
- [[concepts/react/fiber-architecture]]：Fiber 架构（flags、alternate 等字段）
