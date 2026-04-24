---
title: "AST 与代码转换"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, ast, babel, swc, compiler, frontend]
status: active
sources: []
---

# AST 与代码转换

## 定义

AST（Abstract Syntax Tree，抽象语法树）是源代码的树形中间表示，每个节点对应一种语法结构（变量声明、函数调用、JSX 元素等）。**代码转换**指通过解析源码得到 AST、修改节点、再生成新代码的工程链路，是 Babel、TypeScript、ESLint、Prettier、SWC、PostCSS、Webpack Loader 等几乎所有现代前端工具的工作基础。理解 AST 让我们能编写自定义编译插件、Lint 规则、Codemod 重构脚本。

## 工作原理

代码转换的标准流程是 **Parse → Transform → Generate** 三步：

1. **Parse（解析）**：把源码字符串通过词法分析（Tokenize）切成 Token 流，再做语法分析构建 AST。Babel 用 `@babel/parser`，TS 用 `tsc` 自带的 parser，esbuild/SWC 用各自高速实现。
2. **Transform（转换）**：访问者（Visitor）模式遍历 AST，匹配特定节点类型并修改，可插入、删除、替换节点。
3. **Generate（生成）**：把修改后的 AST 还原成代码字符串，并可同步生成 SourceMap。

```js
// 源码
const x = 1 + 2;

// AST（简化）
{
  type: 'VariableDeclaration', kind: 'const',
  declarations: [{
    type: 'VariableDeclarator',
    id: { type: 'Identifier', name: 'x' },
    init: { type: 'BinaryExpression', operator: '+',
      left: { type: 'Literal', value: 1 },
      right: { type: 'Literal', value: 2 } }
  }]
}
```

**Babel Plugin 的 Visitor 模式**：插件返回一个对象，键是节点类型，值是回调。Babel 遍历到匹配节点时调用回调：

```js
module.exports = function () {
  return {
    visitor: {
      Identifier(path) {
        if (path.node.name === 'foo') path.node.name = 'bar';
      },
    },
  };
};
```

`path` 不仅是节点本身，还封装了父子关系、作用域、增删替换的方法（`path.replaceWith` / `path.remove` / `path.insertBefore`）。`@babel/types` 提供构造各种节点的工厂函数。Babel 的"预设（preset）"是一组插件的集合，如 `@babel/preset-env` 根据 `targets` 自动选择需要的语法降级与 polyfill。

**SWC / esbuild / Rspack** 把 parser 与 transformer 用 Rust / Go 重写，速度提升 10–100 倍，但插件生态弱于 Babel；SWC 已能用 Rust / WASM 写插件。Vite 默认用 esbuild 转换 TS/JSX，极致提速。

**典型应用**：

- **语法降级**：JSX → `createElement`、ES2024+ → ES5、TS → JS
- **自动 import**：发现使用了某 API（如 React 17+ 的 JSX 自动注入 `import { jsx }`）时自动加 import
- **国际化提取**：扫描代码中的中文字符串，自动提取到语言包并替换为 `t('key')`
- **代码混淆 / 压缩**：Terser / SWC Minify 在 AST 上做常量折叠、变量重命名、死代码删除
- **Codemod 重构**：jscodeshift 用 AST 转换批量改写代码，比正则可靠得多
- **Lint 规则**：ESLint 规则本质上是 AST Visitor，在特定模式上报告问题

```js
// 自动给 console.log 加文件名
visitor: {
  CallExpression(path) {
    if (path.node.callee.object?.name === 'console') {
      path.node.arguments.unshift(t.stringLiteral(state.filename));
    }
  },
}
```

调试 AST 的利器是 **AST Explorer**（astexplorer.net），可视化任意源码的 AST 并在线编写 transform。

## 优势与局限

- ✅ 比正则可靠，能精确理解代码结构
- ✅ 可自动化大规模重构与代码生成
- ✅ 是构建工具/Lint/格式化背后的统一基础
- ❌ 学习曲线陡，不同 parser 的节点结构有差异
- ❌ Babel 插件性能瓶颈，新一代 Rust 工具兼容性仍在追赶
- ❌ 类型相关的转换需要类型信息，纯 AST 不足

## 应用场景

- 编写 Babel / SWC / Vite / ESLint 插件
- 大型 codemod（类组件迁移到函数组件、API 升级）
- 自定义 DSL 编译（模板编译、SQL 生成）
- 静态分析与代码可视化（依赖图、调用图）

## 相关概念

- [[concepts/engineering/bundler-internals]]: 打包工具的 Loader / Plugin 普遍依赖 AST 转换
- [[concepts/framework/compile-vs-runtime]]: 编译时框架的核心是基于 AST 的代码生成
