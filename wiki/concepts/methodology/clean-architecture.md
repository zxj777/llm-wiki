---
title: "整洁架构"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [methodology, architecture]
status: active
sources: []
---

# 整洁架构

## 定义

整洁架构(Clean Architecture)是 Robert C. Martin(Uncle Bob)在 2012 年提出的软件架构组织方法,综合了 Hexagonal Architecture(Cockburn)、Onion Architecture(Palermo)、DCI、BCE 等思想。核心原则只有一条:**依赖方向永远从外向内,业务核心不依赖任何外部细节**。无论数据库换 PostgreSQL 为 MongoDB、Web 框架从 Express 换为 Fastify、UI 从 Web 换为 CLI,业务规则代码都不应改一行。这种独立性来自严格的分层与依赖倒置原则(DIP),让系统具备可测试性、可替换性、长期可演进性。

## 工作原理

**1. 同心圆四层(由内向外)**

```
        ┌──────────────────────────────┐
        │  Frameworks & Drivers (外层)  │  Web/DB/UI/外部 API
        │  ┌────────────────────────┐  │
        │  │ Interface Adapters     │  │  Controller/Presenter/Gateway
        │  │  ┌──────────────────┐  │  │
        │  │  │ Use Cases        │  │  │  应用业务规则(用例)
        │  │  │  ┌────────────┐  │  │  │
        │  │  │  │ Entities   │  │  │  │  企业级业务规则
        │  │  │  └────────────┘  │  │  │
        │  │  └──────────────────┘  │  │
        │  └────────────────────────┘  │
        └──────────────────────────────┘
```

**2. 依赖规则(The Dependency Rule)**

源代码依赖只能指向圆心。内层不知道任何外层信息——Entity 不知道有 UseCase,UseCase 不知道有 Controller,Controller 不知道有 Express。

**反转手段是接口(Port):**

```ts
// 内层(use case)定义接口
// application/ports/UserRepository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(u: User): Promise<void>;
}

// application/usecases/RegisterUser.ts
export class RegisterUser {
  constructor(private users: UserRepository, private hasher: PasswordHasher) {}
  async execute(input: RegisterInput): Promise<User> {
    if (await this.users.findById(input.email)) throw new Error('exists');
    const u = User.create(input.email, await this.hasher.hash(input.password));
    await this.users.save(u);
    return u;
  }
}

// 外层(infrastructure)实现接口
// infrastructure/persistence/PrismaUserRepo.ts
export class PrismaUserRepo implements UserRepository { /* ... */ }

// 入口装配(composition root)
const usecase = new RegisterUser(new PrismaUserRepo(prisma), new BcryptHasher());
```

**3. 典型目录结构**

```
src/
├── domain/            # Entities + Value Objects + Domain Services
│   ├── User.ts
│   └── Order.ts
├── application/       # Use Cases + Ports(接口)
│   ├── usecases/
│   └── ports/
├── infrastructure/    # 实现 Ports + 框架适配
│   ├── persistence/   # PrismaUserRepo
│   ├── http/          # Express controllers
│   └── messaging/     # Kafka adapters
└── main.ts            # Composition Root,组装所有依赖
```

**4. 用例(Use Case)粒度**

每个用例对应一个用户故事:`RegisterUser`、`PlaceOrder`、`CancelSubscription`。用例只编排领域对象与端口,自己不含业务规则(规则在 Entity / Domain Service)。这样每个用例可独立测试,模拟所有端口即可。

**5. 与 [[concepts/methodology/ddd]] 的关系**

二者高度互补:DDD 提供"领域如何建模"(Entity、Aggregate、Value Object、Domain Service),Clean Architecture 提供"代码如何分层组织"。生产中常见组合:DDD 战术建模 + Clean Architecture 分层 + Hexagonal Ports/Adapters 命名。

## 优势与局限

- ✅ 业务核心独立于框架,长期可演进
- ✅ 依赖倒置使单元测试无需启动数据库/Web 容器
- ✅ 易于替换基础设施(换 ORM、换 MQ、换 Web 框架)
- ✅ 关注点分离清晰,新人可按层定位代码
- ❌ 简单 CRUD 项目过度设计,样板代码多
- ❌ 大量接口与 DTO 增加心智负担
- ❌ 团队需统一遵循,否则极易"跨层访问"破坏架构
- ❌ ORM 实体与领域实体的映射成本(Entity ↔ ORM Entity)
- ❌ 性能敏感路径中,层层调用可能引入开销

## 应用场景

- **中大型业务系统**: SaaS、ERP、金融、电商核心
- **预期长期演进的产品**: 5+ 年维护周期
- **需要高测试覆盖率的系统**: 核心业务规则可纯单元测试
- **可能更换技术栈的项目**: 框架/数据库选型未定
- **微服务的内部架构**: 每个服务内部用 Clean Architecture 组织

## 相关概念

- [[concepts/methodology/ddd]]: 内层建模方法的最佳搭档
- hexagonal architecture: Ports & Adapters,思想同源
- dependency inversion principle: Clean Architecture 的核心 SOLID 原则
- [[concepts/methodology/microservices]]: 单服务内部组织
- [[concepts/methodology/design-patterns]]: 大量使用工厂、策略、适配器
- [[concepts/methodology/bff]]: Web 层在 Clean Architecture 中属外层适配器
