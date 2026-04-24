---
title: "领域驱动设计 DDD"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [methodology, architecture, ddd]
status: active
sources: []
---

# 领域驱动设计 DDD

## 定义

领域驱动设计(Domain-Driven Design,DDD)是 Eric Evans 在 2003 年提出的一套软件设计方法论,核心思想是:**把业务领域(Domain)放在软件设计的中心**,让代码模型直接映射业务专家头脑中的概念,通过持续提炼通用语言(Ubiquitous Language)、划分限界上下文(Bounded Context)、构建富领域模型(Rich Domain Model),应对复杂业务系统的长期演进。DDD 不是技术框架,而是一套战略级(领域划分)与战术级(模型构建)结合的设计方法。

## 工作原理

**1. 战略设计(Strategic Design)**

- **通用语言(Ubiquitous Language)**: 业务方与开发者使用同一套术语。"订单"在代码、文档、UI、对话中含义完全一致
- **限界上下文(Bounded Context)**: 一个模型只在一个上下文内有效。"商品"在订单上下文是 SKU,在仓储上下文是货位,虽同名但是不同模型,通过 ACL(防腐层)翻译
- **上下文映射(Context Map)**: 显式刻画上下文之间的关系——共享内核、客户/供应商、防腐层、开放主机服务、发布订阅

```
[订单上下文] --(防腐层)--> [遗留库存上下文]
[订单上下文] --(发布事件)--> [履约上下文]
[订单上下文] --(共享内核: User)--> [用户上下文]
```

**2. 战术设计(Tactical Design)**

构建块层层组合：

- **值对象(Value Object)**: 无 ID,通过属性比较相等。`Money(100, "CNY")`、`Address`。**不可变**
- **实体(Entity)**: 有唯一 ID,生命周期内属性可变。`User(id=42)`
- **聚合(Aggregate)**: 一组实体+值对象的事务一致性边界,有唯一聚合根(Aggregate Root)。外部只能通过聚合根访问内部对象
- **聚合根(Aggregate Root)**: 聚合的入口,保证不变量(invariant)
- **领域服务(Domain Service)**: 不属于任何实体的业务逻辑,如"转账"涉及两个 Account
- **仓储(Repository)**: 聚合的持久化抽象,只对聚合根开放
- **领域事件(Domain Event)**: 业务上有意义的"已发生"事实,如 `OrderPaid`,驱动跨上下文协作

**3. 代码示例**

```ts
// 值对象
class Money {
  constructor(public readonly amount: number, public readonly currency: string) {
    if (amount < 0) throw new Error('amount must be >= 0');
  }
  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error('currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }
}

// 聚合根
class Order {
  private items: OrderItem[] = [];
  private status: OrderStatus = 'CREATED';

  constructor(public readonly id: OrderId, private readonly customerId: CustomerId) {}

  addItem(sku: SKU, qty: number, price: Money) {
    if (this.status !== 'CREATED') throw new Error('only editable when CREATED');
    this.items.push(new OrderItem(sku, qty, price));
  }

  pay(): DomainEvent[] {
    if (this.items.length === 0) throw new Error('empty order');
    this.status = 'PAID';
    return [new OrderPaid(this.id, this.totalAmount())];
  }

  private totalAmount(): Money { /* ... */ }
}

// 仓储接口在领域层
interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;
}
```

**4. 分层架构(常与 [[concepts/methodology/clean-architecture]] 结合)**

```
┌─────────────────────────────┐
│ Interface (HTTP/CLI/UI)     │
├─────────────────────────────┤
│ Application (用例编排)       │
├─────────────────────────────┤
│ Domain (实体/聚合/领域服务)   │ ← 核心,不依赖任何外部
├─────────────────────────────┤
│ Infrastructure (DB/MQ/外部) │
└─────────────────────────────┘
```

依赖方向从外向内:Application 调用 Domain,Infrastructure 实现 Domain 定义的接口(依赖倒置)。

**5. 事件风暴(Event Storming)**

DDD 推崇的协作式建模工作坊:用便利贴在墙上贴出业务事件、命令、聚合,在数小时内对齐业务认知,识别上下文边界。

## 优势与局限

- ✅ 业务复杂度高时显著提升可维护性,模型可演进数年
- ✅ 通用语言消除业务方与开发者沟通成本
- ✅ 限界上下文天然指导 [[concepts/methodology/microservices]] 拆分
- ✅ 富领域模型让业务规则集中,避免"贫血模型 + 服务层堆逻辑"
- ❌ 学习曲线陡,团队需有经验领头
- ❌ 简单 CRUD 场景过度设计,得不偿失
- ❌ ORM 与聚合一致性边界冲突需技巧
- ❌ "建模"耗时,短期项目难体现价值
- ❌ 滥用 DDD 术语而无实质理解很常见(伪 DDD)

## 应用场景

- **复杂业务系统**: 保险、银行、电商履约、ERP、SaaS 平台
- **微服务拆分**: 用限界上下文指导服务边界
- **遗留系统现代化**: 用防腐层包裹遗留,新模块用 DDD 重构
- **多团队协作**: 上下文映射明确各团队职责边界
- **事件驱动架构(EDA)**: 领域事件天然驱动跨服务协作

## 相关概念

- [[concepts/methodology/clean-architecture]]: 与 DDD 互补的架构组织方式
- [[concepts/methodology/microservices]]: DDD 限界上下文是拆分依据
- [[concepts/methodology/bff]]: 面向上下文的前端聚合层
- event driven architecture: 领域事件驱动
- cqrs: 与 DDD 配套的读写分离模式
- hexagonal architecture: 端口与适配器,与 DDD 思想一致
