---
title: "虚拟 DOM"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [framework, virtual-dom, react, vue, frontend]
status: active
sources: []
---

# 虚拟 DOM

## 定义

虚拟 DOM（Virtual DOM，VDOM）是用 JavaScript 对象树来描述真实 DOM 结构的一种技术。框架在内存中维护一棵 VDOM 树，当状态变化时先生成新的 VDOM 树，与旧树通过 Diff 算法比较出最小差异，再批量地把这些差异 Patch 到真实 DOM 上。它的核心目的是将命令式 DOM 操作抽象为声明式 UI 描述，并通过批量更新降低操作真实 DOM 的次数与代价。

## 工作原理

VDOM 节点通常是形如 `{ type, props, children }` 的普通对象，由 `createElement`（或 JSX 编译产物）生成。每次组件状态变化，都会重新执行 render 函数得到一棵新的 VDOM 树，然后与上一次保存的旧树做 Diff。

朴素的两棵树 Diff 是 O(n³) 的，无法用于真实场景。React/Vue 都引入了三个启发式假设把它降到 O(n)：

1. **同层比较**：只在同一层级内对比节点，不做跨层移动；跨层移动按"删除+新增"处理。
2. **类型不同直接替换**：节点 type 不同（如 `div` → `span`，或两个不同的组件）直接卸载旧子树、挂载新子树，不再深入比较。
3. **key 复用**：列表渲染必须给 key，框架据此判断"同一个节点是否只是位置移动"，避免错误销毁与重建。

```js
// 简化的 VDOM 节点
const vnode = {
  type: 'ul',
  props: { className: 'list' },
  children: [
    { type: 'li', props: { key: 'a' }, children: ['A'] },
    { type: 'li', props: { key: 'b' }, children: ['B'] },
  ],
};
```

Diff 完成后进入 Patch 阶段，把"插入/删除/移动/属性更新/文本更新"这些副作用应用到真实 DOM。React 16 之后引入 **Fiber 架构**，把 VDOM 协调过程拆成可中断的工作单元（链表结构 + 双缓冲），用于实现时间分片和并发模式。Vue 3 则在编译期做了大量优化：**静态提升**把不变的节点提到 render 函数外只创建一次；**Block Tree / PatchFlags** 给动态节点打上标记，运行时只 Diff 这些动态节点，跳过静态部分。

```jsx
// JSX 编译后
const tree = React.createElement('div', { id: 'app' },
  React.createElement('h1', null, title)
);
```

## 优势与局限

- ✅ 声明式 UI，开发心智负担低
- ✅ 跨平台抽象（React Native、小程序、SSR 都基于 VDOM）
- ✅ 批量更新，避免频繁触发 reflow/repaint
- ❌ 额外的内存占用（一棵 JS 对象树）和 Diff 计算开销
- ❌ 极端性能场景仍可能不如手写 DOM 操作或编译时方案（如 Svelte）
- ❌ 需要 key 等约定，否则列表更新可能出错

## 应用场景

- React、Vue、Preact、Inferno 等主流框架的核心机制
- 跨端渲染：React Native、Taro、Remax 把 VDOM 映射到原生或小程序节点
- SSR / SSG：服务端把 VDOM 序列化为 HTML 字符串
- 测试工具：基于 VDOM 做无浏览器的快照与断言

## 相关概念

- [[concepts/react/fiber-architecture]]: React 对 VDOM 协调过程的重新设计，支持可中断渲染
- [[concepts/framework/reactivity-system]]: 响应式系统是 VDOM 的替代/补充思路，Vue 把两者结合
- [[concepts/framework/compile-vs-runtime]]: VDOM 是典型的运行时方案，与 Svelte 等编译时方案形成对照
