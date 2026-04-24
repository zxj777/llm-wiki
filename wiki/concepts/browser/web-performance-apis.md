---
title: "Web Performance APIs"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, performance, api, measurement, frontend]
status: active
sources: []
---

# Web Performance APIs

## 定义
Web Performance APIs 是浏览器提供的一组用于精确测量页面性能的标准接口，统一以 `PerformanceEntry` 为数据模型，覆盖导航、资源加载、绘制、长任务、用户自定义测量等场景。配合 `PerformanceObserver` 订阅模型，能在不影响业务的前提下采集 RUM（Real User Monitoring）数据，是落地 Core Web Vitals、性能预算与回归检测的基础。

## 工作原理
**核心抽象 PerformanceEntry**：所有性能记录都是 `PerformanceEntry` 的子类，含 `name / entryType / startTime / duration` 等字段。可通过 `performance.getEntries()` 获取，但更推荐 `PerformanceObserver` 实时订阅。

**主要 entryType**：
- `navigation`：本次页面导航的全程耗时
- `resource`：资源加载（JS/CSS/img/fetch）
- `paint`：FP、FCP
- `largest-contentful-paint`：LCP
- `first-input`：FID（首次输入延迟）
- `layout-shift`：CLS（累计布局偏移）
- `longtask`：超过 50ms 的长任务
- `mark` / `measure`：自定义打点
- `event`：Event Timing（INP 基础）

**Navigation Timing**：
```js
const [nav] = performance.getEntriesByType('navigation');
console.log({
  dns: nav.domainLookupEnd - nav.domainLookupStart,
  tcp: nav.connectEnd - nav.connectStart,
  ttfb: nav.responseStart - nav.requestStart,
  domReady: nav.domContentLoadedEventEnd - nav.startTime,
  load: nav.loadEventEnd - nav.startTime,
});
```

**Resource Timing**：每个子资源的 DNS、TCP、TLS、TTFB、下载耗时，便于定位慢资源。

**PerformanceObserver**：异步订阅模型，避免轮询：
```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      console.log('LCP', entry.startTime, entry.element);
    }
  }
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

`buffered: true` 表示捕获 observer 创建之前已记录的条目，避免错过早期事件。

**Long Tasks API**：捕获主线程上 > 50ms 的任务，用于诊断卡顿。
```js
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    console.warn('Long task:', e.duration, 'ms');
  }
}).observe({ type: 'longtask', buffered: true });
```

**User Timing**：自定义业务打点：
```js
performance.mark('fetch-start');
await fetchUser();
performance.mark('fetch-end');
performance.measure('fetch-duration', 'fetch-start', 'fetch-end');
const [m] = performance.getEntriesByName('fetch-duration');
console.log(m.duration);
```

`mark/measure` 还会出现在 DevTools Performance 时间线中，便于联动调试。

**CWV 测量**：推荐使用 Google 官方 `web-vitals` 库，封装了上述 API 的兼容性细节、重试与上报：
```js
import { onLCP, onCLS, onINP } from 'web-vitals';
onLCP(v => report('lcp', v));
onCLS(v => report('cls', v));
onINP(v => report('inp', v));
```

**注意**：API 有跨源限制——跨域资源的 timing 字段需 `Timing-Allow-Origin` 响应头放开，否则部分字段为 0。

## 优势与局限
- ✅ 标准化、低开销、可在生产环境采集
- ✅ Observer 模型适合事件式上报
- ✅ 与 DevTools 深度集成，本地调试方便
- ❌ 跨域资源默认看不到详细 timing
- ❌ 部分新 API 在老浏览器或 iOS 上可用性参差
- ❌ 数据上报需注意采样与隐私合规

## 应用场景
- **RUM 监控**：上报 CWV、API 延迟、长任务
- **性能预算**：CI 中跑 Lighthouse + 回归告警
- **诊断慢接口**：Resource Timing + Server-Timing 头联调
- **业务打点**：mark/measure 跟踪关键流程耗时

## 相关概念
- [[concepts/performance/core-web-vitals]]: 用这些 API 度量
- [[concepts/browser/rendering-pipeline]]: paint/lcp/cls 的语义来自流水线阶段
