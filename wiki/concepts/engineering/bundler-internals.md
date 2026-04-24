---
title: "打包工具原理"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, webpack, vite, bundler, build, frontend]
status: active
sources: []
---

# 打包工具原理

## 定义

打包工具（Bundler）把源代码（JS/TS/CSS/图片等）通过依赖分析、转换、合并，输出浏览器可直接执行的产物。它解决了模块化在浏览器侧不易部署、跨环境语法兼容、资源体积优化等问题。主流工具有 Webpack、Rollup、Vite、Parcel、esbuild、Turbopack、Rspack。它们的差异主要在依赖分析方式、转换方式（JS 还是原生语言）、开发与生产模式策略上。

## 工作原理

**Webpack** 基于 **依赖图（Dependency Graph）**：从 Entry 出发，递归解析每个模块的 `import` / `require`，对每个模块用 **Loader** 链转换（如 `babel-loader` 处理 JS、`css-loader` 处理 CSS），最后由 **Plugin** 在构建生命周期的各个钩子上介入（HtmlWebpackPlugin 注入 script 标签、DefinePlugin 注入环境变量），最终把所有模块包装成 `__webpack_require__` 的运行时模块系统并 Bundle 输出。

Webpack 的扩展性来自 **Tapable** 钩子库：核心 Compiler 和 Compilation 暴露大量同步/异步钩子，Plugin 通过 `tap` 注册回调介入。Loader 链是**从右往左**执行：`['style-loader', 'css-loader', 'sass-loader']` 表示先 sass→css，再 css→JS，再注入 style 标签。

```js
module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'babel-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [new HtmlWebpackPlugin()],
};
```

**Vite** 在开发与生产模式上分而治之。**开发模式**：利用现代浏览器原生支持 ES Modules，不做打包，请求哪个模块就**按需转换并返回**。`node_modules` 中的 CommonJS 依赖用 esbuild 预构建为 ESM 并强缓存。结果是冷启动从几十秒降到秒级、HMR 极快。**生产模式**：基于 Rollup 打包，因为 Rollup 的产物对 Tree Shaking、Code Splitting 友好，体积更可控。

```js
// 浏览器直接发起的 ESM 请求
import { Foo } from '/src/Foo.vue';  // Vite dev server 即时编译并返回
```

**esbuild** 用 Go 编写，单进程内做完所有转换且高度并行，速度比 Babel/Webpack 快 10–100 倍，是 Vite 预构建、tsup 等工具的底层。**Turbopack**（Next.js 新打包器）/ **Rspack**（字节，基于 Rust）则是 Webpack 的高性能重写，兼容 Webpack 生态但速度大幅提升。**Rollup** 最适合打包库（输出 ESM/CJS/UMD 多格式，Tree Shaking 干净）。

选型对比：

- **应用开发**：Vite（小到中型）、Rspack/Turbopack（大型）、Webpack（既有项目/复杂自定义）
- **库开发**：Rollup、tsup、unbuild
- **快速脚本/CLI 工具**：esbuild、tsx

## 优势与局限

- ✅ Webpack：生态最成熟、Plugin/Loader 极丰富、支持几乎所有场景
- ✅ Vite：开发体验极佳，配置简洁
- ✅ esbuild/Rust 系：构建极快
- ❌ Webpack：配置复杂、冷启动慢、HMR 较慢
- ❌ Vite：生产用 Rollup 与开发用 ESM 偶有"开发能跑生产挂"的不一致
- ❌ 新工具：生态与稳定性不如 Webpack

## 应用场景

- 单页应用打包（React/Vue/Svelte）
- 库的多格式发布（Rollup/tsup）
- 大型 monorepo 的增量构建（Turbopack/Rspack/Nx）
- Serverless/Edge 函数打包（esbuild）

## 相关概念

- [[concepts/engineering/tree-shaking]]: 打包工具决定 Tree Shaking 的实现质量
- [[concepts/engineering/code-splitting]]: 由打包工具的 chunk 策略决定
- [[concepts/js/module-system]]: 打包工具在 ESM/CJS/UMD 之间转换并最终输出
