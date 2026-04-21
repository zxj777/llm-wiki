---
title: Context 传播
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [react, context]
status: active
sources: [raw/dan-abramov-react-as-ui-runtime.md]
---

# Context 传播

## 定义

Context 传播是 React 在 Provider 的 `value` 发生变化时，自动通知所有消费该 Context 的组件重新渲染的机制。它是 React 数据流的"广播"通道，允许跨越组件层级传递数据，无需逐层手动传递 props。

## 工作原理

### `React.createContext` 的内部结构

```js
const MyContext = React.createContext(defaultValue);
// 内部结构（简化）
{
  $$typeof: REACT_CONTEXT_TYPE,
  _currentValue: defaultValue,   // 当前 context 值（并发模式下还有 _currentValue2）
  Provider: { $$typeof: REACT_PROVIDER_TYPE, _context: MyContext },
  Consumer: { $$typeof: REACT_CONTEXT_TYPE, _context: MyContext },
}
```

`_currentValue` 在 render 阶段由 Provider 临时修改（类似一个全局栈），消费者通过 `readContext` 读取。

### `readContext`：记录依赖

消费者（`useContext`、`Context.Consumer`、`contextType`）在 render 阶段调用 `readContext(context)`：

```js
function readContext(context) {
  const value = context._currentValue;
  // 将此 context 记录到当前 fiber 的 dependencies 链表
  const newObserver = {
    context,
    memoizedValue: value,
    next: null,
  };
  // 追加到 fiber.dependencies.firstContext 链表
  lastContextDependency = lastContextDependency.next = newObserver;
  return value;
}
```

每个消费 context 的 fiber 都维护一个 `dependencies` 链表，记录它读取了哪些 context 以及读取时的值。

### `propagateContextChange`：传播变化

当 Provider 的 `value` 发生变化时（使用 `Object.is` 检测），React 调用 `propagateContextChange`：

```js
function propagateContextChange(workInProgress, context, renderLanes) {
  // 从 Provider fiber 开始，向下遍历整棵子树
  let fiber = workInProgress.child;
  while (fiber !== null) {
    let nextFiber;
    const list = fiber.dependencies;
    if (list !== null) {
      // 检查此 fiber 是否消费了变化的 context
      let dependency = list.firstContext;
      while (dependency !== null) {
        if (dependency.context === context) {
          // 命中！给此 fiber 的 lanes 加上当前渲染 lane
          fiber.lanes = mergeLanes(fiber.lanes, renderLanes);
          // 同时更新祖先节点的 childLanes，确保不被跳过
          scheduleContextWorkOnParentPath(fiber.return, renderLanes, workInProgress);
          break;
        }
        dependency = dependency.next;
      }
    }
    // 继续向下遍历...
    fiber = nextFiber;
  }
}
```

遍历完成后，所有消费了该 context 的 fiber 都被打上了需要重渲染的标记（加入 `lanes`）。

### Bailout 时的 Context 检查

[[concepts/react/bailout-optimization|Bailout]] 判断条件之一是 `checkDidScheduleUpdateOrContext`，它会检查 fiber 的 `dependencies` 中是否有 context 发生了变化：

```js
function checkDidScheduleUpdateOrContext(current, renderLanes) {
  const updateLanes = current.lanes;
  if (includesSomeLane(updateLanes, renderLanes)) return true;
  // 检查 context 依赖
  const dependencies = current.dependencies;
  if (dependencies !== null && checkIfContextChanged(dependencies)) return true;
  return false;
}
```

这意味着：**即使 props 未变化，只要消费的 context 发生了变化，bailout 也不会触发**。

### Context 穿透 `React.memo` 和 `shouldComponentUpdate`

`React.memo` 的浅比较只检查 props，不检查 context。由于 `propagateContextChange` 直接修改消费者 fiber 的 `lanes`，绕过了 `React.memo` 的 props 检查。结果是：**context 变化会强制穿透 `React.memo`**，消费该 context 的组件无论 memo 还是 `shouldComponentUpdate` 都会重渲染。

## 优势与局限

- ✅ **跨层级数据传递**：无需逐层传 props，适合主题、语言、用户状态等全局数据
- ✅ **自动更新**：Provider value 变化时，消费者自动重渲染，无需手动订阅
- ❌ **性能陷阱**：context value 是对象且每次渲染创建新引用时，所有消费者都会重渲染
- ❌ **穿透 memo**：context 变化无法被 `React.memo` 拦截，需要拆分 context 或使用 `useMemo` 稳定 value 对象
- ❌ **细粒度不足**：`propagateContextChange` 遍历整棵子树，消费者数量多时有性能开销
- ❌ **无法选择性订阅**：不能只订阅 context 对象的某个字段（需要拆分 context 或配合第三方库）

## 应用场景

- 主题（Theme）、国际化（i18n）、用户认证状态等需要跨层级共享的全局数据
- 与 `useReducer` 结合实现轻量级全局状态管理（替代 Redux）
- 避免性能陷阱的最佳实践：
  - 将 context value 用 `useMemo` 包裹，稳定引用
  - 拆分成多个细粒度 context，减少不必要的重渲染范围

## 相关概念

- [[concepts/react/render-phase]]：Render 阶段（`propagateContextChange` 在 render 阶段执行）
- [[concepts/react/bailout-optimization]]：Bailout 优化（Context 变化会绕过 bailout）
- [[concepts/react/fiber-architecture]]：Fiber 架构（`dependencies` 链表挂在 fiber 节点上）
- [[concepts/react/concurrent-mode]]：并发模式（并发渲染中 `_currentValue2` 用于隔离不同渲染树的 context）
