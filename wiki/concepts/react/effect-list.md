---
title: 副作用链表（Effect List）
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, effects, commit]
status: active
sources: []
---

# 副作用链表（Effect List）

## 定义

Effect List（副作用链表）是 React 在 render 阶段标记需要在 commit 阶段处理的 Fiber 节点的机制。render 阶段通过 flags 标记每个 fiber 上发生的变化类型（插入、更新、删除等），commit 阶段再根据这些标记批量执行 DOM 操作和副作用。React 17 和 React 18 在实现此机制上有重大架构差异。

## 工作原理

### Flags：副作用标记类型

每个 Fiber 节点都有一个 `flags` 字段（位掩码），表示该节点需要在 commit 阶段执行的操作：

| Flag | 值（示例） | 含义 |
|------|-----------|------|
| `NoFlags` | `0` | 无副作用 |
| `Placement` | `0b000000000010` | 新节点插入（mount）或移动 |
| `Update` | `0b000000000100` | DOM 属性更新、ref 更新 |
| `Deletion` | `0b000000001000` | 节点删除 |
| `ChildDeletion` | `0b000000010000` | 子节点删除（React 18） |
| `PassiveEffect` | `0b000001000000` | `useEffect` 需要执行 |
| `LayoutEffect` | `0b000000100000` | `useLayoutEffect` 需要执行 |
| `Ref` | `0b000010000000` | ref 需要附加或更新 |
| `Snapshot` | `0b000100000000` | `getSnapshotBeforeUpdate` |

flags 使用位掩码，可以用 `|` 组合多个副作用：`fiber.flags |= Placement | Update`。

### React 17：firstEffect / nextEffect 链表

React 17 及以前，render 阶段的 `completeWork` 将有副作用的 fiber 串成一个**链表**：

```js
// completeUnitOfWork（简化）
if (fiber.flags > PerformedWork) {
  if (returnFiber.lastEffect !== null) {
    returnFiber.lastEffect.nextEffect = fiber;
  } else {
    returnFiber.firstEffect = fiber;
  }
  returnFiber.lastEffect = fiber;
}
```

最终，根 fiber 的 `firstEffect` 指向整条副作用链表的起点，commit 阶段线性遍历这条链表：

```js
// commitRoot（简化）
let effect = root.current.firstEffect;
while (effect !== null) {
  commitMutationEffects(root, effect);
  effect = effect.nextEffect;
}
```

**缺点**：维护链表指针开销大，且中断渲染时链表可能处于不一致状态。

### React 18：subtreeFlags 位掩码

React 18 废弃了链表方案，改用 `subtreeFlags`：每个 fiber 的 `subtreeFlags` 是其所有**子孙** fiber 的 flags 的并集（bitwise OR）。

```js
// completeWork 的收集阶段（简化）
let subtreeFlags = NoFlags;
let child = workInProgress.child;
while (child !== null) {
  subtreeFlags |= child.subtreeFlags;  // 子树的 flags
  subtreeFlags |= child.flags;          // 子节点自身的 flags
  child = child.sibling;
}
workInProgress.subtreeFlags = subtreeFlags;
```

commit 阶段通过检查 `subtreeFlags` 决定是否需要递归进入子树：

```js
function commitMutationEffects(root, finishedWork, committedLanes) {
  const flags = finishedWork.flags;
  // 检查子树是否有工作
  if (finishedWork.subtreeFlags & MutationMask) {
    // 递归进入子树
    commitMutationEffectsOnFiber(finishedWork.child, root, committedLanes);
  }
  // 处理当前节点
  commitMutationEffectsOnFiber(finishedWork, root, committedLanes);
}
```

如果某棵子树的 `subtreeFlags` 不包含当前 commit 阶段关心的 flags，整棵子树可以被跳过，大幅减少 commit 阶段的遍历量。

### Commit 阶段的三个子阶段

commit 阶段按顺序执行三个子阶段，每个子阶段遍历整棵 Fiber 树：

1. **BeforeMutation 阶段**：处理 `Snapshot` flag，调用 `getSnapshotBeforeUpdate`（class 组件）
2. **Mutation 阶段**：处理 `Placement`、`Update`、`Deletion` flags，执行实际 DOM 操作
3. **Layout 阶段**：处理 `LayoutEffect` flag，调用 `useLayoutEffect` 的 cleanup 和 setup，以及 `componentDidMount`/`componentDidUpdate`

`PassiveEffect`（`useEffect`）不在 commit 的三个子阶段中执行，而是在 commit 完成后异步调度（`scheduleCallback`），在下一个宏任务中执行。

## 优势与局限

- ✅ **批量处理**：将所有 DOM 操作集中在 commit 阶段，避免频繁重排
- ✅ **subtreeFlags 剪枝**（React 18）：快速跳过无副作用的子树，减少 commit 遍历
- ✅ **三阶段分离**：保证 DOM 操作的顺序性（先 mutation 再 layout），避免 layout thrashing
- ❌ **链表方案**（React 17）：中断渲染时链表维护复杂，已在 React 18 废弃
- ❌ **同步 commit**：commit 阶段是同步且不可中断的，过多副作用会阻塞主线程

## 应用场景

- 理解 `useEffect` 与 `useLayoutEffect` 执行时机的差异（PassiveEffect vs LayoutEffect flag）
- 分析 React 性能瓶颈时，commit 阶段耗时过长往往意味着 DOM 操作过多或副作用链过长
- 自定义渲染器实现：需要正确设置 [[concepts/react/host-config|Host Config]] 中的 mutation 方法，由 commit 阶段调用

## 相关概念

- [[concepts/react/commit-phase]]：Commit 阶段（三个子阶段的执行逻辑）
- [[concepts/react/fiber-architecture]]：Fiber 架构（flags 和 subtreeFlags 存储在 fiber 节点上）
- [[concepts/react/double-buffering]]：双缓冲（commit 完成后切换 `root.current`）
- [[concepts/react/hooks-internals]]：Hooks 底层机制（`useEffect`/`useLayoutEffect` 通过 PassiveEffect/LayoutEffect flag 触发）
