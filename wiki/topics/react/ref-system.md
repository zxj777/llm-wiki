---
title: Ref 系统
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, ref, hooks, frontend]
status: active
sources: []
---

# Ref 系统

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 `useRef`、`React.createRef`、`forwardRef`、`useImperativeHandle` 的实现原理，以及 ref 的挂载和卸载时机。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberHooks.js` — `mountRef` / `updateRef`
- `packages/react-reconciler/src/ReactFiberCommitWork.js` — `commitAttachRef` / `commitDetachRef`

## 调用链路

```
# useRef
useRef(initialValue)
  → mountRef(initialValue)
  → hook.memoizedState = { current: initialValue }  # 返回稳定的 ref 对象

# ref 属性挂载到 DOM 元素
<div ref={myRef}>
  → render 阶段：fiber.ref = ref
  → completeWork → 标记 Ref flag（fiber.flags |= Ref）
  → commitRoot
    → commitMutationEffects
      → commitDetachRef(current)  # 先清空旧 ref（current.ref.current = null）
    → commitLayoutEffects
      → commitAttachRef(finishedWork)  # 挂载新 ref
        → ref.current = finishedWork.stateNode  # DOM 元素
        → 或 ref(instance)（函数形式）

# forwardRef
React.forwardRef((props, ref) => ...)
  → 包装成 $$typeof: REACT_FORWARD_REF_TYPE 的对象
  → renderWithHooks 时将 ref 作为第二参数传入

# useImperativeHandle
useImperativeHandle(ref, createHandle, deps)
  → mountImperativeHandle / updateImperativeHandle
  → 通过 useLayoutEffect 时机执行 createHandle()
  → ref.current = createHandle()  # 覆盖 ref.current 为自定义对象
```

## 涉及核心概念

- [[concepts/react/hooks-internals]]
- [[concepts/react/commit-phase]]
- [[concepts/react/effect-list]]

## 涉及实体

- [[entities/react/react-hooks]]
- [[entities/react/fiber-node]]

## 常见问题

- **`useRef` 和 `createRef` 有什么区别？**
  `useRef` 在 mount 时创建 `{ current: initialValue }` 存入 hook 的 `memoizedState`，后续 render 直接返回同一对象引用，整个组件生命周期内保持稳定，不触发重渲染。`createRef` 每次调用都创建新对象，在函数组件中每次 render 都产生新引用，只适合在 class 组件构造函数或实例属性中使用。函数组件中始终应用 `useRef`。

- **ref 回调函数的执行时机是什么？**
  callback ref 在 `commitLayoutEffects` 的 `commitAttachRef` 中执行，时机与 `useLayoutEffect` create 相同：DOM 已更新、浏览器尚未绘制。卸载或 ref 属性变更时，先在 `commitMutationEffects` 的 `commitDetachRef` 中以 `null` 为参数调用旧 ref 回调，再在 `commitLayoutEffects` 中以新 DOM 节点为参数调用新 ref 回调，保证 ref 始终指向最新实例。

- **`useImperativeHandle` 的 deps 不写会怎样？**
  deps 为 `undefined` 时，`updateEffectImpl` 中 `areHookInputsEqual(undefined, undefined)` 返回 false（视为每次变化），每次 render 都标记 `HookHasEffect`，在 `commitLayoutEffects` 中重新调用 `createHandle` 并覆盖 `ref.current`。功能上无误但有额外开销，建议传入准确的依赖数组（通常与 `useLayoutEffect` 的依赖保持一致）。

- **在函数组件中，ref 何时挂载、何时卸载？**
  **挂载**：组件 mount 时，在 `commitLayoutEffects` 的 `commitAttachRef` 中执行，此时 DOM 已插入文档，`ref.current` 被赋值为 DOM 节点（object ref）或调用回调（callback ref），时机在 `useLayoutEffect` create 之后。**卸载**：组件 unmount 时，在 `commitMutationEffects` 的 `commitDetachRef` 中执行（DOM 实际移除之前），`ref.current` 被置为 `null`，这发生在 useLayoutEffect cleanup 之后、useEffect cleanup 之前。

## 延伸阅读

- [[topics/react/effect-system]]：useLayoutEffect 与 ref 挂载的时机关系
- [[topics/react/initial-render]]：commit 阶段整体链路
