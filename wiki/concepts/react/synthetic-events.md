---
title: 合成事件（Synthetic Events）
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, events]
status: active
sources: []
---

# 合成事件（Synthetic Events）

## 定义

合成事件（SyntheticEvent）是 React 对原生 DOM 事件的跨浏览器封装。React 并不直接在每个 DOM 元素上注册事件监听器，而是采用**事件委托**（Event Delegation）的方式，在容器节点上统一监听所有事件，再通过合成事件系统将事件分发给 [[concepts/react/fiber-architecture|Fiber 树]] 中对应的组件。

## 工作原理

### 事件委托到 root（React 17+）

React 应用初始化时（`createRoot` / `ReactDOM.render`），调用：

```js
// packages/react-dom/src/client/ReactDOMRoot.js
listenToAllSupportedEvents(rootContainerElement);
```

这一调用将所有支持的原生事件（click、input、keydown 等）通过 `addEventListener` 注册到**根 DOM 节点**（即 `ReactDOM.createRoot(container)` 的 `container`），而非每个组件对应的 DOM 元素。

### 事件触发流程

1. 用户触发原生 DOM 事件，事件沿 DOM 树冒泡到 root 容器节点
2. React 注册在 root 上的监听器被触发，调用 `dispatchEvent`
3. `dispatchEvent` 从触发事件的 DOM 节点出发，沿 **Fiber 树**（而非 DOM 树）向上遍历，收集所有注册了该事件处理器的 fiber 节点（捕获和冒泡阶段分开收集）
4. React 创建 `SyntheticEvent` 对象，包装原生 `nativeEvent`
5. 按捕获→目标→冒泡顺序依次调用收集到的事件处理器

### 沿 Fiber 树收集监听器

事件冒泡路径沿 **Fiber 树**（`fiber.return` 指针向上）收集，而非沿 DOM 树。这是 React Portal 事件行为的关键：

```jsx
// Portal 将 DOM 渲染到 body，但 Fiber 父节点仍是 App
const Modal = () => ReactDOM.createPortal(<button onClick={...} />, document.body);

const App = () => (
  <div onClick={() => console.log('App clicked')}>  {/* 这个会触发！ */}
    <Modal />
  </div>
);
```

`Modal` 的 DOM 父节点是 `body`，不在 `App` 的 DOM 子树中，但 Fiber 树中 `Modal` 的 `fiber.return` 仍指向 `App`。所以 Modal 内的点击事件会冒泡到 App 的 onClick，这与 DOM 树冒泡行为不同，但符合 React 的组件树语义。

### SyntheticEvent 的结构

`SyntheticEvent` 是原生事件的轻量包装器：

```js
{
  nativeEvent: MouseEvent,       // 原生事件引用
  target: EventTarget,           // 触发元素
  currentTarget: EventTarget,    // 当前处理元素
  type: 'click',
  bubbles: true,
  preventDefault(): void,        // 调用 nativeEvent.preventDefault()
  stopPropagation(): void,       // 停止 React 合成事件的冒泡（不影响原生冒泡）
  isPropagationStopped(): bool,
  // ... 其他标准事件属性
}
```

## 历史变化

### React 16：委托到 document + 事件池

- 事件委托目标是 **`document`**，而非 root 节点
- 存在**事件池**（Event Pooling）机制：`SyntheticEvent` 对象在事件处理器返回后被回收复用，所有属性清空为 null
- 异步访问事件属性必须调用 `e.persist()` 保留引用：
  ```js
  // React 16 时代
  onClick={(e) => {
    e.persist();  // 否则 setTimeout 里访问 e.target 会得到 null
    setTimeout(() => console.log(e.target), 0);
  }}
  ```

### React 17：委托到 root + 移除事件池

- 事件委托改为挂载在 **root DOM 节点**（`createRoot` 的容器）
  - 好处：多个 React 版本可以共存（微前端场景），各自的事件不会互相干扰
  - React 16 委托在 document 时，在 document 上 `stopPropagation` 才能阻止，React 17 只需在 root 上
- **移除事件池**：`SyntheticEvent` 不再复用，每次事件创建新对象，不再需要 `e.persist()`
- 部分事件语义与浏览器对齐（如 `onScroll` 不再冒泡）

## 优势与局限

- ✅ **跨浏览器一致性**：屏蔽浏览器差异，提供统一的事件 API
- ✅ **性能优化**：事件委托减少 DOM 监听器数量，避免频繁 add/remove
- ✅ **Portal 语义正确**：事件沿 Fiber 树冒泡，符合组件树层级关系
- ✅ **与并发模式集成**：可以在事件处理器中调用 `startTransition`
- ❌ **`stopPropagation` 只停止 React 层冒泡**：原生 DOM 事件仍会继续冒泡（需调用 `nativeEvent.stopPropagation()`）
- ❌ **部分原生事件不支持委托**：如 `scroll`、`blur`/`focus`（React 用 `focusin`/`focusout` 代替）需特殊处理

## 应用场景

- 所有 React 组件中的事件处理（`onClick`、`onChange`、`onSubmit` 等）
- Portal 内需要向 React 父组件冒泡事件的场景
- 微前端场景中多版本 React 共存（React 17+ 各自委托到自己的 root，互不干扰）

## 相关概念

- [[concepts/react/fiber-architecture]]：Fiber 架构（事件冒泡路径沿 Fiber 树，而非 DOM 树）
- [[concepts/react/concurrent-mode]]：并发模式（事件处理器可触发 `startTransition`）
