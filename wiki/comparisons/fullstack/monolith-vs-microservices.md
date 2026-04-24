---
title: "Monolith vs Microservices"
type: comparison
created: 2026-04-02
updated: 2026-04-02
tags: [architecture, microservices, monolith, backend]
status: active
sources: []
---

# Monolith vs Microservices

单体架构（Monolith）与微服务架构（Microservices）是后端系统组织方式的两种典型选择。微服务在 2014 年由 Martin Fowler 与 James Lewis 推广后曾被普遍视为「现代标配」，但近年来「modular monolith」与「微服务过度拆分」反思也逐渐成为主流共识。

## 对比维度

| 维度 | 单体 Monolith | 微服务 Microservices |
|------|--------------|----------------------|
| 部署单元 | 单一可执行/包 | 多个独立服务 |
| 进程通信 | 函数调用（进程内） | 网络调用（HTTP/gRPC/消息队列） |
| 数据库 | 通常共享一个 | 每服务独立数据库 |
| 团队协作 | 适合小团队，强协调 | 适合多团队并行，弱耦合 |
| 部署频率 | 全量部署 | 各服务独立部署 |
| 故障隔离 | 一处崩溃全停 | 单服务故障不影响他人（理论上） |
| 一致性 | 进程内事务易得 | 跨服务一致性难（Saga / 事件） |
| 可观测性 | 简单（单一日志） | 复杂（分布式追踪、聚合日志） |
| 运维复杂度 | 低 | 高（K8s、服务网格、CI/CD 矩阵） |
| 性能（同步调用） | 高（无网络） | 低（网络与序列化开销） |
| 技术栈灵活性 | 单一栈为主 | 各服务可独立选型 |
| 启动速度 | 项目大时变慢 | 单服务快，但整体环境复杂 |

## 分析

### 复杂度的本质

单体把复杂度集中在「代码内部」：模块边界靠规范与团队约束维持，违反容易但调用便宜。微服务把复杂度迁移到「系统之间」：物理边界明确，但你必须处理网络不可靠、最终一致性、版本兼容、分布式事务、调用链追踪。

> "你不会摆脱复杂度，只是改变它的位置。" — 这是微服务最常被低估的真相。

### 团队拓扑（Conway's Law）

Conway 定律指出：系统结构会反映组织结构。微服务真正发挥威力的前提是有多个**独立、自治**的团队，每队拥有从开发、部署到运维的端到端责任。少于 ~30 人的团队大概率不需要微服务，强行拆分只会带来分布式单体（distributed monolith）。

### 数据一致性

单体内部的数据库事务是免费的；微服务跨服务的一致性需要复杂方案：
- **Saga 模式**：长事务拆分为本地事务 + 补偿动作。
- **事件驱动 + 最终一致**：通过消息队列异步同步状态。
- **Outbox 模式**：保证业务库写入与消息发布原子性。

实施成本远高于直接 `BEGIN; ...; COMMIT;`。

### 部署与运维

微服务要求成熟的 DevOps 基建：容器化、Kubernetes、CI/CD、服务网格（Istio/Linkerd）、集中式日志（ELK）、分布式追踪（Jaeger/Tempo）、指标（Prometheus）。没有这些工具，微服务调试比单体痛苦数倍。

### Modular Monolith：第三选项

近年广泛兴起的折中方案：单一部署单元，但内部以严格模块边界（package、module、bounded context）组织代码，对外接口清晰。需要时再单独拆出某模块为服务。**Shopify、Basecamp、Stack Overflow** 都是大规模 modular monolith 的成功案例。

### 何时该走向微服务

- 多团队并行开发，部署相互阻塞已是瓶颈；
- 不同子系统的扩展需求差异巨大（如 ML 推理 vs CRUD）；
- 不同子系统对技术栈有强约束（Python ML / Go 网关 / Java 业务）；
- 单体已大到 CI/CD 不可持续。

## 结论

- **新创业 / 小团队 / MVP**：Monolith，且尽量做成 modular monolith。
- **中型团队 / 单一业务域**：Modular Monolith，必要时拆 1–2 个边缘服务（如通知、文件处理）。
- **大型组织 / 多业务线 / 已有 DevOps 能力**：Microservices。
- **绝对不要**：在没有可观测性与自动化部署能力下盲目拆微服务。
- **演进路径**：Monolith → Modular Monolith → Selective Microservices，几乎总比一开始就微服务更稳健。

## 相关
- conway law
- saga pattern
