---
title: SSR 与 Hydration
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, ssr, hydration, frontend]
status: active
sources: []
---

# SSR 与 Hydration

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚服务端渲染（`renderToPipeableStream`）的流程，以及客户端 `hydrateRoot` 如何复用服务端生成的 DOM，并理解 React 18 的 Selective Hydration 机制。

## 入口函数/文件

- `packages/react-dom/src/server/ReactDOMFizzServer.js` — `renderToPipeableStream`（流式）
- `packages/react-server/src/ReactFizzServer.js` — Fizz Work Loop 核心
- `packages/react-dom/src/client/ReactDOMHydrationRoot.js` — `hydrateRoot`
- `packages/react-reconciler/src/ReactFiberHydrationContext.js` — `tryToClaimNextHydratableInstance`

## 调用链路

```
# 服务端：流式 SSR（React 18）
renderToPipeableStream(<App />, { onShellReady, onAllReady, onError })
  → createRequest(element, resources, responseState, rootFormatContext, ...)
  → performWork(request)
    → renderElement(request, task, node)
    → renderFunctionComponent(request, task, type, props)
    → 遇到 <Suspense>：
      → 渲染 fallback，挂起子内容
      → 等待 data resolve（Promise）
      → data 就绪后通过 <script> 标签流式注入实际内容
  → onShellReady()：Suspense 边界外的首屏内容就绪，调用 pipe(response) 开始流式传输

# 服务端 HTML 输出包含：
  → Suspense 边界占位：<!-- $?--><template id="B:0"></template><!-- $-->
  → 流式注入脚本：<script>$RC("B:0","S:0")</script>（内容就绪后替换 fallback）

# 客户端：Hydration 链路
hydrateRoot(container, <App />)
  → createHydrationContainer(element, container, ...)
  → scheduleUpdateOnFiber(root, fiber, SyncLane)  # 以 Sync 优先级启动 hydration

performConcurrentWorkOnRoot(root)
  → renderRootConcurrent(root, lanes)
    → workLoopConcurrent → beginWork（hydration 模式：supportsHydration = true）
      → tryToClaimNextHydratableInstance(workInProgress)
        → nextHydratableInstance = getNextHydratableSibling()  # 遍历已有 DOM
        → 类型匹配 → prepareToHydrateHostInstance()
          → hydrateInstance(instance, type, props)  # 验证 props、绑定事件
        → 类型不匹配 → 记录 mismatch 错误，创建新 DOM 节点
    → commitRoot(root)
      → commitPlacement：跳过（DOM 节点已存在）
      → commitHydratedContainer：附加事件监听器到 root

# Selective Hydration（React 18）
<Suspense> 边界内的内容延迟水合（deferred hydration）
  → 用户点击/hover 未水合的 Suspense 区域
    → ReactDOM.unstable_scheduleHydration(fiber)
    → 该 Suspense 边界被提升到最高优先级水合（DiscreteEventPriority）
    → 先水合用户交互的区域，其他区域按优先级队列依次水合
```

## 涉及核心概念

- [[concepts/react/hydration]]
- [[concepts/react/fiber-architecture]]
- [[concepts/react/suspense-mechanism]]
- [[concepts/react/concurrent-mode]]

## 涉及实体

- [[entities/react/react-dom]]
- [[entities/react/react-reconciler]]
- [[entities/react/fiber-node]]

## 常见问题

- **Hydration 不匹配时，React 会做什么？**
  开发环境输出 `Warning: Expected server HTML to contain a matching...` 警告。React 18 的处理策略：文本节点不匹配时 React 接受服务端内容并更新（减少 DOM 操作）；元素类型不匹配时 React 丢弃服务端 DOM，重新创建（客户端渲染），可能导致闪烁。排查方向：日期/时间格式（服务端/客户端时区差异）、随机 ID、`typeof window` 条件渲染、浏览器自动插入的元素（如 `<tbody>`）。

- **`hydrateRoot` 和 `createRoot` 创建的根有什么区别？**
  `hydrateRoot` 创建的根在 render 阶段启用 `supportsHydration = true`，workLoop 调用 `tryToClaimNextHydratableInstance` 复用已有 DOM 节点而非创建新节点，commit 阶段跳过 `appendChildToContainer`；`createRoot` 创建的根总是创建新 DOM 节点并追加（不复用任何 DOM）。两者都使用 ConcurrentMode，都支持 Suspense 和并发特性。

- **流式 SSR 中，Suspense fallback 如何替换为实际内容？**
  服务端 Fizz Work Loop 处理挂起的 Suspense 边界：初始时发送 `<template id="B:0">` 占位符和 fallback HTML；当对应的 Promise resolve 后，服务端将实际内容追加到流，同时内联 `<script>` 调用 `$RC("B:0","S:0")`——浏览器执行此脚本将 template 内容替换掉 fallback，随后触发该 Suspense 边界的 selective hydration。

- **Selective Hydration 的优先级如何确定？**
  默认按 Suspense 边界在 HTML 中的顺序（从上到下）排队水合，优先级均等；当用户与某个未水合区域交互时，React 通过 `ReactDOM.unstable_scheduleHydration` 将该边界的水合提升到 `DiscreteEventPriority`（离散事件优先级，最高），优先于其他边界水合，确保交互区域能立即响应用户操作。

## 延伸阅读

- [[concepts/react/hydration]]：Hydration 详细机制
- [[topics/react/suspense]]：Suspense 与 hydration 的交互
- [[comparisons/react/sync-vs-concurrent]]：hydration 在并发模式下的改进
