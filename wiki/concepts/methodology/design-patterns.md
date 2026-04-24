---
title: "设计模式"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [methodology, patterns, design]
status: active
sources: []
---

# 设计模式

## 定义

设计模式(Design Patterns)是软件设计中针对反复出现的问题所形成的、可复用的解决方案模板。1994 年 GoF(Gang of Four,Erich Gamma 等四人)在《Design Patterns: Elements of Reusable Object-Oriented Software》中归纳了 23 个经典面向对象模式,分为创建型、结构型、行为型三类,成为软件工程的"通用词汇"。设计模式不是可直接复制的代码,而是"问题—场景—权衡—结构"的一组思维范式;它的真正价值是让开发者在沟通与思考中拥有共同语言,而不是被生硬套用。

## 工作原理

**1. 三大类与代表模式**

| 类别 | 解决的问题 | 代表模式 |
|------|-----------|---------|
| **创建型(Creational)** | 对象如何创建 | 工厂方法、抽象工厂、单例、建造者、原型 |
| **结构型(Structural)** | 对象如何组合 | 适配器、装饰器、代理、外观、组合、桥接、享元 |
| **行为型(Behavioral)** | 对象如何协作 | 观察者、策略、命令、迭代器、模板方法、状态、责任链、中介者、备忘录、访问者、解释器 |

**2. 创建型代表**

```ts
// 工厂方法:把"用哪个具体类"延迟到子类/配置
interface Notifier { send(msg: string): void; }
class EmailNotifier implements Notifier { send(m){/*...*/} }
class SmsNotifier implements Notifier { send(m){/*...*/} }

function createNotifier(type: string): Notifier {
  switch(type) {
    case 'email': return new EmailNotifier();
    case 'sms':   return new SmsNotifier();
    default: throw new Error('unknown');
  }
}

// 建造者:链式构建复杂对象
const query = new QueryBuilder()
  .from('users').where('age >', 18).orderBy('id').limit(10).build();
```

**3. 结构型代表**

```ts
// 适配器:让接口不兼容的类一起工作
class LegacyLogger { logIt(level, msg) {/*老接口*/} }
class LoggerAdapter implements ModernLogger {
  constructor(private legacy: LegacyLogger) {}
  log(msg: string) { this.legacy.logIt('INFO', msg); }
}

// 装饰器:不修改原类的前提下扩展行为
function withRetry(fn, max=3) {
  return async (...args) => {
    for (let i=0; i<max; i++) {
      try { return await fn(...args); }
      catch(e) { if (i===max-1) throw e; }
    }
  };
}
const reliableFetch = withRetry(fetch);
```

**4. 行为型代表**

```ts
// 观察者:一对多事件订阅,前端 UI 数据流核心
class EventBus {
  private listeners: Record<string, Function[]> = {};
  on(evt, fn) { (this.listeners[evt] ??= []).push(fn); }
  emit(evt, payload) { (this.listeners[evt] ?? []).forEach(fn => fn(payload)); }
}

// 策略:运行时切换算法
const strategies = {
  flat: (price) => price * 0.9,
  vip:  (price) => price * 0.7,
  none: (price) => price
};
function checkout(price, strategy: keyof typeof strategies) {
  return strategies[strategy](price);
}
```

**5. 前端常见模式**

| 模式 | 前端落地 |
|------|---------|
| **观察者** | RxJS、Vue 响应式、EventEmitter、Pub/Sub |
| **策略** | 表单校验规则、支付/排序/路由策略 |
| **工厂** | React 组件工厂、createElement、Hooks 创建 |
| **装饰器** | HOC、Vue Mixin、TS @decorator |
| **代理** | Vue 3 reactive(Proxy 实现)、API 拦截器 |
| **命令** | Redux action、Undo/Redo、CQRS 命令 |
| **状态** | XState 状态机、表单状态机 |
| **责任链** | Express/Koa 中间件、Axios interceptors |
| **组合** | React 组件树、Render Props |
| **单例** | Redux store、全局 EventBus(慎用) |
| **适配器** | 不同 API 的统一封装(LiteLLM 类) |
| **外观** | 一组复杂 API 的简化入口(SDK 设计) |

**6. 现代演进**

- **函数式偏好**: 闭包/高阶函数 + 不可变数据可替代很多 OO 模式
- **Hook 模式**: React Hooks 实质是组合 + 观察者的现代化表达
- **依赖注入**: NestJS、Angular 把工厂 + IoC 标准化
- **反模式警示**: 单例滥用、过度使用模式("锤子综合症")是常见反例

**7. SOLID 原则**

设计模式背后的指导原则:
- **S** Single Responsibility 单一职责
- **O** Open/Closed 对修改关闭、对扩展开放
- **L** Liskov Substitution 里氏替换
- **I** Interface Segregation 接口隔离
- **D** Dependency Inversion 依赖倒置

## 优势与局限

- ✅ 提供团队"共同语言",一句"用观察者"即对齐设计
- ✅ 经过几十年验证,降低重复设计风险
- ✅ 遵循模式的代码通常更易扩展、易测试
- ✅ 是面试与技术沟通的基础词汇
- ❌ 过度套用导致"为模式而模式",代码反而复杂
- ❌ 函数式 / 现代语言特性已使部分 OO 模式过时
- ❌ 学习时易陷入"分类背诵",忽视背后的设计权衡
- ❌ 团队水平不一时,模式可能被误用甚至破坏

## 应用场景

- **库与框架设计**: 几乎所有主流框架内部大量使用模式
- **重构遗留代码**: 用模式名描述重构方向,沟通高效
- **复杂业务建模**: 状态机、责任链处理复杂流程
- **面向接口编程**: 策略 + 工厂 + 依赖注入是 [[concepts/methodology/clean-architecture]] 的基石
- **组件库 / SDK**: 装饰器、外观、构建者大量出现
- **架构沟通**: 系统设计文档以模式为词汇

## 相关概念

- [[concepts/methodology/clean-architecture]]: 大量依赖工厂、策略、适配器
- [[concepts/methodology/ddd]]: 战术模式(实体、聚合、仓储)是 DDD 的设计模式
- solid principles: 设计模式背后的指导原则
- react patterns: 高阶组件、Render Props、Hooks 等前端模式
- functional programming: 函数式视角下的模式简化
- [[concepts/methodology/microservices]]: 分布式版本的模式(Saga、Circuit Breaker、Sidecar)
