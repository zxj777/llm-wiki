---
title: useEffect vs useLayoutEffect
type: comparison
created: 2026-04-21
updated: 2026-04-21
tags: [react, hooks, effects]
status: active
sources: []
---

# useEffect vs useLayoutEffect

## 对比维度

| 维度 | useEffect | useLayoutEffect |
|------|-----------|-----------------|
| 执行时机 | commit 完成 + 浏览器绘制之后 | commit mutation 子阶段之后、浏览器绘制之前 |
| 调度方式 | 异步（通过 `scheduleCallback` 调度到微任务/MessageChannel） | 同步（在 `commitLayoutEffects` 中直接调用） |
| 阻塞浏览器绘制 | ❌ 不阻塞，用户先看到更新后的 UI | ✅ 阻塞绘制，DOM 操作在绘制前完成 |
| cleanup 执行时机 | 下次 effect 执行前（或 unmount 时），在 `flushPassiveEffects` 中 | DOM 变更后（`commitMutationEffects` 阶段），同步执行 |
| commit 子阶段 | beforeMutation 调度，layout 之后的 `flushPassiveEffects` 执行 | `commitLayoutEffects`（layout 子阶段）同步执行 |
| SSR 行为 | ✅ SSR 时不执行（服务器端无副作用），客户端 hydrate 后异步执行 | ⚠️ SSR 时触发警告（`useLayoutEffect does nothing on the server`），因为服务器无 DOM |
| 类比生命周期 | `componentDidMount` + `componentDidUpdate`（但异步） | `componentDidMount` + `componentDidUpdate`（同步，完全等价） |
| 适用场景 | 数据获取、事件订阅、日志上报、不需要同步 DOM 的副作用 | 读取 DOM 布局（getBoundingClientRect）、手动 DOM 同步操作、避免闪烁 |

## 分析

`useEffect` 和 `useLayoutEffect` 的本质区别在于**相对于浏览器绘制的执行时机**。`useLayoutEffect` 在 DOM 变更后、绘制前同步执行，行为等同于类组件的 `componentDidMount`/`componentDidUpdate`；`useEffect` 则在绘制完成后异步执行，用户会先看到渲染结果，再执行副作用。

React 内部处理流程：commit 阶段分三步——beforeMutation（此时 `scheduleCallback(flushPassiveEffects)` 将 useEffect 的执行加入异步队列）→ mutation（DOM 真实变更，同步执行 useLayoutEffect cleanup）→ layout（同步执行 useLayoutEffect setup，更新 ref）。layout 完成后，React 将控制权还给浏览器，浏览器绘制新帧，之后 `flushPassiveEffects` 才真正执行 useEffect cleanup 和 setup。

**useLayoutEffect 的典型用途**是避免"闪烁"：如果你需要在 render 后同步调整 DOM（如根据内容高度设置元素尺寸），用 useEffect 会让用户看到一帧错误的布局，而 useLayoutEffect 在绘制前修正，用户完全感知不到中间状态。这也是为什么 tooltip 定位、modal 居中等 UI 库广泛使用 `useLayoutEffect`。

**SSR 注意事项**：服务器端没有 DOM，`useLayoutEffect` 无意义且会产生警告。如果你的组件在 SSR 场景下必须读取 DOM，可以用条件判断（`if (typeof window !== 'undefined')`）或将 `useLayoutEffect` 替换为 `useIsomorphicLayoutEffect`（社区惯用模式：SSR 时退化为 `useEffect`）。

## 结论

- **默认选择 `useEffect`**：绝大多数副作用（数据获取、订阅、分析）无需阻塞绘制，异步执行更友好。
- **需要同步读/写 DOM 时用 `useLayoutEffect`**：如测量元素尺寸后立即调整位置、手动操作第三方 DOM 库（避免闪烁）。
- **SSR 项目**：如果组件会在服务器渲染，避免在顶层无条件使用 `useLayoutEffect`；封装为 `useIsomorphicLayoutEffect` 或延迟到客户端。
- **性能敏感路径**：`useLayoutEffect` 同步阻塞绘制，若其中有耗时操作会导致帧率下降，需谨慎。

## 相关概念

- [[comparisons/react/render-vs-commit]]：两种 effect 在 commit 不同子阶段的执行位置
- [[comparisons/react/mount-vs-update]]：effect 在首次挂载和更新时的 cleanup / setup 差异
- [[comparisons/react/sync-vs-concurrent]]：并发模式下 effect 可能被多次调度的注意事项
