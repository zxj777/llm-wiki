---
title: "npm vs Yarn vs pnpm"
type: comparison
created: 2026-04-02
updated: 2026-04-02
tags: [package-manager, npm, yarn, pnpm, tooling]
status: active
sources: []
---

# npm vs Yarn vs pnpm

npm、Yarn、pnpm 是 Node.js 生态中三大包管理器。它们解决相同的问题（依赖解析、安装、锁定、脚本运行），但在磁盘占用、安装速度、monorepo 支持与依赖严格性上有显著差异。

## 对比维度

| 维度 | npm | Yarn (Classic 1.x / Berry 2+) | pnpm |
|------|-----|-------------------------------|------|
| 安装速度（冷） | 中 | 快（Yarn 1）/ 极快（Berry PnP） | 极快 |
| 安装速度（热缓存） | 中 | 快 | 极快（硬链接，不拷贝） |
| 磁盘占用 | 高（每项目重复） | 高 | 极低（全局 store + 硬链接） |
| node_modules 结构 | 扁平（hoisting） | 扁平（hoisting） | 嵌套符号链接（严格） |
| 幽灵依赖（phantom deps） | 常见 | 常见 | 默认禁止（严格模式） |
| 锁文件 | package-lock.json | yarn.lock | pnpm-lock.yaml |
| Workspace（monorepo） | 支持（npm 7+） | 优秀（Yarn 1 起就有） | 优秀（推荐） |
| Plug'n'Play (PnP) | ❌ | ✅ Yarn Berry | ❌（但有类似严格性） |
| 内置脚本运行 | npm run | yarn / yarn run | pnpm run / pnpm dlx |
| 离线模式 | 较弱 | 强 | 强（全局 store） |
| 安全审计 | npm audit | yarn audit | pnpm audit |
| Node 默认捆绑 | ✅ | ❌ | ❌ |
| 生态兼容 | 100% | 99%（Berry 偶有边缘问题） | 99%（严格性偶遇兼容问题） |

## 分析

### 依赖结构与「幽灵依赖」

npm 与 Yarn Classic 都使用 **flattening / hoisting**：把依赖尽可能拉平到 `node_modules` 顶层，以避免重复。代价是 **幽灵依赖**——你能 `import` 一个并未在 `package.json` 声明的包，仅因为它是某个依赖的间接依赖。这在重构、升级时常导致难以诊断的错误。

pnpm 采用完全不同的策略：所有真实依赖存在全局 store（`~/.pnpm-store`），项目中的 `node_modules/.pnpm/` 是硬链接副本，对外只暴露 `package.json` 直接声明的依赖（通过符号链接）。这意味着：
- 同一版本的包在磁盘上只占一份；
- 无法 `import` 未声明的依赖（避免幽灵依赖）；
- 安装速度极快（只需建链接，不复制文件）。

### 速度

冷安装：pnpm > Yarn Berry > Yarn Classic > npm（差距大约 2–3×）。
热安装（已有缓存）：pnpm 因硬链接几乎瞬间完成。

> 实测在大型 monorepo 中，pnpm 可比 npm 节省 50–70% 的 CI 安装时间与数十 GB 的磁盘占用。

### Monorepo / Workspace

- **npm workspaces**：npm 7+ 内置，基础功能可用，但依赖管理较粗。
- **Yarn workspaces**：成熟稳定，配合 `yarn workspaces foreach` 与 `nohoist` 使用广泛。
- **pnpm workspaces**：与 Turborepo / Nx 配合极佳；严格依赖隔离让 monorepo 中的包边界清晰；`pnpm -r` 批量执行命令体验顺手。

实际中，pnpm 已成为大型 monorepo（Vue、Vite、Next.js examples、Prisma 等）的事实标准。

### Yarn Berry 与 PnP

Yarn 2+（Berry）引入 **Plug'n'Play**：彻底放弃 `node_modules`，用单一 `.pnp.cjs` 直接告诉 Node 解析每个 import。优点是更快、更严格；缺点是部分工具链（旧打包器、IDE 插件）需要适配，导致迁移阻力大。许多团队最终选择保留 `nodeLinker: node-modules` 模式以兼容生态。

### 安全与可重现

三者都提供锁文件保证可重现安装。npm 的 `package-lock.json` 经过多版本演进已较稳定；pnpm 的 lockfile 包含更详细的依赖图；Yarn Berry 的 `yarn.lock` 与配置链路最完整。CI 中应使用 `npm ci` / `pnpm install --frozen-lockfile` / `yarn install --immutable` 保证不修改锁文件。

## 结论

- **新项目 / monorepo / 节省磁盘 / 严格依赖**：pnpm（强烈推荐）。
- **个人小项目 / 跟随 Node 默认 / 不想多装工具**：npm。
- **遗留 Yarn Classic 项目**：保持 Yarn 1，迁移成本与收益需评估。
- **追求极致严格 + 愿意付出生态迁移成本**：Yarn Berry + PnP。
- **CI 配置**：始终用 `--frozen-lockfile` / `npm ci` 保证可重现构建。

## 相关
- [[concepts/engineering/package-management]]
- [[concepts/engineering/monorepo]]
