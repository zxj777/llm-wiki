---
title: "WebSocket 与长连接"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [browser, websocket, network, realtime, frontend]
status: active
sources: []
---

# WebSocket 与长连接

## 定义
**WebSocket** 是基于 TCP 的全双工通信协议（RFC 6455），通过一次 HTTP 握手升级为长连接，之后客户端与服务端可随时双向发送消息。它解决了传统 HTTP 请求-响应模型在实时场景下的两大痛点：**轮询效率低**与**单向推送困难**。WebSocket 与 SSE（Server-Sent Events）、长轮询并列为浏览器实时通信的三种主要方案。

## 工作原理
**握手升级**：客户端发起标准 HTTP/1.1 请求，带升级头：
```http
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://example.com
```
服务端校验 `Sec-WebSocket-Key`（拼接固定 GUID 后取 SHA-1 + Base64）回应：
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```
之后 TCP 连接转为 WebSocket 帧协议。

**帧结构**：每帧包含 `FIN` 标志、`opcode`（文本 0x1 / 二进制 0x2 / 关闭 0x8 / Ping 0x9 / Pong 0xA）、`mask` 位（客户端→服务端必须掩码以防代理污染）、payload length、可选 masking key、payload data。

**浏览器 API**：
```js
const ws = new WebSocket('wss://example.com/chat');
ws.onopen = () => ws.send(JSON.stringify({ type: 'hello' }));
ws.onmessage = (e) => console.log('recv', e.data);
ws.onclose = (e) => console.log('closed', e.code, e.reason);
ws.onerror = (e) => console.error(e);
ws.send(new Uint8Array([1, 2, 3])); // 二进制
```

**心跳与重连**：协议层有 Ping/Pong 帧，但浏览器不暴露 API，通常应用层定期发空消息探活。重连建议指数退避 + 最大上限。

**与其他方案对比**：
| 方案 | 方向 | 协议 | 适用 |
|------|------|------|------|
| 短轮询 | 单向轮询 | HTTP | 简单低频 |
| 长轮询 | 单向（伪推送） | HTTP | 兼容性强 |
| **SSE** | 服务端→客户端 | HTTP/1.1 chunked | 单向推送、自动重连、文本 |
| **WebSocket** | 全双工 | 独立帧协议 | 双向、低延迟、二进制 |

SSE 是 HTTP 流的标准化包装，自动重连 + 事件 ID 续传，但只能服务端推客户端，且不支持二进制；WebSocket 更通用但需自实现重连与协议封装。AI 流式响应通常用 SSE 即可。

## 优势与局限
- ✅ 全双工低延迟，适合实时双向通信
- ✅ 一次握手长期复用，无 HTTP 头开销
- ✅ 支持文本与二进制
- ❌ 需服务端独立维护连接状态，扩展成本高
- ❌ 中间代理/防火墙可能不友好（建议 wss + 443）
- ❌ 协议层无重连/鉴权/序列化标准，需应用层补齐
- ❌ 不参与 HTTP 缓存与 CDN 体系

## 应用场景
- **聊天/IM**：消息双向实时
- **协同编辑**：多人同时改文档（OT/CRDT）
- **实时监控**：股价、监控仪表盘、游戏状态
- **在线游戏**：低延迟双向状态同步
- **AI 对话**：双向场景用 WS；单向流式输出 SSE 更轻

## 相关概念
- [[concepts/browser/http-evolution]]: 握手基于 HTTP，升级后脱离
- streaming response: SSE 是 LLM 流式输出的事实标准
