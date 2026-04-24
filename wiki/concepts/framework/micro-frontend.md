---
title: "微前端架构"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [framework, micro-frontend, architecture, engineering, frontend]
status: active
sources: []
---

# 微前端架构

## 定义

微前端（Micro-Frontends）把后端"微服务"思想引入前端：将一个大型 SPA 拆分为多个**独立开发、独立部署、独立运行**的子应用，由一个主应用（Shell / Container）在运行时组合渲染。目的是解决巨型前端代码库带来的协作冲突、技术栈锁定、构建缓慢、上线串行等问题，让多个团队能并行交付，并允许遗留系统与新技术栈共存。

## 工作原理

按集成方式可分为几类：

1. **iframe**：最古老的隔离方案。天然隔离样式与 JS，但路由、通信、登录、SEO、性能都很差，且 UI 体验割裂（弹窗无法跨边界）。
2. **Web Components + Custom Elements**：把子应用打包成自定义元素，主应用像用普通标签一样使用。利用 Shadow DOM 做样式隔离。标准化但生态成熟度有限。
3. **Single-SPA**：通过路由把不同子应用挂载/卸载到同一页面，子应用暴露 `bootstrap / mount / unmount` 三个生命周期函数。
4. **qiankun**（阿里基于 Single-SPA）：补全 JS 沙箱（Proxy 代理 window）和样式隔离，提供完整生命周期与通信机制。
5. **Module Federation**（Webpack 5）：以"运行时动态加载远程模块"为核心，主应用直接 `import('app2/Button')` 拉取另一构建产物中的模块，可共享依赖（React 只下载一份）。

```js
// Webpack 5 ModuleFederationPlugin（消费方）
new ModuleFederationPlugin({
  remotes: { app2: 'app2@https://cdn.example.com/app2/remoteEntry.js' },
  shared: ['react', 'react-dom'],
});
```

主要挑战：

- **样式隔离**：CSS 全局污染。方案有 Shadow DOM、CSS Modules、CSS-in-JS、动态 scope 前缀（qiankun）
- **JS 沙箱**：避免子应用污染全局 window。方案有快照沙箱、Proxy 沙箱、iframe 沙箱
- **状态共享与通信**：通过自定义事件、共享 Store、props down + events up、URL 参数
- **公共依赖**：避免每个子应用重复打包 React/Vue。Module Federation 的 `shared` 是最佳解
- **路由协调**：主应用决定整体路由，子应用接管自己的子路由
- **性能**：首屏多次加载、依赖重复、CSS/JS 体积膨胀

```js
// qiankun 主应用注册
registerMicroApps([
  { name: 'shop', entry: '//shop.example.com', container: '#sub', activeRule: '/shop' },
]);
start();
```

适用场景：超大型 B 端系统（中后台）、多团队多技术栈共存、收购/合并后系统融合、把巨石应用渐进式重写。**不适用**于：中小型项目（拆分成本远高于收益）、强交互一致性的 C 端产品、对首屏极敏感的场景。

## 优势与局限

- ✅ 团队自治、独立发布
- ✅ 技术栈无关，可逐步迁移遗留系统
- ✅ 故障隔离，单个子应用挂掉不影响整体
- ❌ 工程复杂度显著上升（CI/CD、监控、调试都更难）
- ❌ 性能成本（多次加载、依赖重复、样式/沙箱开销）
- ❌ 用户体验易割裂，需要严格的设计系统约束

## 应用场景

- 大型中后台（阿里云、腾讯云控制台）
- 银行/保险等遗留系统改造
- 多业务线整合到统一门户
- 设计系统升级期间新旧组件并存

## 相关概念

- [[concepts/engineering/module-federation]]: 当前最主流的微前端实现机制
- [[concepts/framework/router-internals]]: 主应用与子应用的路由必须协商权责
- [[concepts/engineering/monorepo]]: 微前端常与 monorepo 配合管理子应用代码
