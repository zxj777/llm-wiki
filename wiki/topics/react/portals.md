---
title: Portals 渲染与事件冒泡
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, portals, events, frontend]
status: active
sources: []
---

# Portals 渲染与事件冒泡

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 `ReactDOM.createPortal` 如何让 React 组件渲染到 DOM 树的任意位置，以及为什么 Portal 的事件冒泡是沿 Fiber 树而非 DOM 树传播的。

## 入口函数/文件

- `packages/react-dom/src/client/ReactDOMPortal.js` — `createPortal`
- `packages/react-reconciler/src/ReactFiberPortal.js` — `createFiberFromPortal`
- `packages/react-dom/src/events/ReactDOMEventListener.js` — `dispatchEvent`

## 调用链路

```
# 创建 Portal 对象
ReactDOM.createPortal(children, container, key?)
  → 返回 ReactPortal 对象：
    {
      $$typeof: REACT_PORTAL_TYPE,  # Symbol(react.portal)
      key: key ?? null,
      children: children,
      containerInfo: container,     # 目标 DOM 容器（如 document.body）
    }

# reconciliation：Portal Fiber 在 Fiber 树中的位置
beginWork → updatePortalComponent(current, workInProgress, renderLanes)
  → pushHostContainer(workInProgress, portal.containerInfo)
    # 将 portal.containerInfo 推入 hostContainerInfoStack
    # 后续子节点的 getHostParent() 会读取此栈顶值
  → reconcileChildren(current, workInProgress, portal.children, renderLanes)
  # Portal fiber 在 Fiber 树中仍然是父组件的子 fiber（React 树结构不变）

# commit 阶段：DOM 插入到 Portal 容器（而非 React 父 DOM）
commitPlacement(finishedWork)
  → getHostParentFiber(finishedWork)
    → 向上找最近的 HostComponent / HostRoot / HostPortal fiber
    → 找到 HostPortal fiber
    → 返回 fiber.stateNode.containerInfo（portal 的目标 DOM 容器）
  → insertOrAppendPlacementNode(finishedWork, before, parent)
    → 将 Portal 的子 DOM 节点插入 containerInfo（如 document.body）
    # 而非插入 React 父组件对应的 DOM 节点

# 事件系统：沿 Fiber 树冒泡（而非 DOM 树）
Portal 内 DOM 元素触发点击事件
  → 事件沿 DOM 树冒泡到 root container（React 17+ 的事件委托点）
  → dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent)
    → getClosestInstanceFromNode(target)  # 获取对应的 fiber 节点
    → accumulateSinglePhaseListeners(targetFiber, reactName, ...)
      → 沿 fiber.return 向上收集 onClick 等监听器（Fiber 树遍历）
      → Portal fiber 的 return 是 React 父组件的 fiber
      → 父组件的 onClick 监听器被收集并执行
    # 结论：事件沿 Fiber 树冒泡，与 DOM 树结构无关
```

## 涉及核心概念

- [[concepts/react/fiber-tree]]
- [[concepts/react/synthetic-events]]
- [[concepts/react/commit-phase]]

## 涉及实体

- [[entities/react/fiber-node]]
- [[entities/react/react-dom]]
- [[entities/react/react-reconciler]]

## 常见问题

- **Portal 的事件为什么能冒泡到 React 父组件？**
  React 17+ 将事件监听器注册到 `createRoot` 的 root container（而非 document），所有事件通过委托处理。当事件冒泡到 root container 时，React 的 `dispatchEvent` 通过 `accumulateSinglePhaseListeners` **沿 Fiber 树（而非 DOM 树）**向上收集监听器——Portal 在 Fiber 树中仍是父组件的子节点，所以父组件的事件处理器会被触发，即使在 DOM 层面两者没有父子关系。

- **Portal 的 DOM 容器必须是 `document.body` 吗？**
  不是，可以是任意 DOM 节点（只要在当前 document 内）。常见容器：`document.body`（模态框）、`document.getElementById('modal-root')`（专用挂载点）。注意：如果 portal 容器在**另一个 React root**（独立的 `createRoot`）下，事件冒泡会止于该 root 的 container，无法冒泡到原始 React 父组件——因为原始 root 的事件委托只覆盖自己的 container。

- **Portal 内的 context 可以访问外部 Provider 吗？**
  可以。context 传播沿 Fiber 树进行（`pushProvider`/`popProvider` 在 beginWork/completeWork 中操作 context stack），与 DOM 树结构无关。Portal 的子组件在 Fiber 树中是外部 Provider 的后代，因此可以访问 Provider 提供的 context 值，这是 Portal 相比 `document.body.appendChild` 手动渲染的关键优势之一。

- **Portal 内的 `z-index` 如何管理？**
  Portal 渲染到目标容器后，其 `z-index` 相对于**目标容器的堆叠上下文**。推荐在 `<body>` 末尾准备专用的 `#modal-root` 容器，让所有模态框渲染其中，避免堆叠上下文问题。注意：若 portal 容器有 `transform`、`filter`、`opacity < 1` 等 CSS 属性，会创建新的堆叠上下文，导致 `position: fixed` 相对于该容器而非视口定位。

## 延伸阅读

- [[topics/react/event-system]]：合成事件系统与事件委托
- [[concepts/react/synthetic-events]]：事件冒泡的模拟机制
- [[concepts/react/fiber-tree]]：Fiber 树与 DOM 树的差异
