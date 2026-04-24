---
title: 浏览器与网络
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [browser, network, http, frontend]
status: active
sources: []
---

# 浏览器与网络

## 概述

浏览器是前端代码的运行容器，网络是前后端协作的传输层。理解浏览器从输入 URL 到屏幕呈现的完整流程（DNS → TCP/TLS → HTTP → HTML 解析 → CSSOM → Render Tree → Layout → Paint → Composite），是性能优化、SEO 优化与异常排查的共同基础。

网络层面的演进（HTTP/1.1 → HTTP/2 → HTTP/3/QUIC）改变了资源加载策略：多路复用、Server Push、0-RTT 等特性使得「合并请求」「域名分片」等老经验逐渐失效。同时，浏览器也提供了越来越多的存储、缓存、并发、安全 API（Service Worker、Storage、Web Worker、Permissions、CSP），这些能力定义了现代 Web 应用的能力边界。

## 核心概念

- [[concepts/browser/rendering-pipeline]]: 渲染管线全流程
- [[concepts/browser/critical-rendering-path]]: 关键渲染路径优化
- [[concepts/browser/http-evolution]]: HTTP/1.1 → HTTP/3 演进
- [[concepts/browser/caching]]: 强缓存 / 协商缓存 / Service Worker 缓存
- [[concepts/browser/cors]]: 同源策略、预检请求、凭证传递
- [[concepts/browser/websocket]]: 双工通信与心跳
- [[concepts/browser/storage]]: Cookie / localStorage / IndexedDB 取舍
- [[concepts/browser/service-worker]]: 离线、推送、后台同步
- [[concepts/browser/security-model]]: 同源、隔离、Permissions
- [[concepts/browser/dns-resolution]]: DNS 层级与预解析
- [[concepts/browser/reflow-repaint]]: 重排重绘触发条件
- [[concepts/browser/web-performance-apis]]: Performance Observer、Navigation Timing

## 关联板块

- 性能：[[topics/fullstack/performance]]（基于本板块的指标做优化）
- 安全：[[topics/fullstack/security]]（CSP、HTTPS、CORS 与同源）
- 框架：[[topics/fullstack/framework]]（SSR/CSR 决策依赖网络与渲染特性）

## 推荐学习路径

**初级**
1. URL → 屏幕完整流程的口头复述
2. HTTP 请求/响应报文结构、常见状态码与头部
3. 浏览器 DevTools Network / Performance 面板基本用法

**进阶**
1. [[concepts/browser/rendering-pipeline]] + [[concepts/browser/reflow-repaint]]
2. [[concepts/browser/caching]] 完整策略（含 ETag、Vary、SWR）
3. [[concepts/browser/cors]]、[[concepts/browser/security-model]]
4. [[concepts/browser/http-evolution]]：HTTP/2 多路复用、HTTP/3 的 QUIC

**深入**
1. [[concepts/browser/service-worker]] 离线方案与 PWA
2. [[concepts/browser/web-performance-apis]] 自建 RUM 监控
3. 从 Chromium 源码或文档了解 Compositor、Tile、Blink 渲染细节

## 开放问题

- HTTP/3 普及后，是否还需要在前端做请求合并、雪碧图等老优化？
- Service Worker 的边缘计算化（Cloudflare Workers）会模糊前后端的边界吗？
