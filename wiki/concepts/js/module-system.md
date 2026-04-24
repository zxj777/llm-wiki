---
title: "模块系统"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, esm, commonjs, modules, frontend]
status: active
sources: []
---

# 模块系统

## 定义
模块系统用于将 JavaScript 代码拆分为可复用、可独立加载的单元，并明确声明依赖关系。JavaScript 历史上经历了多种模块规范：CommonJS（Node.js 同步加载）、AMD（浏览器异步）、UMD（兼容封装）、最终在 ES2015 标准化为 ES Modules（ESM）。理解 CJS 与 ESM 的差异是写好现代 JS 工程、配置打包工具与处理互操作问题的基础。

## 工作原理
**CommonJS（CJS）**：Node.js 默认模块格式，使用 `require/module.exports`。特点：
- **运行时同步加载**：`require` 在执行时读文件并求值
- **导出值的拷贝**（基本类型）或引用（对象）
- **动态**：路径可以是变量，可在条件分支里 `require`
- 不支持 Tree Shaking（静态分析困难）

```js
// math.js
module.exports = { add: (a, b) => a + b };
// app.js
const { add } = require('./math');
```

**ES Modules（ESM）**：标准模块系统，使用 `import/export`。特点：
- **静态结构**：导入导出在解析阶段确定，支持 Tree Shaking
- **导出绑定的实时引用**（live binding），不是值拷贝
- **异步加载**（浏览器中默认 defer 行为）
- 支持顶层 `await`
- 严格模式默认开启，`this` 为 `undefined`

```js
// math.js
export const add = (a, b) => a + b;
export default class Calc {}
// app.js
import Calc, { add } from './math.js';
const mod = await import('./feat.js'); // 动态导入
```

**关键差异**：
| 维度 | CJS | ESM |
|------|-----|-----|
| 加载时机 | 运行时 | 编译时（静态） |
| 导出语义 | 值拷贝 | 实时绑定 |
| 顶层 await | 否 | 是 |
| Tree Shaking | 困难 | 友好 |
| 循环依赖 | 返回部分导出 | 通过未初始化的绑定 |
| `this` | `module.exports` | `undefined` |

**互操作**：Node.js 通过 `package.json` 的 `"type": "module"` 与 `.mjs/.cjs` 后缀区分。ESM 可 `import` CJS（`default` 取 `module.exports`），CJS 仅能用动态 `import()` 加载 ESM。打包工具（webpack/Rollup/Vite/esbuild）会做格式转换。

## 优势与局限
- ✅ ESM 标准化，浏览器和 Node 通用
- ✅ 静态结构利于优化（Tree Shaking、按需加载、并行加载）
- ✅ 模块作用域避免全局污染
- ❌ CJS 与 ESM 互操作存在边界 case（默认导出、命名空间）
- ❌ 浏览器 ESM 直接加载存在请求瀑布，仍需打包工具
- ❌ 历史遗留代码混用多种规范，迁移成本高

## 应用场景
- **库开发**：同时输出 ESM + CJS 双格式（`exports` 字段）
- **应用打包**：Vite/webpack 基于 ESM 进行依赖分析与代码分割
- **服务端**：Node.js 14+ 原生支持 ESM
- **动态加载**：路由级代码分割、插件系统

## 相关概念
- [[concepts/engineering/bundler-internals]]: 打包器以模块图为核心
- [[concepts/engineering/tree-shaking]]: 静态 ESM 是 Tree Shaking 的前提
