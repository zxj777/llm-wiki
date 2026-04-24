---
title: "DNS 解析与 CDN"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [network, dns, cdn, performance, frontend]
status: active
sources: []
---

# DNS 解析与 CDN

## 定义
**DNS（Domain Name System）** 是将域名翻译为 IP 地址的分布式系统，是几乎所有网络请求的第一步。**CDN（Content Delivery Network）** 是分布在全球边缘节点的内容分发网络，结合智能 DNS 解析与缓存，将静态资源就近提供给用户。两者共同决定了用户首次访问站点的延迟下限。

## 工作原理
**DNS 解析层级**（一次请求自下而上查询）：
1. **浏览器 DNS 缓存**：几十秒至几分钟
2. **操作系统 DNS 缓存** + `hosts` 文件
3. **本地递归解析器**（运营商或公共 DNS：8.8.8.8 / 1.1.1.1）
4. **根域名服务器（Root）**：`.` 返回 TLD 服务器地址
5. **顶级域服务器（TLD）**：`.com` 返回权威 NS 地址
6. **权威域名服务器（Authoritative）**：返回最终记录

```
example.com → 浏览器缓存命中? → 系统缓存? → 本地 DNS → Root → .com TLD → 权威 NS → 1.2.3.4
```

**常见记录类型**：
| 类型 | 含义 |
|------|------|
| A | 域名 → IPv4 |
| AAAA | 域名 → IPv6 |
| CNAME | 域名 → 域名（别名） |
| MX | 邮件服务器 |
| TXT | 任意文本（SPF/DMARC/域名验证） |
| NS | 域名服务器 |
| SRV | 服务定位（端口+主机） |
| CAA | 限制可签发 SSL 证书的 CA |

**TTL（Time-To-Live）**：每条记录附带 TTL，控制各级缓存的存活时间。短 TTL 利于切换故障，长 TTL 减轻 DNS 压力。

**CDN 工作机制**：
1. 站点把静态资源域名 CNAME 到 CDN（如 `static.a.com → static.a.com.cdn.com`）
2. CDN 的智能 DNS 根据用户来源 IP（或 EDNS Client Subnet）返回**最近边缘节点 IP**
3. 用户请求落到边缘节点
4. 节点命中缓存直接返回；未命中则回源（可能经过区域节点 → 源站，多级缓存）

**CDN 关键能力**：
- **就近接入**：降低 RTT，绕开骨干拥塞
- **缓存分层**：边缘 + 区域 + 源站
- **TLS 终结**：在边缘完成 TLS 握手，源站只与 CDN 通信
- **DDoS 防护、WAF**：边缘清洗
- **动态加速**：通过专线 + TCP/QUIC 优化加速 API 流量
- **边缘计算**（Edge Workers）：在边缘运行 JS/WASM 处理逻辑

**前端预解析提示**：
```html
<link rel="dns-prefetch" href="//api.example.com">
<link rel="preconnect" href="https://api.example.com" crossorigin>
```
- `dns-prefetch`：仅 DNS 预解析（廉价）
- `preconnect`：DNS + TCP + TLS 全部完成（昂贵但更彻底）

适用于已知后续会请求的关键第三方域名（CDN、API、字体）。

## 优势与局限
- ✅ DNS 缓存大幅降低重复解析开销
- ✅ CDN 显著缩短首字节时间（TTFB）
- ✅ 边缘 TLS 终结 + HTTP/3 优化弱网
- ✅ 抗 DDoS、抗源站宕机
- ❌ DNS 投毒、劫持仍是安全隐患（需 DNSSEC / DoH / DoT）
- ❌ TTL 设置不当导致故障切换慢
- ❌ CDN 缓存刷新有延迟，紧急回滚需 Purge API
- ❌ 跨国 DNS 解析可能因 GFW/EDNS 支持差异错节点

## 应用场景
- **静态资源加速**：JS/CSS/图片/视频通过 CDN 分发
- **多区域容灾**：基于地理 DNS 路由到最近健康集群
- **关键域名预热**：首屏 `preconnect` 加速第三方接口
- **隐私 DNS**：DoH/DoT 防运营商劫持

## 相关概念
- [[concepts/browser/caching]]: CDN 是 HTTP 缓存的边缘层
- [[concepts/performance/prefetch-preload]]: dns-prefetch/preconnect 是预加载家族成员
