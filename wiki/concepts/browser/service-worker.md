---
title: "Service Worker 与 PWA"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, service-worker, pwa, cache, frontend]
status: active
sources: []
---

# Service Worker 与 PWA

## 定义
**Service Worker（SW）**是运行在浏览器后台、独立于页面的脚本，可作为网络代理拦截源自其控制范围内页面的请求，实现可编程缓存、离线访问、推送通知与后台同步。**PWA（Progressive Web App）**是构建在 Service Worker、Web App Manifest、HTTPS 等能力之上的现代 Web 应用形态，旨在让 Web 站点具备接近原生 App 的体验：离线可用、可安装到桌面、可推送、可后台同步。

## 工作原理
**生命周期**：
1. **register**：页面通过 `navigator.serviceWorker.register('/sw.js')` 注册
2. **install**：首次或 SW 文件变化时触发，常用于预缓存关键资源
3. **waiting**：旧 SW 仍在控制页面时新 SW 进入等待，可调 `self.skipWaiting()` 强制激活
4. **activate**：旧 SW 释放控制权后触发，常用于清理过期缓存
5. **idle / fetch / message / push / sync**：日常事件循环

```js
// sw.js
const CACHE = 'app-v1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/app.js', '/style.css'])));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});
```

**作用域**：SW 只控制其路径及子路径下的页面，`/sw.js` 控制全站，`/app/sw.js` 仅控制 `/app/*`。

**常见缓存策略**：
- **Cache First**：先查缓存，未命中再请求。适合不变资源（静态文件）
- **Network First**：先发请求，失败回退缓存。适合内容会变的接口
- **Stale-While-Revalidate (SWR)**：返回缓存的同时后台刷新。常用于头像、列表
- **Network Only**：始终走网络。适合鉴权、支付
- **Cache Only**：始终走缓存。适合预缓存资源

```js
// SWR
e.respondWith(
  caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(e.request);
    const networkPromise = fetch(e.request).then(res => {
      cache.put(e.request, res.clone());
      return res;
    });
    return cached || networkPromise;
  })
);
```

**进阶能力**：
- **Background Sync**：网络恢复后自动重发失败请求
- **Push API + Notification**：服务端推送 + 系统通知
- **Periodic Background Sync**：定期后台拉新（限制严格）

**PWA 必备**：
- **Web App Manifest**（`manifest.webmanifest`）：定义图标、名称、启动 URL、显示模式（standalone/fullscreen）、主题色
- **HTTPS**：SW 与 PWA 强制要求（localhost 例外）
- **响应式设计**与离线兜底页面

## 优势与局限
- ✅ 可编程缓存层，灵活实现各种策略
- ✅ 离线访问 + 安装到桌面 = 接近原生体验
- ✅ 后台推送、同步降低对原生 App 的依赖
- ❌ SW 调试复杂，更新策略需精心设计（避免用户卡在旧版本）
- ❌ iOS Safari 对 PWA 支持长期受限
- ❌ 缓存错误的 HTML 可能导致"白屏"且难以恢复
- ❌ 增加运维与发版心智成本

## 应用场景
- **离线优先应用**：笔记、阅读器、翻译
- **资讯/电商**：弱网下也能浏览缓存内容
- **企业内部工具**：安装到桌面，提升使用频率
- **推送场景**：替代邮件订阅与原生通知

## 相关概念
- [[concepts/browser/caching]]: SW 是 HTTP 缓存之外的应用层缓存
- [[concepts/browser/storage]]: Cache API 与 IndexedDB 提供 SW 数据底座
