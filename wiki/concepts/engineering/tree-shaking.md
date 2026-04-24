---
title: "Tree Shaking"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, tree-shaking, bundler, optimization, frontend]
status: active
sources: []
---

# Tree Shaking

## 定义

Tree Shaking 是基于 ES Modules 静态结构特性、在打包阶段**移除未使用代码**（Dead Code Elimination）的优化技术。"摇树"形象地描述了把死分支从依赖树上抖落的过程。它依赖 ESM 的 `import` / `export` 语句必须出现在模块顶层、且模块名是字符串字面量这一静态约束，使得打包工具在不执行代码的前提下就能精确分析哪些导出被用到、哪些没用，从而安全地删除未使用的导出。

## 工作原理

Tree Shaking 通常分两阶段：

1. **标记阶段**：构建工具（Webpack/Rollup）解析每个模块，记录所有导出与每个导入的引用关系，给每个导出打上"used / unused"标签
2. **Shake 阶段**：压缩器（Terser/SWC Minify/esbuild）根据标记移除未引用的导出与其依赖代码

```js
// utils.js
export function used() { return 1; }
export function unused() { return 2; }   // 未被任何文件 import → 被摇掉

// app.js
import { used } from './utils';
console.log(used());
```

**为什么 ESM 可以而 CJS 不行**：CJS 的 `require` 是运行时的函数调用，参数可以是变量；`module.exports` 可以在任意位置动态修改。这些动态特性让静态分析无能为力。ESM 的 `import` 是声明式的、必须出现在顶层、模块名必须是字符串字面量，于是可以纯静态地构建依赖图。

```js
// CJS: 无法 Tree Shake
const m = require(getName());
m.foo();
```

**副作用（side effects）问题**：有些模块仅靠 import 就会执行副作用（如 `import 'core-js/stable'` 注入 polyfill、`import './styles.css'` 注入样式）。打包器必须保守地保留这些"看似没用但实际有副作用"的代码。`package.json` 中的 `sideEffects` 字段告诉打包器哪些文件**没有副作用**可以放心摇：

```json
{
  "sideEffects": false,
  // 或精确白名单
  "sideEffects": ["*.css", "./src/polyfill.js"]
}
```

**常见失效场景**：

- 库以 CJS 发布（如某些旧的 lodash 版本）→ 改用 `lodash-es`
- `import * as utils from './utils'` 命名空间导入，用了一两个但全保留
- 类的方法即使没用也无法摇掉（无法静态判断哪个实例会调用哪个方法）
- Babel 把 ESM 编译成了 CJS（要把 `@babel/preset-env` 的 `modules` 设为 `false`）
- 副作用未声明，打包器保守保留
- 动态 import 路径（`import(\`./pages/\${name}\`)`）只能整体保留

实际项目中，`bundle-analyzer` 可以可视化最终产物的体积构成，验证 Tree Shaking 是否生效。

## 优势与局限

- ✅ 显著减少 bundle 体积（尤其工具库场景，如 lodash-es）
- ✅ 完全发生在构建期，运行时零成本
- ✅ 与 Code Splitting 叠加效果更好
- ❌ 依赖库必须以 ESM 发布
- ❌ 副作用代码、动态特性会让 Tree Shaking 失效
- ❌ 类方法、对象属性级别的摇树能力有限

## 应用场景

- 工具库使用场景（lodash-es、date-fns、ramda）
- 大型 UI 库按需引入组件（Ant Design、Element Plus）
- 移除开发/调试代码（用 `__DEV__` 常量配合 DefinePlugin）
- 多端构建中按平台剔除无关代码

## 相关概念

- [[concepts/js/module-system]]: ESM 的静态特性是 Tree Shaking 的前提
- [[concepts/engineering/bundler-internals]]: Tree Shaking 由打包工具与压缩器协作完成
