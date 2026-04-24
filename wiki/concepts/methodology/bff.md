---
title: "BFF 前端后端聚合层"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [methodology, architecture, api]
status: active
sources: []
---

# BFF 前端后端聚合层

## 定义

BFF(Backend for Frontend,服务于前端的后端)是 SoundCloud 在 2015 年提出的架构模式,指为每一种前端体验(Web、iOS、Android、TV、Watch)定制一个专属的后端聚合层。BFF 不重新实现业务逻辑,而是位于通用后端服务(微服务/领域服务)之上,负责:**API 编排聚合、协议/格式转换、为特定前端裁剪数据、跨域与会话处理、面向前端的缓存与限流**。一句话:让后端微服务保持纯粹,把前端形态差异"吃"在 BFF 里。

## 工作原理

**1. 经典分层**

```
┌──────────────────────────────────────────┐
│   Web      iOS      Android     TV       │  ← 多端
└────┬────────┬─────────┬──────────┬───────┘
     │        │         │          │
┌────▼──┐ ┌───▼────┐ ┌──▼─────┐ ┌──▼──┐
│Web BFF│ │iOS BFF │ │And BFF │ │TV BFF│   ← 各端 BFF
└────┬──┘ └───┬────┘ └──┬─────┘ └──┬──┘
     └────────┴─────────┴──────────┘
                      │
       ┌──────────────▼──────────────┐
       │  通用领域服务 / 微服务        │     ← 业务核心
       │  (订单、商品、用户、库存...)   │
       └─────────────────────────────┘
```

**2. 核心职责**

- **API 编排(Aggregation)**: 一个前端页面常需调多个后端服务,BFF 一次并行调用,合并返回,显著降低移动端往返延迟
- **数据裁剪(Tailoring)**: 移动端只要 5 个字段,BFF 不返回完整 30 字段对象,节省带宽
- **协议转换**: 后端 gRPC,前端要 GraphQL/REST/SSE/WebSocket,BFF 转换
- **会话与认证**: BFF 承担 [[concepts/security/oauth2]] 流程、Cookie 管理(避免 SPA 直接持有 refresh token)
- **跨域**: 前端只需访问同源 BFF,跨域问题在 BFF 内部解决
- **失败降级**: 某个下游服务挂时返回降级数据,而非整页报错
- **缓存**: 面向前端访问模式的缓存(如首页聚合结果)
- **A/B 实验、灰度**: 在 BFF 层切流量

**3. 代码示例(Node BFF)**

```ts
// Web BFF: 首页聚合接口
app.get('/web/home', async (req, res) => {
  const user = await getUser(req.session.userId);

  const [banners, recommendations, orders] = await Promise.all([
    bannerService.list({ channel: 'web' }),
    recommendService.forUser(user.id, { limit: 20 }),
    orderService.recent(user.id, { limit: 5 })
  ]);

  res.json({
    user: { name: user.name, avatar: user.avatarUrl },  // 裁剪
    banners: banners.map(b => ({ id: b.id, img: b.imageUrl })),
    recommendations,
    recentOrders: orders.map(o => ({ id: o.id, total: o.total, status: o.status }))
  });
});
```

**4. BFF + OAuth(Backend-For-Frontend Pattern,OAuth 2.1 推荐)**

SPA 不再持有 access/refresh token,而是把它们放在 BFF 的 HttpOnly Cookie 会话中,BFF 代理调用后端 API。这是当前 SPA + OAuth 的安全最佳实践,完全规避了 [[concepts/security/xss]] 窃取 token 的风险。

**5. GraphQL BFF**

GraphQL 天然适合做 BFF:前端按需查询,BFF 通过 resolver 编排多个后端微服务。Apollo Federation / Hot Chocolate 把多个子图统一成一个超级图。

**6. 谁拥有 BFF?**

经验法则:**BFF 由前端团队所有**,跟随前端版本节奏发布,前端可自行修改 BFF 而无需协调后端团队——这正是"为前端服务"的本意。

## 优势与局限

- ✅ 后端微服务保持稳定通用,不被前端形态绑架
- ✅ 移动端往返次数大幅减少,弱网体验提升
- ✅ 前端获得"贴合自己需求"的 API,迭代更快
- ✅ 是 SPA + OAuth 的安全最佳实践载体
- ✅ 跨域、降级、缓存集中处理
- ❌ 多端意味着多个 BFF,代码重复风险(可抽共享层)
- ❌ 多了一层网络与运维负担
- ❌ 边界不清易演变成"业务逻辑泄漏到 BFF"的反模式
- ❌ 前端团队需具备 Node/服务端开发与运维能力
- ❌ 版本兼容:多端共享同一 BFF 时灰度复杂

## 应用场景

- **多端产品**: Web + iOS + Android + 小程序,各端体验差异大
- **微服务体系**: 后端拆得很细,前端不堪重负聚合
- **SPA + OAuth**: BFF 持有令牌,Cookie 维护会话(BFF Pattern)
- **遗留系统对外**: BFF 包装老 SOAP/RPC,对外提供现代 REST/GraphQL
- **小程序聚合**: 微信小程序网络请求受限,聚合后单接口返回
- **边缘渲染场景**: BFF 部署到边缘(Vercel Edge / Cloudflare Workers)就近响应

## 相关概念

- [[concepts/methodology/microservices]]: BFF 通常构建在微服务之上
- [[concepts/security/oauth2]]: BFF Pattern 是 SPA 的安全最佳实践
- [[concepts/browser/cors]]: BFF 同源消除前端跨域问题
- [[concepts/methodology/clean-architecture]]: BFF 在外层适配器位置
- [[concepts/methodology/ddd]]: BFF 边界与"客户端上下文"对应
- [[concepts/nodejs/graphql]]: BFF 的常见技术选型
- api gateway: 与 BFF 互补——网关面向通用治理,BFF 面向特定前端
