---
title: Hooks 底层机制
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, hooks]
status: active
sources: [raw/dan-abramov-react-as-ui-runtime.md, raw/kasong-react-source-book.md]
---

# Hooks 底层机制

## 定义

Hooks 是 React 16.8 引入的函数组件状态与副作用机制。在底层，每个 hook 调用对应一个**链表节点**，挂载在当前组件 fiber 的 `memoizedState` 字段上。React 通过在 mount 和 update 时注入不同的 **Dispatcher** 来区分两种情况下 hook 的行为。

## 工作原理

### Hook 链表节点结构

每个 hook（无论是 `useState`、`useEffect` 还是 `useRef`）在内存中对应一个 `Hook` 对象：

```ts
type Hook = {
  memoizedState: any;   // 该 hook 当前的状态值（useState 存 state，useEffect 存 effect 对象，useRef 存 { current }）
  baseState: any;       // 未应用 update 前的基础 state（用于优先级跳过时的回滚）
  baseQueue: Update | null; // 被跳过的低优先级 update 队列
  queue: UpdateQueue | null; // 完整的 update 环形链表
  next: Hook | null;    // 指向下一个 hook（链表）
};
```

所有 hook 节点串联成单向链表，`fiber.memoizedState` 指向第一个节点。**这就是为什么 hooks 不能在条件语句或循环中调用**：每次渲染 React 按固定顺序访问链表节点，条件改变会导致节点错位。

### Dispatcher 注入机制

React 在调用函数组件之前，根据当前是 mount 还是 update，把全局的 `ReactCurrentDispatcher.current` 切换到不同的实现：

```js
// mount 阶段
ReactCurrentDispatcher.current = HooksDispatcherOnMount;
// 对应：useState → mountState, useEffect → mountEffect, ...

// update 阶段
ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
// 对应：useState → updateState, useEffect → updateEffect, ...
```

函数组件内的 `useState()`、`useEffect()` 等调用，实际是通过 `ReactCurrentDispatcher.current.useState()` 间接调用，从而在 mount/update 路径上自动分发。

### useState：mount 路径（mountState）

```js
function mountState(initialState) {
  const hook = mountWorkInProgressHook(); // 在链表末尾创建新 Hook 节点

  if (typeof initialState === 'function') {
    initialState = initialState(); // 惰性初始化
  }

  hook.memoizedState = hook.baseState = initialState;
  const queue = {
    pending: null,       // 环形链表，存待处理的 update
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;

  const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue));
  return [hook.memoizedState, dispatch];
}
```

### useState：update 路径（updateState → updateReducer）

```js
function updateState(initialState) {
  return updateReducer(basicStateReducer, initialState);
}

function updateReducer(reducer, initialArg) {
  const hook = updateWorkInProgressHook(); // 沿链表取下一个节点
  const queue = hook.queue;

  // 遍历 queue.pending（环形链表），依次 reduce 得到新 state
  let newState = hook.baseState;
  let update = queue.pending;
  // ... 循环处理所有 update ...
  hook.memoizedState = newState;
  return [newState, queue.dispatch];
}
```

### dispatchSetState（setState 的实现）

调用 `setState(newValue)` 时执行：

```js
function dispatchSetState(fiber, queue, action) {
  const lane = requestUpdateLane(fiber);           // 获取当前更新优先级
  const update = { lane, action, next: null };

  // 把 update 加入 queue.pending 环形链表（尾插，next 指向头）
  const pending = queue.pending;
  if (pending === null) {
    update.next = update; // 首个 update，自环
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;

  // 触发重新渲染
  scheduleUpdateOnFiber(fiber, lane, eventTime);
}
```

### useEffect：mount 路径（mountEffect）

```js
function mountEffect(create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;

  // 创建 effect 对象
  const effect = {
    tag: HookPassive | HookHasEffect, // 标记为 passive effect，且本次需执行
    create,       // 用户传入的函数
    destroy: undefined, // create 返回的 cleanup 函数，初始为 undefined
    deps: nextDeps,
    next: null,   // 链接到 fiber 的 effect 环形链表
  };

  hook.memoizedState = effect;
  // 把 effect 追加到 fiber.updateQueue 的 effect 环形链表
  pushEffect(HookPassive | HookHasEffect, create, undefined, nextDeps);
}
```

`useEffect` 产生的 effect 对象收集在 `fiber.updateQueue.lastEffect` 指向的环形链表中。commit 阶段的 `flushPassiveEffects` 遍历这个链表，先执行所有旧 effect 的 `destroy`，再执行所有新 effect 的 `create`。

**依赖比较（update 路径）**：`updateEffect` 比较新旧 deps 数组（`Object.is` 浅比较），若依赖未变，创建的 effect 对象不带 `HookHasEffect` tag，commit 阶段跳过执行。

### useLayoutEffect vs useEffect

| | useLayoutEffect | useEffect |
|--|--|--|
| 执行时机 | commit 阶段同步（DOM 更新后、浏览器绘制前） | commit 阶段后异步（浏览器绘制后） |
| effect tag | `HookLayout` | `HookPassive` |
| 阻塞绘制 | 是 | 否 |
| 适用场景 | 读取/修改 DOM 布局 | 数据请求、订阅、日志 |

## 优势与局限

- ✅ **逻辑复用**：hooks 把状态逻辑从组件实例中解耦，可以自由组合为自定义 hook，复用能力远超 HOC 和 render props。
- ✅ **无 class 心智负担**：不需要理解 `this`、生命周期方法顺序等 class 概念。
- ❌ **调用顺序约束**：hooks 不能在条件/循环中调用，违反规则会导致链表错位，产生难以追踪的 bug。
- ❌ **闭包陷阱**：`useEffect` 等 hook 的回调捕获创建时的 props/state 快照，若不正确使用依赖数组，可能读到过期值。
- ❌ **底层调试困难**：hook 链表和 dispatcher 注入对用户不可见，出错时错误信息不直观。

## 应用场景

所有 React 函数组件中对 `useState`、`useEffect`、`useRef`、`useCallback`、`useMemo`、`useContext` 等的调用，都通过上述底层机制实现。理解 hooks 内部机制是排查"为什么 state 没更新"、"为什么 effect 多次执行"等问题的基础。

## 相关概念

- [[concepts/react/fiber-architecture]]：Fiber 架构（`fiber.memoizedState` 挂载 hook 链表）
- [[concepts/react/render-phase]]：Render 阶段（hooks 在 `renderWithHooks` 中执行）
- [[concepts/react/effect-list]]：副作用链表（`fiber.updateQueue` 收集 effect）
