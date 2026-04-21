---
title: Reconciliation 与 Diff 算法
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, reconciliation, diff, frontend]
status: active
sources: [raw/react-official-reconciliation.md, raw/acdlite-react-fiber-architecture.md]
---

# Reconciliation 与 Diff 算法

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 React 的 diff 算法如何通过 O(n) 复杂度对比新旧 Fiber 树，以及 `key` 在多节点 diff 中的作用原理。

## 入口函数/文件

- `packages/react-reconciler/src/ReactChildFiber.js` — `reconcileChildren` / `createChildReconciler`

## 调用链路

```
beginWork(current, workInProgress, lanes)
  → updateFunctionComponent / updateHostComponent / ...
  → reconcileChildren(current, workInProgress, nextChildren, renderLanes)
    → reconcileChildFibers(returnFiber, current.child, newChild, lanes)
      # 根据 newChild 类型分发：
      → reconcileSingleElement(returnFiber, currentFirstChild, element, lanes)
        # 单节点 diff
        → 遍历旧 fiber 链表，按 key 和 type 匹配
        → 匹配成功：useFiber(current, element.props)  # 复用 fiber
        → 匹配失败：createFiberFromElement()          # 新建 fiber
        → deleteRemainingChildren()                   # 删除多余旧节点

      → reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes)
        # 多节点 diff（两轮遍历）
        # 第一轮：按索引顺序对比（处理更新场景）
        → updateSlot(returnFiber, oldFiber, newChild, lanes)
          → key 不同 → 跳出第一轮
        # 第二轮：用 Map 处理移动/新增/删除
        → mapRemainingChildren(returnFiber, existingChildren)  # 建立 key→fiber Map
        → 遍历 newChildren
          → updateFromMap()  # 从 Map 中查找可复用 fiber
          → placeChild()     # 判断是否需要移动（lastPlacedIndex 算法）

      → reconcileSingleTextNode()  # 文本节点 diff
      → createFiberFromFragment()  # Fragment diff
```

## 涉及核心概念

- [[concepts/react/reconciliation]]
- [[concepts/react/fiber-architecture]]
- [[concepts/react/fiber-tree]]
- [[concepts/react/render-phase]]

## 涉及实体

- [[entities/react/fiber-node]]
- [[entities/react/react-reconciler]]

## 常见问题

- **React diff 算法的时间复杂度为何是 O(n) 而不是 O(n³)？**
  传统树 diff 是 O(n³)，React 通过三条启发式假设降为 O(n)：（1）只对同层兄弟节点做 diff，不跨层级移动；（2）不同 type 的元素产生不同树，遇到 type 不同直接删旧子树、建新子树，不尝试复用；（3）开发者通过 `key` 提示哪些节点可复用。这三条规则牺牲极少数场景的最优解，换取实际项目中接近线性的 diff 性能。

- **为什么 key 必须在兄弟节点间唯一？用 index 作为 key 有什么问题？**
  key 用于 `reconcileChildrenArray` 第二轮中构建 `Map{key→fiber}` 定位可复用旧 fiber，只需同级唯一。用 index 作 key 的问题：列表重排（如头部插入）时新旧元素 index 相同但内容不同，React 错误复用旧 fiber 的 state（如输入框的值），导致状态错乱；同时每个节点都被判为 props 变化，无法触发 bailout，性能优化失效。

- **多节点 diff 的 `lastPlacedIndex` 算法如何判断是否需要移动节点？**
  `lastPlacedIndex` 记录上一个"无需移动节点"在旧数组中的最大索引。遍历新 children 时，若找到可复用旧 fiber：旧 `oldIndex >= lastPlacedIndex` → 相对顺序未变，不移动，更新 `lastPlacedIndex = oldIndex`；`oldIndex < lastPlacedIndex` → 该节点在新顺序中"落后"了，标记 `Placement` flag（需移动）。React 采用这种贪心策略，不用 LIS 算法（Vue 3 用了）。

- **Fragment 如何参与 diff？**
  `<Fragment>` 在 `reconcileChildFibers` 中命中 Fragment 分支（`createFiberFromFragment`），Fragment fiber 本身不创建 DOM。有 `key` 时整个 Fragment 被视为可复用单元；无 `key` 时按位置匹配。`completeWork` 不为 Fragment 创建 DOM 实例，`appendAllChildren` 穿透 Fragment 直接收集其子 DOM 节点挂到父实例上。

## 延伸阅读

- [[comparisons/react/mount-vs-update]]：首次挂载 vs 更新的 diff 差异
- [[topics/react/bailout]]：如何在 diff 之前提前跳过
- [[concepts/react/fiber-tree]]：Fiber 树的链表结构
