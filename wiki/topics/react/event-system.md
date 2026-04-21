---
title: 合成事件系统
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, events, frontend]
status: active
sources: []
---

# 合成事件系统

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 React 的事件系统如何将原生 DOM 事件统一封装成合成事件，以及事件委托、冒泡模拟、事件池的实现原理。

## 入口函数/文件

- `packages/react-dom/src/events/ReactDOMEventListener.js` — 事件注册与分发
- `packages/react-dom/src/events/DOMPluginEventSystem.js` — 插件式事件系统

## 调用链路

```
# 事件注册（应用启动时）
createRoot(container)
  → listenToAllSupportedEvents(rootContainerElement)
    → 对每种事件（click, input, ...）：
    → listenToNativeEvent(domEventName, isCapturePhaseListener, rootContainerElement)
      → addEventBubbleListener / addEventCaptureListener
        → container.addEventListener(domEventName, dispatchEvent, ...)

# 事件触发（用户点击时）
用户点击 → 原生 click 事件冒泡到 root container
  → dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent)
  → dispatchEventForPluginEventSystem()
  → batchedUpdates(handleTopLevel, ...)   # 事件处理在批处理上下文内
    → dispatchEventsForPlugins()
      → extractEvents()                   # 通过插件提取合成事件
        → SimpleEventPlugin / ChangeEventPlugin / ...
        → new SyntheticEvent(nativeEvent) # 创建合成事件对象
      → accumulateSinglePhaseListeners()  # 收集 Fiber 树上的监听函数
        → 沿 fiber.return 向上遍历，收集 onClick / onClickCapture
      → processDispatchQueue()            # 执行收集到的监听函数（模拟冒泡/捕获顺序）
```

## 涉及核心概念

- [[concepts/react/synthetic-events]]
- [[concepts/react/fiber-tree]]

## 涉及实体

- [[entities/react/react-dom]]
- [[entities/react/fiber-node]]

## 常见问题

- **React 17 之后事件委托绑定在哪里？**
  绑定到 `createRoot` 传入的 container DOM 节点（通常是 `<div id="root">`），而非 `document`。`listenToAllSupportedEvents(rootContainerElement)` 为每种支持的事件在 container 上注册 bubble 和 capture 两个监听器。这样多个 React 根可以共存互不干扰，`e.stopPropagation()` 在 React 根之外仍有效，也便于微前端架构下的事件隔离。

- **为什么在 setTimeout 中调用 setState 不会批处理？（React 17 及以前）**
  批处理依赖 `executionContext |= BatchedContext`，只在 `batchedUpdates` 包裹（React 合成事件处理）期间有效。`setTimeout` 回调直接由浏览器调用，不经过 `batchedUpdates`，`executionContext` 中没有 `BatchedContext`，每次 `scheduleUpdateOnFiber` 检测到后立即调 `flushSyncCallbackQueue`，每次 setState 独立触发一次同步渲染。React 18 的自动批处理通过微任务机制解决了这一问题。

- **合成事件对象的 `persist()` 方法还有用吗？**
  React 17 移除了事件池（event pooling），合成事件对象不再被复用和属性清空，`persist()` 已变为空操作（no-op）。React 16 及以前，事件处理完毕后属性会被清空并归还事件池，若在异步代码（如 `setTimeout`）中访问事件属性需先调 `e.persist()`。React 17+ 每次事件创建新对象，无需 persist，但保留该方法以兼容旧代码。

- **`e.stopPropagation()` 能阻止 Fiber 树上的模拟冒泡，但能阻止原生 DOM 冒泡吗？**
  不能。`e.stopPropagation()` 阻止的是 React 模拟冒泡——即 `processDispatchQueue` 按序执行 Fiber 树上收集的监听器时的传播，不影响原生 DOM 事件。因为 React 在 container 上只有一个监听器，用户点击后原生事件已完成从 target 到 container 的冒泡，React 才开始分发。Portal 内的 React 事件会沿 Fiber 树冒泡到 Portal 的 React 父组件，但原生 DOM 事件只沿 Portal 实际 DOM 父节点冒泡。

## 延伸阅读

- [[topics/react/batching]]：事件处理内的批量更新
- [[topics/react/portals]]：Portal 场景下事件冒泡沿 Fiber 树而非 DOM 树
- [[concepts/react/synthetic-events]]：合成事件详细机制
