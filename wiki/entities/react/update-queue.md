---
title: UpdateQueue 数据结构
type: entity
created: 2026-04-21
updated: 2026-04-21
tags: [react, state, fiber]
status: active
sources: []
---

# UpdateQueue 数据结构

## 概述

`UpdateQueue` 是 React 管理组件 state 更新的核心数据结构，位于 `packages/react-reconciler/src/ReactUpdateQueue.js`。它挂载在 fiber 节点的 `updateQueue` 字段上，用于：
- **类组件**和 **HostRoot**：存储 `setState` / `forceUpdate` / `ReactDOM.render` 触发的更新
- **函数组件**：存储 `useEffect`、`useLayoutEffect` 等产生的 effect 对象链表

## 数据结构定义

### UpdateQueue

```javascript
type UpdateQueue<State> = {
  baseState: State,
  // 基础 state：已完整处理完所有高优先级更新后的状态
  // 下一次 processUpdateQueue 从此 state 开始计算

  firstBaseUpdate: Update<State> | null,
  lastBaseUpdate: Update<State> | null,
  // 上次渲染中因优先级不足被跳过的 update 链表（非环形，单向链表）
  // 这些 update 在下次渲染中必须重新处理，以保证状态一致性

  shared: {
    pending: Update<State> | null,
    // 新提交的 update 以环形链表存储
    // pending 指向链表的最后一个节点，pending.next 指向第一个节点
    // 处理时会先切断环（lastPendingUpdate.next = null），展开为单向链表
    interleaved: Update<State> | null,
    // 并发模式下，render 阶段产生的更新（render 阶段 setState）
    lanes: Lanes,
  },

  effects: Array<Update<State>> | null,
  // 有 callback 的 update 列表，commit 阶段用于调用 setState 回调
};
```

### Update

```javascript
type Update<State> = {
  eventTime: number,       // 更新触发时间（performance.now()）
  lane: Lane,              // 该更新的优先级 lane

  tag: 0 | 1 | 2 | 3,
  // UpdateState = 0：合并 payload 到 state（setState）
  // ReplaceState = 1：直接替换 state（replaceState，legacy）
  // ForceUpdate = 2：强制更新（forceUpdate）
  // CaptureUpdate = 3：错误边界捕获后的更新

  payload: any,
  // 更新内容：
  //   setState({count: 1})  → payload = {count: 1}
  //   setState(s => s + 1) → payload = 函数
  //   ReactDOM.render(<App />) → payload = {element: <App />}

  callback: Function | null,  // setState(s, callback) 的回调
  next: Update<State> | null, // 链表指针
};
```

## 关键操作

### enqueueUpdate（入队）

```javascript
function enqueueUpdate(fiber, update, lane) {
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;

  // 维护环形链表：新节点的 next 指向旧的链表头
  const pending = sharedQueue.pending;
  if (pending === null) {
    update.next = update; // 只有一个节点，自己指向自己
  } else {
    update.next = pending.next; // 新节点的 next = 旧链表头
    pending.next = update;      // 旧链表尾的 next = 新节点
  }
  sharedQueue.pending = update; // pending 始终指向链表尾（最新的 update）
}
```

### processUpdateQueue（处理队列，计算新 state）

