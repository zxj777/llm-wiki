---
title: "前端设计模式"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, design-patterns, architecture, frontend]
status: active
sources: []
---

# 前端设计模式

## 定义

设计模式（Design Patterns）是针对常见软件设计问题的可复用解决方案。在前端开发中，许多经典 GoF 模式以特定形态深度融入框架与库的设计——观察者模式驱动响应式系统、单例模式实现全局 Store、装饰器模式形成 React HOC、代理模式让 Vue 3 实现响应式。理解这些模式有助于读懂源码、设计可维护的架构、用恰当抽象解决复杂问题。

## 工作原理

**观察者模式（Observer）**：被观察者（Subject）维护观察者列表，状态变化时通知所有观察者。Node.js 的 `EventEmitter` 是直接体现：

```js
class Emitter {
  constructor() { this.listeners = {}; }
  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); }
  emit(evt, data) { (this.listeners[evt] || []).forEach((fn) => fn(data)); }
}
```

**发布订阅 vs 观察者**：观察者中 Subject 直接持有 Observer 列表，两者强耦合；发布订阅在中间多了 **Event Bus / Channel**，发布者与订阅者通过主题字符串解耦，互不感知。框架级事件总线（如 Vue 2 的 `$bus`）属于发布订阅。

**单例模式（Singleton）**：保证一个类只有一个实例，全局共享。前端常见于 logger、全局 store、HTTP 客户端实例：

```js
let instance = null;
class Logger {
  static getInstance() { return instance ||= new Logger(); }
}
```

**工厂模式（Factory）**：用一个函数封装"根据参数创建不同对象"的逻辑。React 的 `React.createElement` 是工厂；UI 库根据类型字段创建不同组件实例也是工厂。

**策略模式（Strategy）**：把一组可互换算法封装成对象，运行时根据条件选择。表单验证常用：每个字段配置一个验证策略，引擎遍历执行：

```js
const strategies = {
  required: (v) => v != null && v !== '',
  minLength: (v, n) => v.length >= n,
  email: (v) => /^\S+@\S+$/.test(v),
};
```

**代理模式（Proxy）**：用一个代理对象拦截对目标对象的访问。Vue 3 / MobX 的响应式基于 ES Proxy；前端"接口请求拦截器"也是代理。

**装饰器模式（Decorator）**：在不修改原对象的前提下动态添加能力。React **HOC**（Higher-Order Component）就是装饰器：接收组件返回增强版组件。AOP 切面（如方法埋点、错误捕获）也用装饰器实现：

```js
function withLogger(Comp) {
  return function Logged(props) {
    console.log('render', Comp.name);
    return <Comp {...props} />;
  };
}
```

**命令模式（Command）**：把"操作"封装成对象，便于排队、撤销、重放。富文本编辑器、设计工具的撤销/重做是经典案例：每个用户操作生成一个 Command 对象推入栈，撤销时 pop 并执行其逆操作。

**适配器模式**：把不兼容接口转换为期望接口（封装第三方 SDK 为统一 API）。**外观模式**：对一组复杂接口提供简化入口（封装一组 fetch 调用为 service 方法）。**责任链**：请求依次经过多个处理器（Express/Koa 中间件）。

实战要点：模式不是目的，是沟通词汇。识别问题特征再套用，避免"为模式而模式"导致的过度抽象。

## 优势与局限

- ✅ 提供通用术语，降低团队沟通成本
- ✅ 帮助识别设计中的可复用结构
- ✅ 引导走向松耦合、可扩展的架构
- ❌ 滥用导致过度设计，简单问题复杂化
- ❌ 部分 GoF 模式在 JS 中已被语言特性内化（高阶函数 vs 策略）
- ❌ 模式是描述而非教条，不应机械套用

## 应用场景

- 框架/库设计：观察者、代理、装饰器、工厂遍布
- 业务架构：策略（验证/计费规则）、命令（撤销重做）、适配器（多供应商接入）
- 复杂表单与流程编排：策略 + 责任链
- 性能优化中的代理（懒加载、缓存代理）

## 相关概念

- [[concepts/framework/state-management]]: Flux/Redux 是观察者 + 命令模式的工程化
- [[concepts/js/proxy-reflect]]: 代理模式在 JS 中的语言级实现
