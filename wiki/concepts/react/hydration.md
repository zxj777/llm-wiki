---
title: Hydration（水合）
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, ssr, hydration]
status: active
sources: []
---

# Hydration（水合）

## 定义

Hydration（水合）是 React 在客户端接管服务端渲染（SSR）HTML 的过程。与客户端渲染从零创建 DOM 不同，水合复用服务端已生成的 DOM 节点，只为其附加事件监听器和 React 内部状态，从而显著减少首次交互前的工作量，提升页面性能。

## 工作原理

### 服务端渲染

服务端通过以下 API 生成 HTML：

- **React 17 及以前**：`ReactDOMServer.renderToString(element)` — 同步渲染，返回 HTML 字符串
- **React 18**：`renderToPipeableStream(element, options)` — 流式渲染，支持边生成边传输，配合 Suspense 实现按需流式

生成的 HTML 中包含 React 用于匹配的标记（data 属性等），但不包含事件绑定。

### 客户端水合入口：`hydrateRoot`

```js
// React 18
import { hydrateRoot } from 'react-dom/client';
const root = hydrateRoot(document.getElementById('root'), <App />);
```

`hydrateRoot` 内部创建一个特殊的 `ReactDOMHydrationRoot`，与 `createRoot` 的区别在于告知 reconciler 进入水合模式。

### 水合过程：Fiber 树与 DOM 树的匹配

水合阶段本质上是一次特殊的 render，reconciler 在构建 Fiber 树时不创建新 DOM，而是从已有 DOM 中匹配：

1. **`prepareToHydrateHostInstance`**：对每个 HostComponent fiber，找到对应的 DOM 节点（通过 `nextHydratableInstance` 指针在 DOM 树中游走）
2. **验证**：比对 fiber 的 `type`（标签名）和 `props`（属性）与实际 DOM 节点是否一致
3. **匹配成功**：将 DOM 节点绑定到 fiber（`fiber.stateNode = domNode`），注册事件监听器
4. **commit 阶段**：`commitHydratedContainer` 最终确认水合完成

```
服务端 HTML:  <div id="root"><h1>Hello</h1><p>World</p></div>
客户端 Fiber: App → h1("Hello") → p("World")
水合过程: 逐个 fiber 匹配 DOM 节点，成功则复用，失败则警告
```

### 水合不匹配（Hydration Mismatch）的处理

当 fiber 期望的内容与实际 DOM 节点不一致时（文本内容不同、标签类型不同等）：

- **React 开发模式**：在控制台输出详细警告（"Did not expect server HTML to contain..."）
- **处理策略**：React 会**丢弃**不匹配的 DOM 子树，在客户端重新创建（fallback 到客户端渲染）
- **常见原因**：服务端/客户端渲染时的时间戳差异、随机 ID、`window`/`localStorage` 访问、浏览器扩展注入的 DOM

### React 18：Selective Hydration（选择性水合）

React 18 通过 [[concepts/react/suspense-mechanism|Suspense]] 边界实现按需、优先级驱动的水合：

**原理**：
- `renderToPipeableStream` 允许服务端延迟发送 Suspense boundary 内的内容（先发 fallback HTML）
- 客户端收到完整 HTML 前就开始水合其他部分（不等待 Suspense 内容）
- 当 Suspense 内的 HTML 到达时，独立水合该边界

**交互优先水合**：
- 用户点击了尚未水合的区域时，React 将该 Suspense boundary 的水合优先级提升到最高
- 立即同步水合该边界，然后触发用户的事件处理器
- 其他 Suspense boundary 的水合继续在后台低优先级进行

```jsx
<Suspense fallback={<Spinner />}>
  <Comments />  {/* 可以延迟水合，不阻塞 Header 的交互 */}
</Suspense>
```

## 优势与局限

- ✅ **复用 DOM**：无需重新创建 DOM，减少首次可交互时间（TTI）
- ✅ **SEO 友好**：服务端输出完整 HTML，搜索引擎可直接索引
- ✅ **Selective Hydration**：React 18 支持按需、优先级驱动的部分水合
- ❌ **水合成本**：水合过程仍需遍历整棵 Fiber 树，对大型页面依然有 JavaScript 执行成本
- ❌ **不匹配问题**：服务端/客户端渲染结果不一致会导致静默的 DOM 重建，难以调试
- ❌ **`useEffect` 只在客户端运行**：服务端渲染时不执行副作用，需注意服务端与客户端状态的一致性

## 应用场景

- Next.js、Remix 等 SSR 框架的核心机制
- 需要 SEO 和快速首屏的内容型页面
- 使用 `renderToPipeableStream` + Suspense 实现流式 SSR，配合 Selective Hydration 优化大型页面

## 相关概念

- [[concepts/react/fiber-architecture]]：Fiber 架构（水合是特殊的 render pass）
- [[concepts/react/suspense-mechanism]]：Suspense 机制（Selective Hydration 依赖 Suspense boundary）
- [[concepts/react/concurrent-mode]]：并发模式（Selective Hydration 是并发特性，利用 lane 优先级）
- [[concepts/react/double-buffering]]：双缓冲（水合完成后同样通过切换 `root.current` 完成）