```javascript
function processUpdateQueue(workInProgress, props, instance, renderLanes) {
  const queue = workInProgress.updateQueue;

  // 1. 将 shared.pending 环形链表展开，拼接到 baseUpdate 链表末尾
  let pendingQueue = queue.shared.pending;
  // 切断环：
  const lastPendingUpdate = pendingQueue;
  const firstPendingUpdate = lastPendingUpdate.next;
  lastPendingUpdate.next = null; // 展开为单向链表

  // 2. 遍历所有 update（firstBaseUpdate + 展开的 pending）
  let newState = queue.baseState;
  let newFirstBaseUpdate = null; // 跳过的 update 链表头
  let newLastBaseUpdate = null;

  let update = firstBaseUpdate;
  while (update !== null) {
    const updateLane = update.lane;

    if (!isSubsetOfLanes(renderLanes, updateLane)) {
      // 优先级不足，跳过此 update
      // 但必须保留到 baseUpdate 链表，以便下次渲染补充处理
      if (newLastBaseUpdate === null) {
        newFirstBaseUpdate = newLastBaseUpdate = clone(update);
        newBaseState = newState; // 记录跳过前的 state
      } else {
        newLastBaseUpdate.next = clone(update);
        newLastBaseUpdate = newLastBaseUpdate.next;
      }
    } else {
      // 优先级足够，处理此 update
      newState = getStateFromUpdate(workInProgress, queue, update, newState, props, instance);
    }
    update = update.next;
  }

  // 3. 更新 fiber
  queue.baseState = newBaseState; // 跳过 update 前的 state（或最终 state）
  queue.firstBaseUpdate = newFirstBaseUpdate;
  queue.lastBaseUpdate = newLastBaseUpdate;
  workInProgress.memoizedState = newState; // 本次渲染的最终 state
}
```

## 优先级处理

UpdateQueue 的优先级机制是 React 并发特性的核心之一：

1. **高优先级抢占**：当高优先级更新到来时，React 会暂停当前渲染，重新开始一次新渲染，只处理高优先级的 update
2. **低优先级 update 保留**：被跳过的低优先级 update 保存在 `baseQueue` 中，且其后所有 update（无论优先级）也必须保留——保证最终状态的正确性
3. **baseState**：记录第一个被跳过的 update 之前的 state，下次处理时从 baseState 重新计算，保证幂等性
4. **最终一致性**：所有优先级的 update 最终都会被处理，用户不会丢失任何 setState 调用

### 示例

```
初始 state: 0
update A（SyncLane）:  +1
update B（DefaultLane）: *10
update C（SyncLane）:  +5

第一次渲染（只处理 SyncLane）：
  baseState = 0
  处理 A：0 + 1 = 1
  跳过 B：记录 baseState = 1，保留 B 和 C 到 baseQueue
  处理 C：必须在 baseQueue 中保留（C 在 B 之后），但仍然处理 → 1 + 5 = 6
  memoizedState = 6（屏幕显示 6）

第二次渲染（处理所有 lane）：
  从 baseState = 1 开始
  处理 B：1 * 10 = 10
  处理 C：10 + 5 = 15
  memoizedState = 15（最终正确结果）
```

## 函数组件中的 updateQueue

函数组件的 `fiber.updateQueue` 不存储 state 更新，而是存储 **effect 对象链表**：

```javascript
type FunctionComponentUpdateQueue = {
  lastEffect: Effect | null, // 环形链表，指向最后一个 effect
};

type Effect = {
  tag: HookFlags,     // HookPassive（useEffect）| HookLayout（useLayoutEffect）| HookInsertion
  create: () => (() => void) | void,  // effect 函数
  destroy: (() => void) | void,       // 上次执行返回的清理函数
  deps: Array<mixed> | null,          // 依赖数组
  next: Effect,       // 环形链表指针
};
```

commit 阶段会遍历此链表，执行有 `HookHasEffect` 标记的 effect 的 `destroy`（清理）和 `create`（执行）。

## 关联

- [[entities/react/fiber-node]]：`fiber.updateQueue` 字段挂载 UpdateQueue
- [[concepts/react/hooks-internals]]：函数组件的 updateQueue 存储 effect 链表；useState/useReducer 有独立的 hook.queue
- [[concepts/react/lanes-model]]：每个 Update 携带 lane 信息，决定是否在本次渲染中处理
- [[topics/react/state-update]]：状态更新的完整流程（setState → enqueueUpdate → scheduleUpdate → processUpdateQueue）
- [[entities/react/react-reconciler]]：`processUpdateQueue` 在 beginWork 阶段调用
