---
title: 首次渲染全链路
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, render, frontend]
status: active
sources: []
---

# 首次渲染全链路

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚从 `ReactDOM.createRoot(container).render(<App />)` 调用到真实 DOM 挂载到页面，React 内部究竟发生了什么。

## 入口函数/文件

- `packages/react-dom/src/client/ReactDOMRoot.js` — `createRoot`
- `packages/react-dom/src/client/ReactDOM.js` — `render`（legacy 模式）

## 调用链路

```
ReactDOM.createRoot(container)
  → createFiberRoot(container, ConcurrentMode)
  → new FiberRootNode()
  → createHostRootFiber()

root.render(<App />)
  → updateContainer(element, root)
  → scheduleUpdateOnFiber(root, hostRootFiber, lane)
  → ensureRootIsScheduled(root)
  → performSyncWorkOnRoot(root)        # 同步模式
    → renderRootSync(root, lanes)
      → workLoopSync()
        → performUnitOfWork(workInProgress)
          → beginWork(current, workInProgress, lanes)  # 递归向下
            → updateFunctionComponent / updateClassComponent / updateHostComponent
          → completeWork(current, workInProgress, renderLanes)  # 归并向上
            → createInstance / appendAllChildren / finalizeInitialChildren
    → commitRoot(root)
      → commitBeforeMutationEffects()   # getSnapshotBeforeUpdate
      → commitMutationEffects()         # 插入/更新/删除 DOM
        → commitPlacement → insertBefore / appendChild
      → commitLayoutEffects()           # componentDidMount / useLayoutEffect
      → schedulePassiveEffects()        # 异步调度 useEffect
```

## 涉及核心概念

- [[concepts/react/fiber-architecture]]
- [[concepts/react/fiber-tree]]
- [[concepts/react/work-loop]]
- [[concepts/react/render-phase]]
- [[concepts/react/commit-phase]]
- [[concepts/react/double-buffering]]

## 涉及实体

- [[entities/react/fiber-node]]
- [[entities/react/react-reconciler]]
- [[entities/react/react-dom]]
- [[entities/react/work-in-progress-tree]]

## 常见问题

- **`createRoot` 和 `ReactDOM.render` 有什么区别？**
  `createRoot` 启用并发模式（Concurrent Mode），root 使用 `performConcurrentWorkOnRoot` 调度，支持时间切片、Transition、Suspense 等特性。`ReactDOM.render` 是 legacy 模式，始终同步渲染（`performSyncWorkOnRoot`），不支持并发特性，在 React 18 中已被弃用。两者创建的 FiberRoot 的 `tag` 字段不同（`ConcurrentRoot` vs `LegacyRoot`），`ensureRootIsScheduled` 据此分路。

- **Fiber 树是怎么从无到有建立的？**
  首次渲染时 `current` 树只有 HostRoot fiber，`workInProgress` 从 HostRoot 克隆起步。`beginWork` 自上而下递归创建子 fiber（`createFiberFromElement`），`completeWork` 自下而上创建 DOM 节点（`createInstance`）并将子 DOM 连接（`appendAllChildren`）。commit 阶段 `commitPlacement` 将 HostRoot 下整棵 DOM 树一次性 `appendChild` 到容器，最后 `root.current = finishedWork` 完成双缓冲切换。

- **`beginWork` 和 `completeWork` 各自负责什么？**
  `beginWork` 负责"递进向下"：根据 fiber 类型调用对应 update 函数（如 `updateFunctionComponent`），执行组件渲染，调用 `reconcileChildren` 生成子 fiber，返回第一个子 fiber 让 workLoop 继续向下。`completeWork` 负责"归并向上"：当 fiber 没有子节点或子树处理完毕时，创建对应 DOM 实例、连接子 DOM，然后返回兄弟节点（若有）或父节点，标记需要提交的 `flags`。

- **DOM 操作究竟在哪一步执行？**
  DOM 操作在 commit 阶段的 `commitMutationEffects` 中执行。render 阶段只构建 fiber 树并在 fiber 上标记 `flags`（`Placement`、`Update`、`Deletion`），完全不触碰 DOM。`commitPlacement` 通过 `insertBefore` 或 `appendChild` 将新 DOM 插入，`commitWork` 处理属性更新（`updateProperties`），`commitDeletion` 递归卸载并删除旧节点。

## 延伸阅读

- [[topics/react/state-update]]：理解更新与首次渲染的差异
- [[topics/react/reconciliation]]：beginWork 中的 diff 细节
- [[topics/react/concurrent-scheduler]]：并发模式下的调度差异
