---
title: React.memo vs useMemo vs useCallback
type: comparison
created: 2026-04-21
updated: 2026-04-21
tags: [react, performance, hooks]
status: active
sources: []
---

# React.memo vs useMemo vs useCallback

## 对比维度

| 维度 | React.memo | useMemo | useCallback |
|------|-----------|---------|-------------|
| 作用对象 | 整个组件（HOC 包裹） | render 阶段的计算值 | render 阶段的函数引用 |
| 比较方式 | 浅比较 props（`Object.is` 逐字段），或自定义 compareFn | `areHookInputsEqual`：`Object.is` 逐一比较 deps 数组 | 同 useMemo，`Object.is` 比较 deps |
| 存储内容（memoizedState） | Fiber 节点的 type 包装，`REACT_MEMO_TYPE` | `[value, deps]` 存入 hook.memoizedState | `[fn, deps]` 存入 hook.memoizedState |
| 实现函数 | `updateSimpleMemoComponent`（无 compareFn）/ `updateMemoComponent`（有 compareFn） | `mountMemo` / `updateMemo` | `mountCallback` / `updateCallback` |
| 是否影响 render | ✅ props 未变时跳过整个组件 render（进入 bailout） | ❌ 不跳过 render，只避免重复执行 factory 函数 | ❌ 不跳过 render，只保持函数引用稳定 |
| 在 render 中执行 | 在 beginWork 的 bailout 检查中决定 | render 期间同步执行 factory | render 期间"执行"但只是存储函数引用 |
| 使用位置 | 组件定义处（包裹组件导出） | 组件函数体内（Hook） | 组件函数体内（Hook） |
| 典型场景 | 父组件频繁更新但子组件 props 稳定时跳过子组件 render | 昂贵的计算（如大数组过滤/排序）避免每次 render 重算 | 传递给子组件或 useEffect deps 的回调，保持引用稳定 |

## 分析

三者都是 React 的记忆化（memoization）工具，但层次不同：`React.memo` 作用于**组件粒度**，`useMemo` 和 `useCallback` 作用于**值/函数粒度**。

**React.memo** 是高阶组件（HOC），在 `beginWork` 中检查新旧 props 是否相等（默认浅比较，可传第二个参数自定义）。若相等，直接复用上次的渲染输出（`bailoutOnAlreadyFinishedWork`），整个子树不会进入 render 阶段。它对**引用类型 props 敏感**：即使内容相同，每次父组件 render 产生的新对象/数组/函数引用都会触发子组件重新渲染，因此通常需要配合 `useMemo`/`useCallback` 稳定引用。

**useMemo** 在每次 render 时检查 deps 是否变化，若未变化则返回上次的缓存值，跳过 factory 函数执行。它的核心价值是**避免昂贵计算**（如复杂派生数据、大列表过滤）。注意：`useMemo` 本身不阻止组件 render，它只是在 render 期间避免重复执行 factory。

**useCallback** 是 `useMemo` 的语法糖：`useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`，区别在于 memoizedState 存的是函数本身而不是调用结果。它的核心价值是**稳定函数引用**，使得接收该函数作为 prop 的 `React.memo` 子组件，或将函数作为 dep 的 `useEffect`，不会因每次 render 产生新函数而失效。

三者协同的典型模式：父组件用 `useCallback` 稳定传给子组件的回调，子组件用 `React.memo` 跳过不必要的 render，子组件内部用 `useMemo` 缓存昂贵计算。过度使用这三者（尤其对轻量计算用 useMemo、对简单函数用 useCallback）反而会增加 deps 比较开销和代码复杂度，应按需使用。

## 结论

- **子组件被频繁触发不必要的 render**：用 `React.memo` 包裹子组件，同时确保 props 引用稳定。
- **组件内有昂贵的计算**（如过滤大列表、格式化复杂数据）：用 `useMemo` 缓存计算结果。
- **需要传递稳定的函数引用**（传给 memo 子组件、作为 useEffect dep）：用 `useCallback`。
- **不要滥用**：对每次执行只需 < 1ms 的计算，`useMemo`/`useCallback` 的 deps 比较开销不比直接计算少。

## 相关概念

- [[comparisons/react/mount-vs-update]]：bailout 机制是 React.memo 生效的底层原理
- [[comparisons/react/render-vs-commit]]：useMemo 在 render 阶段同步执行，不涉及 commit
- [[comparisons/react/sync-vs-concurrent]]：并发模式下 render 可能重复，useMemo 的幂等性更重要
