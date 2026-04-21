---
title: Profiler API 与性能采样
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, profiler, performance, frontend]
status: active
sources: []
---

# Profiler API 与性能采样

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 `<React.Profiler>` 如何在渲染过程中采集性能数据，`onRender` 回调的各个参数来自哪里，以及 Profiler 对渲染性能的影响。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberCommitWork.js` — `commitProfilerUpdate`
- `packages/react-reconciler/src/ReactProfilerTimer.js` — `recordStartTime`、`recordElapsedTime`

## 调用链路

```
# Profiler fiber 创建
<React.Profiler id="App" onRender={callback}>
  → fiber.tag = Profiler
  → fiber.mode |= ProfileMode             # 开启 ProfileMode 标志位
  → fiber.memoizedProps = { id, onRender }

# render 阶段（render 开始计时）
beginWork(current, workInProgress, renderLanes)
  → case Profiler → updateProfiler(current, workInProgress, renderLanes)
    → if enableProfilerTimer && workInProgress.mode & ProfileMode:
      → workInProgress.actualStartTime = now()  # performance.now()

# render 阶段（子树完成，计算耗时）
completeWork(current, workInProgress, renderLanes)
  → case Profiler：
    → workInProgress.actualDuration = elapsedTime（渲染阶段实际耗时，ms）
    → workInProgress.treeBaseDuration = 子树所有 fiber 的 selfBaseDuration 累加
      # selfBaseDuration：该 fiber 单独渲染一次的耗时（不含子树）
      # treeBaseDuration：假设全树无 memo 时的估算总耗时

# commit 阶段（触发 onRender 回调）
commitRootImpl()
  → commitLayoutEffects(finishedWork, root, committedLanes)
    → commitProfilerUpdate(finishedWork, current, commitTime, finishedEventTime)
      → fiber.tag === Profiler
      → phase = current === null ? 'mount' : 'update'
      → onRender(
          id,              # Profiler id prop
          phase,           # 'mount' | 'update'
          actualDuration,  # fiber.actualDuration（本次渲染实际耗时）
          baseDuration,    # fiber.treeBaseDuration（无 memo 时的估算耗时）
          startTime,       # fiber.actualStartTime（render 开始时间戳）
          commitTime,      # commit 阶段时间戳
        )
      # onRender 是同步调用，发生在 DOM 更新后、浏览器绘制前
```

## 涉及核心概念

- [[concepts/react/render-phase]]
- [[concepts/react/commit-phase]]
- [[concepts/react/fiber-architecture]]

## 涉及实体

- [[entities/react/fiber-node]]
- [[entities/react/react-reconciler]]

## 常见问题

- **`actualDuration` 和 `baseDuration` 的区别是什么？**
  `actualDuration` 是本次 render 的**真实耗时**，被 `React.memo`/`shouldComponentUpdate` 跳过（bailout）的子树不计入，反映实际性能；`baseDuration` 是**估算基准**，等于子树中所有 fiber 的 `selfBaseDuration` 之和（每个 fiber 单独渲染一次的耗时），代表"无任何 memo 优化时的理论耗时"。两者的差值 `baseDuration - actualDuration` 量化了 memo 优化的实际节省。

- **Profiler 在生产环境会收集数据吗？**
  默认不会——生产 bundle 中 `enableProfilerTimer = false`，计时代码被 dead-code elimination 移除，`onRender` 不会调用。需要生产环境 profiling 时，应使用 `react-dom/profiling` 这个特殊的 build，它保留计时代码但移除开发警告，性能开销约 2-5%。

- **嵌套 Profiler 的数据是独立计算的吗？**
  是的，每个 Profiler 独立计算其子树的 `actualDuration` 和 `baseDuration`，`commitProfilerUpdate` 对每个 Profiler fiber 单独触发一次 `onRender` 回调。外层 Profiler 的 `actualDuration` 包含内层 Profiler 及其子树的耗时；通过比较嵌套 Profiler 的数据可以精准定位性能瓶颈所在层级。

- **Profiler 的 `onRender` 是同步调用还是异步调用？**
  同步调用，在 `commitLayoutEffects` 阶段执行（时机等同于 `useLayoutEffect`）——DOM 已更新但浏览器尚未绘制。因此 `onRender` 中不应执行耗时操作（网络请求、大量计算），否则会延迟浏览器绘制；可在其中积累数据，用 `setTimeout` 或 `requestIdleCallback` 异步上报。

## 延伸阅读

- [[topics/react/initial-render]]：commit 阶段整体流程
- [[topics/react/bailout]]：bailout 如何影响 actualDuration
