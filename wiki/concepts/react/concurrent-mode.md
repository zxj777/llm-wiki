---
title: 并发模式（Concurrent Mode）
type: concept
created: 2026-04-21
updated: 2026-04-23
tags: [react, concurrent]
status: active
sources: [raw/react/kasong-react-source-book.md]
---

# 并发模式（Concurrent Mode）

## 定义

Concurrent Mode（并发模式）是 React 18 正式发布的渲染模式，通过 `ReactDOM.createRoot()` 启用。它允许 React 同时在内存中**准备多个版本的 UI**，并根据用户交互的优先级决定哪个版本先提交到屏幕。核心机制是 [[concepts/react/work-loop]] 的可中断性与 [[concepts/react/lanes-model]] 的优先级分配。

## 工作原理

### 时间切片（Time Slicing）

React 使用 [[concepts/react/cooperative-scheduling]] 把渲染工作分散到多帧：

```js
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

`shouldYield()` 检查当前时间片是否已耗尽（默认 5ms）。若耗尽，退出循环，把控制权还给浏览器，使浏览器能在每帧间处理用户输入、执行布局和绘制。下一帧开始时 Scheduler 重新调度，从 `workInProgress` 断点处继续。

### 优先级抢占

当低优先级渲染（如数据驱动的列表更新）正在进行时，若发生高优先级事件（如用户点击按钮），React 可以：

1. 中断当前低优先级 work loop。
2. 丢弃未完成的 workInProgress 树（render 阶段无副作用，可安全丢弃）。
3. 立即开始高优先级更新，完成并提交。
4. 之后重新开始低优先级更新。

这一能力依赖 [[concepts/react/lanes-model]]：不同事件被分配到不同 lane，`getNextLanes` 每次选择最高优先级的 lane 集合进行渲染。

### startTransition

`startTransition` 把其回调内的 setState 标记为 TransitionLane（低优先级）：

```jsx
import { startTransition } from 'react';

function handleInput(value) {
  setInputValue(value);                    // SyncLane / DefaultLane（立即更新）
  startTransition(() => {
    setSearchResults(computeResults(value)); // TransitionLane（可延迟）
  });
}
```

- 输入框立即响应（`setInputValue` 高优先级）。
- 搜索结果在后台计算，不阻塞输入（`setSearchResults` 低优先级）。
- `useTransition` 提供 `isPending` 状态，可在过渡期间显示加载指示器。

### Suspense 协作

Suspense 的工作原理：

1. 子组件执行时 `throw` 一个 Promise（通常由数据请求库触发）。
2. React 的 work loop 捕获这个 throw（`handleThrow`），将该子树标记为 "suspended"。
3. React 向上查找最近的 `<Suspense>` 边界，渲染其 `fallback` 内容并提交。
4. Promise resolve 后，React 把对应 fiber 标记为 `pingLane`，重新调度渲染。
5. 重新渲染时该组件不再 throw，正常完成，替换 fallback。

Suspense 与 Concurrent Mode 协作时，React 可以在等待 Promise 期间继续处理其他高优先级更新，而非阻塞整个应用。

### useDeferredValue

`useDeferredValue` 返回值的"延迟版本"：

```jsx
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  // deferredQuery 在高优先级更新时保持旧值，
  // 待高优先级更新完成后才更新为新值
  return <List filter={deferredQuery} />;
}
```

实现原理：React 用旧的 `deferredValue` 先完成高优先级渲染，同时在 TransitionLane 上启动一次使用新值的后台渲染。若后台渲染被更新的高优先级任务打断，会重新开始。

### Strict Mode 双调用

在开发模式下，`React.StrictMode` 会对函数组件、`useState` 的 initializer、`useMemo`/`useReducer` 的 reducer 等进行**双调用**（mount 时调用两次），以检测副作用是否被意外地写在了 render 阶段（render 阶段可能被多次执行）。生产环境不双调用。

## 优势与局限

- ✅ **更好的用户响应性**：时间切片使长渲染任务不再阻塞用户交互，UI 保持流畅。
- ✅ **渐进增强**：`startTransition` 和 `useDeferredValue` 允许开发者明确划分"紧急"和"非紧急"更新，精细控制优先级。
- ✅ **Suspense 集成**：数据加载和代码分割的 loading 状态由 React 统一协调，不再需要手动管理 loading flag。
- ❌ **副作用可能被多次调用**：Concurrent 模式下 render 阶段可能重复执行，若函数组件有写全局变量等副作用，会产生 bug。StrictMode 双调用有助于提前发现问题。
- ❌ **心智模型改变**：开发者需要理解"渲染可能被中断"这一前提，重新审视 ref 读取、外部 store 订阅等模式（需用 `useSyncExternalStore`）。
- ❌ **第三方库兼容性**：不支持 Concurrent Mode 的库（如直接操作 DOM、使用 `ReactDOM.render`）需要迁移才能获益。

## 应用场景

- **数据密集型列表**：用 `startTransition` 把过滤/搜索更新推迟，保证输入框即时响应。
- **路由切换**：用 Suspense + `startTransition` 实现"等待新页面数据就绪再切换"的体验，避免空白页面闪烁。
- **代码分割**：`React.lazy` + `Suspense` 在 Concurrent Mode 下可以在加载 chunk 时保留当前 UI。

## 相关概念

- [[concepts/react/cooperative-scheduling]]：协作式调度（shouldYield 实现）
- [[concepts/react/time-slicing]]：时间切片
- [[concepts/react/lanes-model]]：Lanes 优先级模型
- [[concepts/react/work-loop]]：Work Loop（workLoopConcurrent）
