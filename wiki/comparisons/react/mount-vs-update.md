---
title: 首次挂载 vs 更新流程
type: comparison
created: 2026-04-21
updated: 2026-04-21
tags: [react, render]
status: active
sources: []
---

# 首次挂载 vs 更新流程

## 对比维度

| 维度 | 首次挂载（Mount） | 更新（Update） |
|------|-----------------|---------------|
| current 树 | 只有 HostRoot 的 current 存在，子树 current 全为 null | 完整的 current 树存在，对应上次渲染结果 |
| beginWork 路径 | 走 `mountXxx`，无可复用节点，直接创建新 Fiber | 先检查 bailout 条件，命中则跳过整棵子树 |
| Hooks dispatcher | `HooksDispatcherOnMount`（`mountState`、`mountEffect`…） | `HooksDispatcherOnUpdate`（`updateState`、`updateEffect`…） |
| Hook 初始化 | `mountWorkInProgressHook` 创建新 hook 节点，追加到链表 | `updateWorkInProgressHook` 复用 current 的 hook 节点，处理 update queue |
| Diff（Reconcile） | 无旧子树可对比，直接为所有子元素创建新 Fiber | `reconcileChildFibers` 与 current 子树对比，复用 / 删除 / 新增 |
| flags 标记 | 叶节点标记 `Placement`，但 HostRoot 处批量插入（仅一次真实 DOM 插入） | 按需标记 `Update`、`Deletion`、`Placement`（颗粒度更细） |
| completeWork DOM 操作 | `createInstance` 创建 DOM 节点，`appendAllChildren` 构建离屏 DOM 树 | `updateDOMProperties` 对比 oldProps / newProps，只更新变化属性 |
| bailout 检查 | ❌ 无（没有旧状态可比较） | ✅ 检查 `lanes`、`context`、`props` 是否变化，命中则跳过 render |
| 性能特点 | 创建开销大，但离屏 DOM 拼装后只做一次 DOM 插入 | 增量更新，只处理变化节点，但需要 diff 开销 |

## 分析

首次挂载时，workInProgress 树上每个节点的 `current` 指针为 null（除了 HostRoot 本身）。`beginWork` 检测到 `current === null` 后走 mount 路径：直接创建新的子 Fiber，无需与旧树对比。Hooks 通过 `HooksDispatcherOnMount` 初始化，`mountState` 将初始值写入 hook 节点的 `memoizedState`，`mountEffect` 将 effect 对象追加到 `fiber.updateQueue.lastEffect` 环形链表。

`completeWork` 阶段，mount 路径通过 `createInstance`（封装 `document.createElement`）为每个 HostComponent 创建 DOM 节点，再通过 `appendAllChildren` 将子节点离线拼装成完整的 DOM 树。这样在 commit 阶段，只需在 HostRoot 处做一次 `appendChild`，避免了大量单次 DOM 插入带来的回流开销。

更新流程的核心在于 **bailout**：如果一个 Fiber 节点的 `lanes` 不含当前渲染优先级，且 props / context 未变，React 会直接复用该节点及其整棵子树（`cloneChildFibers`），完全跳过 render 和 reconcile。这是 React 性能优化的核心机制，也是 `React.memo`、`PureComponent`、`shouldComponentUpdate` 能生效的原因。

Hooks 在 update 路径通过 `updateWorkInProgressHook` 从 current 链表取出对应 hook，消费 update queue（由 `setState` 调用产生）计算新 state。**Hook 调用顺序必须稳定**正是因为 mount 和 update 路径都依赖链表顺序对应：mount 时第 N 次 Hook 调用创建第 N 个节点，update 时第 N 次调用消费第 N 个节点，顺序错乱会导致状态错配。

## 结论

- **调试 Hook 规则违反**：报错"rendered more hooks than previous"说明 update 路径消费了与 mount 时数量不符的 hook 节点，通常是条件调用 Hook 导致。
- **优化首屏性能**：mount 阶段无法 bailout，减少首屏组件数量（懒加载、虚拟列表）比优化 re-render 更有效。
- **优化更新性能**：善用 bailout 条件——保持 props 引用稳定（memo + useCallback）、避免不必要的 context 更新。

## 相关概念

- [[comparisons/react/render-vs-commit]]：mount 和 update 在 render / commit 两阶段的具体操作
- [[comparisons/react/memo-vs-usememo-vs-usecallback]]：如何触发 bailout 优化更新路径
- [[comparisons/react/fiber-vs-vdom]]：current 树与 workInProgress 树的双缓冲机制
- [[comparisons/react/current-tree-vs-workinprogress]]：两棵树的 alternate 关系
