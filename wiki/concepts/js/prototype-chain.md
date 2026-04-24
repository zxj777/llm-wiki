---
title: "原型链与继承"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [javascript, prototype, oop, frontend]
status: active
sources: []
---

# 原型链与继承

## 定义
原型链（Prototype Chain）是 JavaScript 实现对象继承与属性共享的核心机制。每个对象都有一个内部链接 `Prototype`（可通过 `__proto__` 或 `Object.getPrototypeOf` 访问），指向另一个对象——其原型。当访问对象的属性时，引擎沿原型链向上查找，直到找到属性或到达链顶 `null`。ES6 的 `class` 语法只是这一机制的语法糖，本质仍是原型继承，与 Java/C++ 的基于类的继承存在显著差异。

## 工作原理
关键关系：
- 每个**函数**都有 `prototype` 属性，指向一个原型对象
- 通过 `new F()` 创建的实例的 `__proto__` 指向 `F.prototype`
- `F.prototype.__proto__` 通常指向 `Object.prototype`
- `Object.prototype.__proto__ === null`，链终止

属性查找规则：先查实例自身，再沿 `__proto__` 链上溯。这使得原型上的方法被所有实例共享，节省内存。

```js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return `${this.name} speaks`; };

function Dog(name) { Animal.call(this, name); }
Dog.prototype = Object.create(Animal.prototype); // 建立原型链
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function () { return 'woof'; };

const d = new Dog('Rex');
d.speak(); // 'Rex speaks' —— 沿链找到 Animal.prototype.speak
d instanceof Dog;    // true
d instanceof Animal; // true
```

ES6 class 语法糖：

```js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} speaks`; }
}
class Dog extends Animal {
  bark() { return 'woof'; }
}
```

`extends` 同时建立了实例链（`Dog.prototype.__proto__ === Animal.prototype`）和静态链（`Dog.__proto__ === Animal`），所以静态方法也能继承。`instanceof` 通过判断右侧构造函数的 `prototype` 是否在左侧对象的原型链上来工作；`Object.create(proto)` 直接创建一个以 `proto` 为原型的新对象，绕过构造函数。

## 优势与局限
- ✅ 方法共享于原型上，实例只存自有数据，节省内存
- ✅ 运行时可动态修改原型（mixin、polyfill）
- ✅ 灵活，可实现多种继承模式（组合/寄生/原型链）
- ❌ 链过长会降低属性查找性能
- ❌ 修改内置原型（`Array.prototype.xxx = ...`）易破坏全局一致性
- ❌ 与基于类的语言心智模型不同，初学者易困惑

## 应用场景
- **框架内部**：Vue/React 组件类继承自基类，复用生命周期
- **Polyfill**：在 `Array.prototype` 上补齐新版方法
- **Mixin**：用 `Object.assign(Target.prototype, mixin)` 注入方法集
- **类型判断**：`instanceof` 与原型链检测自定义类型

## 相关概念
- [[concepts/js/closures]]: 与原型并列的两大代码组织机制
- [[concepts/js/this-binding]]: 原型方法中的 this 绑定决定调用语义
