---
title: Lanes 优先级模型
type: concept
created: 2026-04-21
updated: 2026-04-23
tags: [react, priority, lanes]
status: active
sources: [raw/react/kasong-react-source-book.md]
---

# Lanes 优先级模型

## 定义

Lanes 是 React 17 引入（React 18 全面使用）的**优先级模型**，用位掩码（bitmask）实现多通道并发更新。每个 bit 代表一个"车道"（lane），不同的更新可以被分配到不同的 lane，使 React 能够同时追踪多个优先级不同的更新，并按优先级选择处理顺序。Lanes 替代了 React 16 基于 `expirationTime` 的单值优先级方案。

## 工作原理

### 主要 Lane 定义（ReactFiberLane.js）

```js
export const NoLane             = /*                        */ 0b0000000000000000000000000000000; // 0
export const SyncLane            = /*                        */ 0b0000000000000000000000000000001; // 1
export const InputContinuousLane = /*                        */ 0b0000000000000000000000000000100; // 4
export const DefaultLane         = /*                        */ 0b0000000000000000000000000010000; // 16
// TransitionLanes: 多个 bit，如 0b0000000000000000000000001000000 到 0b0000000000000100000000000000000
export const IdleLane            = /*                        */ 0b0100000000000000000000000000000;
```

优先级由高到低：`SyncLane` > `InputContinuousLane` > `DefaultLane` > `TransitionLanes` > `IdleLane`

### 核心操作

**获取最高优先级 Lane**：

```js
function getHighestPriorityLane(lanes) {
  return lanes & -lanes; // 取最低位的 1（即最高优先级）
}
```

原理：`-lanes` 是 `lanes` 的二补数，`lanes & -lanes` 的结果只保留最低位的 1，对应优先级最高的 lane（数值越小越优先）。

**合并多个 Lanes**：

```js
function mergeLanes(a, b) {
  return a | b; // 位或，合并所有 lane
}
```

`mergeLanes` 用于把多个更新的 lane 合并为一个 lanes 集合，例如 fiber 的 `lanes` 字段积累所有待处理更新的 lane。

**检查交叉（是否有共同 lane）**：

```js
function intersectLanes(a, b) {
  return a & b; // 位与，交集
}

function includesSomeLane(a, b) {
  return (a & b) !== NoLane; // 判断 a 是否包含 b 中的任意 lane
}
```

`includesSomeLane` 用于 bailout 检查：若 `fiber.lanes & renderLanes === 0`，说明该 fiber 的更新不在本次渲染批次中，可以跳过。

**移除已处理的 Lane**：

```js
function removeLanes(set, subset) {
  return set & ~subset; // 清除指定 lane
}
```

### Lane 分配时机

`requestUpdateLane(fiber)` 根据当前调度上下文返回合适的 lane：

| 场景 | 返回的 Lane |
|------|------------|
| `ReactDOM.flushSync` / legacy 模式 | `SyncLane` |
| 用户输入事件（`onClick` 等）处于连续输入 | `InputContinuousLane` |
| 普通 `setState` / 默认 | `DefaultLane` |
| `startTransition` 包裹的更新 | `TransitionLane`（从 pool 中取一个） |
| `requestIdleCallback` 类工作 | `IdleLane` |

### 与 Scheduler 优先级的映射

React Lanes 优先级映射到 Scheduler 的任务优先级，供 [[concepts/react/cooperative-scheduling]] 模块使用：

| Lanes | Scheduler 优先级 | 超时时间 |
|-------|----------------|---------|
| `SyncLane` | `ImmediateSchedulerPriority` | -1ms（立即执行） |
| `InputContinuousLane` | `UserBlockingSchedulerPriority` | 250ms |
| `DefaultLane` | `NormalSchedulerPriority` | 5000ms |
| `TransitionLanes` | `NormalSchedulerPriority` | 5000ms |
| `IdleLane` | `IdleSchedulerPriority` | 永不超时 |

### Root 级别的 Lane 追踪

`FiberRoot` 上有多个 lanes 字段：

- `pendingLanes`：所有待处理的 lane 集合
- `expiredLanes`：已过期（必须同步处理）的 lane
- `pingedLanes`：Suspense promise resolve 后标记的 lane
- `entangledLanes`：相互纠缠（必须一起处理）的 lane

每次选择渲染批次时，`getNextLanes(root, wipLanes)` 从 `pendingLanes` 中选出最高优先级的 lane 集合作为 `renderLanes`。

## 优势与局限

- ✅ **多 lane 并发**：不同优先级的更新可同时挂起在各自 lane 上，React 可按优先级选择处理，无需像 expirationTime 那样把所有更新串行化。
- ✅ **批量合并（mergeLanes）**：同一 lane 上的多次 setState 可自动合并为一次渲染（批处理）。
- ✅ **交叉检测（intersectLanes）**：O(1) 判断某个 fiber 的更新是否属于当前渲染批次，支持高效 bailout。
- ✅ **Transition 支持**：TransitionLanes 有多个 bit，允许多个并发 Transition 互不干扰地追踪各自状态。
- ❌ **调试困难**：位掩码在 DevTools 和日志中难以直观理解，需要工具辅助解码。
- ❌ **概念复杂**：Lanes + entanglement + pinged/expired 状态的组合使优先级逻辑极为复杂，贡献者门槛高。

## 应用场景

Lanes 是 [[concepts/react/concurrent-mode]] 的优先级基础，`startTransition`、`useDeferredValue`、Suspense 的重试调度等特性都依赖 lane 分配和选择机制。也是 `useTransition` 的 `isPending` 状态实现的依据（TransitionLane 未完成时 `isPending = true`）。

## 相关概念

- [[concepts/react/concurrent-mode]]：并发模式（Lanes 的主要使用场景）
- [[concepts/react/cooperative-scheduling]]：协作式调度（Lanes → Scheduler 优先级映射）
- [[concepts/react/work-loop]]：Work Loop（`renderLanes` 参数来自 Lanes 选择）
