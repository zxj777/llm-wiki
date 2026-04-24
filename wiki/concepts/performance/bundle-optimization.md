---
title: "Bundle 体积优化"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [performance, bundle, webpack, tree-shaking, frontend]
status: active
sources: []
---

# Bundle 体积优化

## 定义

Bundle 体积优化指减少最终下发到浏览器的 JavaScript/CSS 字节数与请求数的工程实践。Bundle 越大，下载、解析、编译、执行成本越高，直接拉长 TTI 与 INP。优化手段贯穿依赖选型、打包配置、按需加载与压缩传输四个阶段。

## 工作原理

**第一步：分析现状**。`webpack-bundle-analyzer`、`rollup-plugin-visualizer`、`source-map-explorer` 可视化每个模块占比。`bundlephobia.com` 在引入新依赖前评估代价。

**第二步：Tree Shaking**。打包器基于 ES Module 静态分析删除未使用导出。前提：依赖必须是 ESM、`package.json` 标注 `sideEffects: false`、避免 `import * as` 或副作用调用。

**第三步：代码分割**。按路由拆分（`React.lazy` / `import()`），按组件拆分（弹窗、富编辑器），按依赖拆分（vendor chunk）。Webpack `splitChunks` 自动提取共享模块。

```js
// 动态导入大依赖
button.onclick = async () => {
  const { jsPDF } = await import('jspdf');
  new jsPDF().text('Hello', 10, 10).save('a.pdf');
};
```

**第四步：依赖替换**。`moment` (290kb) → `date-fns` / `dayjs` (2-7kb)；`lodash` 全量 → `lodash-es` 按需 import；`antd`/`element-plus` 配合 `babel-plugin-import` 或自带的 ESM 入口实现按需加载，避免引入整个 UI 库。

**第五步：压缩与传输**。Terser 压缩 JS、cssnano 压缩 CSS、`gzip` 平均压缩 70%、Brotli 比 gzip 再小 15-20%（CDN/Nginx 开启）。HTTP/2 多路复用降低多 chunk 的连接成本。

**第六步：externals + CDN**。React、Vue 等公共库通过外部 CDN 加载并 `externals` 排除出 bundle，命中浏览器/CDN 缓存。

```js
// vite.config
build: { rollupOptions: { external: ['react'], output: { manualChunks: { vendor: ['lodash-es'] } } } }
```

## 优势与局限

- ✅ 直接降低首屏 JS 字节
- ✅ 优化 TTI、INP、移动端体验
- ✅ 工具链成熟，自动化程度高
- ❌ 过度分包导致请求数飙升
- ❌ Tree Shaking 受副作用与 CJS 依赖限制
- ❌ 需持续监控防止劣化

## 应用场景

- 中后台 SPA 体积治理
- 移动端 H5 弱网优化
- 多产品共用 SDK 的瘦身
- 性能预算（performance budget）落地

## 相关概念

- [[concepts/engineering/tree-shaking]]: 体积优化的核心机制
- [[concepts/engineering/code-splitting]]: 按需加载的实现基础
