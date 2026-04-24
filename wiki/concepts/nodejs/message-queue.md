---
title: "消息队列"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [nodejs, message-queue, rabbitmq, redis, architecture, backend]
status: active
sources: []
---

# 消息队列

## 定义

消息队列（Message Queue / MQ）是一种异步通信中间件，生产者把消息写入队列，消费者按自身节奏取出处理。它实现服务间解耦、削峰填谷、异步任务、可靠传递、广播/事件驱动等模式，是分布式后端不可或缺的基础设施。代表实现包括 Redis（BullMQ）、RabbitMQ、Kafka、NATS、AWS SQS/SNS、Pulsar 等，各自定位不同。

## 工作原理

**核心模型**：Producer → Queue/Topic → Consumer。变体包括点对点（一条消息一个消费者消费）与发布订阅（多个订阅者各收一份）。

**Redis + BullMQ（任务队列）**：在 Redis 上实现的轻量任务队列，适合后台 Job：邮件发送、缩略图生成、报表导出。支持延迟任务、定时任务（cron）、优先级、重试与速率限制，开发体验最简单。

```js
import { Queue, Worker } from 'bullmq';
const q = new Queue('email', { connection });
await q.add('welcome', { userId: 1 }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });

new Worker('email', async (job) => {
  await sendEmail(job.data.userId);
}, { connection });
```

**RabbitMQ（AMQP，复杂路由）**：Exchange（direct/topic/fanout/headers）+ Binding + Queue 的灵活路由模型。适合需要按 routing key 精细分发的业务事件、RPC 模拟、跨语言场景。提供 ack/nack、死信队列（DLX）、TTL、镜像队列。

**Kafka（高吞吐事件流）**：分布式提交日志，按 Partition 顺序持久化，消息保留可达天/周。Consumer 通过 offset 自行追踪位置，支持回放与多消费组并行。适合：日志收集、事件溯源（Event Sourcing）、CDC、用户行为流、Streaming 计算（Flink/Spark）。吞吐可达百万 msg/s，但运维与延迟高于 RabbitMQ。

**关键语义**：
- **At-most-once**：可能丢，不会重
- **At-least-once**（最常见）：不会丢，可能重
- **Exactly-once**：复杂代价高，Kafka 在事务+幂等生产者下可达成

**Ack 与重试**：消费者处理成功后显式 ack；失败则 nack 并按策略重试。多次失败进入**死信队列**人工介入。指数退避避免雪崩。

**幂等性**：因为 at-least-once 是常态，**消费者必须幂等**。常见手法：以业务主键 + 状态机判重；写一张 `processed_messages(message_id PK)` 表，插入冲突即跳过；下游接口支持 `Idempotency-Key`。

```js
// 幂等消费：先尝试插入消息 ID
try { await db.processed.insert({ id: msg.id }); }
catch (e) { if (e.code === 'UNIQUE_VIOLATION') return; throw e; }
await handle(msg);
```

**选型建议**：任务队列选 BullMQ；微服务事件总线选 RabbitMQ/NATS；大数据/事件流选 Kafka；云原生托管选 SQS+SNS/EventBridge。

## 优势与局限

- ✅ 解耦生产消费，独立伸缩
- ✅ 削峰填谷，保护下游
- ✅ 失败重试与死信兜底
- ❌ 引入额外组件，运维成本上升
- ❌ 调试链路长，需追踪 ID
- ❌ 幂等与顺序保证难

## 应用场景

- 异步任务：邮件、通知、缩略图、PDF 生成
- 系统解耦：订单创建 → 库存/支付/物流各自订阅
- 事件溯源 / CQRS / CDC 数据同步
- 流量削峰：秒杀写入先入队再消费

## 相关概念

- [[concepts/nodejs/event-loop]]: 消费者基于事件循环执行
- [[concepts/nodejs/restful-design]]: 同步 RPC 的异步替代方案
