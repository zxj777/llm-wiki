---
title: "Web Worker"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [performance, web-worker, multithreading, frontend]
status: active
sources: []
---

# Web Worker

## 定义

Web Worker 是浏览器提供的多线程 API，允许在独立于 UI 主线程的后台线程中运行脚本。由于 JS 在主线程是单线程的，任何耗时计算都会阻塞渲染与交互（影响 INP/掉帧），Web Worker 把计算卸载到 Worker 线程，让主线程专注于 UI。它分为 Dedicated Worker（专属）、Shared Worker（多个上下文共享）和 Service Worker（拦截网络）。

## 工作原理

Worker 在独立线程独立 V8 实例运行，**没有 DOM、window、document 访问权**，只能通过 `postMessage` 与主线程通信，消息通过结构化克隆算法序列化（无法传函数与 DOM）。

```js
// main.js
const worker = new Worker(new URL('./heavy.worker.js', import.meta.url), { type: 'module' });
worker.postMessage({ type: 'crunch', data: bigArray });
worker.onmessage = (e) => console.log('result', e.data);

// heavy.worker.js
self.onmessage = (e) => {
  const result = doExpensiveWork(e.data.data);
  self.postMessage(result);
};
```

**Transferable Objects** 实现零拷贝传输 `ArrayBuffer`、`MessagePort`、`OffscreenCanvas`：所有权转移而非克隆，性能差距可达数十倍。

```js
worker.postMessage(buffer, [buffer]); // buffer 转移后主线程不可再用
```

**SharedArrayBuffer + Atomics**：多线程共享同一段内存，配合 `Atomics.wait/notify` 实现锁与信号量，但要求页面启用 COOP/COEP（Cross-Origin Isolation）。

**典型应用**：
- 大数据排序/过滤/聚合（分析仪表盘）
- 图像/视频处理：`OffscreenCanvas` 在 Worker 渲染图层
- 加密解密、WASM 计算（如 ffmpeg.wasm、SQL.js）
- 解压、JSON parse 大文件

**限制**：启动有几十 ms 开销，不适合短任务；`postMessage` 序列化成本对大对象明显（用 Transferable 缓解）；调试不如主线程方便；Worker 内不能直接访问 LocalStorage。

封装库 `comlink` 用 Proxy 把 Worker 通信变成普通函数调用，开发体验大幅提升。

## 优势与局限

- ✅ 解放主线程，改善 INP 与帧率
- ✅ 支持 WASM、OffscreenCanvas 等强算力场景
- ✅ Transferable 提供零拷贝
- ❌ 无法访问 DOM
- ❌ 通信序列化开销
- ❌ 启动成本不适合微任务

## 应用场景

- 在线表格的公式计算与排序
- 浏览器端视频转码（WASM）
- 大型 PDF 渲染、富文本解析
- 加解密、签名、Hash 计算

## 相关概念

- [[concepts/js/event-loop]]: 主线程事件循环卡顿是 Worker 出发点
- [[concepts/browser/rendering-pipeline]]: OffscreenCanvas 与渲染管线协同
