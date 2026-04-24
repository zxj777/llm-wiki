---
title: "懒加载策略"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [performance, lazy-loading, images, code-splitting, frontend]
status: active
sources: []
---

# 懒加载策略

## 定义

懒加载（Lazy Loading）是一种将非关键资源的加载推迟到真正需要时再执行的优化策略，通过减少首屏需下载/解析的字节数与请求数，降低 LCP、TTI 与带宽消耗。它适用于图片、视频、第三方组件、路由模块、弹窗等场景，是现代前端性能优化的基础手段之一。

## 工作原理

**图片懒加载**：原生属性 `loading="lazy"` 由浏览器决定阈值（约视口下 1-3 屏外）。需要更精细控制时使用 `IntersectionObserver` 监听元素进入视口，再替换 `data-src` → `src`。配合 LQIP（Low Quality Image Placeholder）或 blur-up 占位减少视觉跳变。

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.src = e.target.dataset.src;
      io.unobserve(e.target);
    }
  });
}, { rootMargin: '200px' }); // 提前 200px 加载避免闪烁
document.querySelectorAll('img[data-src]').forEach(img => io.observe(img));
```

**组件懒加载**：React 通过 `React.lazy` + `<Suspense>` 实现按需加载子组件，Vue 用 `defineAsyncComponent`。打包器（webpack/vite）将动态 `import()` 拆为独立 chunk，按需加载。

```jsx
const HeavyChart = React.lazy(() => import('./HeavyChart'));
function Page() {
  return <Suspense fallback={<Skeleton />}><HeavyChart /></Suspense>;
}
```

**路由懒加载**：React Router / Vue Router 配合动态 import 按路由切分。

**列表场景**：数据量大时优先选无限滚动 + 虚拟列表；分页则适合需要 SEO/可定位的内容。

关键参数 `rootMargin`：提前于视口 N px 触发加载，避免用户滚到才发现仍在加载，权衡过早加载带来的浪费。

## 优势与局限

- ✅ 显著降低首屏字节数与请求数
- ✅ 改善 LCP、TTI、带宽成本
- ✅ 原生 API 已成熟，浏览器兼容性好
- ❌ 可能引起视觉跳变（CLS）
- ❌ SEO 场景需谨慎（爬虫不一定执行 JS）
- ❌ 过度懒加载导致滚动卡顿

## 应用场景

- 长图文/电商商品列表
- 后台管理系统多 Tab/路由
- 弹窗、Modal、富文本编辑器等重型组件
- 第三方 SDK（如地图、视频播放器）按需加载

## 相关概念

- [[concepts/engineering/code-splitting]]: 实现组件懒加载的打包基础
- [[concepts/performance/virtual-scrolling]]: 大列表的互补方案
- [[concepts/performance/image-optimization]]: 图片懒加载常与压缩格式配合
