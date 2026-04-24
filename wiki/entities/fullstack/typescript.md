---
title: "TypeScript"
type: entity
created: 2026-04-02
updated: 2026-04-02
tags: [language, typescript, types, frontend, backend]
status: active
sources: []
---

# TypeScript

TypeScript 是由 **Microsoft** 于 2012 年发布、由 **Anders Hejlsberg**（C# 与 Delphi 之父）主导设计的开源编程语言。它是 JavaScript 的严格超集，在 JS 之上叠加可选的、结构化的（structural）静态类型系统，编译后产出标准 JavaScript。截至 2026 年，TypeScript 已成为前端与 Node.js 生态的事实默认语言；几乎所有主流框架（React、Vue、Angular、Next.js、Nuxt、Svelte）与库都以 TS 优先发布。

## 概述

TypeScript 的设计哲学有几个关键定位：

- **JavaScript 的超集**：任何合法 JS 都是合法 TS；类型仅在编译期存在，运行时为纯 JS。
- **结构化类型（structural typing）**：类型兼容性基于「结构形状」而非「显式声明」，与 Java/C# 的标称类型（nominal typing）不同。
- **强大的类型推导**：大多数情况下无需显式标注；类型可由表达式形态推导。
- **渐进式采用**：可通过 `// @ts-check`、`.d.ts`、`any`、`unknown` 等机制平滑迁移现有 JS 项目。
- **不增加运行时**：与 Flow、Dart、Reason 不同，TS 编译产物即标准 JS，零运行时开销。

它在工程上带来的核心价值不只是「捕获 bug」，更是 **大型代码库的可维护性、IDE 智能化、API 自描述与重构信心**。在多人协作、长期演进的项目中，TS 的收益几乎是决定性的。

## 关键特性或贡献

- **类型推导（Type Inference）**：从赋值、上下文、控制流推导类型，最小化标注负担。
- **泛型（Generics）**：为函数、类、接口提供参数化类型能力，是构建可复用类型安全 API 的基石。
- **联合 / 交叉类型与窄化（Narrowing）**：`A | B`、`A & B` 与 `typeof`、`in`、`instanceof`、自定义 type guard 共同构成强大的控制流类型系统。
- **条件类型与映射类型**：`T extends U ? X : Y`、`{ [K in keyof T]: ... }` 是类型层「函数式编程」的核心，也是 `Partial`、`Pick`、`Omit`、`Awaited` 等内置工具类型的基础。
- **Template Literal Types（v4.1）**：在类型层进行字符串拼接与模式匹配，让 API 路径、事件名、SQL 等可类型化。
- **`unknown` / `never` / `satisfies`**：现代 TS 提倡用 `unknown` 取代 `any`、`satisfies` 在不丢推导的前提下做约束。
- **声明文件（.d.ts）与 DefinitelyTyped**：为无类型 JS 库提供类型补充；几乎所有主流 JS 库都已有官方或社区 typings。
- **结构化类型契约**：API 边界、组件 props、状态形状均可被精确表达，配合 IDE 的跳转、补全、重命名能力大幅提升开发效率。
- **生态联动**：[[entities/fullstack/prisma]] 的类型安全数据库访问、tRPC 的端到端类型安全、Zod 的运行时 schema → 类型派生，都是 TS 类型系统赋能的现代范式。
- **官方 Native 移植（进行中）**：2025 年起，TypeScript 团队启动用 Go 重写编译器（Project Corsa）的工作，目标是 10× 编译速度，解决大型项目类型检查慢的痛点。

## 关联

- [[entities/fullstack/nodejs]]：TS 在服务端的主要运行环境。
- [[entities/fullstack/vite]]、[[entities/fullstack/webpack]]：均原生或通过 loader 支持 TS（Vite 默认仅转译；类型检查需配合 `tsc --noEmit`）。
- [[entities/fullstack/prisma]]：通过代码生成提供数据库 schema → TS 类型的强类型映射，是 TS 在后端价值的典型案例。
- **JavaScript / ECMAScript**：TS 的超集对象；TS 的语言演进始终保持与 ECMAScript 提案的兼容。
- **tsc**：TypeScript 官方编译器；同时承担类型检查与（可选的）转译。
- **esbuild / SWC / Babel**：常用的 TS 转译器（仅去类型，不做类型检查），速度远快于 tsc。
- **DefinitelyTyped (`@types/*`)**：庞大的社区类型仓库。
- **Zod / Valibot / ArkType**：运行时 schema 库，可派生 TS 类型，弥补 TS 仅编译期生效的局限。
- **tRPC**：端到端类型安全的 RPC 框架，是 TS 类型系统跨前后端共享的极致体现。
