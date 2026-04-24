---
title: "Monorepo 架构"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, monorepo, pnpm, turborepo, architecture, fullstack]
status: active
sources: []
---

# Monorepo 架构

## 定义

Monorepo（Monolithic Repository）是把多个相关项目（应用、库、工具）放在**同一个版本仓库**中管理的代码组织方式。与 Polyrepo（每个项目一个仓库）相对。Google、Meta、Microsoft 等公司的代码仓库都是大型 Monorepo。在前端生态，Babel、React、Next.js、Vue 等开源项目以及大量企业级中后台都采用 Monorepo 配合 pnpm/Yarn workspace + Turborepo/Nx 实现。

## 工作原理

**优势来源**：

- **代码共享**：业务组件、工具函数、类型定义可以以包形式被多个应用 import，无需发布私有 npm
- **原子化提交**：跨项目的修改（如同时改库与使用方）能在一次 commit/PR 中完成
- **统一工具链**：一套 lint、format、test、CI 配置覆盖所有子项目
- **重构友好**：跨包改 API 时编辑器和编译器能立即发现所有 caller

**代价**：仓库体积膨胀、CI 时间增加、权限控制复杂、Git 操作变慢。

**包管理层 — pnpm workspace**：在根 `package.json` 添加 `workspaces` 字段，pnpm/Yarn 把每个子包当作"本地依赖"通过**符号链接**联通。pnpm 进一步用全局 CAS（Content-Addressable Store）+ symlink 让所有项目共享一份磁盘存储，安装快且省空间。

```json
// pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// apps/web/package.json
{ "dependencies": { "@org/ui": "workspace:*" } }
```

**任务编排层 — Turborepo**：把 lint/test/build 等任务表达为有依赖关系的图，按拓扑排序并行执行；通过指纹（输入文件 hash + 命令）做**本地缓存**和**远程缓存**（Vercel Remote Cache），未变更的包直接复用上次结果。CI 可达到秒级。

```json
// turbo.json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["build"] }
  }
}
```

**Nx**（更"重"的方案）：除任务编排和缓存外，提供代码生成器（`nx generate @nx/react:app`）、依赖图可视化、**affected** 命令（只对受改动影响的项目运行任务）、模块边界规则（限制 lib 之间互相引用）。适合大型企业。

**典型目录结构**：

```
my-monorepo/
  apps/
    web/        # Next.js 应用
    admin/     # React 中后台
  packages/
    ui/        # 共享组件库
    utils/     # 工具函数
    config/    # ESLint/TS 共享配置
```

**适用场景**：跨项目共享大量代码、多团队需要协同发布、希望统一工程规范。**不适用**：完全独立无关的项目、各项目技术栈差异极大、无法接受 CI/CD 改造成本。

## 优势与局限

- ✅ 跨包重构与原子提交体验极佳
- ✅ 配合 Turborepo/Nx 后 CI 可极快
- ✅ 工具链与质量标准统一
- ❌ 仓库体积、Git 操作延迟随规模增加
- ❌ 权限粒度只能到仓库级（除非用 CODEOWNERS）
- ❌ 工程化门槛高，新人上手成本大

## 应用场景

- 设计系统 + 多个消费应用
- 微前端的子应用集中管理
- 开源框架（React、Vue、Babel、Next.js）
- 企业级中台：API 客户端、UI 库、工具库统一管理

## 相关概念

- [[concepts/engineering/package-management]]: workspace 协议是 monorepo 的基础
- [[concepts/engineering/cicd]]: Monorepo 的 CI 必须做"按需构建"才能扛住规模
