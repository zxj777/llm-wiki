---
title: react-dom 包
type: entity
created: 2026-04-21
updated: 2026-04-21
tags: [react, package, dom]
status: active
sources: []
---

# react-dom 包

## 概述

`react-dom`（`packages/react-dom/`）是 React 的**浏览器 DOM 渲染器**，是 `react-reconciler` 的宿主适配层。它的职责是：
1. 向 reconciler 注入 **host config**（DOM 操作方法），让 reconciler 能够创建/更新/删除真实 DOM 节点
2. 提供用户层 API（`createRoot`、`hydrateRoot` 等）
3. 实现浏览器**事件系统**（委托监听 + 合成事件）

架构上，react-dom 调用 `react-reconciler` 暴露的 `createContainer`/`updateContainer` 注入更新，reconciler 在 commit 阶段回调 host config 中的 DOM 操作方法完成实际渲染。

## 关键 API

### 现代 API（React 18+）

```javascript
// 创建并发根，返回 ReactDOMRoot 实例
const root = ReactDOM.createRoot(container, options?)
root.render(<App />)
root.unmount()

// SSR 水合
const root = ReactDOM.hydrateRoot(container, <App />, options?)
```

### 工具 API

```javascript
// 同步执行回调内的所有更新（绕过批量更新）
ReactDOM.flushSync(callback)

// 在 Portal 中渲染（无需 createRoot）
ReactDOM.createPortal(children, container, key?)

// 获取组件对应的 DOM 节点（legacy，不推荐）
ReactDOM.findDOMNode(component)

// 预加载资源（React 19+）
ReactDOM.preload(href, options)
ReactDOM.preinit(href, options)
```

### Legacy API（React 17 及以前）

```javascript
// 同步渲染，不支持并发特性
ReactDOM.render(<App />, container, callback?)
ReactDOM.unmountComponentAtNode(container)
```

## Host Config 实现

react-dom 在 `ReactDOMHostConfig.js`（或 `ReactFiberHostConfig.js`）中实现 reconciler 所需的全部 host config 方法：

| 方法 | DOM 实现 |
|------|---------|
| `createInstance(type, props, ...)` | `document.createElement(type)` |
| `createTextInstance(text, ...)` | `document.createTextNode(text)` |
| `appendInitialChild(parent, child)` | `parent.appendChild(child)` |
| `finalizeInitialChildren(domElement, type, props, ...)` | 设置 DOM 属性、事件监听（通过 `setInitialDOMProperties`） |
| `prepareUpdate(domElement, type, oldProps, newProps, ...)` | `diffProperties()`，返回 `[propKey, propValue, ...]` 差异数组 |
| `commitUpdate(domElement, updatePayload, ...)` | `updateDOMProperties()`，将差异应用到 DOM |
| `removeChild(parentInstance, child)` | `parentInstance.removeChild(child)` |
| `insertBefore(parentInstance, child, beforeChild)` | `parentInstance.insertBefore(child, beforeChild)` |
| `getPublicInstance(instance)` | 返回 DOM 元素本身（用于 ref） |
| `supportsHydration` | `true` |
| `canHydrateInstance(fiber, type, props)` | 检查 SSR 生成的 DOM 节点是否可复用 |

## 事件系统

react-dom 实现了完整的**事件委托**机制，所有事件监听器注册在根容器（`createRoot` 的 container）上，而非每个 DOM 节点。

### 核心文件

| 文件 | 职责 |
|------|------|
| `ReactDOMEventListener.js` | `listenToAllSupportedEvents(rootContainerElement)`：在根容器上注册所有支持事件的捕获/冒泡监听器 |
| `ReactDOMEventPlugin.js` | 事件插件体系，将原生事件转换为合成事件 |
| `SyntheticEvent.js` | `SyntheticEvent` 基类，封装原生 event 对象，统一跨浏览器差异 |
| `ReactDOMEventPluginOrder.js` | 定义事件插件执行顺序 |

### 事件处理流程

1. `createRoot` 调用 `listenToAllSupportedEvents(container)` 注册所有事件
2. 用户触发事件 → 原生事件到达根容器
3. `dispatchEvent` 从目标 fiber 向上遍历，收集所有监听器
4. 构造 `SyntheticEvent` 对象
5. 按捕获→冒泡顺序执行监听器（批量更新上下文中）

### 事件优先级

不同事件类型对应不同的调度优先级：
- 离散事件（click、keydown）→ `SyncLane`（同步，不可中断）
- 连续事件（mousemove、scroll）→ `InputContinuousLane`
- 其他（load 等）→ `DefaultLane`

## 关联

- [[entities/react/react-reconciler]]：react-dom 是基于 react-reconciler 的 DOM 渲染器
- [[concepts/react/host-config]]：react-dom 实现 host config 接口
- [[concepts/react/synthetic-events]]：事件系统的合成事件机制
- [[concepts/react/hydration]]：`hydrateRoot` 实现 SSR 水合
- [[concepts/react/fiber-architecture]]：通过 reconciler 间接使用 Fiber 架构
- [[entities/react/react-scheduler]]：通过 reconciler 间接使用 Scheduler 调度
