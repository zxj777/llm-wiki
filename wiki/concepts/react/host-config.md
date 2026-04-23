---
title: Host Config（宿主配置）
type: concept
created: 2026-04-21
updated: 2026-04-23
tags: [react, renderer, custom]
status: active
sources: [raw/react/dan-abramov-react-as-ui-runtime.md]
---

# Host Config（宿主配置）

## 定义

Host Config（宿主配置）是 `react-reconciler` 与具体宿主环境（浏览器 DOM、React Native、Three.js 等）之间的适配接口。`react-reconciler` 是平台无关的调度和协调引擎，它通过 Host Config 定义的一组回调函数与宿主环境交互，实现创建、更新、插入、删除节点等操作。这使得 React 的渲染逻辑可以运行在任何目标平台上。

## 工作原理

### 架构分层

```
react（用户 API：JSX、Hooks、createRoot）
    ↓
react-reconciler（平台无关：Fiber、调度、diff）
    ↓
Host Config（适配接口）
    ↓
宿主环境（DOM / Native / Canvas / Terminal ...）
```

`react-reconciler` 在 [[concepts/react/render-phase|render 阶段]] 和 [[concepts/react/commit-phase|commit 阶段]] 调用 Host Config 中的方法，但自身不知道也不关心底层平台的实现细节。

### 关键方法

Host Config 定义了以下核心方法（分为创建、突变、查询三类）：

#### 创建节点

```js
// 创建宿主组件实例（对应 <div>、<View> 等）
createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle)
// → 返回宿主实例（DOM: Element；Native: ReactNativeHostComponent）

// 创建文本节点
createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle)
// → 返回文本宿主实例（DOM: TextNode）
```

#### DOM 树操作

```js
// 将子节点追加到父节点（commit 阶段：Placement）
appendChildToContainer(container, child)
appendChild(parentInstance, child)

// 在参考节点之前插入（节点移动/重排）
insertBefore(parentInstance, child, beforeChild)
insertInContainerBefore(container, child, beforeChild)

// 删除节点
removeChild(parentInstance, child)
removeChildFromContainer(container, child)
```

#### 更新

```js
// 计算需要更新的 props（render 阶段）
prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, hostContext)
// → 返回 updatePayload（null 表示无需更新）

// 提交 DOM 属性更新（commit 阶段：Update）
commitUpdate(instance, updatePayload, type, oldProps, newProps, internalInstanceHandle)

// 更新文本节点内容
commitTextUpdate(textInstance, oldText, newText)
```

#### 生命周期钩子

```js
// DOM 插入前（可用于测量、snapshot）
prepareForCommit(containerInfo)
// DOM 插入后（可用于 focus 恢复）
resetAfterCommit(containerInfo)

// 是否支持 Mutation 模式（DOM）还是 Persistence 模式（不可变更新）
supportsMutation: true  // DOM 环境
supportsPersistence: false
```

### react-dom 的实现

`react-dom` 的 Host Config 实现位于：

```
packages/react-dom/src/client/ReactFiberHostConfig.js
（或 packages/react-dom-bindings/src/client/ReactDOMHostConfig.js，取决于版本）
```

以 `createInstance` 为例，`react-dom` 的实现是调用 `document.createElement`：

```js
function createInstance(type, props, rootContainerInstance, hostContext) {
  const domElement = createElement(type, props, rootContainerInstance, hostContext);
  // 将 props 设置到 DOM 元素
  setInitialDOMProperties(domElement, props, ...);
  return domElement;
}
```

### 其他渲染器的实现

| 渲染器 | 宿主环境 | createInstance 做什么 |
|--------|---------|----------------------|
| `react-dom` | 浏览器 DOM | `document.createElement(type)` |
| `react-native` | Native 组件 | 调用 Native 端的组件创建 API |
| `react-three-fiber` | Three.js | `new THREE.Mesh()` 等 Three.js 对象 |
| `ink` | Terminal | 创建终端 UI 节点（布局计算后输出字符） |
| `react-pdf` | PDF | 创建 PDF 元素节点 |

## 应用场景

### 实现自定义渲染器

基于 `react-reconciler` 创建自定义渲染器只需三步：

```js
import ReactReconciler from 'react-reconciler';

const hostConfig = {
  supportsMutation: true,
  createInstance(type, props) {
    // 创建你的平台节点
    return { type, props, children: [] };
  },
  appendChildToContainer(container, child) {
    container.children.push(child);
  },
  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    instance.props = newProps;
    // 触发平台特定的更新
  },
  // ... 其他必要方法
};

const MyRenderer = ReactReconciler(hostConfig);

export function render(element, container) {
  const root = MyRenderer.createContainer(container, 0, null, false, null, '', {}, null);
  MyRenderer.updateContainer(element, root, null, null);
}
```

### react-test-renderer

React 内置的 `react-test-renderer` 也是一个基于 Host Config 的自定义渲染器，它将 React 组件渲染成纯 JavaScript 对象树，用于单元测试时无需 DOM 环境。

## 优势与局限

- ✅ **平台无关性**：`react-reconciler` 逻辑完全复用，渲染器只需实现 Host Config
- ✅ **生态扩展**：任何平台都可以拥有 React 的组件模型、Hooks、并发特性
- ✅ **类型安全**：TypeScript 类型定义完整，自定义渲染器有完整类型约束
- ❌ **接口复杂**：Host Config 方法众多（约 20+），实现完整的渲染器工作量大
- ❌ **API 不稳定**：`react-reconciler` 作为 experimental 包，不保证稳定的 API，版本升级可能破坏自定义渲染器
- ❌ **Mutation vs Persistence 两种模式**：并非所有平台都适合 Mutation 模式（如不可变平台需要 Persistence 模式），需要额外实现

## 相关概念

- [[concepts/react/fiber-architecture]]：Fiber 架构（reconciler 驱动 Host Config 调用）
- [[concepts/react/render-phase]]：Render 阶段（`prepareUpdate`、`createInstance` 在此阶段调用）
- [[concepts/react/commit-phase]]：Commit 阶段（`commitUpdate`、`appendChildToContainer` 等在此阶段调用）
- [[concepts/react/effect-list]]：副作用链表（flags 决定 commit 阶段调用哪些 Host Config 方法）
