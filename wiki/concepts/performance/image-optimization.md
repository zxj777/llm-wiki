---
title: "图片优化"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [performance, images, webp, avif, cdn, frontend]
status: active
sources: []
---

# 图片优化

## 定义

图片优化指通过格式转换、压缩、响应式加载、CDN 处理等手段，在保持视觉质量的前提下最小化图片字节数与渲染开销。由于图片通常占 Web 流量 50% 以上，且常常是 LCP 元素，图片优化是性能优化中投入产出比最高的环节之一。

## 工作原理

**格式选型**：JPEG（有损，照片）→ WebP 较 JPEG 小 25-35%，浏览器覆盖率 95%+；AVIF 在 WebP 基础上再小 20-30%，但编码慢、Safari 支持较新。SVG 适合图标，PNG 仅在需要透明且 WebP 不可用时使用。

**响应式图片**：`srcset` + `sizes` 让浏览器按设备 DPR 与视口选择最合适尺寸；`<picture>` 用于格式回退：

```html
<picture>
  <source type="image/avif" srcset="hero.avif" />
  <source type="image/webp" srcset="hero.webp" />
  <img src="hero.jpg" width="1200" height="600"
       srcset="hero-600.jpg 600w, hero-1200.jpg 1200w"
       sizes="(max-width: 768px) 100vw, 1200px"
       fetchpriority="high" alt="" />
</picture>
```

**压缩工具**：构建期使用 `imagemin`/`squoosh`/`sharp`；CI 中可设置质量门禁。

**CDN 按需生成**：Cloudflare Images、imgix、Vercel Image Optimization 等通过 URL 参数（宽度、格式、质量）实时生成衍生图，避免预生成所有尺寸。Next.js / Nuxt Image 组件内置该能力。

**显式尺寸**：`width`/`height`（或 CSS `aspect-ratio`）让浏览器在加载前预留空间，避免 CLS。

**优先级提示**：`fetchpriority="high"` 提升首屏 LCP 图优先级；`loading="lazy"` 仅用于折叠下方图片，绝不能加在 LCP 图上。

```js
// Sharp 服务端转 AVIF/WebP
await sharp(input).resize(1200).avif({ quality: 50 }).toFile('out.avif');
```

## 优势与局限

- ✅ 大幅降低带宽与 LCP
- ✅ 现代格式视觉质量更优
- ✅ CDN 方案运维成本低
- ❌ AVIF 编码慢，构建期耗时
- ❌ 多格式备选增加 HTML 复杂度
- ❌ 第三方 CDN 引入额外费用与依赖

## 应用场景

- 电商商品图、Banner、Hero 图
- 媒体/博客文章配图
- 用户上传场景（头像、UGC 图片）
- 地图瓦片、缩略图大量加载

## 相关概念

- [[concepts/performance/core-web-vitals]]: LCP 与 CLS 的直接受益项
- [[concepts/performance/lazy-loading]]: 折叠下图片懒加载的搭档
