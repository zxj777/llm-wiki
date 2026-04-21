---
title: Lanes 优先级模型
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, lanes, priority, concurrent, frontend]
status: active
sources: []
---

# Lanes 优先级模型

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 React 18 的 Lanes 位掩码优先级模型是如何设计的，lane 如何分配、合并、消费，以及它相比旧版 expirationTime 的优势。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberLane.js` — lane 定义与工具函数
- `packages/react-reconciler/src/ReactFiberWorkLoop.js` — `getNextLanes` / `markRootUpdated`

## 调用链路

```
# Lane 定义（位掩码）
SyncLane            = 0b0000000000000000000000000000001
InputContinuousLane = 0b0000000000000000000000000000100
DefaultLane         = 0b0000000000000000000000000010000
TransitionLane1     = 0b0000000000000000000000001000000
IdleLane            = 0b0100000000000000000000000000000

# Lane 分配
requestUpdateLane(fiber)
  → 根据当前调度上下文（isInputPending / scheduler priority）返回对应 lane
  → 如果在 transition 中：requestTransitionLane() → 轮转分配 TransitionLane

# Lane 合并
root.pendingLanes |= lane         # 将新 lane 加入待处理集合
root.childLanes |= lane           # 向上传播

# 选择下一批渲染的 lanes
getNextLanes(root, wipLanes)
  → 从 pendingLanes 中取最高优先级（最低位）的 lanes
  → 合并同批次的 lanes（如所有 TransitionLane 可一起处理）
  → 返回 nextLanes

# Lane 消费
markRootFinished(root, lanes)
  → root.pendingLanes &= ~lanes   # 清除已完成的 lanes
  → 更新 entangledLanes（纠缠 lanes）
```

## 涉及核心概念

- [[concepts/react/lanes-model]]
- [[concepts/react/concurrent-mode]]
- [[concepts/react/work-loop]]

## 涉及实体

- [[entities/react/react-reconciler]]
- [[entities/react/fiber-node]]

## 常见问题

- **为什么用位掩码而不是数字优先级？位掩码有什么优势？**
  三大优势：（1）**批量操作**：`pendingLanes |= lane` 一次运算合并多个优先级，`pendingLanes &= ~lane` 清除 lane，O(1) 完成；（2）**集合操作**：`getHighestPriorityLane` 用 `lanes & -lanes` 取最低有效位，O(1) 找最高优先级；`intersectLanes` 用 `&` 检查两个 lane 集合是否重叠；（3）**批次区分**：16 个 TransitionLane 可同时独立存在，旧的 expirationTime 无法区分同优先级的不同批次，导致不相关 transition 被错误合并。

- **"纠缠 lanes（entangled lanes）"是什么？**
  Entanglement 表示"这些 lane 必须一起提交"的约束。典型场景：一个 transition 内产生了依赖同一数据的多次更新（如输入框 + 搜索结果列表），用 `entangleLanes(root, lane)` 将它们绑定。`markRootFinished` 清除已完成 lane 时检查 `entangledLanes`，若有纠缠 lane 未完成则继续等待，防止 UI 出现中间状态不一致（一个更新已提交、另一个还在挂起）。

- **`TransitionLane` 有多少个？为什么要轮转？**
  共 16 个（`TransitionLane1` ~ `TransitionLane16`）。轮转（round-robin）分配的原因：若所有 transition 共用同一 lane，它们的 update 会合并为同一批次，一旦一个 transition 被高优先级打断重做，其他不相关 transition 也要重做，浪费计算。使用不同 lane 可独立跟踪每个 transition，被打断时只重做该 lane 对应的 transition，其他 lane 不受影响。

- **`getNextLanes` 的返回值是单个 lane 还是多个 lanes 的集合？**
  是多个 lanes 的集合（位掩码）。函数取 `pendingLanes` 中最高优先级组的所有 lane 合并返回——同一优先级组（如所有 TransitionLane）中存在的 lane 都纳入本次渲染，避免频繁在相同优先级间切换。返回值赋给 `root.renderLanes`，render 阶段中每个 fiber 检查 `fiber.lanes & renderLanes !== 0` 来决定是否需要处理本次更新。

## 延伸阅读

- [[comparisons/react/lanes-vs-expiration-time]]：Lanes vs 旧版 expirationTime 对比
- [[topics/react/concurrent-scheduler]]：Scheduler 与 Lanes 的映射
- [[topics/react/transition]]：TransitionLane 的使用场景
