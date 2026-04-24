---
title: "Node.js Streams"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, streams, pipe, buffer, backend]
status: active
sources: []
---

# Node.js Streams

## 定义

Stream 是 Node.js 中处理流式数据的统一抽象，让数据按"块（chunk）"逐步生产、转换、消费，避免一次性把全部数据加载进内存。它是 HTTP、文件系统、压缩、加密、子进程等模块的底层接口，是写出可处理大文件、低内存、可组合数据管道的关键能力。

## 工作原理

四种基础类型：
- **Readable**：可读流（fs.createReadStream、http req）
- **Writable**：可写流（fs.createWriteStream、http res）
- **Duplex**：双向流（TCP socket）
- **Transform**：转换流（zlib gzip、crypto cipher）

**两种模式**：flowing（自动推送 `data` 事件）与 paused（手动调用 `read()`）。

**Backpressure（背压）**是核心概念：当下游 Writable 写入速度跟不上上游 Readable 产出速度时，内部 buffer 累积，`write()` 返回 `false` 提示生产方暂停；下游消费完毕触发 `drain` 事件让生产方恢复。手写时容易遗漏，推荐用 `pipe` 或更安全的 `pipeline`：

```js
const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

await pipeline(
  fs.createReadStream('huge.log'),
  zlib.createGzip(),
  fs.createWriteStream('huge.log.gz')
);
// pipeline 自动处理背压、错误传播、资源清理
```

vs `pipe`：`pipe` 不会自动转发错误也不会清理失败的下游资源，生产环境推荐 `pipeline`。

**自定义 Transform**：

```js
const { Transform } = require('stream');
const upper = new Transform({
  transform(chunk, _enc, cb) {
    cb(null, chunk.toString().toUpperCase());
  }
});
process.stdin.pipe(upper).pipe(process.stdout);
```

**与 async iterator 互通**：Readable 实现了 `[Symbol.asyncIterator]`，可直接 `for await` 消费，写法更直观。

```js
for await (const chunk of fs.createReadStream('a.txt')) { /* ... */ }
```

**Web Streams**（`ReadableStream` / `WritableStream`）是浏览器/Deno 标准，Node 18+ 已支持，与 Node Stream 可互转，未来跨运行时方案首选。

`highWaterMark` 控制内部 buffer 阈值，默认 16KB（对象模式 16 个），调优时可结合内存与吞吐折衷。

## 优势与局限

- ✅ 处理大文件不爆内存
- ✅ 可组合：解压 → 解析 → 转换 → 写入
- ✅ 背压机制保护系统稳定
- ❌ API 复杂，错误处理易踩坑
- ❌ 调试困难（异步链路长）
- ❌ Web Streams 与 Node Streams 双轨过渡期

## 应用场景

- 大文件读写、上传下载、CSV 处理
- 压缩/加密/哈希流水线
- 代理与转发（HTTP req → upstream → res）
- 实时日志聚合与导出

## 相关概念

- [[concepts/nodejs/event-loop]]: Stream 基于事件循环驱动
- [[concepts/nodejs/middleware-pattern]]: 中间件常通过流处理 body
