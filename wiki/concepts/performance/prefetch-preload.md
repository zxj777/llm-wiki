---
title: "prefetch / preload / preconnect"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [performance, prefetch, preload, resource-hints, frontend]
status: active
sources: []
---

# prefetch / preload / preconnect

## 定义

资源提示（Resource Hints）是一组通过 `<link>` 标签告诉浏览器提前发起网络/解析操作的指令，包括 `preload`（当前页必需，高优先级）、`prefetch`（下个页面可能用到，低优先级）、`preconnect`（提前建立 TCP+TLS 连接）、`dns-prefetch`（仅做 DNS 解析）。合理使用能显著缩短关键资源到达时间，错误使用反而浪费带宽并干扰更紧急的请求。

## 工作原理

**preload**：以高优先级、按 `as` 类型并行下载当前页**确定要用**的资源，常用于：自托管字体（避免 FOUT）、LCP 大图、晚被发现的关键脚本/CSS。

```html
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero.avif" as="image" fetchpriority="high">
```

未在数秒内被使用，DevTools 会报警告 "preloaded but not used"，浪费带宽。

**prefetch**：以最低优先级在浏览器空闲时拉取下一页可能用到的资源（路由 chunk、下页 HTML、下页图片），缓存到 HTTP 缓存中。

```html
<link rel="prefetch" href="/checkout.js">
```

Webpack 魔法注释自动生成：

```js
import(/* webpackPrefetch: true */ './Checkout');
import(/* webpackPreload: true */ './CriticalChart');
```

**preconnect**：对将访问的第三方域提前完成 DNS + TCP + TLS 握手（节省 100-300ms）。适用于：分析、字体、图片 CDN、支付网关。开销不小，建议只对最关键的 4-6 个域使用。

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

**dns-prefetch**：仅做 DNS 查询，开销小但收益也小，作为不支持 preconnect 时的回退或对次要域使用。

**优先级权衡**：浏览器有自己的优先级队列，preload 会"插队"。滥用 preload 把字节抢在脚本前，反而推迟了首次绘制。一条经验：**仅 preload 解析 HTML 时还无法被发现的关键资源**（字体、CSS 引用的图片、JS 内才发现的 chunk）。

## 优势与局限

- ✅ 提前关键路径，显著缩短 LCP/字体 FOUT
- ✅ 实现成本低，标签即可
- ✅ 与构建工具集成良好
- ❌ 错误 preload 浪费带宽并降级其它请求
- ❌ prefetch 命中率低时可能纯浪费
- ❌ 浏览器策略不完全一致

## 应用场景

- 自托管 Web Font（preload）
- 路由切换体验优化（prefetch）
- 第三方 CDN 加速（preconnect）
- 支付/登录跳转前预连接

## 相关概念

- [[concepts/browser/dns-resolution]]: preconnect/dns-prefetch 的底层
- [[concepts/performance/lazy-loading]]: 与按需加载策略互补
