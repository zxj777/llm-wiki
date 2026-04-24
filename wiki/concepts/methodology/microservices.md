---
title: "微服务架构"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [methodology, architecture, distributed]
status: active
sources: []
---

# 微服务架构

## 定义

微服务架构(Microservices Architecture)是把单一应用拆分为一组小型、自治、围绕业务能力组织的服务,每个服务独立部署、独立技术栈、通过轻量协议(HTTP/gRPC/消息队列)通信。Martin Fowler 与 James Lewis 在 2014 年的同名文章中正式定义了这一模式。它的核心承诺是:**用分布式系统的复杂度,换取业务模块的独立演进与团队自治**——前提是组织有足够的 DevOps 与运维成熟度,否则只会得到"分布式单体"的灾难。

## 工作原理

**1. 拆分原则**

- **业务能力对齐**: 按"订单服务、用户服务、库存服务"而非"DAO 层、Service 层"拆
- **限界上下文(来自 [[concepts/methodology/ddd]])**: 是最佳的拆分依据
- **单一职责 + 数据私有**: 每个服务独占数据库,绝不直接读他人数据库
- **Two-Pizza Team**: 每个服务由可被两个披萨喂饱的小团队拥有
- **避免过早拆分**: 单体拆错代价远小于微服务拆错,新项目优先 Modular Monolith

**2. 通信模式**

```
同步:
  REST / GraphQL  ← 前后端 / 跨团队公开 API
  gRPC            ← 服务间高性能、强类型

异步:
  消息队列(Kafka/RabbitMQ/Pulsar)
  事件总线         ← 解耦、削峰、最终一致
```

**事件驱动示例:**

```
[订单服务] --OrderPaid 事件--> [Kafka]
                                  ├──> [履约服务] 创建发货单
                                  ├──> [积分服务] 加积分
                                  └──> [通知服务] 发短信
```

**3. 数据一致性**

跨服务事务不能用 2PC,常用模式:
- **Saga**: 编排式(Orchestration)或编舞式(Choreography),通过补偿事务回滚
- **事件溯源(Event Sourcing) + CQRS**: 写入事件流,读侧投影
- **Outbox 模式**: 业务库与消息发送在本地事务内原子写入

**4. 服务治理基础设施**

| 维度 | 主流方案 |
|------|---------|
| **服务发现** | Consul / Eureka / Kubernetes DNS |
| **API 网关** | Kong / APISIX / Envoy / Spring Cloud Gateway |
| **配置中心** | Nacos / Consul / etcd |
| **限流熔断** | Sentinel / Resilience4j / Istio |
| **链路追踪** | OpenTelemetry / Jaeger / Zipkin |
| **日志** | ELK / Loki + Grafana |
| **指标监控** | Prometheus + Grafana |
| **服务网格** | Istio / Linkerd(把治理下沉到 Sidecar) |
| **容器编排** | Kubernetes(事实标准) |

**5. 服务网格(Service Mesh)**

把流量治理(mTLS、重试、超时、熔断、可观测)从应用代码下沉到 Sidecar 代理(Envoy),让业务代码无侵入获得能力。

```
┌─────────────────┐    ┌─────────────────┐
│ App A           │    │ App B           │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Envoy       │◄┼────┼►│ Envoy       │ │
│ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘
       ▲                      ▲
       │  控制平面 Istiod      │
```

**6. 部署与发布**

- **CI/CD**: 每服务独立流水线
- **容器化**: Docker + K8s 是主流
- **灰度发布**: 金丝雀、蓝绿、流量染色
- **可观测性三支柱**: Logs / Metrics / Traces 缺一不可

## 优势与局限

- ✅ 团队自治,服务独立演进与部署
- ✅ 技术栈自由,可针对场景选最优技术
- ✅ 故障隔离,单服务挂不影响整体
- ✅ 独立扩缩容,按热点服务精准扩
- ❌ 分布式复杂度暴增:网络、一致性、部分失败
- ❌ 运维成本高,需成熟 DevOps、可观测、CI/CD
- ❌ 跨服务事务困难,需 Saga/Outbox 等模式
- ❌ 接口契约管理成本高,版本兼容易出问题
- ❌ 调试困难,问题可能跨多个服务
- ❌ 拆分错误代价高,容易变成"分布式单体"
- ❌ 小团队/小业务上,引入微服务通常得不偿失

## 应用场景

- **大型组织**: 多团队并行开发,需技术与发布解耦
- **高并发场景**: 不同服务独立扩缩(如电商大促)
- **业务复杂度高**: 多业务域并行演进
- **遗留系统现代化**: 通过 Strangler Fig 模式渐进拆分
- **多产品线复用**: 共享核心能力(支付、用户、通知)

**反场景:** 初创、MVP、单团队、业务尚未稳定 → 优先 Modular Monolith,业务清晰后再拆分。

## 相关概念

- [[concepts/methodology/ddd]]: 限界上下文是拆分依据
- [[concepts/methodology/bff]]: 微服务前的聚合层,屏蔽后端复杂度
- [[concepts/methodology/clean-architecture]]: 单服务内部组织
- event driven architecture: 微服务异步协作模式
- saga pattern: 分布式事务方案
- service mesh: 治理下沉
- api gateway: 入口流量治理
- modular monolith: 微服务的克制替代
