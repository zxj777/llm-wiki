---
title: "渲染模式 SSR/CSR/SSG/ISR"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [framework, ssr, csr, ssg, nextjs, frontend]
status: active
sources: []
---

# 渲染模式 SSR/CSR/SSG/ISR

## 定义

现代前端的渲染模式按"HTML 在何时由谁生成"可以分为四类：**CSR**（客户端渲染，浏览器运行 JS 生成 DOM）、**SSR**（服务端渲染，请求时在服务器生成 HTML）、**SSG**（静态站点生成，构建时预生成 HTML）、**ISR**（增量静态再生，SSG + 按需重生成）。Next.js、Nuxt、Remix、Astro 等框架允许在同一应用内按页面或组件粒度混合使用这些模式，以在性能、SEO、新鲜度、成本之间取得平衡。

## 工作原理

**CSR（Client-Side Rendering）**：服务器返回近乎空的 HTML（只有挂载点 `<div id="app">` 和 JS 引用），浏览器下载并执行 JS bundle，运行框架渲染出 DOM。优点是后端简单、可做 CDN 静态托管；缺点是首屏白屏时间长（FCP/LCP 差）、爬虫看不到内容（SEO 差）、对低端设备不友好。

**SSR（Server-Side Rendering）**：每次请求时服务器执行组件代码生成完整 HTML 字符串返回。浏览器立即看到内容，随后下载 JS 进行 **Hydration**——复用已有 DOM、绑定事件、激活响应式。优点是首屏快、SEO 好；缺点是服务器压力大、TTFB 受后端影响、Hydration 期间页面"看得见但点不动"。

```js
// 简化的 SSR
import { renderToString } from 'react-dom/server';
app.get('*', (req, res) => {
  const html = renderToString(<App url={req.url} />);
  res.send(`<!doctype html><div id="app">${html}</div><script src="/bundle.js"></script>`);
});
```

**SSG（Static Site Generation）**：构建时遍历所有路由，预先渲染成 HTML 文件部署到 CDN。访问时直接返回静态文件，速度极快、成本极低、可缓存于全球边缘节点。缺点是不能展示实时数据，且页面数量极大时构建时间爆炸。适合博客、文档、营销页。

**ISR（Incremental Static Regeneration）**：SSG 的演进。Next.js 的 `revalidate` 参数让静态页面在指定时间后被访问时**异步重新生成**，下次访问拿到新版本。也支持按需 `revalidatePath()` 触发。兼顾 SSG 的极速访问和数据的合理新鲜度。

**Streaming SSR + React 18 Suspense**：传统 SSR 必须等所有数据准备好才能返回 HTML。React 18 的 `renderToPipeableStream` 配合 `Suspense` 可以**流式输出**——先发送骨架，慢的部分用 `<Suspense fallback>` 占位，数据就绪后继续追加 HTML 片段并替换占位。**Selective Hydration** 让 Hydration 也按片段并行进行。

```jsx
<Suspense fallback={<Skeleton />}>
  <SlowDataComponent />
</Suspense>
```

混合策略：Next.js App Router 默认所有组件是 **Server Components**（在服务端运行，不进入 bundle），需要交互的组件标 `"use client"` 切到客户端；页面级别可以选择 SSG / SSR / ISR。Astro 走 **Islands Architecture**，整体 SSG 但每个交互组件是独立的"岛屿"按需 Hydration。

## 优势与局限

- ✅ CSR：后端零负担、易部署、强交互应用合适
- ✅ SSR：首屏快、SEO 好、动态数据
- ✅ SSG：极致性能与成本、强可缓存
- ✅ ISR：兼顾性能与数据新鲜度
- ❌ CSR：SEO 与首屏差
- ❌ SSR：服务器开销、Hydration 成本
- ❌ SSG：构建时间随页面数线性增长

## 应用场景

- 仪表盘、复杂 Web App：CSR
- 电商详情页、新闻、社区：SSR / ISR
- 博客、文档、Landing Page：SSG
- 大型内容站点：SSG + ISR + 部分 SSR 的混合

## 相关概念

- [[topics/react/ssr-hydration]]: Hydration 是 SSR / SSG 落地的关键步骤与性能瓶颈
- [[concepts/performance/core-web-vitals]]: 不同渲染模式直接影响 LCP / FID / CLS
- [[concepts/framework/router-internals]]: 路由系统需要在客户端与服务端共用一套规则
