---
title: "路由原理"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [framework, router, history, hash, frontend]
status: active
sources: []
---

# 路由原理

## 定义

前端路由（Client-side Router）让 SPA 在不刷新整页的前提下切换视图，并保持 URL 与界面状态同步。其核心要做三件事：**监听 URL 变化**、**根据 URL 匹配组件**、**渲染对应视图并维护历史栈**。常见实现有 Hash 路由和 History 路由两种模式，配合参数解析、嵌套路由、导航守卫、懒加载等能力，构成现代框架（React Router、Vue Router、Next.js Router）的路由层。

## 工作原理

**Hash 路由**利用 URL 中 `#` 后面的部分变化不会触发页面刷新这一特性，监听 `window.onhashchange` 事件来感知路由变化。优点是兼容性极好（IE8+），不需要服务器配合；缺点是 URL 不美观，且 `#` 之后的内容不会被发送到服务器，SEO 和某些场景受限。

```js
window.addEventListener('hashchange', () => {
  const path = location.hash.slice(1);
  render(matchRoute(path));
});
```

**History 路由**基于 HTML5 History API：`pushState` / `replaceState` 修改 URL 但不触发刷新，`popstate` 监听浏览器前进后退。URL 干净（如 `/users/123`），但需要服务器把所有路径都回退到 `index.html`，否则刷新会 404。

```js
function navigate(path) {
  history.pushState({}, '', path);
  render(matchRoute(path));
}
window.addEventListener('popstate', () => render(matchRoute(location.pathname)));
```

**路径匹配**通常基于路径模板编译成正则：`/users/:id` 会被编译成 `/^\/users\/([^/]+)$/`，匹配时把捕获组赋给 `params.id`；通配符 `*` 匹配任意剩余路径用于 404 页面。嵌套路由维护一棵路由树，每层负责自己的 outlet/RouterView，匹配时从根向下逐层确定渲染哪些组件。

**导航守卫**（如 Vue Router 的 `beforeEach`、React Router 的 `loader` / `action`）在路由切换前后插入钩子，可用于鉴权、数据预取、离开确认。**懒加载**通过动态 `import()` 把每个路由对应的组件拆成独立 chunk，访问时再加载，配合 `React.lazy` + `Suspense` 实现按需加载。

```js
const routes = [
  { path: '/users/:id', component: () => import('./User.vue') },
];
```

**SSR 路由匹配**在服务端用同一套路由表匹配请求 URL，渲染出完整 HTML，浏览器拿到后做 **Hydration**：复用现有 DOM，仅绑定事件和恢复响应式，避免重渲染。Next.js / Nuxt 的文件系统路由（File-based Routing）是路由表的一种约定式生成方式。

## 优势与局限

- ✅ 切换无刷新，体验接近原生应用
- ✅ 支持懒加载、嵌套、动态参数等丰富能力
- ✅ History 模式 URL 干净，利于 SEO（配合 SSR）
- ❌ History 模式需要服务器配合 fallback
- ❌ Hash 模式 URL 不美观且 SEO 弱
- ❌ 大型应用路由表膨胀，需要权限/分组等额外组织手段

## 应用场景

- 单页应用的多页面切换（React Router、Vue Router）
- SSR 框架的统一路由（Next.js、Nuxt、Remix）
- 微前端中的子应用路由协调
- 移动端混合 App 的页面栈管理

## 相关概念

- [[concepts/framework/ssr-csr-ssg]]: SSR 需要服务端与客户端共用同一套路由匹配
- [[concepts/engineering/code-splitting]]: 路由级分割是代码分割最常见的应用
- [[concepts/framework/micro-frontend]]: 微前端中主应用与子应用需要协商路由控制权
