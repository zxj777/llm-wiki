---
title: "TypeScript 类型系统"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [typescript, types, frontend]
status: active
sources: []
---

# TypeScript 类型系统

## 定义
TypeScript 是 JavaScript 的超集，在编译期为 JS 添加静态类型检查。它的类型系统采用**结构子类型（Structural Subtyping）**——只要形状（属性与方法）兼容即视为同类型，与 Java/C# 的名义类型不同。TS 类型在编译后被完全擦除，不影响运行时行为。其核心目标是：在不牺牲 JS 灵活性的前提下，提供 IDE 智能补全、重构安全和早期错误发现，并通过强大的类型表达力（泛型、条件类型、模板字面量类型）建模复杂的库 API。

## 工作原理
**类型推断**：变量声明、函数返回值、解构赋值都能自动推断类型，多数场景无需显式标注。

**结构类型**：
```ts
interface Point { x: number; y: number; }
function dist(p: Point) { return Math.hypot(p.x, p.y); }
dist({ x: 3, y: 4, name: 'a' }); // OK，多余属性兼容
```

**泛型**：参数化类型，提供类型层面的复用。

```ts
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const ret = {} as Pick<T, K>;
  for (const k of keys) ret[k] = obj[k];
  return ret;
}
```

**联合 / 交叉 / 字面量类型**：`A | B`（其中之一）、`A & B`（同时是）、`'red' | 'blue'`（字符串字面量）。配合**类型守卫**（`typeof`、`instanceof`、自定义 `x is T`）实现窄化。

**条件类型与 infer**：在类型层面进行条件判断与模式匹配。

```ts
type ReturnType<T> = T extends (...args: any) => infer R ? R : never;
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
```

**Mapped Types & 工具类型**：`Partial<T>`、`Required<T>`、`Readonly<T>`、`Pick`、`Omit`、`Record`、`Exclude`、`Extract`、`ReturnType`、`Parameters` 等内置工具类型基于映射类型实现。

**模板字面量类型**：在类型层面操作字符串，常用于事件名、API 路径推导。
```ts
type Event = `on${Capitalize<'click' | 'hover'>}`; // 'onClick' | 'onHover'
```

## 优势与局限
- ✅ 编译期发现类型错误，降低线上 bug
- ✅ IDE 自动补全、跳转、重构精准
- ✅ 类型即文档，提升大型项目可维护性
- ✅ 类型层强大表达力（泛型/条件/模板）
- ❌ 学习曲线较陡，复杂类型可读性差
- ❌ `any/as` 滥用会绕过保护
- ❌ 编译耗时随类型复杂度增长，需配合 `tsc --build` 或 Vite/swc/esbuild

## 应用场景
- **大型应用**：长期维护的前后端项目
- **库 API 设计**：通过类型表达精确契约（如 zod、tRPC）
- **重构**：依赖类型快速定位影响面
- **配置/路由建模**：模板字面量类型派生 URL/状态机

## 相关概念
- [[concepts/js/module-system]]: TS 沿用 ESM 模块语法并增强类型导入导出
