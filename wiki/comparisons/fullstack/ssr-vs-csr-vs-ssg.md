---
title: "SSR vs CSR vs SSG"
type: comparison
created: 2026-04-02
updated: 2026-04-02
tags: [rendering, frontend, ssr, csr, ssg, nextjs]
status: active
sources: []
---

# SSR vs CSR vs SSG

服务端渲染（SSR）、客户端渲染（CSR）与静态站点生成（SSG）是现代 Web 应用三种主流渲染策略。它们在首屏速度、SEO、交互可达时间（TTI）、服务器成本与内容时效之间做出不同权衡。Next.js、Nuxt、Remix、Astro 等框架的核心价值之一就是让开发者按页面甚至组件粒度灵活选择。

## 对比维度

| 维度 | CSR | SSR | SSG |
|------|-----|-----|-----|
| HTML 生成时机 | 浏览器运行时 | 每次请求时（服务器） | 构建时（一次） |
| 首屏内容（FCP） | 慢（先空白，等 JS） | 快（HTML 直出） | 极快（CDN 直出） |
| 可交互时间（TTI） | 同 FCP 之后 | 需 hydration | 需 hydration |
| SEO | 差（爬虫需执行 JS） | 好 | 好 |
| 服务器成本 | 极低（静态托管） | 较高（每请求渲染） | 极低 |
| 内容时效性 | 实时（客户端拉数据） | 实时 | 静态（需重建或 ISR） |
| 个性化内容 | 容易（客户端） | 容易（服务器） | 困难（除非 hydrate 后取数据） |
| CDN 友好度 | 高 | 中（需边缘渲染或缓存） | 极高 |
| 复杂度 | 低 | 高（同构、状态序列化） | 中 |
| 典型场景 | SaaS 后台、强交互应用 | 电商、内容站、个性化首页 | 博客、文档、营销页 |

## 分析

### CSR：客户端渲染

CSR 是 SPA 的默认形态：服务器仅返回一个空 HTML 壳与 JS bundle，浏览器执行 JS 后才渲染界面并异步取数据。优点是部署简单（静态托管 + API），适合强交互、强状态的「应用型」产品（如管理后台、IDE）。缺点：
- **首屏长时间白屏**：TTFB 后还需下载、解析、执行大体积 JS。
- **SEO 不友好**：搜索引擎对 JS 渲染支持有限。
- **低端设备慢**：JS 解析与执行在客户端的代价不可忽视。

### SSR：服务端渲染

服务器在每次请求时执行 React/Vue 组件树，生成完整 HTML 返回给浏览器，浏览器随后下载 JS 进行 **hydration**（让静态 HTML 接管事件，变成可交互应用）。优势：
- 首屏极快、内容立即可见，对 SEO 与社交分享卡片友好。
- 个性化（基于 cookie / header）可在服务端完成。

代价：
- 服务器需持续执行渲染工作，规模化成本高。
- Hydration 体积仍大，过大时反而出现「能看不能点」的卡顿（TTI 差）。
- 需要同构代码处理（避免使用 `window`）、错误处理更复杂。

React Server Components、Streaming SSR、Partial Hydration（Astro 的 Islands）等是对 SSR 的进一步优化。

### SSG：静态站点生成

构建阶段对每条路由预渲染为 HTML，部署到 CDN。访问时几乎零延迟、零服务端成本。最适合内容更新频率低的场景：博客、文档、营销页、产品介绍。

挑战：
- 内容变更需重新构建（成千上万页面会很慢）。
- 个性化困难。
- **ISR（Incremental Static Regeneration，Next.js）** 与 **DPR（Distributed Persistent Rendering）** 是折中方案：保留静态优势的同时支持按需重建。

### 现代趋势：混合渲染

主流框架（Next.js App Router、Remix、Nuxt 3、Astro）已支持页面级甚至组件级混合：营销页 SSG、个性化首页 SSR、后台 CSR、动态片段用 RSC + Streaming。「单一渲染策略」正逐渐让位于「按场景选择」。

## 结论

- **博客 / 文档 / 营销页**：SSG（+ 必要时 ISR）。
- **电商 / 内容门户 / SEO 关键页**：SSR（或 SSG + 边缘个性化）。
- **管理后台 / 强交互 SaaS**：CSR 足矣。
- **对首屏与 SEO 都敏感的产品**：Next.js / Remix 的 SSR + RSC + Streaming。
- **重 SEO 且静态内容多 + 少量交互**：Astro 的 Islands 架构。
- 默认建议：内容驱动用 SSG/SSR；应用驱动用 CSR；不确定时用支持混合的框架。

## 相关
- [[concepts/react/hydration]]
- react server components
