---
title: Fiber 节点数据结构
type: entity
created: 2026-04-21
updated: 2026-04-23
tags: [react, fiber, data-structure]
status: active
sources: [raw/react/acdlite-react-fiber-architecture.md]
---

# Fiber 节点数据结构

## 概述

`FiberNode` 是 React 内部表示组件实例的核心数据结构，位于 `packages/react-reconciler/src/ReactFiber.js`。每个 React 元素在内存中对应一个 Fiber 节点，Fiber 节点通过三种指针（`child`、`sibling`、`return`）构成链表树，取代了传统递归调用栈，使 React 的渲染过程可以暂停和恢复。

Fiber 节点同时扮演三个角色：
1. **工作单元**：work loop 每次处理一个 fiber（`performUnitOfWork`）
2. **状态容器**：保存组件的 props、state、hooks 链表
3. **副作用载体**：通过 `flags`/`subtreeFlags` 标记需要在 commit 阶段执行的操作

## WorkTag 枚举

`tag` 字段使用 `WorkTag` 枚举标识 fiber 类型，决定 `beginWork`/`completeWork` 中的处理分支：

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | `FunctionComponent` | 函数组件 |
| 1 | `ClassComponent` | 类组件 |
| 2 | `IndeterminateComponent` | 首次渲染前类型未确定 |
| 3 | `HostRoot` | Fiber 树的根节点（FiberRootNode 对应的 fiber） |
| 4 | `HostPortal` | Portal 容器 |
| 5 | `HostComponent` | 宿主元素（div、span 等 DOM 节点） |
| 6 | `HostText` | 文本节点 |
| 7 | `Fragment` | `<>...</>` 片段 |
| 8 | `Mode` | 模式节点（ConcurrentMode、StrictMode） |
| 9 | `ContextConsumer` | `Context.Consumer` |
| 10 | `ContextProvider` | `Context.Provider` |
| 11 | `ForwardRef` | `React.forwardRef` 组件 |
| 12 | `Profiler` | `<Profiler>` |
| 13 | `SuspenseComponent` | `<Suspense>` |
| 14 | `MemoComponent` | `React.memo` 包装的组件（有自定义比较函数） |
| 15 | `SimpleMemoComponent` | `React.memo` 包装的组件（无自定义比较函数） |
| 16 | `LazyComponent` | `React.lazy` 懒加载组件 |
| 18 | `DehydratedFragment` | SSR 脱水片段 |

## 关键字段详解

### 身份标识字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `tag` | `WorkTag` | fiber 类型，决定处理分支 |
| `key` | `null \| string` | reconciliation 中的唯一标识，对应 JSX 的 `key` 属性 |
| `type` | `any` | 对应 React element 的 type（函数引用/类引用/字符串如 `'div'`） |
| `stateNode` | `any` | 关联的真实节点：HostComponent → DOM 元素；ClassComponent → 组件实例；HostRoot → FiberRootNode |

### 树结构指针

| 字段 | 类型 | 说明 |
|------|------|------|
| `return` | `Fiber \| null` | 父 fiber（名称来自"返回到哪个 fiber 继续执行"） |
| `child` | `Fiber \| null` | 第一个子 fiber（链表头） |
| `sibling` | `Fiber \| null` | 下一个兄弟 fiber |
| `index` | `number` | 在同级兄弟节点中的位置，reconciliation 时用于 key 比较 |

### Props 与状态

| 字段 | 类型 | 说明 |
|------|------|------|
| `pendingProps` | `any` | 本次渲染开始时设置的 props，处理完成后应等于 `memoizedProps` |
| `memoizedProps` | `any` | 上次渲染完成时确认的 props，用于 bailout：`pendingProps === memoizedProps` 时可跳过 |
| `memoizedState` | `any` | 上次渲染完成时的 state。函数组件：hooks 链表的头节点；类组件：state 对象 |
| `updateQueue` | `UpdateQueue \| null` | state 更新队列（类组件/HostRoot）；也存储 useEffect/useLayoutEffect 的 effect 对象（函数组件） |
| `ref` | `null \| RefCallback \| RefObject` | ref 引用，在 commit 的 `commitAttachRef` 中被赋值 |

### 副作用标记

| 字段 | 类型 | 说明 |
|------|------|------|
| `flags` | `Flags` | 该 fiber 自身需要在 commit 阶段执行的操作（位掩码） |
| `subtreeFlags` | `Flags` | 子树所有 fiber 的 flags 并集（React 18+，替代旧版 effect list） |
| `deletions` | `Array<Fiber> \| null` | 需要删除的子 fiber 列表，commit 阶段依次处理 |

常用 flags 值：
- `Placement = 0b000000000010`（插入/移动）
- `Update = 0b000000000100`（属性更新）
- `Deletion = 0b000000001000`（删除）
- `PassiveEffect = 0b000010000000`（有 useEffect 需要执行）
- `LayoutEffect = 0b000000100000`（有 useLayoutEffect 需要执行）

### 优先级

| 字段 | 类型 | 说明 |
|------|------|------|
| `lanes` | `Lanes` | 该 fiber 上待处理更新的 lane 集合，`NoLanes = 0` 表示无待处理工作 |
| `childLanes` | `Lanes` | 子树中所有 fiber 的 lanes 并集，用于 bailout：为 0 时可跳过整个子树 |

### 双缓冲

| 字段 | 类型 | 说明 |
|------|------|------|
| `alternate` | `Fiber \| null` | 指向另一棵树中对应的 fiber：current.alternate = workInProgress，workInProgress.alternate = current |

## 创建与复用

```javascript
// packages/react-reconciler/src/ReactFiber.js
function createFiber(tag, pendingProps, key, mode) {
  return new FiberNode(tag, pendingProps, key, mode);
}

// 创建 workInProgress 时优先复用 current.alternate
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key, current.mode);
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }
  // 复制其他字段...
  return workInProgress;
}
```

## 关联

- [[concepts/react/fiber-architecture]]：Fiber 架构设计思想
- [[concepts/react/fiber-tree]]：Fiber 节点如何组成树结构
- [[concepts/react/double-buffering]]：`alternate` 字段实现双缓冲
- [[entities/react/update-queue]]：`updateQueue` 字段的完整数据结构
- [[entities/react/work-in-progress-tree]]：workInProgress 树的创建与切换
- [[concepts/react/hooks-internals]]：`memoizedState` 作为 hooks 链表头
- [[concepts/react/lanes-model]]：`lanes`/`childLanes` 字段的含义
