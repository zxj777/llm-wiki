---
title: 工程化与架构
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, build-tools, architecture, fullstack]
status: active
sources: []
---

# 工程化与架构

## 概述

工程化是把「能跑的代码」变成「能多人长期协作维护、能稳定交付到生产」的系统性能力。它横跨前后端：构建工具、包管理、Monorepo、CI/CD、设计模式、AST 转换、Module Federation 等议题在前端和后端都有相似的解决方案与权衡。

构建工具的核心问题是「依赖图分析 + 转换 + 产物优化」，从 Webpack 到 Rollup 再到 Vite/esbuild/Rspack/Turbopack，差异主要在 dev/build 性能、产物质量与生态。包管理（npm/yarn/pnpm）解决依赖解析、幽灵依赖、磁盘占用问题，Monorepo（Nx/Turborepo/pnpm workspace）则解决多包仓库的依赖复用与构建编排。

架构层面，BFF（Backend For Frontend）、Module Federation、AST 自动化重构等模式让大型项目可以拆分、解耦、协同演进。

## 核心概念

- [[concepts/engineering/bundler-internals]]: 依赖图、Loader、Plugin、Chunk
- [[concepts/engineering/tree-shaking]]: 静态分析 + sideEffects
- [[concepts/engineering/code-splitting]]: 路由级、组件级、Vendor 拆分
- [[concepts/engineering/monorepo]]: pnpm workspace / Nx / Turborepo
- [[concepts/engineering/cicd]]: GitHub Actions / GitLab CI 流水线设计
- [[concepts/engineering/design-patterns]]: 工厂、单例、观察者、责任链等在前端的运用
- [[concepts/engineering/bff-pattern]]: BFF 与聚合层
- [[concepts/engineering/module-federation]]: 运行时模块共享
- [[concepts/engineering/ast-transform]]: Babel / SWC 插件、Codemod
- [[concepts/engineering/package-management]]: 依赖解析、lockfile、phantom dependency

## 关联板块

- 前端框架：[[topics/fullstack/framework]]
- 性能：[[topics/fullstack/performance]]（构建产物直接影响性能）
- 后端：[[topics/fullstack/backend]]、[[topics/fullstack/nodejs]]（Node 工具链与服务部署同源）

## 推荐学习路径

**初级**
1. 理解 npm/pnpm/yarn 基本命令与 lockfile 作用
2. 用 Vite 或 Webpack 配出一个项目，理解 Loader/Plugin
3. 配置一条最简 CI（lint + test + build）

**进阶**
1. [[concepts/engineering/bundler-internals]]：依赖图、Chunk、Hash
2. [[concepts/engineering/tree-shaking]] + [[concepts/engineering/code-splitting]]
3. [[concepts/engineering/monorepo]]：pnpm workspace + Turborepo 实战
4. [[concepts/engineering/design-patterns]]：在业务代码中识别与重构

**深入**
1. [[concepts/engineering/ast-transform]]：写一个 Babel/SWC 插件做自动化迁移
2. [[concepts/engineering/module-federation]]：跨应用模块共享的版本管理
3. [[concepts/engineering/bff-pattern]]：BFF 在多端聚合中的取舍
4. 自建脚手架与企业级 CI/CD 平台

## 开放问题

- Rust 工具链（SWC/Rspack/Turbopack/Biome）何时能完全替代 JS 工具链？
- Module Federation 与 RSC 在「跨应用代码共享」上的边界如何划分？
