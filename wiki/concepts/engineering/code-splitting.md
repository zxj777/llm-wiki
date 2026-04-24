---
title: "代码分割"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, code-splitting, lazy-loading, webpack, frontend]
status: active
sources: []
---

# 代码分割

## 定义

代码分割（Code Splitting）是把整个应用 bundle 拆分成多个较小 chunk、按需加载的优化技术。它直接服务于"减小初始下载体积、加快首屏渲染"的目标，让用户只为当前页面需要的代码付费，进入新页面或触发新功能时再加载对应代码。常见拆分维度有：多入口拆分、路由级拆分、组件级懒加载、第三方依赖拆分。

## 工作原理

**多入口（Multi-Entry）**：在 Webpack 配置多个 entry，输出多个独立 bundle，适合多页应用或对外提供多个入口产物的场景。

**动态 import()**：ECMAScript 标准的动态导入语法，调用时返回 Promise。打包工具识别 `import()` 调用并自动把其参数指向的模块拆成独立 chunk，运行时通过 JSONP 或原生 `<link rel="modulepreload">` 异步加载。

```js
button.addEventListener('click', async () => {
  const { renderChart } = await import('./chart');
  renderChart();
});
```

**React.lazy + Suspense**：React 内置的懒加载 API，把组件用 `lazy(() => import('./Heavy'))` 包裹后，配合 `<Suspense fallback={...}>` 在加载期间展示占位 UI：

```jsx
const Settings = React.lazy(() => import('./Settings'));
<Suspense fallback={<Spinner />}>
  <Settings />
</Suspense>
```

**路由级分割**是最实用的策略：每个路由对应一个 chunk，访问到才加载。React Router、Vue Router、Next.js 等都默认或鼓励这种模式。

```js
const routes = [
  { path: '/dashboard', component: () => import('./pages/Dashboard') },
  { path: '/settings', component: () => import('./pages/Settings') },
];
```

**SplitChunksPlugin**（Webpack 4+ 内置）按规则把公共依赖抽出为独立 chunk：

- `vendors` chunk：把 `node_modules` 中的依赖单独打包，业务代码变更不影响这个 chunk 的缓存
- `common` chunk：被多处引用但不在 node_modules 的代码
- 自定义规则：按 chunk 大小、最小重复次数、组名进行细粒度控制

```js
optimization: {
  splitChunks: {
    cacheGroups: {
      vendor: { test: /node_modules/, name: 'vendors', chunks: 'all' },
    },
  },
}
```

**预加载提示**：`<link rel="preload">`（当前页很快用到，高优先级）、`<link rel="prefetch">`（未来可能用到，浏览器空闲时下载）。Webpack 提供 `import(/* webpackPreload: true */ ...)` 与 `webpackPrefetch` 魔法注释自动注入这些标签。

实践注意：

- chunk 太多反而增加 HTTP 请求开销（HTTP/2 已大幅缓解但仍存在）
- 关键路径（首屏必须）的代码不应被分割
- 使用 bundle-analyzer 验证拆分效果

## 优势与局限

- ✅ 减小首屏 bundle，提升 LCP
- ✅ 资源按路由/功能划分，缓存命中率高
- ✅ 与 Tree Shaking 叠加效果更佳
- ❌ chunk 切换时有加载延迟，需要 Skeleton/Spinner 兜底
- ❌ 拆分粒度难以拿捏，过细会爆增请求数
- ❌ SSR 场景需要服务端也能识别异步组件并预先 push

## 应用场景

- SPA 路由级懒加载
- 大型组件按需加载（图表、富文本编辑器、地图）
- 多语言资源按当前语言加载
- 仅在特定环境/角色才需要的代码（管理员后台）

## 相关概念

- [[concepts/engineering/bundler-internals]]: 代码分割由打包器的 chunk 策略实现
- [[concepts/performance/lazy-loading]]: 代码分割是组件懒加载的基础设施
