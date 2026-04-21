---
title: Bailout 机制
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, performance, memo, bailout, frontend]
status: active
sources: []
---

# Bailout 机制

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 React 如何在 `beginWork` 阶段跳过不需要重新渲染的子树（bailout），以及 `React.memo`、`useMemo`、`useCallback`、`shouldComponentUpdate` 如何触发这一机制。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberBeginWork.js` — `beginWork` / `bailoutOnAlreadyFinishedWork`

## 调用链路

```
beginWork(current, workInProgress, renderLanes)
  # 检查是否可以 bailout（跳过）
  → 检查 workInProgress.lanes 是否包含 renderLanes
    → 不包含：说明这个 fiber 没有待处理的更新
  → checkIfContextChanged(workInProgress.dependencies)
    → Context 值有变化：不能 bailout
  → 如果 props 未变化（Object.is 比较）且没有 context 变化且没有 state 变化：
    → bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
      → 检查子树是否有工作（childLanes & renderLanes）
      → 无工作：return null  # 整个子树跳过
      → 有工作：cloneChildFibers()  # 复用子 fiber，继续向下

# React.memo
React.memo(Component, compare?)
  → 包装为 MemoComponent
  → updateMemoComponent()
    → compare(prevProps, nextProps) 或默认 shallowEqual
    → props 相同：didReceiveUpdate = false → 走 bailout 路径

# useMemo / useCallback
useMemo(factory, deps)
  → updateMemo()
  → areHookInputsEqual(nextDeps, prevDeps)  # 依赖未变
  → 返回缓存值，不重新计算

useCallback(fn, deps)
  → updateCallback()
  → 依赖未变：返回缓存函数引用
```

## 涉及核心概念

- [[concepts/react/bailout-optimization]]
- [[concepts/react/fiber-tree]]
- [[concepts/react/render-phase]]
- [[concepts/react/context-propagation]]

## 涉及实体

- [[entities/react/fiber-node]]
- [[entities/react/react-reconciler]]

## 常见问题

- **`React.memo` 的浅比较是如何实现的？**
  `React.memo` 默认使用 `shallowEqual`（`packages/shared/shallowEqual.js`）：先用 `Object.is(a, b)` 检查引用相等，相等返回 true；再比较两个对象的 key 数量是否一致；最后对每个 key 用 `Object.is` 比较对应值。因此可处理 props 属性为原始类型的情况，但嵌套对象只比较引用。`React.memo(Component, customCompare)` 支持传入自定义比较函数替换默认 shallowEqual。

- **bailout 后，子树完全不执行吗？还是部分执行？**
  取决于子树的 childLanes。`bailoutOnAlreadyFinishedWork` 检查 `workInProgress.childLanes & renderLanes`：若为 0，表示子树无待更新 lane，跳过整棵子树（返回 null，beginWork/completeWork 均不执行）；若非 0，表示子树中某些 fiber 有待更新 lane，调 `cloneChildFibers` 复用直接子 fiber 并继续向下，直到找到真正需要更新的 fiber。bailout 是"尽可能跳过"而非一刀切。

- **为什么子组件 props 没变，但父组件 rerender 后子组件还是重渲染了？**
  最常见原因：父组件 render 时创建了新的对象/函数引用作为 props，即使内容相同 `Object.is({a:1},{a:1})` 返回 false，触发重渲染。解法：用 `React.memo` 包裹子组件，并用 `useMemo`/`useCallback` 稳定 props 引用。其他原因：子组件订阅了变化的 context（`checkIfContextChanged` 强制跳过 bailout），或 key 变化导致 React 认为是不同实例而重新 mount。

- **`useMemo` 的依赖比较和 `React.memo` 的 props 比较有什么区别？**
  两者都用 `Object.is` 逐项比较，但作用范围不同。`useMemo(factory, deps)` 的 `areHookInputsEqual` 比较 `deps` 数组中每一项，全部相同则返回缓存值，不重新调用 factory——这是"计算结果缓存"。`React.memo` 的 `shallowEqual` 比较整个 props 对象的所有 key，全部相同则触发 bailout，跳过子组件 render——这是"渲染跳过"。前者是值缓存优化，后者是渲染优化，常组合使用。

## 延伸阅读

- [[comparisons/react/memo-vs-usememo-vs-usecallback]]：三种优化方式对比
- [[topics/react/context]]：Context 如何绕过 bailout
- [[concepts/react/bailout-optimization]]：bailout 详细机制
