---
title: "Monorepo 单一仓库"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [methodology, tooling, build]
status: active
sources: []
---

# Monorepo 单一仓库

## 定义

Monorepo(Monolithic Repository,单一仓库)是把多个项目、多个包、甚至整个组织所有代码放入一个版本控制仓库统一管理的代码组织策略。与之相对的是 Polyrepo(每项目一仓库)。Monorepo 不等于"大单体"——仓库内部仍由多个独立可发布的包(package/module/app)组成,通过统一的工具链(Turborepo、Nx、Bazel、Lerna、pnpm workspace、Yarn workspaces)实现跨包依赖管理、增量构建、共享代码、原子化跨项目变更。Google、Meta、Microsoft、Uber、Airbnb 都采用 Monorepo。

## 工作原理

**1. 典型目录结构**

```
my-monorepo/
├── package.json              # 工作区根
├── pnpm-workspace.yaml       # 声明 packages 路径
├── turbo.json                # 任务流水线配置
├── apps/
│   ├── web/                  # Next.js 前端
│   ├── admin/                # 管理后台
│   └── api/                  # NestJS 后端
├── packages/
│   ├── ui/                   # 共享组件库
│   ├── config/               # 共享 ESLint/TS 配置
│   ├── utils/                # 工具函数
│   └── types/                # 共享 TS 类型
└── tools/
    └── scripts/
```

**2. 工作区(Workspace)管理**

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// apps/web/package.json
{
  "dependencies": {
    "@my/ui": "workspace:*",
    "@my/utils": "workspace:*"
  }
}
```

`workspace:*` 协议让本地包符号链接而非走 npm 仓库,改动立即生效。

**3. 主流工具链对比**

| 工具 | 特点 |
|------|------|
| **pnpm workspace** | 包管理 + 硬链接节省磁盘,生态最轻 |
| **Yarn workspaces / Berry** | 老牌,Plug'n'Play 模式快 |
| **npm workspaces** | npm 7+ 内置,功能最少 |
| **Turborepo(Vercel)** | JS 友好,远程缓存,任务编排,易上手 |
| **Nx(Nrwl)** | 全功能,代码生成器、依赖图、插件丰富 |
| **Bazel(Google)** | 多语言、大规模,极陡学习曲线 |
| **Rush(Microsoft)** | 大规模、严格变更管理 |
| **Lerna** | 早期主力,现已被 Nx 收购重启 |

**4. 增量构建与缓存**

Turborepo / Nx 通过任务图 + 输入哈希实现:

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],     // 先构建依赖包
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": { "outputs": [] }
  }
}
```

```bash
turbo run build --filter=web      # 只构建 web 及其依赖
turbo run test --filter=...[main] # 只测试相对 main 分支变更影响的包
```

只有输入文件哈希变化的任务才重新执行,其余从本地或远程缓存恢复。CI 中可数小时缩短至数分钟。

**5. 跨包原子化变更**

Monorepo 最大魅力:**一次 PR 同时改 schema、后端 API、前端调用、共享类型、文档**,所有变更在同一提交,review 时上下文完整,CI 一次跑通。在 Polyrepo 下需要协调多个 PR 与发布顺序。

**6. 发布策略**

- **固定版本(Lockstep)**: 所有包共用一个版本号,如 React Native(简单)
- **独立版本(Independent)**: 每包独立版本,Changesets / Nx release 管理(灵活)

## 优势与局限

- ✅ 跨包变更原子化,重构成本大幅下降
- ✅ 共享代码、配置、工具链,减少重复
- ✅ 统一依赖版本,避免"依赖地狱"
- ✅ 增量构建 + 远程缓存大幅提速 CI
- ✅ 全局可见性,新人易理解整体架构
- ✅ 易于强制统一标准(lint、test、TS 配置)
- ❌ 仓库体积膨胀,克隆/索引慢(Git Sparse Checkout 缓解)
- ❌ 工具链复杂,配置门槛高
- ❌ 权限粒度难以细化到包(GitHub 仅到仓库级别)
- ❌ CI 时间随仓库增长,需缓存与并行优化
- ❌ 团队若不约束,容易演变成"巨型耦合"
- ❌ 大规模(10万+ 文件)需 Bazel 等工业级工具

## 应用场景

- **前端组件库 + 多应用**: 共享 UI、design system
- **全栈项目**: 前端 + 后端 + 共享类型(TS 端到端类型安全)
- **微前端 / 微服务**: 多应用统一构建发布
- **开源工具链**: Babel、Jest、Next.js、Vite 等都是 Monorepo
- **跨平台产品**: Web + Mobile + Desktop 共享业务逻辑
- **企业级代码平台**: 集团内多产品线复用

## 相关概念

- [[concepts/methodology/microservices]]: Monorepo 与微服务可共存(代码 mono,部署 multi)
- [[concepts/methodology/bff]]: BFF 与前端常放同 Monorepo
- [[concepts/methodology/design-patterns]]: 共享 packages 是模式落地的载体
- modular monolith: Monorepo 内部的模块化单体
- turborepo: JS 生态主流工具
- changesets: 独立版本发布管理
