---
title: react-reconciler 包
type: entity
created: 2026-04-21
updated: 2026-04-21
tags: [react, package]
status: active
sources: []
---

# react-reconciler 包

## 概述

`react-reconciler` 是 React 的核心协调包，位于 `packages/react-reconciler/`，实现了 Fiber 架构、work loop、diff 算法（reconcileChildren）和 commit 三阶段逻辑。它是**平台无关**的：不依赖任何宿主环境 API，通过注入 **host config**（宿主配置）对象适配不同的渲染目标（浏览器 DOM、React Native、测试渲染器等）。

渲染器（如 react-dom）调用 `ReactFiberReconciler.createContainer` / `updateContainer` 将更新注入 reconciler，reconciler 负责构建 workInProgress 树、计算差异并生成副作用列表，最后回调 host config 的方法完成实际的 DOM 操作或 Native 视图操作。

## 核心文件列表

| 文件 | 职责 |
|------|------|
| `ReactFiberWorkLoop.js` | work loop 主循环（`performConcurrentWorkOnRoot`、`performSyncWorkOnRoot`）、render/commit 入口 |
| `ReactFiberBeginWork.js` | `beginWork`：根据 fiber tag 分发处理，调用函数组件、类组件、处理 Context/Suspense 等 |
| `ReactFiberCompleteWork.js` | `completeWork`：向上归并 subtreeFlags，HostComponent 在此创建/更新 DOM 节点（调用 host config） |
| `ReactFiberCommitWork.js` | commit 三阶段：`commitBeforeMutationEffects`、`commitMutationEffects`、`commitLayoutEffects` |
| `ReactFiberHooks.js` | 所有 hook 的实现（useState、useEffect、useRef、useContext 等） |
| `ReactChildFiber.js` | `reconcileChildren` / `reconcileChildFibers`：列表 diff 算法，生成 Placement/Deletion 标记 |
| `ReactFiberContext.js` | Legacy context 和新 Context API 的传播逻辑 |
| `ReactFiberThrow.js` | 错误边界捕获、Suspense throw 处理（promise 抛出后重新调度） |
| `ReactFiberLane.js` | Lanes 模型工具函数：`mergeLanes`、`pickArbitraryLane`、`isSubsetOfLanes` 等 |
| `ReactUpdateQueue.js` | `UpdateQueue` 数据结构、`enqueueUpdate`、`processUpdateQueue` |
| `ReactFiber.js` | `FiberNode` 构造函数、`createWorkInProgress`、`createFiberFromElement` |
| `ReactFiberReconciler.js` | 对外暴露的 API 入口：`createContainer`、`updateContainer`、`getPublicRootInstance` |

## 关键 API

### 对外暴露（供渲染器调用）

```javascript
// 创建 Fiber 根容器（渲染器初始化时调用一次）
createContainer(containerInfo, tag, hydrationCallbacks, isStrictMode, ...)

// 将更新注入 reconciler（触发重新渲染）
updateContainer(element, container, parentComponent, callback)

// 获取根组件的公共实例
getPublicRootInstance(container)

// 批量更新控制
batchedUpdates(fn, a)
flushSync(fn)
```

### 内部核心函数

```javascript
// render 阶段入口
renderRootSync(root, lanes)
renderRootConcurrent(root, lanes)

// work loop
workLoopSync()        // 同步：不检查时间片
workLoopConcurrent()  // 并发：每个 fiber 后调用 shouldYield()

// 单个 fiber 处理
performUnitOfWork(unitOfWork)
  → beginWork(current, workInProgress, renderLanes)   // 向下
  → completeUnitOfWork(unitOfWork)                    // 向上

// commit 阶段
commitRoot(root)
```

## Host Config 接口

reconciler 通过以下方法与宿主环境通信（react-dom 实现了全部方法）：

| 方法 | 说明 |
|------|------|
| `createInstance(type, props, ...)` | 创建宿主节点（如 `document.createElement`） |
| `createTextInstance(text, ...)` | 创建文本节点 |
| `appendInitialChild(parent, child)` | 首次挂载时追加子节点 |
| `finalizeInitialChildren(instance, ...)` | 设置 DOM 属性（事件监听、样式等） |
| `prepareUpdate(instance, type, oldProps, newProps, ...)` | 计算属性差异，返回 updatePayload |
| `commitUpdate(instance, updatePayload, ...)` | 将差异应用到 DOM |
| `commitMount(instance, ...)` | autoFocus 等挂载后操作 |
| `removeChild(parent, child)` | 删除子节点 |
| `insertBefore(parent, child, before)` | 插入节点到指定位置 |

## 关联

- [[concepts/react/fiber-architecture]]：该包实现了 Fiber 架构
- [[concepts/react/work-loop]]：work loop 在此包中实现
- [[concepts/react/reconciliation]]：diff 算法（reconcileChildren）在此包中实现
- [[concepts/react/lanes-model]]：lanes 优先级模型贯穿整个 reconciler
- [[entities/react/react-dom]]：react-dom 是基于此包的 DOM 渲染器，注入 host config
- [[entities/react/react-scheduler]]：reconciler 通过 Scheduler 调度并发任务
- [[entities/react/fiber-node]]：reconciler 操作的核心数据结构
- [[entities/react/update-queue]]：reconciler 通过 updateQueue 管理 state 更新
