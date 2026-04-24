---
title: "HTTP 协议演进"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [http, network, http2, http3, frontend]
status: active
sources: []
---

# HTTP 协议演进

## 定义
HTTP（HyperText Transfer Protocol）是 Web 通信的基础协议。自 1990 年代以来经历了多次重大升级：HTTP/1.0（短连接）、HTTP/1.1（持久连接 + 管道化）、HTTP/2（二进制分帧 + 多路复用）、HTTP/3（基于 QUIC，解决 TCP 队头阻塞）。每一代演进都围绕"减少延迟、提升并发、增强安全"展开，对 Web 性能优化策略有直接影响。

## 工作原理
**HTTP/1.0**（1996）：每个请求新建一个 TCP 连接，响应完即关闭。三次握手成本高，无并发。

**HTTP/1.1**（1997）：
- **Keep-Alive 持久连接**：同一 TCP 连接可复用
- **Pipelining 管道化**：可在不等响应的情况下连续发请求，但响应必须按序返回，浏览器普遍未实现，因为存在**队头阻塞（HOL Blocking）**
- **Chunked Transfer**、**Range 请求**、**Host 头**（虚拟主机）
- 浏览器对同一域名通常限制 6 个并发连接（"域名分片"由此而生）

**HTTP/2**（2015，基于 SPDY）：
- **二进制分帧**：将报文拆为 HEADERS、DATA 等帧，复用同一连接
- **多路复用**：同一 TCP 连接上并发多个请求/响应流，互不阻塞（应用层）
- **HPACK 头压缩**：基于动态表压缩重复 header
- **Server Push**（已被主流浏览器移除）：服务端主动推送资源
- **流优先级**：客户端可声明依赖关系
- 仍受 **TCP 层队头阻塞** 影响：单个丢包阻塞所有流

```http
:method: GET
:path: /api/user
:scheme: https
:authority: example.com
```

**HTTP/3**（2022，基于 QUIC）：
- **传输层换为 QUIC**（基于 UDP），彻底解决 TCP 队头阻塞——单流丢包不影响其他流
- **0-RTT** 重连：缓存的握手参数允许首包直接带数据
- **TLS 1.3 内建**：握手与加密合一，更快
- **连接迁移**：手机切换 WiFi/4G 时连接不中断（QUIC 用 Connection ID 而非 IP+Port 标识连接）

**HTTPS = HTTP + TLS**：TLS 1.3 握手 1-RTT（甚至 0-RTT），提供加密、完整性、身份认证。证书链与 SNI 是常见考点。

## 优势与局限
- ✅ HTTP/2 多路复用大幅减少连接数与延迟
- ✅ HTTP/3 解决传输层 HOL，移动网络体验显著改善
- ✅ HPACK / QPACK 压缩节省带宽
- ❌ HTTP/2 在高丢包网络下可能比 HTTP/1.1 更差（TCP HOL）
- ❌ HTTP/3 部署需 UDP 通行，企业防火墙可能阻断
- ❌ 老的"域名分片"优化在 HTTP/2/3 下反而有害（破坏多路复用）

## 应用场景
- **API 服务**：开启 HTTP/2 提升并发请求性能
- **CDN 边缘**：HTTP/3 + QUIC 优化弱网体验
- **WebSocket 替代**：HTTP/2 流可承载部分实时场景，但 WebSocket 仍主流
- **协议选型**：移动 App 后台、跨国请求优先 HTTP/3

## 相关概念
- [[concepts/browser/caching]]: 缓存机制对协议层透明，优化效果叠加
- [[concepts/security/https-tls]]: HTTPS 是现代 HTTP 的事实标配
