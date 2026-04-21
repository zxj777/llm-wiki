---
title: Lanes 模型 vs Expiration Time
type: comparison
created: 2026-04-21
updated: 2026-04-21
tags: [react, priority, history]
status: active
sources: []
---

# Lanes 模型 vs Expiration Time

## 对比维度

| 维度 | Expiration Time（React 16） | Lanes（React 17+，React 18 完善） |
|------|-----------------------------|---------------------------------|
| 数据类型 | `number`（时间戳，单位 ms） | `number`（31 位位掩码，每 bit 代表一个 lane） |
| 优先级表示 | 数值越小优先级越高（到期越早） | bit 位越低（值越小）优先级越高，`SyncLane = 0b0000001` |
| 多更新并存 | ❌ 同一时刻只能追踪一个优先级批次 | ✅ 多个 lane 可同时 pending，位掩码天然支持集合运算 |
| 取最高优先级 | 比较数值大小 | `getHighestPriorityLane = lanes & -lanes`（取最低 bit） |
| 合并优先级 | 取最小值（min） | `mergeLanes(a, b) = a \| b` |
| 插队处理 | 高优先级插队后，低优先级 work 被整体丢弃，重新计算 | 高优先级插队后，低优先级 lanes 保留在 `pendingLanes`，render 后恢复 |
| 饥饿（Starvation）防护 | ⚠️ 有，通过过期时间自动升级；但多次插队仍可能饿死 | ✅ `checkForInterruptedWorkOnUnboundedComponents` + entanglement 机制 |
| Transition 支持 | ❌ 无对应概念 | ✅ `TransitionLanes`（16 个 bit），startTransition 专用 |
| Lane Entanglement | ❌ 无 | ✅ 某些更新必须一起提交（如 setState 在 useEffect 中） |
| 调试友好性 | 数值直观（时间戳） | 需要将位掩码转为二进制才直观，但 React DevTools 已做翻译 |
| 引入版本 | React 16（Fiber 初始） | React 17 引入，React 18 正式完善 |

## 分析

Expiration Time 模型在 React 16 Fiber 发布时引入。每个更新被分配一个"到期时间"（基于当前时间戳 + 优先级偏移量），到期时间越早意味着优先级越高。这个模型简单有效，但有一个根本缺陷：**同一时刻只能处于一个优先级批次的 render 中**。当高优先级更新插队时，当前低优先级的 render 进度必须完全丢弃，高优先级完成后再重新开始低优先级 render。这导致了"优先级饥饿"——如果高优先级更新不断插入，低优先级可能永远得不到执行机会。

Lanes 模型用位掩码替代时间戳，将"优先级"从标量变为**集合**。React 18 定义了约 31 个 lane（`SyncLane`、`InputContinuousLane`、`DefaultLane`、`TransitionLane1`…`TransitionLane16`、`IdleLane` 等），每个 lane 是一个 bit。多个 lane 可以同时处于 `pendingLanes`（等待处理的集合），`root.pendingLanes` 是一个位掩码，反映所有未处理更新的优先级集合。高优先级 render 完成后，低优先级 lanes 仍在 `pendingLanes` 中，React 取最高优先级 lane 继续处理，不会丢失进度。

Lanes 的另一个重要概念是 **entanglement**（关联）：当某些 lane 必须一起提交时（如 `useEffect` 内触发的 setState），React 会将它们关联到同一批次，确保观测一致性。这在 Expiration Time 模型中无法表达。

`TransitionLanes` 是 Lanes 模型专为 `startTransition` 设计的 16 个 lane，允许 React 18 同时追踪最多 16 个独立的 transition 更新，每个都有独立的进度，互不干扰。这在 Expiration Time 模型中根本无法实现。

## 结论

- **理解 React 优先级系统**：Lanes 是 React 18 并发特性（startTransition、useDeferredValue、Suspense）的底层支柱，理解位掩码运算有助于调试复杂的优先级问题。
- **阅读源码**：React 17+ 源码全面使用 Lanes，Expiration Time 已完全移除，不再出现在生产代码中。
- **调试工具**：React DevTools Profiler 中显示的优先级 label（"Sync"、"Default"、"Transition"）就是对 Lanes 的直观翻译。

## 相关概念

- [[comparisons/react/sync-vs-concurrent]]：Lanes 是并发模式多优先级调度的基础
- [[comparisons/react/render-vs-commit]]：不同 lane 的更新如何影响 render 阶段的执行
- [[comparisons/react/fiber-vs-vdom]]：Fiber 节点的 `lanes` 字段存储该节点挂起的更新优先级
- [[comparisons/react/current-tree-vs-workinprogress]]：`root.pendingLanes` 驱动下一次 workInProgress 树的构建
