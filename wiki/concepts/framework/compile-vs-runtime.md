---
title: "编译时 vs 运行时框架"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [framework, compiler, runtime, svelte, react, vue, frontend]
status: active
sources: []
---

# 编译时 vs 运行时框架

## 定义

前端框架按"工作发生的时间"可以分为**运行时框架**（Runtime）、**编译时框架**（Compile-time）和**编译+运行时混合**三类。运行时框架把大部分逻辑（如 VDOM Diff、依赖追踪）放到浏览器执行；编译时框架在构建阶段把组件代码编译成针对性的、最优的命令式 DOM 操作；混合方案则在编译期做静态分析与优化提示，运行时按提示走更快路径。这条分类直接影响 Bundle 体积、首屏性能和调试体验。

## 工作原理

**纯运行时（React 16-17 经典模式）**：JSX 被 Babel 编译为 `React.createElement` 调用，运行时构建 VDOM 树，由 React 在浏览器内完成 Diff、调度、Patch。框架本身是一个相对固定的 runtime（约 40KB），所有应用共用同一份。

```jsx
// 源码
function App() { return <h1>{title}</h1>; }
// 编译后（仅展开 JSX，逻辑仍在运行时）
function App() { return React.createElement('h1', null, title); }
```

**纯编译时（Svelte）**：编译器读取 `.svelte` 文件，分析依赖关系，直接产出针对每个组件的命令式 DOM 操作代码。运行时不需要 VDOM 也不需要 Diff，"组件即最优的更新函数"。Svelte 的运行时只有几 KB，且单页应用越大节省越明显。

```js
// Svelte 编译产物（伪代码）
function update(ctx, dirty) {
  if (dirty & 1) text.data = ctx.title;
}
```

**编译 + 运行时混合（Vue 3、Solid、Qwik）**：Vue 3 模板编译器在构建期识别静态节点和动态节点，生成带 PatchFlag 的 render 函数；运行时仍有响应式系统和精简的 VDOM，但只 Diff 被标记为动态的部分。Solid 编译 JSX 为细粒度 Signal 订阅，没有 VDOM 但保留响应式 runtime。**React Server Components / Next.js App Router** 把组件分为 Server Component（编译/运行在服务端，不进入 Bundle）和 Client Component（运行时），是 React 生态向"更多编译期决策"靠拢的标志。

权衡维度：

- **Bundle 体积**：编译时方案更小（无 runtime），但每个组件代码可能更长；运行时方案 runtime 固定但应用越大越摊薄
- **性能上限**：编译时直接操作 DOM，理论更快；运行时受 VDOM Diff 开销限制
- **灵活性**：运行时能轻松实现高阶组件、动态组件；编译时做静态分析时遇到动态特性会退化
- **调试体验**：运行时可以在 DevTools 看到组件树/状态；编译产物离源码远，调试需 sourcemap

## 优势与局限

- ✅ 编译时：极致体积与运行性能，适合性能敏感场景
- ✅ 运行时：动态性强，生态成熟，工具链丰富
- ✅ 混合：兼顾两者，适合大型应用
- ❌ 编译时：调试困难，编译器本身复杂，跨端能力受限
- ❌ 运行时：bundle 中始终包含框架 runtime
- ❌ 混合：心智模型更复杂（哪些在编译期、哪些在运行时）

## 应用场景

- Svelte / SvelteKit：内容站、营销页、小型应用
- Solid / Qwik：追求极致首屏与可恢复性的现代框架
- React Server Components：服务端渲染密集的复杂应用
- Vue 3：在保持渐进式哲学的同时享受编译优化

## 相关概念

- [[concepts/framework/virtual-dom]]: 运行时框架的核心机制，编译时方案试图绕开它
- [[concepts/engineering/ast-transform]]: 编译时框架的基础是 AST 分析与转换
- [[concepts/framework/reactivity-system]]: 与编译期分析结合可实现细粒度更新
