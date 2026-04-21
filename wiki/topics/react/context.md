---
title: Context 传播机制
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, context, frontend]
status: active
sources: []
---

# Context 传播机制

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 `React.createContext` 如何创建 context，Provider 的 value 变化后如何传播到消费者，以及为何 Context 会导致跳过 bailout。

## 入口函数/文件

- `packages/react/src/ReactContext.js` — `createContext`
- `packages/react-reconciler/src/ReactFiberNewContext.js` — `propagateContextChange` / `readContext`

## 调用链路

```
# 创建
React.createContext(defaultValue)
  → { $$typeof: REACT_CONTEXT_TYPE, _currentValue: defaultValue, Provider, Consumer }

# Provider 更新
<MyContext.Provider value={newValue}>
  → beginWork → updateContextProvider()
    → pushProvider(workInProgress, context, newValue)   # 将新值压栈（context 栈）
    → calculateChangedBits(context, newValue, oldValue) # 是否变化（Object.is）
    → 如果变化：
      → propagateContextChange(workInProgress, context, renderLanes)
        → 向下遍历 Fiber 树，找到所有订阅了该 context 的 fiber
        → fiber.lanes |= renderLanes  # 标记需要重新渲染
        → 向上标记 fiber.childLanes   # 确保祖先不会 bailout 跳过这些子树

# Consumer 读取
useContext(MyContext)
  → readContext(context)
    → context._currentValue  # 读取当前栈顶值
    → 将当前 fiber 添加到 context 的订阅列表（dependencies）

# 渲染时跳过 bailout
beginWork → checkIfContextChanged(dependencies)
  → 如果 context 值变化，不能 bailout，必须重新渲染
```

## 涉及核心概念

- [[concepts/react/context-propagation]]
- [[concepts/react/bailout-optimization]]
- [[concepts/react/fiber-tree]]
- [[concepts/react/render-phase]]

## 涉及实体

- [[entities/react/fiber-node]]
- [[entities/react/react-reconciler]]

## 常见问题

- **为什么 Context value 是对象时，每次 render 都会触发消费者重渲染？**
  `updateContextProvider` 用 `Object.is(oldValue, newValue)` 比较新旧 value。对象字面量 `value={{ theme, lang }}` 每次 render 都创建新引用，`Object.is` 比较引用不等，触发 `propagateContextChange`，向下标记所有 consumer fiber 为待更新。解法：用 `useMemo` 缓存 value 对象、将稳定函数和变化数据拆为两个独立 Context、或使用状态管理库。

- **`React.memo` 能阻止 Context 导致的重渲染吗？**
  不能。`beginWork` 中 bailout 检查会调 `checkIfContextChanged(fiber.dependencies)`，只要 fiber 的 `dependencies` 链表中有任何 context 值变化，就强制跳过 bailout——即使 `React.memo` 的 props 浅比较通过也会重渲染。根本原因是 `propagateContextChange` 已将该 fiber 的 `lanes |= renderLanes`，使 `workInProgress.lanes & renderLanes !== 0`，从而阻断 bailout 路径。

- **`propagateContextChange` 的遍历复杂度是多少？**
  O(n)，n 为 Provider 下方所有 Fiber 节点数。函数对整个子树做深度优先遍历，逐节点检查 `fiber.dependencies` 链表是否含当前变化的 context，找到 consumer 后标记 `fiber.lanes |= renderLanes`，并通过 `scheduleContextWorkOnParentPath` 向上更新祖先 `childLanes`，防止中间 fiber 的 bailout 阻断 consumer 被调度。频繁变化的 context 在大型子树中可能成为性能瓶颈。

- **`useContext` 和 `Context.Consumer` 有实现上的区别吗？**
  没有本质区别。`useContext(Context)` 内部调 `readContext(context)`，读取 `context._currentValue` 并将 context 注册到 fiber 的 `dependencies`。`Context.Consumer` 经由 `updateContextConsumer` 同样调 `readContext`，然后将结果作为 render prop 参数传入子函数。两者触发更新的机制完全相同；`useContext` 写法更简洁，无需额外 JSX 层级，是函数组件的推荐做法。

## 延伸阅读

- [[concepts/react/context-propagation]]：Context 传播详细机制
- [[topics/react/bailout]]：bailout 如何与 context 检查交互
- [[topics/react/concurrent-scheduler]]：并发模式下的 context 传播
