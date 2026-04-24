---
title: "Vite"
type: entity
created: 2026-04-02
updated: 2026-04-02
tags: [build-tool, frontend, vite, esm, esbuild]
status: active
sources: []
---

# Vite

Vite（法语「快」之意，发音 /vit/）是由 Vue.js 作者 **尤雨溪（Evan You）** 于 2020 年发起的下一代前端构建工具。它的核心创新在于充分利用现代浏览器对原生 ESM（ECMAScript Modules）的支持，把传统打包式开发服务器换成「按需编译 + 即时服务」的架构，使开发体验与项目规模解耦。

## 概述

Vite 的设计可拆为两条主线：
- **开发期（dev server）**：基于 [[entities/fullstack/nodejs]] 的轻量 HTTP 服务，浏览器以 ESM 直接请求源码，Vite 用 **esbuild**（Go 编写）即时转译 TS/JSX。依赖（node_modules）则用 esbuild 预打包成 ESM 单文件，减少请求瀑布。
- **生产期（build）**：放弃 esbuild，改用 **Rollup** 输出体积更小、tree-shaking 更彻底、支持高级代码分割与 CSS code-splitting 的产物。

这种「开发与生产用不同引擎」的混合策略让 Vite 在两端都拿到当前生态最优解，而非在性能与产物质量之间妥协。

Vite 的成功让「开发服务器与打包器分离」、「ESM-first」成为新一代工具的共识，催生了 SvelteKit、Nuxt 3、Remix（部分支持）、Astro、SolidStart、Qwik 等框架的底层选择。截至 2026 年，Vite 已成为新建前端项目的事实默认工具。

## 关键特性或贡献

- **冷启动几乎不随项目规模变慢**：得益于按需编译，初始化时间通常 < 1 秒。
- **极速 HMR**：基于 ESM 模块边界精确失效，更新时间复杂度恒定，与项目大小无关。
- **零配置开箱即用**：原生支持 TypeScript、JSX/TSX、Vue SFC、CSS Modules、PostCSS、CSS 预处理器、静态资源、JSON 等。
- **Rollup 兼容的插件 API**：复用 Rollup 庞大生态；Vite 自己的插件钩子在 Rollup 钩子之上扩展。
- **SSR 支持**：内置 `ssrLoadModule`、`createServer({ middlewareMode })`，是 Nuxt 3、SvelteKit、Astro、Remix 的底层基础。
- **Library Mode**：`vite build --lib` 可方便地构建库（产出 ESM + CJS + dts，配合 Rollup）。
- **Vitest**：基于 Vite 的测试框架，复用相同的转译 pipeline，比 Jest 快得多。
- **Environment API（Vite 5+）**：解耦客户端、SSR、Worker 多种构建环境，使框架作者更易构建复杂同构应用。
- **Rolldown（进行中）**：基于 Rust 的 Rollup 重写，未来计划替换 Vite 内部的 Rollup 与 esbuild，进一步统一与提速。

## 关联

- [[entities/fullstack/webpack]]：Vite 的主要竞争者与对比对象，详见 [[comparisons/fullstack/webpack-vs-vite]]。
- [[entities/fullstack/nodejs]]：Vite 的运行时基础。
- [[entities/fullstack/typescript]]：Vite 内置 TS 转译（仅转译，不做类型检查；类型检查仍依赖 `tsc --noEmit`）。
- **esbuild**：Vite 开发期与依赖预打包所用的高速转译器（Go 实现）。
- **Rollup**：Vite 生产构建底层；Vite 的插件 API 即扩展自 Rollup。
- **Rolldown**：未来用 Rust 重写 Rollup 的项目，由 Vite 团队主导。
- **Vitest**：与 Vite 共享配置与转译管线的现代测试框架。
- **Nuxt 3 / SvelteKit / Astro / Remix / SolidStart**：构建在 Vite 之上的元框架。
