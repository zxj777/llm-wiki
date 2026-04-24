---
title: "Module Federation"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [engineering, module-federation, webpack, micro-frontend, frontend]
status: active
sources: []
---

# Module Federation

## 定义

Module Federation 是 Webpack 5 引入的核心特性，支持**多个独立构建的应用在运行时通过网络互相加载对方暴露的模块**。它打破了"一次构建产出一个孤立 bundle"的传统，让多个 webpack 构建产物之间像在同一个应用内一样 `import`，并能共享公共依赖（同一份 React 只下载一次）。它是当前微前端架构最主流的技术底座，也用于"跨项目共享组件 / 工具"等运行时模块共享场景。

## 工作原理

每个参与 Module Federation 的应用通过 `ModuleFederationPlugin` 配置自己的角色：

- **Host（消费者）**：声明 `remotes`，运行时从远程拉取模块
- **Remote（提供者）**：声明 `exposes`，把指定模块暴露出去
- **Shared（共享依赖）**：声明 `shared`，多个应用共用一份依赖（如 React）

构建时每个 Remote 会额外产出一个 `remoteEntry.js`，里面是模块清单和加载逻辑。Host 启动时会先加载这些 `remoteEntry.js`，运行时调用 `import('app2/Button')` 时动态拉取对应 chunk 并执行。

```js
// app2 (Remote)
new ModuleFederationPlugin({
  name: 'app2',
  filename: 'remoteEntry.js',
  exposes: { './Button': './src/Button' },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
});

// app1 (Host)
new ModuleFederationPlugin({
  name: 'app1',
  remotes: { app2: 'app2@https://cdn.example.com/app2/remoteEntry.js' },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
});
```

```js
// app1 中使用
const Button = React.lazy(() => import('app2/Button'));
```

**Shared 依赖协商**：`singleton: true` 表示该依赖必须只有一份实例（React 必须如此，否则 Hooks 会出错）。Webpack 在运行时根据每个应用声明的版本协商使用哪个版本，可设 `requiredVersion` 锁版本，`strictVersion` 不匹配时直接报错。

**动态 Remote**：上面是静态配置，实际场景常需运行时动态决定加载哪个远程。Module Federation 暴露了底层 API（`__webpack_init_sharing__` / `__webpack_share_scopes__` / `loadRemote`），可以在运行时拼接 Remote 地址并加载，从而实现"插件市场"式的扩展。

```js
async function loadRemote(name, url) {
  await __webpack_init_sharing__('default');
  const container = await import(/* webpackIgnore: true */ url);
  await container.init(__webpack_share_scopes__.default);
  return container;
}
```

**与传统微前端方案对比**：

- iframe / qiankun：以"应用"为粒度集成，沙箱与生命周期是核心
- Module Federation：以"模块"为粒度集成，更接近 npm 但运行时分发，适合既要独立部署、又要细粒度共享代码的场景

**陷阱**：

- Shared 依赖版本不一致引发隐蔽 bug（如双 React 实例）
- Remote 地址变更需要前端集中通知 / 配置中心
- Remote 不可用时 Host 必须有降级策略
- 仅 Webpack 5+ 支持；Vite 需用 `@originjs/vite-plugin-federation`，行为差异需注意

## 优势与局限

- ✅ 真正运行时的模块共享，独立构建独立部署
- ✅ Shared 机制避免重复依赖，节省体积
- ✅ 与微前端、组件市场、A/B 测试结合灵活
- ❌ 调试链路复杂（跨应用、跨网络）
- ❌ 版本协商失败时排查困难
- ❌ TypeScript 类型同步需要额外工具（@module-federation/typescript）

## 应用场景

- 微前端：主应用动态加载子应用
- 跨业务线共享组件库 / 设计系统
- 插件化产品（在线编辑器、低代码平台）
- 灰度发布：新版本以独立 Remote 形式投放给部分用户

## 相关概念

- [[concepts/framework/micro-frontend]]: Module Federation 是当前微前端的主流实现机制
- [[concepts/engineering/bundler-internals]]: Module Federation 是 Webpack 5 的核心新能力
