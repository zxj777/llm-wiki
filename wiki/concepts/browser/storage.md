---
title: "浏览器存储"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, storage, cookie, localstorage, indexeddb, frontend]
status: active
sources: []
---

# 浏览器存储

## 定义
浏览器为 Web 应用提供了多种客户端存储方案：Cookie、LocalStorage、SessionStorage、IndexedDB、Cache API、File System Access API 等。它们在容量、生命周期、API 形态、是否随请求自动发送、同步/异步、是否结构化等维度差异显著。合理选型能够提升性能、支持离线、降低后端压力，错误使用则可能引发安全问题或性能瓶颈。

## 工作原理

**Cookie**
- 容量约 **4KB**/条，每域名约 50 条
- 每次同源 HTTP 请求**自动发送**（同站/跨站受 SameSite 控制），适合传 session id
- 关键属性：`HttpOnly`（JS 不可读，防 XSS 窃取）、`Secure`（仅 HTTPS）、`SameSite=Strict/Lax/None`（防 CSRF）、`Domain`、`Path`、`Expires/Max-Age`
- API 同步、字符串
```js
document.cookie = 'sid=abc; Max-Age=3600; Secure; SameSite=Lax';
```

**LocalStorage**
- 容量 **5–10MB** / origin
- **永久持久化**，需手动清除
- API 同步、仅字符串（对象需 JSON.stringify）
- 跨 tab 共享，触发 `storage` 事件
```js
localStorage.setItem('token', 'xxx');
const t = localStorage.getItem('token');
```

**SessionStorage**
- 容量同 LocalStorage
- 生命周期 = **当前 tab 会话**，关闭即清
- 同一 origin 不同 tab 互不可见
- API 与 LocalStorage 一致

**IndexedDB**
- **GB 级**容量（受磁盘配额控制）
- **异步**（Promise 风格，原生为事件回调；推荐用 idb 库包装）
- 支持**事务、索引、游标、结构化对象**（包含 Blob/File）
- 适合大数据量、复杂查询
```js
import { openDB } from 'idb';
const db = await openDB('app', 1, {
  upgrade(db) { db.createObjectStore('files', { keyPath: 'id' }); }
});
await db.put('files', { id: 1, blob });
```

**Cache API**
- Service Worker 配套 API，按 Request/Response 对存储 HTTP 响应
- 适合离线缓存静态资源与 API 响应
```js
const cache = await caches.open('v1');
await cache.put(req, res.clone());
const hit = await cache.match(req);
```

**对比表**：
| 维度 | Cookie | LocalStorage | SessionStorage | IndexedDB | Cache API |
|------|--------|-------------|----------------|-----------|-----------|
| 容量 | 4KB | 5-10MB | 5-10MB | GB+ | GB+ |
| 生命周期 | Expires/Max-Age | 永久 | tab 关闭 | 永久 | 永久 |
| 同步 | 同步 | 同步 | 同步 | 异步 | 异步 |
| 自动发送 | 是 | 否 | 否 | 否 | 否 |
| 数据类型 | 字符串 | 字符串 | 字符串 | 任意 + Blob | Request/Response |
| 容易 XSS 泄露 | HttpOnly 可防 | 是 | 是 | 是 | 是 |

**存储隔离**：所有存储按 origin 隔离。在隐私模式下容量缩减或会话级。Storage Pressure 时浏览器可能驱逐，`navigator.storage.persist()` 可申请持久化。

## 优势与局限
- ✅ 多种方案覆盖从 KB 到 GB 各种场景
- ✅ 异步 IndexedDB 不阻塞主线程
- ✅ 配合 SW 实现完整离线体验
- ❌ Cookie 自动发送增加请求体积，应避免存大量数据
- ❌ LocalStorage 同步 API 大量读写会卡主线程
- ❌ 隐私模式与配额清理可能导致数据丢失
- ❌ XSS 可读取除 HttpOnly Cookie 外的所有存储

## 应用场景
- **认证**：Token 存 HttpOnly Cookie；前端可见状态存 LocalStorage
- **草稿/偏好**：LocalStorage 持久化用户配置
- **临时表单**：SessionStorage 防止刷新丢失
- **离线数据库**：IndexedDB 存大量结构化数据（笔记、邮件）
- **PWA 资源**：Cache API + Service Worker

## 相关概念
- [[concepts/browser/service-worker]]: 与 Cache API 紧密配合
- [[concepts/browser/security-model]]: 决定存储的可访问性与攻击面
