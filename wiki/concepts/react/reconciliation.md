---
title: Reconciliation（协调）
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, diff, reconciliation]
status: active
sources: [raw/acdlite-react-fiber-architecture.md, raw/react-official-reconciliation.md, raw/dan-abramov-react-as-ui-runtime.md, raw/kasong-react-source-book.md]
---

# Reconciliation（协调）

## 定义

Reconciliation（协调）是 React 比较**新旧 Fiber 树**、决定哪些 DOM 节点需要创建、更新或删除的过程。它发生在 [[concepts/react/render-phase]]（render 阶段）中，由 `beginWork` 调用 `reconcileChildren` 触发，核心源文件是 `ReactChildFiber.js`。

## 工作原理

### 两条核心启发式规则

React 的 diff 算法基于两条假设，把通用树形 diff 的 O(n³) 复杂度降到 O(n)：

1. **不同类型的元素生成完全不同的树**：若新旧节点的 `type` 不同（如 `div` → `span`），React 直接销毁整棵旧子树并重建，不尝试复用任何子节点。
2. **列表使用 `key` 标识节点**：开发者通过 `key` 告诉 React 哪些节点是"同一个"，使 React 能高效处理列表的插入、移动和删除。

### 入口函数

```
reconcileChildren(current, workInProgress, nextChildren, renderLanes)
  └─ reconcileChildFibers(returnFiber, currentFirstChild, newChild, lanes)
       ├─ reconcileSingleElement   // 新节点是单个 React element
       ├─ reconcileSingleTextNode  // 新节点是文本
       └─ reconcileChildrenArray   // 新节点是数组
```

### 单节点 diff（reconcileSingleElement）

逻辑：遍历旧 fiber 链表，找到与新 element 的 `key` 匹配的旧 fiber：

- `key` 和 `type` 都匹配 → **复用**该 fiber（`useFiber`），标记删除其余旧 fiber。
- `key` 匹配但 `type` 不同 → 删除该旧 fiber 及其所有兄弟，创建新 fiber。
- `key` 不匹配 → 标记该旧 fiber 删除，继续遍历下一个旧 fiber。
- 遍历完未找到 → 创建新 fiber。

### 多节点 diff（reconcileChildrenArray）—— 两轮遍历

多节点 diff 需要处理节点的增删改和**移动**，采用两轮遍历：

```
// 伪代码
function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
  let oldFiber = currentFirstChild;
  let newIdx = 0;

  // === 第一轮：逐个对比，处理更新（无位置变化的情况）===
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) break; // 旧节点位置超前，停止

    const newChild = newChildren[newIdx];
    const matchFiber = updateSlot(returnFiber, oldFiber, newChild); // key 相同则复用/更新

    if (matchFiber === null) break; // key 不匹配，停止第一轮

    // 记录已处理的旧 fiber
    oldFiber = oldFiber.sibling;
  }

  // === 第二轮：处理剩余节点（插入 / 移动 / 删除）===
  if (newIdx === newChildren.length) {
    // 新节点已全部处理，删除剩余旧节点
    deleteRemainingChildren(returnFiber, oldFiber);
    return;
  }

  if (oldFiber === null) {
    // 旧节点已全部匹配，剩余新节点全部插入
    for (; newIdx < newChildren.length; newIdx++) {
      createChild(returnFiber, newChildren[newIdx]);
    }
    return;
  }

  // 把剩余旧 fiber 放入 Map（key → fiber 或 index → fiber）
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx]);
    if (newFiber !== null) {
      // 若复用了旧 fiber，从 Map 中移除
      existingChildren.delete(newFiber.key ?? newIdx);
      // 判断是否需要移动（lastPlacedIndex 算法）
      placeChild(newFiber, lastPlacedIndex, newIdx);
    }
  }

  // Map 中剩余的旧 fiber 全部删除
  existingChildren.forEach(child => deleteChild(returnFiber, child));
}
```

**关键细节 — 移动检测（lastPlacedIndex）**：React 记录最后一个可复用旧节点在旧列表中的 `index`（`lastPlacedIndex`）。若当前复用节点的旧 index 小于 `lastPlacedIndex`，说明该节点在新列表中相对位置前移，需要移动（标记 `Placement` flag）；否则不移动，更新 `lastPlacedIndex`。

### key 的作用

没有 `key` 时，React 按**位置（index）**匹配旧新节点，列表头部插入会导致所有后续节点被视为更新（低效）。有 `key` 后，React 通过 Map 快速找到对应旧节点，跳过无变化的节点，只处理真正变化的部分。

`key` 要求：
- 在**同级**中唯一（不需要全局唯一）
- **稳定**：不依赖数组 index，否则节点移动时 key 跟着变，失去 diff 意义

## 优势与局限

- ✅ **O(n) 复杂度**：两条启发式规则把理论上的 O(n³) 降到 O(n)，适用于实际 UI 场景。
- ✅ **key 优化列表性能**：正确使用 key 可以把列表插入/移动的代价从 O(n) 降到 O(1)（仅移动 DOM 节点）。
- ❌ **key 要求稳定唯一**：使用数组 index 作为 key 在列表有增删时会导致错误复用，是常见的性能/正确性陷阱。
- ❌ **跨层级移动不优化**：Rule 1 意味着跨层级移动（如把节点从一个父节点移到另一个）会触发销毁+重建，而非真正的 DOM 移动。

## 应用场景

Reconciliation 在每次状态或 props 更新时触发，是 React "只更新需要更新的部分" 这一核心承诺的实现机制。

## 相关概念

- [[concepts/react/fiber-architecture]]：Fiber 架构（FiberNode 结构）
- [[concepts/react/render-phase]]：Render 阶段（reconciliation 发生的阶段）
- [[concepts/react/fiber-tree]]：Fiber 树结构（新旧树的组织形式）
