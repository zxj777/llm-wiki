---
title: "Webpack"
type: entity
created: 2026-04-02
updated: 2026-04-02
tags: [build-tool, frontend, webpack, bundler]
status: active
sources: []
---

# Webpack

Webpack 是由 **Tobias Koppers** 于 2012 年发起的 JavaScript 静态模块打包器（module bundler）。它在 2014–2020 年间几乎主导了整个前端工程化生态，让「一切皆模块」（包括 JS、CSS、图片、字体）成为现代 Web 工程的标配心智模型。即使在 [[entities/fullstack/vite]] 等新一代工具崛起后，Webpack 仍是大量企业级与遗留项目的核心构建工具。

## 概述

Webpack 的本质是 **递归依赖图遍历器**：从一个或多个入口（entry）出发，沿 `import`/`require` 解析模块依赖，将所有模块按规则转化（loader）并组合（plugin）成一个或多个产物 bundle。它解决的核心问题是：

- 让浏览器能够运行模块化的 JavaScript（在 ESM 普及前尤为关键）；
- 把任意类型资源（CSS、图片、字体、SVG、WASM）纳入依赖图，统一处理；
- 通过 code splitting、tree shaking、lazy loading 优化体积与加载性能；
- 通过 HMR（Hot Module Replacement）大幅改善开发体验。

Webpack 5（2020）带来了多项重要演进：内置持久化缓存、原生 Module Federation（微前端事实标准）、改进的 tree-shaking、对 Web Workers 与 WASM 更好的支持、不再自动 polyfill Node 内置模块。

## 关键特性或贡献

- **Loader 系统**：把任意类型文件转化为 JS 模块（`babel-loader`、`ts-loader`、`css-loader`、`style-loader`、`file-loader`、`asset/resource` 等）。
- **Plugin 系统**：基于 Tapable 的钩子机制，几乎能介入构建生命周期任意阶段（`HtmlWebpackPlugin`、`MiniCssExtractPlugin`、`DefinePlugin`、`SplitChunksPlugin`）。
- **Code Splitting**：通过动态 `import()` 与 `SplitChunksPlugin` 实现按路由 / 按需分包，是 SPA 性能优化基石。
- **Tree Shaking**：基于 ES Module 静态分析剔除未使用代码（需配合 `sideEffects: false`）。
- **HMR**：模块级热更新，无需刷新页面即可看到代码变化。
- **Module Federation（v5）**：允许多个独立部署的应用在运行时共享模块，是 **微前端** 与多团队协作的事实标准方案；这是 Vite 等新工具至今仍难完全替代 Webpack 的关键场景。
- **持久化缓存**：v5 引入文件系统缓存，二次构建时间显著缩短。
- **Asset Modules**：v5 内置资源处理类型（`asset/resource`、`asset/inline`、`asset/source`），减少对 file-loader / url-loader 的依赖。
- **生态深度**：十年沉淀的 loader/plugin 数量远超任何其他打包器，几乎能覆盖所有边缘场景。

## 关联

- [[entities/fullstack/vite]]：Webpack 的主要竞争者；详细对比见 [[comparisons/fullstack/webpack-vs-vite]]。
- [[entities/fullstack/nodejs]]：Webpack 运行环境。
- [[entities/fullstack/typescript]]：通常通过 `ts-loader` 或 `babel-loader` + `@babel/preset-typescript` 集成。
- **Babel**：与 Webpack 长期紧密配合，负责语法转换。
- **Rollup**：库构建的对位选择，更适合输出 ESM 库；Vite 生产构建即基于 Rollup。
- **Module Federation**：Webpack 5 原生能力，被广泛用于微前端架构。
- **Turbopack**：Vercel 推出的 Rust 编写的下一代打包器，定位接替 Webpack（尤其在 Next.js 场景）。
- **Rspack**：字节跳动用 Rust 重写的 Webpack-兼容打包器，在保留 Webpack 配置兼容性的同时提供数倍性能。
