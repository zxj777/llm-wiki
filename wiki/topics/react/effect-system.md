---
title: 副作用系统（useEffect）
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, hooks, effects, frontend]
status: active
sources: []
---

# 副作用系统（useEffect）

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 `useEffect` 和 `useLayoutEffect` 的执行时机、执行顺序、cleanup 机制，以及它们在源码中对应的实现路径。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberHooks.js` — `mountEffect` / `updateEffect`
- `packages/react-reconciler/src/ReactFiberCommitWork.js` — `commitHookEffectListMount` / `commitHookEffectListUnmount`

## 调用链路

```
# Mount 阶段
useEffect(create, deps)
  → mountEffect(create, deps)
  → mountEffectImpl(PassiveEffect | PassiveStaticEffect, HookPassive, create, deps)
    → hook.memoizedState = pushEffect(HookHasEffect | HookPassive, create, undefined, deps)
    # effect 节点挂在 fiber.updateQueue 的环形链表上

# Commit 阶段
commitRoot(root)
  → commitBeforeMutationEffects()
  → commitMutationEffects()         # DOM 变更
  → commitLayoutEffects()
    → commitLifeCycles()
      → commitHookEffectListMount(HookLayout | HookHasEffect, fiber)
      # ↑ useLayoutEffect 的 create 在此同步执行
  → scheduleCallback(NormalPriority, flushPassiveEffects)
    → flushPassiveEffects()         # 异步（下一个宏任务）
      → commitPassiveUnmountEffects()
        → commitHookEffectListUnmount(HookPassive | HookHasEffect, fiber)  # cleanup
      → commitPassiveMountEffects()
        → commitHookEffectListMount(HookPassive | HookHasEffect, fiber)   # create

# Update 阶段
useEffect(create, deps)
  → updateEffect(create, deps)
  → updateEffectImpl()
    → areHookInputsEqual(nextDeps, prevDeps)  # 对比依赖
    → 如果依赖变化：标记 HookHasEffect，加入新 effect
    → 如果依赖相同：复用旧 effect，不标记 HookHasEffect
```

## 涉及核心概念

- [[concepts/react/effect-list]]
- [[concepts/react/hooks-internals]]
- [[concepts/react/commit-phase]]
- [[concepts/react/render-phase]]

## 涉及实体

- [[entities/react/react-hooks]]
- [[entities/react/fiber-node]]
- [[entities/react/react-reconciler]]

## 常见问题

- **`useEffect` 和 `useLayoutEffect` 的执行时机有何不同？**
  `useLayoutEffect` 在 commit 阶段 `commitLayoutEffects` 中**同步**执行，此时 DOM 已更新但浏览器尚未绘制，可以读取 DOM 布局并同步修改，不产生视觉闪烁。`useEffect` 通过 `scheduleCallback(NormalPriority, flushPassiveEffects)` 异步调度，在浏览器完成绘制**之后**的宏任务/微任务中执行，不阻塞页面渲染，但若在其中修改 DOM 会引发二次绘制。

- **cleanup 函数什么时候执行？**
  两种时机：（1）组件卸载时，`commitPassiveUnmountEffects` → `commitHookEffectListUnmount(HookPassive, ...)` 执行 useEffect 的 cleanup；（2）下次 effect 执行前，若依赖变化，先执行旧 effect 的 cleanup，再执行新的 create。对 `useLayoutEffect` 而言，cleanup 在 `commitMutationEffects` 的 `commitHookEffectListUnmount(HookLayout, ...)` 中**同步**执行（早于 passive effects 的 cleanup）。

- **依赖数组为空 `[]` 时，effect 为何仍在 commit 后执行一次？**
  `HookHasEffect` 标记在 mount 时**总是被设置**——首次没有"旧 deps"可比较，`mountEffectImpl` 调用 `pushEffect(HookHasEffect | HookPassive, create, undefined, deps)` 无条件加上该标记，`commitPassiveMountEffects` 因此执行该 effect。此后 `updateEffectImpl` 中 `areHookInputsEqual([], [])` 返回 true，不再追加 `HookHasEffect`，effect 不再重复执行。

- **React 18 中 useEffect 的执行时机与 React 17 有何变化？**
  React 18 Strict Mode 下，mount 阶段额外执行一次 mount → unmount → mount 的 effect 循环，暴露非幂等的副作用问题。此外 React 18 优先用 `queueMicrotask`（降级用 `MessageChannel`）在 commit 后尽早调度 `flushPassiveEffects`，使 passive effects 更快执行，减少与 `useLayoutEffect` 的时序差异，但语义上 `useEffect` 仍是"paint 之后"执行。

## 延伸阅读

- [[comparisons/react/useeffect-vs-uselayouteffect]]：两者详细对比
- [[topics/react/strict-mode]]：Strict Mode 下 effect 的双重调用
- [[topics/react/initial-render]]：commit 阶段的完整链路
