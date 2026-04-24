---
title: "状态管理架构"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [framework, state, redux, zustand, flux, frontend]
status: active
sources: []
---

# 状态管理架构

## 定义

状态管理（State Management）是组织应用中数据的来源、流向与变更方式的架构模式。随着应用复杂度提升，状态从组件内部逐步演化到组件树共享，再到全局可访问、可持久化、可调试。状态管理方案的选择直接影响代码可维护性、性能和调试体验，常见模式包括组件本地状态、状态提升、Context、Flux/Redux 单向数据流、原子化状态、基于响应式的 Store 等。

## 工作原理

**演化路径**：最简单的形式是组件本地 state；当多个兄弟组件需要共享时进行**状态提升**到最近公共祖先；当跨多层组件传递时引入 **Context**；当全局共享或需要复杂派生与中间件时引入专门的状态管理库。

**Flux 单向数据流**由 Facebook 提出：View 触发 Action，Dispatcher 把 Action 派发给 Store，Store 更新后通知 View 重渲染。**Redux** 是其简化与函数式实现，三大原则是单一数据源、状态只读、纯函数 Reducer 修改：

```js
function reducer(state = { count: 0 }, action) {
  switch (action.type) {
    case 'INC': return { ...state, count: state.count + 1 };
    default: return state;
  }
}
const store = createStore(reducer);
store.dispatch({ type: 'INC' });
```

Redux 的中间件机制（redux-thunk 处理函数 Action 实现异步、redux-saga 用 Generator 编排副作用）让异步与副作用可控；不可变更新让时间旅行调试成为可能。代价是模板代码多（Action / Reducer / Selector 三件套），后来 Redux Toolkit 用 Immer 和 `createSlice` 大幅简化。

**Context + useReducer** 是 React 内置的轻量方案，但 Context 的更新会让所有消费组件重新渲染，无法做细粒度订阅，性能不适合频繁更新的全局状态。

**Zustand** 用极简 API 暴露一个 hook，内部基于订阅机制，组件只重渲染它实际选择的状态切片：

```js
const useStore = create((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));
const count = useStore((s) => s.count);
```

**Jotai / Recoil** 走原子化路线，把全局状态拆成大量独立的"原子"（atom），组件只订阅自己用到的原子，天然细粒度更新；派生原子（selector）类似 computed。Vue 生态的 **Pinia** 用响应式系统实现 Store，API 简洁且有类型推导。

**选型建议**：本地状态优先 useState；跨层传递配置/主题用 Context；高频共享用 Zustand / Jotai；需要时间旅行、复杂中间件、严格规范的大型团队选 Redux Toolkit；Vue 项目用 Pinia。

## 优势与局限

- ✅ 集中管理状态，调试可追踪（Redux DevTools）
- ✅ 解耦组件与数据来源，便于测试
- ✅ 可插入中间件（日志、持久化、异步编排）
- ❌ 引入额外抽象与样板代码
- ❌ 全局化过度会让本应内聚的状态散落各处
- ❌ Context + useReducer 大规模使用易出现性能问题

## 应用场景

- 跨页面共享的用户信息、主题、权限
- 复杂表单、向导、购物车等需要多组件协作的状态
- 离线缓存、撤销重做、时间旅行调试
- 与服务端数据同步（结合 React Query / SWR 做"服务端状态"）

## 相关概念

- [[concepts/react/hooks-internals]]: useState / useReducer 是 React 内置状态管理基础
- [[concepts/react/context-propagation]]: Context 的更新传播机制及其性能陷阱
- [[concepts/framework/reactivity-system]]: Pinia / MobX 等基于响应式系统实现 Store
