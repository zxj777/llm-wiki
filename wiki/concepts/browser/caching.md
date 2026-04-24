---
title: "缓存机制"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, http, cache, network, frontend]
status: active
sources: []
---

# 缓存机制

## 定义
浏览器缓存机制通过在客户端、CDN、反向代理等多层存储响应副本，避免重复请求源站，显著降低延迟与带宽。HTTP 缓存分为两类：**强缓存**（在有效期内直接读本地，不发请求）与**协商缓存**（发请求带条件头，由服务端返回 304 Not Modified 复用本地副本）。配合 Service Worker、CDN 与浏览器自身的多级缓存（Memory Cache、Disk Cache、Push Cache、Service Worker Cache），构成完整的缓存体系。

## 工作原理
**强缓存（Fresh）**：
- `Cache-Control: max-age=3600`：相对时间，秒
- `Expires: Wed, 21 Oct 2026 07:28:00 GMT`：绝对时间（HTTP/1.0 遗留，受时钟影响）
- `Cache-Control` 优先级高于 `Expires`

命中强缓存时浏览器**不发请求**，状态显示 `200 (from disk/memory cache)`。

**协商缓存（Stale 后再验证）**：
- `Last-Modified` / `If-Modified-Since`：基于修改时间（秒级精度）
- `ETag` / `If-None-Match`：基于内容指纹（推荐）

```http
# 首次请求响应
HTTP/1.1 200 OK
Cache-Control: max-age=600
ETag: "v1-abc"
Last-Modified: Wed, 20 Oct 2026 12:00:00 GMT

# 600s 后再次请求
GET /index.html
If-None-Match: "v1-abc"

# 服务端比对未变更
HTTP/1.1 304 Not Modified
```

**Cache-Control 关键指令**：
| 指令 | 含义 |
|------|------|
| `public` | 任意中间节点可缓存（包括 CDN） |
| `private` | 仅终端浏览器缓存，CDN 不缓存 |
| `no-cache` | 必须协商验证（不是不缓存） |
| `no-store` | 完全不缓存 |
| `max-age=N` | 强缓存有效期（秒） |
| `s-maxage=N` | 仅对共享缓存（CDN）生效 |
| `must-revalidate` | 过期后必须验证 |
| `immutable` | 内容永不变化，无需协商 |
| `stale-while-revalidate=N` | 过期后 N 秒内可先用旧值，后台异步刷新 |

**多级缓存层级**（由近到远）：
1. **Memory Cache**：当前 tab 内存，关闭即失
2. **Disk Cache**：磁盘持久缓存
3. **Service Worker Cache**：可编程缓存，受 SW 拦截控制
4. **HTTP/2 Push Cache**：连接级
5. **CDN 边缘节点**
6. **源站**

**典型策略**：
- HTML：`Cache-Control: no-cache`，每次协商，确保入口最新
- 带 hash 的静态资源（`app.a1b2c3.js`）：`max-age=31536000, immutable`，永久强缓存
- API 响应：通常 `no-store` 或短 `max-age`
- 图片：长 `max-age` + ETag

## 优势与局限
- ✅ 显著降低延迟与带宽消耗
- ✅ 多级体系灵活，可按资源类型精细控制
- ✅ ETag/SWR 等机制兼顾新鲜度与性能
- ❌ 缓存失效策略错误会导致用户看到旧版本
- ❌ 复杂的多层缓存调试困难（"为什么我的更新没生效"）
- ❌ `no-cache` 与 `no-store` 易混淆

## 应用场景
- **静态资源**：JS/CSS/图片永久强缓存 + 文件名 hash
- **HTML 入口**：协商缓存避免离线/旧版陷阱
- **CDN 加速**：`s-maxage` + Purge API
- **离线应用**：Service Worker + Cache API 实现 offline-first

## 相关概念
- [[concepts/browser/service-worker]]: 提供可编程的应用层缓存
- [[concepts/browser/http-evolution]]: 缓存语义在所有 HTTP 版本通用
