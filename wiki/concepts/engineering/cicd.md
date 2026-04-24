---
title: "CI/CD 流水线"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, cicd, github-actions, deployment, devops, fullstack]
status: active
sources: []
---

# CI/CD 流水线

## 定义

CI（Continuous Integration，持续集成）是开发者频繁向主干合并代码、并通过自动化检查（lint、type-check、单测、构建）保证主干始终可发布的实践。CD 既可以指 Continuous **Delivery**（持续交付，自动构建出可发布产物，部署仍需人工触发）也可以指 Continuous **Deployment**（持续部署，每次合并后自动上线）。两者合称 CI/CD，是现代软件交付的基础设施，常用工具有 GitHub Actions、GitLab CI、CircleCI、Jenkins、ArgoCD。

## 工作原理

CI/CD 的核心是把"代码事件 → 自动化检查 → 部署"形成可追溯的流水线（Pipeline）。以 GitHub Actions 为例，结构是 **Workflow → Job → Step**：Workflow 由事件触发（push、pull_request、schedule、workflow_dispatch），包含多个 Job（可并行或依赖串行），每个 Job 在指定 runner 上按顺序执行 Steps（命令或 Action）。

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

**典型流水线阶段**（前端项目）：

1. **静态检查**：ESLint / Stylelint / Prettier check
2. **类型检查**：tsc --noEmit
3. **单测 + 集成测试**：Vitest / Jest + 覆盖率上报到 Codecov
4. **构建**：产出 dist
5. **E2E 测试**：Playwright / Cypress 在预览环境运行
6. **部署**：上传到 CDN / 触发平台（Vercel/Netlify/Cloudflare Pages）/ K8s rollout

**环境策略**：

- **dev**：开发分支自动部署，供开发自测
- **staging / preview**：每个 PR 自动部署预览环境（Vercel Preview Deployments、Netlify Deploy Previews），方便代码评审与产品验收
- **production**：合并到 main / 打 tag 后部署

**部署策略**（避免上线引发故障）：

- **蓝绿部署**：维护"蓝/绿"两套环境，新版本部署到空闲环境，验证 OK 后切流量
- **滚动部署**：逐批替换实例（Kubernetes Deployment 默认）
- **金丝雀部署**：先把新版本发给 1%/5%/20% 用户，监控指标无异常再放大
- **特性开关（Feature Flag）**：代码层面控制新功能开关，可独立于部署上下线

**最佳实践**：

- Lockfile 必须提交，CI 用 `--frozen-lockfile` 保证可复现
- 缓存依赖（`actions/setup-node` 的 cache 选项），减少 install 时间
- 长任务并行化，必要时矩阵构建（matrix）
- 密钥用 Secret 管理，绝不写入代码
- 失败可重试，但要记录失败原因避免"重试通过"掩盖 flaky 测试

## 优势与局限

- ✅ 主干始终可发布，降低集成风险
- ✅ 自动化测试与部署，减少人为失误
- ✅ 部署可追溯，回滚迅速
- ❌ 流水线本身需要持续维护（Action 版本、依赖、缓存）
- ❌ Flaky 测试会侵蚀团队对 CI 的信任
- ❌ 大型仓库 CI 时间长，需投入精力做增量与缓存

## 应用场景

- 开源库每次 PR 自动测试 + 多 Node 版本矩阵
- 业务前端每次合并自动部署到 Vercel/Netlify
- Monorepo 中按 affected 项目跑测试与构建
- 定时任务（每日依赖更新、安全扫描）

## 相关概念

- testing strategy: 测试金字塔的执行依赖 CI 流水线编排
- git workflow: 分支策略直接决定流水线触发与部署节奏
