---
title: "Node.js"
type: entity
created: 2026-04-02
updated: 2026-04-02
tags: [runtime, javascript, nodejs, backend]
status: active
sources: []
---

# Node.js

Node.js 是 **Ryan Dahl** 于 2009 年发布的服务端 JavaScript 运行时，构建在 Google Chrome 的 V8 引擎之上，配合 **libuv** 提供跨平台的事件驱动、非阻塞 I/O 模型。它让 JavaScript 走出浏览器，成为构建 Web 服务、CLI、构建工具、桌面应用（Electron）等几乎所有领域的通用运行时，并间接催生了今天庞大的 npm 生态。

## 概述

Node.js 的核心架构由四层组成：

1. **V8**：Google 开源的 JavaScript / WebAssembly 引擎，负责 JS 的解析、JIT 编译与执行。
2. **libuv**：C 库，提供跨平台事件循环（event loop）、线程池、异步文件 I/O、网络 I/O。
3. **Node 核心 API（C++ 绑定）**：`fs`、`net`、`http`、`crypto`、`stream`、`buffer` 等模块的 native 实现。
4. **JS 标准库与模块系统**：CommonJS（历史）与 ESM（现代）双模块体系。

其执行模型的关键概念是 **单线程事件循环**：JS 主线程负责调度，所有 I/O 通过 libuv 的事件循环与线程池异步完成。这使得 Node 在高并发 I/O 密集型场景（API 网关、实时通信、代理）上极具优势，但 CPU 密集任务需借助 `worker_threads` 或子进程。

Node.js 在 2015 年与 io.js 分裂后合并，并由 **OpenJS Foundation** 治理，采用奇数版/偶数版（LTS）发布节奏：偶数版本提供 30 个月长期支持，是生产首选。

## 关键特性或贡献

- **事件循环 + 非阻塞 I/O**：基于 libuv 的多阶段事件循环（timers → pending callbacks → poll → check → close），是 Node 高并发能力的基石。
- **npm 生态**：截至 2026 年，npm 注册表上已有超过 300 万个包，是世界上最大的开源软件仓库。
- **同语言全栈开发**：前后端共用 JS/TS，使得团队结构、代码复用、工具链统一成为可能。
- **流（Streams）**：可读、可写、双工、转换四种流抽象，支撑高效大文件 / 网络处理。
- **Worker Threads**：在 v10.5+ 引入，用于 CPU 密集任务的真正多线程并行。
- **原生 ESM 支持**：v12 起渐进式支持，v18+ 已稳定；与 CJS 互操作仍是常见痛点。
- **内置 Test Runner**：v20 起内置 `node:test`，减少对 Jest / Mocha 的依赖。
- **内置 fetch / WebStreams / FormData**：v18+ 引入浏览器对齐的 API，跨端同构更自然。
- **Permission Model（实验）**：v20+ 探索运行时权限隔离，对标 Deno。
- **新生态竞争**：[[entities/fullstack/typescript]] 普及、Deno 与 Bun 的崛起推动 Node 加速演进（直接执行 TS、内置工具链等）。

## 关联

- [[entities/fullstack/typescript]]：现代 Node 项目的事实标配语言。
- [[entities/fullstack/vite]]、[[entities/fullstack/webpack]]：构建工具运行在 Node 上。
- [[entities/fullstack/prisma]]：Node 生态最流行的类型安全 ORM。
- **V8**：JS 引擎，决定 Node 的语言特性与性能上限。
- **libuv**：异步 I/O 与事件循环底层实现，Node 性能模型的灵魂。
- **npm / pnpm / Yarn**：Node 生态的包管理器；详细对比见 [[comparisons/fullstack/npm-vs-yarn-vs-pnpm]]。
- **Deno**：Ryan Dahl 于 2018 年发起的「重做版 Node」，原生 TS、内置权限模型、Web 标准 API。
- **Bun**：Zig 编写的 Node 兼容运行时，以极致性能与一体化工具链（runtime + bundler + test + pkg manager）为卖点。
- **Express / Fastify / NestJS / Hono**：建立在 Node 之上的主流 Web 框架。
