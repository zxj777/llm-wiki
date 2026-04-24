---
title: "Webpack vs Vite"
type: comparison
created: 2026-04-02
updated: 2026-04-02
tags: [build-tools, frontend, webpack, vite, hmr]
status: active
sources: []
---

# Webpack vs Vite

Webpack 与 Vite 是当下前端工程中最具代表性的两种构建工具范式。Webpack 自 2014 年起几乎主导了整个 JavaScript 模块化打包时代，而 Vite 则在 2020 年由尤雨溪基于浏览器原生 ESM 与 esbuild 重新设计开发体验。两者本质代表着「打包优先」与「按需编译」两种哲学。

## 对比维度

| 维度 | Webpack | Vite |
|------|---------|------|
| 开发模式 | 启动前打包整个依赖图 | 启动即服务，按需编译 |
| 底层引擎 | JavaScript（Webpack 自身） + 各种 loader | esbuild（Go，开发期）+ Rollup（生产期） |
| 冷启动速度 | 项目越大越慢，常见 10s–60s | 通常 < 1s，几乎与项目规模无关 |
| HMR 速度 | 模块越多越慢，需重建依赖图 | 基于 ESM，仅失效单个模块，毫秒级 |
| 生产构建 | Webpack 自身打包 | Rollup 打包（产物体积通常更小） |
| 配置复杂度 | 高，loader/plugin 概念较多 | 低，约定大于配置，开箱即用 |
| 生态成熟度 | 极成熟，几乎覆盖所有场景 | 快速增长，覆盖主流框架 |
| TS / JSX 支持 | 需 ts-loader / babel-loader | 原生支持（esbuild 转译） |
| CSS / 资源处理 | loader 链 | 内置 PostCSS / CSS Modules / 静态资源 |
| 旧浏览器兼容 | 强（可输出 ES5） | 需 @vitejs/plugin-legacy |
| 适用规模 | 任意规模，尤其大型遗留项目 | 中小型新项目最佳，大型项目逐步成熟 |

## 分析

### 构建机制差异

Webpack 在启动 dev server 前必须遍历整个依赖图，将所有模块（含 node_modules）打包成内存中的 bundle，再交给浏览器。这种「先打包，后服务」的方式在项目膨胀后会出现明显的冷启动延迟。

Vite 则利用了现代浏览器对 `<script type="module">` 的原生支持：开发时浏览器直接请求源文件，Vite 服务器仅在请求到达时按需用 esbuild 即时转译。依赖（node_modules）则用 esbuild 预打包成单个 ESM 文件以减少请求数。这种「按需编译」让冷启动几乎与项目规模无关。

### HMR 与开发体验

Webpack 的 HMR 需要维护并更新模块依赖图，模块越多更新链越长。Vite 的 HMR 基于 ESM 模块边界，更新时只让对应模块失效并重新请求，复杂度恒定。对于体量超过几百个模块的项目，差异极为显著。

### 生产构建

Vite 在生产环境放弃 esbuild 而选用 Rollup，原因是 Rollup 在 tree-shaking、代码分割、CSS code-splitting 上更成熟。Webpack 的产物可控性极强，但配置成本高；Vite 默认即可输出体积合理、按路由分包的产物。

### 生态与迁移成本

Webpack 拥有十年沉淀的 loader/plugin 生态，几乎能解决任何边缘需求（特殊资源、Module Federation、复杂 polyfill 链）。Vite 生态以插件兼容 Rollup 为主，主流场景齐全，但深度自定义场景仍可能需要手写插件。

## 结论

- **新项目 / 现代浏览器目标**：优先选择 Vite，开发体验和默认配置远胜 Webpack。
- **大型遗留项目**：Webpack 仍是稳妥选择，迁移成本可能高于收益。
- **微前端 / Module Federation**：Webpack 5 原生支持，Vite 通过插件方案仍在演进。
- **库开发**：可直接用 Rollup 或 tsup；Vite 也提供 library mode。
- **追求极致冷启动**：Vite；**追求极致产物可控性**：Webpack。

## 相关
- [[entities/fullstack/vite]]
- [[entities/fullstack/webpack]]
