---
title: current 树 vs workInProgress 树
type: comparison
created: 2026-04-21
updated: 2026-04-21
tags: [react, fiber, double-buffering]
status: active
sources: []
---

# current 树 vs workInProgress 树

## 对比维度

| 维度 | current 树 | workInProgress 树 |
|------|-----------|-----------------|
| 指向/含义 | `root.current` 指向根节点；代表**当前渲染到屏幕上**的 UI 状态 | render 阶段正在构建的**下一次 UI 状态**；commit 前不可见 |
| 稳定性 | ✅ 稳定，commit 完成前不会被修改 | ❌ 随 render 进行不断更新，可能被丢弃重建 |
| 创建时机 | 首次 commit 完成后确立；此后每次 commit 后由 workInProgress 树切换而来 | 每次 render 开始时，从 current 树克隆（`createWorkInProgress`）或新建 |
| alternate 关系 | `current.alternate === workInProgress` | `workInProgress.alternate === current` |
| commit 后状态 | 原 current 树成为下次渲染的 alternate（备用），等待被复用 | 原 workInProgress 树切换为新的 current（`root.current = finishedWork`） |
| Hooks 状态 | `current.memoizedState` 存当前生效的 Hook 链表 | 在 render 期间通过 `updateWorkInProgressHook` 构建新的 Hook 链表 |
| 修改时机 | 仅在 commit 阶段的最后（`root.current = finishedWork`）原子切换 | render 阶段全程修改（beginWork / completeWork） |
| 可中断性 | N/A（不参与 render 计算） | ✅ 可中断（concurrent 模式）；丢弃时直接抛弃整棵 workInProgress 树，current 不受影响 |

## 分析

React 的双缓冲（Double Buffering）机制是其并发安全的核心保障。类比图形渲染中的双缓冲：前缓冲区（current）始终显示稳定内容，后缓冲区（workInProgress）在屏幕外准备下一帧，准备好后原子切换。

**首次挂载**时只有 HostRoot 的 current fiber 存在（React 初始化时创建），其余子树的 current 均为 null。render 阶段为每个子节点创建新的 workInProgress fiber；commit 完成后，这棵 workInProgress 树变为 current 树，对应的 DOM 也已插入页面。

**后续更新**时，`createWorkInProgress` 从 current 树克隆 workInProgress 节点：若 `current.alternate` 存在（上次 render 留下的备用节点）则复用并重置字段，否则新建。这个复用机制避免了每次更新都大量分配内存。克隆时，workInProgress 继承 current 的 `memoizedState` 和 `memoizedProps` 作为起点，render 阶段再基于新的 props/state 更新 workInProgress 的字段。

**并发安全性**来自 current 树的不变性：render 阶段只修改 workInProgress，current 始终是上次 commit 的稳定快照。如果 render 被中断（高优先级任务插队），直接丢弃 workInProgress 树即可，current 树不受任何影响，用户看到的 UI 始终一致。

**commit 阶段的原子切换**：`root.current = finishedWork` 这一行赋值是整个切换的核心，执行前是旧 UI，执行后是新 UI。React 选择在 `commitMutationEffects`（DOM 变更）完成后、`commitLayoutEffects`（layout effect）开始前执行此切换，确保 `useLayoutEffect` 中读到的 current 是新树。

## 结论

- **理解 Fiber 内存结构**：current 和 workInProgress 通过 alternate 指针互相关联，两棵树复用同一套节点池，大幅减少 GC 压力。
- **调试并发中断问题**：render 阶段可以安全中断，原因就是 workInProgress 是独立副本；若发现状态不一致，检查是否在 render 阶段有副作用修改了外部状态（而非 workInProgress 本身）。
- **理解 Hook 状态**：`current.memoizedState` 是已提交的 Hook 状态，`workInProgress.memoizedState` 是 render 期间正在计算的新状态，两者通过 `alternate` 关联，commit 后 workInProgress 的值"固化"为新的 current。

## 相关概念

- [[comparisons/react/fiber-vs-vdom]]：Fiber 节点结构（child/sibling/return/alternate）
- [[comparisons/react/render-vs-commit]]：render 阶段修改 workInProgress，commit 阶段切换 current
- [[comparisons/react/sync-vs-concurrent]]：并发模式下 workInProgress 可被丢弃的场景
- [[comparisons/react/mount-vs-update]]：首次挂载时 current 为 null 的特殊路径
