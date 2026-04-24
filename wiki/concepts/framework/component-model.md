---
title: "组件模型"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [framework, component, lifecycle, props, frontend]
status: active
sources: []
---

# 组件模型

## 定义

组件模型（Component Model）是现代前端框架组织 UI 的基础抽象：把界面拆分成**封装了视图、数据和行为**的可复用单元，通过组合形成完整应用。组件模型规定了组件之间如何传参、通信、共享逻辑、管理生命周期，以及如何处理内容投影。React 的函数组件 + Hooks、Vue 的单文件组件、Web Components、Angular 的指令体系都是不同形态的组件模型。

## 工作原理

**Props 与 State**是组件的两类数据：Props 是父组件传入的只读输入，State 是组件内部可变的状态。"单一数据源 + 单向数据流"原则要求子组件不能直接修改 Props，要修改父组件状态必须通过事件回调向上通知（Props down, Events up）。

**通信方式**：

1. **父子**：Props 向下、回调函数或自定义事件向上
2. **兄弟**：通过共同父组件中转，或提升到全局状态
3. **跨层**：Context（React）/ Provide-Inject（Vue）避免逐层透传
4. **任意距离**：全局 Store（Redux/Pinia/Zustand）或事件总线

**生命周期**：类组件时代有 `componentDidMount` / `componentDidUpdate` / `componentWillUnmount` 等显式钩子；函数组件用 Hooks 把生命周期"按关注点"组合到 `useEffect` 中：

```jsx
function Timer() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>{n}</p>;
}
```

Vue 3 的 `setup` + 组合式 API 与之类似，`onMounted` / `onUnmounted` 成为可组合函数，`watch` / `watchEffect` 处理副作用。

**受控 vs 非受控组件**：受控组件的状态完全由父组件 Props 决定，事件回调通知变更（`<input value={v} onChange={...}/>`）；非受控组件由组件内部 DOM 自行维护状态，父组件通过 ref 读取（`<input defaultValue="..." ref={r}/>`）。表单库（Formik、React Hook Form）的差异本质就是受控/非受控的取舍。

**组合 vs 继承**：React 官方明确推荐"组合优于继承"，复用代码用自定义 Hook 或高阶组件，而非类继承。Vue 通过 mixins / 组合式 API 也走类似思路。

**Slot / children / 内容投影**：父组件可以把任意 UI 片段传给子组件作为占位符内容渲染。React 中通过 `children` 或具名 props 传递；Vue 用 `<slot>` 实现默认插槽、具名插槽、作用域插槽；Web Components 用原生 `<slot>` 元素。这是构建高复用组件库（Modal、Card、Layout）的关键能力。

```vue
<!-- Vue 作用域插槽 -->
<List :items="users">
  <template #default="{ item }">
    <UserCard :user="item" />
  </template>
</List>
```

## 优势与局限

- ✅ 封装与复用：组件即"小应用"，可独立开发、测试
- ✅ 关注点分离：模板/逻辑/样式聚合在同一处
- ✅ 类型友好：Props 可借助 TS 获得完整类型推导
- ❌ 组件粒度难以拿捏，过细产生"组件爆炸"
- ❌ 跨组件通信复杂场景需要额外状态管理方案
- ❌ 不同框架的组件互操作性差（Web Components 试图解决）

## 应用场景

- 业务组件库（Ant Design、Element Plus、shadcn/ui）
- 设计系统：跨产品共享一致 UI 与交互
- 微前端中独立开发可独立部署的功能模块
- 跨端复用：React Native / Taro 复用组件代码

## 相关概念

- [[concepts/react/hooks-internals]]: 函数组件依赖 Hooks 实现状态与生命周期
- [[concepts/framework/state-management]]: 跨组件状态共享需要状态管理方案
- [[concepts/framework/virtual-dom]]: 组件最终通过 VDOM 描述并渲染到真实 DOM
