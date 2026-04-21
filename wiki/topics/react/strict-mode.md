---
title: Strict Mode 内部机制
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, strict-mode, frontend]
status: active
sources: []
---

# Strict Mode 内部机制

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 `<React.StrictMode>` 如何通过双重调用渲染函数和 effect 来帮助检测副作用，以及这种机制在生产环境如何关闭。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberBeginWork.js` — `updateMode`
- `packages/react-reconciler/src/ReactFiberHooks.js` — `renderWithHooks`（双重调用逻辑）
- `packages/react-reconciler/src/ReactStrictModeWarnings.js` — 双重调用开关

## 调用链路

```
# StrictMode fiber 标记
<React.StrictMode>
  → fiber.mode |= StrictLegacyMode | StrictEffectsMode
  → 所有子孙 fiber 继承此 mode 标志位（在 createFiberFromElement 时传递）

# render 阶段：函数组件双重调用
renderWithHooks(current, workInProgress, Component, props, secondArg, nextRenderLanes)
  → let children = Component(props, secondArg)          # 第一次调用（正式结果）
  → if __DEV__ && debugRenderPhaseSideEffectsForStrictMode && workInProgress.mode & StrictLegacyMode:
    → disableLogs()                                     # 静默 console 输出
    → try { Component(props, secondArg) } finally {}    # 第二次调用（结果丢弃）
    → reenableLogs()                                    # 恢复 console
    # 目的：检测函数组件是否有不纯的副作用（如修改外部变量）
    # React DevTools 会部分解禁第二次调用的 console.log，颜色稍浅

# render 阶段：类组件双重调用
constructClassInstance → new Component(props, context)
  → if StrictLegacyMode：new Component(props, context)  # 第二次（检测构造函数副作用）

updateClassComponent → instance.render()
  → if StrictLegacyMode：instance.render()              # 第二次（检测 render 副作用）

# commit 阶段：effect 双重调用（React 18 StrictEffectsMode）
commitPassiveMountEffects(root, finishedWork, committedLanes, committedTransitions)
  → 正常执行 mount effect（useEffect create）
  → if StrictEffectsMode && __DEV__:
    → 立即执行 cleanup（unmount effect）  # 模拟卸载
    → 再次执行 create（mount effect）     # 模拟重新挂载
    # 完整顺序：create → cleanup → create
    # 目的：验证 cleanup 函数能正确清理 create 设置的副作用

# useState / useReducer initializer 双重调用
mountState(initialState)
  → if initialState is function && StrictLegacyMode && __DEV__:
    → initialState()  # 调用两次，检测 initializer 是否有副作用

# 生产环境关闭
所有双重调用逻辑都在 if (__DEV__) 块中
  → 生产 bundle 通过 __DEV__ = false + tree-shaking 完全移除
  → 生产环境中 StrictMode 对运行行为无影响
```

## 涉及核心概念

- [[concepts/react/render-phase]]
- [[concepts/react/effect-list]]
- [[concepts/react/hooks-internals]]

## 涉及实体

- [[entities/react/react-reconciler]]
- [[entities/react/react-hooks]]

## 常见问题

- **Strict Mode 的双重渲染会导致性能问题吗？**
  仅在开发环境（`__DEV__ = true`）下发生，生产 bundle 完全没有双重调用开销。开发环境中性能会降低约 2 倍（双重渲染），但这是开发体验与检测能力的合理取舍。在开发中看到的渲染次数不能代表生产中的实际次数，性能分析应在生产 build 下进行。

- **为什么 React 18 的 Strict Mode 会触发双重 `useEffect`？**
  React 18 引入 `StrictEffectsMode`（`useEffect` 的 mount → unmount → mount 三连）是为了模拟未来"Offscreen API"（Activity）的行为——React 计划允许组件在不销毁 state 的情况下卸载（如路由切换），这要求每个 effect 都有正确的 cleanup。通过在开发模式下故意触发 unmount 再 mount，可以发现 cleanup 不完整的 effect（如定时器未清除、订阅未取消）。

- **为什么 StrictMode 会让 `console.log` 打印两次？**
  函数组件在 StrictMode 下被调用两次（第二次用于副作用检测）。React 在第二次调用前调用 `disableLogs()` 静默 console，但 React DevTools 会在开发模式下**部分解除静默**（保留 `console.log` 等输出），导致同一条 log 出现两次。安装 React DevTools 后，第二次调用的 log 颜色稍浅（灰色），可与第一次区分。

- **生产环境中 Strict Mode 还有效果吗？**
  没有行为上的效果。生产 bundle 中 `__DEV__` 为 false，所有双重调用代码通过 dead code elimination 被移除。StrictMode 的 `fiber.mode` 标志位在生产构建中虽然被设置，但相关的条件检查（`if (__DEV__ && mode & StrictLegacyMode)`）已不存在，对运行时行为零影响。

## 延伸阅读

- [[topics/react/effect-system]]：useEffect 正常执行流程
- [[topics/react/error-boundary]]：Strict Mode 如何配合错误检测
