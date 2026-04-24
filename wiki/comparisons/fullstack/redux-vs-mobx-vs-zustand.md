---
title: "Redux vs MobX vs Zustand"
type: comparison
created: 2026-04-02
updated: 2026-04-02
tags: [state-management, frontend, react, redux, mobx, zustand]
status: active
sources: []
---

# Redux vs MobX vs Zustand

Redux、MobX、Zustand 是 React 生态中最具代表性的三种状态管理范式：单向 Flux 数据流、响应式可观察对象、极简的 hooks-based store。它们对应不同年代的最佳实践，理解差异有助于在新项目中做出合适选择。

## 对比维度

| 维度 | Redux (RTK) | MobX | Zustand |
|------|-------------|------|---------|
| 范式 | 函数式 / 单向数据流 | 响应式 / OOP | 极简 hook + store |
| 状态可变性 | 不可变（Immer 协助） | 可变（自动追踪） | 可变（set 函数） |
| 样板代码 | 中（RTK 已大幅简化） | 少 | 极少 |
| 学习曲线 | 中（需理解 action/reducer/selector） | 中（装饰器 / observable 概念） | 极低（几乎就是 hook） |
| 体积（gzip） | ~12KB（RTK） | ~16KB | ~1KB |
| 异步处理 | createAsyncThunk / RTK Query | 直接在 action 内 await | 直接在 set 内 await |
| 中间件 | 强大（logger / saga / persist） | 较少 | 中间件机制简单 |
| DevTools | 极强（时间旅行调试） | 一般 | 接 Redux DevTools |
| TypeScript | 极佳（RTK 类型推导） | 良好 | 极佳 |
| React 外使用 | 可（store 独立） | 可 | 可 |
| 服务端渲染 | 良好 | 一般 | 良好 |
| 适用规模 | 中大型、强规范化 | 中型，OOP 风格团队 | 小到中型，追求轻量 |

## 分析

### Redux（Toolkit 时代）

Redux 的核心是单一 store + reducer 纯函数 + 不可变更新，配合 action 描述「发生了什么」。早期因 boilerplate 过重被诟病，但 **Redux Toolkit (RTK)** 引入 `createSlice`、`createAsyncThunk`、内置 Immer 后样板大幅减少；**RTK Query** 进一步把数据获取与缓存集成为开箱即用的方案。

优势：
- 严格的可预测性（纯函数 + 不可变）。
- 时间旅行调试（DevTools）几乎无敌。
- 大型团队的规范化效果好，状态变化可审计。

劣势：
- 仍比其他方案啰嗦。
- 对极简场景过度工程化。

### MobX

MobX 借鉴 Vue 的响应式思想：用 `observable` 装饰类属性，在 `observer` 组件中读取的值会自动建立依赖；属性变更时只重渲染相关组件。心智模型接近 OOP：状态就是带方法的 store 对象。

优势：
- 代码量少、表达力强，复杂表单与领域模型友好。
- 自动追踪依赖，无需手写 selector。

劣势：
- 隐式响应有时难调试，状态变更入口不明显。
- 与 React Server Components / Concurrent Rendering 协作不如不可变方案天然。
- 装饰器语法依赖 babel/TS 配置，工程链略显尴尬。

### Zustand

Zustand 是「2020 年代极简主义」的代表：一个 `create` 函数返回 hook，组件用 selector 订阅切片，无需 Provider。底层依赖 React 的 `useSyncExternalStore`，与 Concurrent Mode 兼容良好。

```ts
const useStore = create((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 }))
}))
```

优势：
- API 极简，几分钟上手。
- 体积小（~1KB），无 Provider 嵌套。
- 中间件支持 persist、devtools、immer，必要时仍可扩展。

劣势：
- 对超大型状态、强规范化、时间旅行调试需求支持不如 Redux。
- 异步逻辑组织全凭团队约定，无内建模式。

### 现代趋势：服务端状态 vs 客户端状态分离

近年共识：**服务端数据用 React Query / SWR / RTK Query，客户端 UI 状态用 Zustand / Jotai / useState**。把「请求状态、缓存、失效」交给专用库处理后，全局 state 库的复杂度与必要性大幅下降，这也是 Zustand 流行的重要背景。

## 结论

- **大型企业级、需要规范与可审计**：Redux Toolkit + RTK Query。
- **OOP 风格团队 / 复杂领域模型 / 强表单**：MobX。
- **中小型项目 / 追求轻量与简洁**：Zustand（+ React Query/SWR 处理服务端数据）。
- **极简全局状态**：Zustand 或 Jotai；很多项目其实只需 `useState + Context`。
- **现代默认推荐**：服务端状态用 React Query/SWR，客户端 UI 状态用 Zustand。

## 相关
- [[concepts/framework/state-management]]
- react query
