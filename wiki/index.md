# Wiki 索引

> 最后更新: 2026-04-24 | 页面总数: 172

## 主题

- [[topics/react/source-code]]: React 源码阅读总入口，含20条阅读路径
- [[topics/react/initial-render]]: 首次渲染全链路（createRoot → commitRoot）
- [[topics/react/state-update]]: 状态更新流程（useState/setState）
- [[topics/react/effect-system]]: 副作用系统（useEffect/useLayoutEffect）
- [[topics/react/reconciliation]]: Reconciliation 与 Diff 算法
- [[topics/react/event-system]]: 合成事件系统（事件委托与合成事件）
- [[topics/react/context]]: Context 传播机制（propagateContextChange）
- [[topics/react/ref-system]]: Ref 系统（useRef/forwardRef/useImperativeHandle）
- [[topics/react/concurrent-scheduler]]: 并发模式与 Scheduler（时间切片）
- [[topics/react/lanes]]: Lanes 优先级模型（位掩码优先级）
- [[topics/react/suspense]]: Suspense 与数据加载（Promise throw 机制）
- [[topics/react/bailout]]: Bailout 机制（React.memo/跳过子树）
- [[topics/react/batching]]: 批量更新机制（Auto Batching）
- [[topics/react/transition]]: Transition 与降级渲染（startTransition）
- [[topics/react/profiler]]: Profiler API 与性能采样
- [[topics/react/ssr-hydration]]: SSR 与 Hydration（hydrateRoot/Selective Hydration）
- [[topics/react/error-boundary]]: 错误边界机制（throwException/unwindWork）
- [[topics/react/portals]]: Portals 渲染与事件冒泡
- [[topics/react/strict-mode]]: Strict Mode 内部机制（双重调用）
- [[topics/react/custom-renderer]]: 自定义渲染器与 hostConfig
- [[topics/react/package-architecture]]: React 包架构与 renderer 解耦
- [[topics/ai-flow/ai-coding]]: AI Coding 工程实践（AGENTS.md、Harness Engineering、验证闭环）
- ⭐ [[topics/fullstack/index]]: 全栈知识库总入口（前端/后端/共享板块）
- [[topics/fullstack/frontend]]: 前端总览（JS/浏览器/框架/性能）
- [[topics/fullstack/backend]]: 后端总览（Node/数据/接口/安全）
- [[topics/fullstack/javascript]]: JavaScript 与 TypeScript 语言核心
- [[topics/fullstack/browser-network]]: 浏览器原理与网络协议
- [[topics/fullstack/framework]]: 前端框架原理（虚拟 DOM、响应式、SSR）
- [[topics/fullstack/engineering]]: 工程化（构建、Monorepo、CI/CD）
- [[topics/fullstack/performance]]: 前端性能优化（Core Web Vitals、加载/运行时）
- [[topics/fullstack/nodejs]]: Node.js 与后端实践
- [[topics/fullstack/security]]: Web 安全（XSS/CSRF/CORS/JWT/OAuth）
- [[topics/fullstack/ai-engineering]]: AI 工程化（LLM 集成、RAG、Agent）
- [[topics/fullstack/methodology]]: 架构方法论（DDD、Clean、微服务、Monorepo）
- [[topics/fullstack/interview]]: 面试题与系统设计

## 概念

- [[concepts/react/bailout-optimization]]: Bailout 优化（跳过不需要重渲染的子树）
- [[concepts/react/commit-phase]]: Commit 阶段（DOM 变更与 effect 执行）
- [[concepts/react/concurrent-mode]]: 并发模式（Concurrent Mode）
- [[concepts/react/context-propagation]]: Context 传播（propagateContextChange）
- [[concepts/react/cooperative-scheduling]]: 协作式调度（主动让出主线程）
- [[concepts/react/double-buffering]]: 双缓冲（current 树 vs workInProgress 树）
- [[concepts/react/effect-list]]: 副作用链表（Effect List）
- [[concepts/react/error-propagation]]: 错误传播与捕获（ErrorBoundary 机制）
- [[concepts/react/fiber-architecture]]: Fiber 架构（可中断的链表式渲染单元）
- [[concepts/react/fiber-tree]]: Fiber 树结构（return/child/sibling 三指针）
- [[concepts/react/hooks-internals]]: Hooks 底层机制（dispatcher 注入与链表）
- [[concepts/react/host-config]]: Host Config（宿主配置接口）
- [[concepts/react/hydration]]: Hydration（水合，复用服务端 DOM）
- [[concepts/react/lanes-model]]: Lanes 优先级模型（位掩码）
- [[concepts/react/reconciliation]]: Reconciliation（协调与 diff 算法）
- [[concepts/react/render-phase]]: Render 阶段（可中断，构建 workInProgress 树）
- [[concepts/react/suspense-mechanism]]: Suspense 机制（Promise throw/unwind）
- [[concepts/react/synthetic-events]]: 合成事件（Synthetic Events）
- [[concepts/react/time-slicing]]: 时间切片（Time Slicing，5ms 时间片）
- [[concepts/react/work-loop]]: Work Loop（工作循环，驱动 Fiber 遍历）
- [[concepts/ai-flow/agents-md]]: 给 AI Agent 的项目上下文文件格式（地图而非手册）
- [[concepts/ai-flow/harness-engineering]]: 让 AI 自主完成改构建启动验证闭环的工程方法
- [[concepts/ai-flow/monorepo-harness]]: 在全栈 monorepo 中落地 Harness 的分层治理

### 全栈 / JavaScript
- [[concepts/js/event-loop]]: 事件循环、宏/微任务、渲染时机
- [[concepts/js/closures]]: 闭包原理与作用域链
- [[concepts/js/prototype-chain]]: 原型链与继承
- [[concepts/js/async-programming]]: Promise/async-await/异步编程模型
- [[concepts/js/module-system]]: ESM vs CJS 模块体系
- [[concepts/js/typescript-type-system]]: TS 类型系统（结构化、泛型、条件类型）
- [[concepts/js/garbage-collection]]: V8 垃圾回收（分代、标记清除）
- [[concepts/js/this-binding]]: this 绑定规则
- [[concepts/js/scope-hoisting]]: 作用域与变量提升
- [[concepts/js/iterators-generators]]: 迭代器与生成器
- [[concepts/js/proxy-reflect]]: Proxy 与 Reflect 元编程
- [[concepts/js/weakref-finalization]]: WeakRef 与 FinalizationRegistry

### 全栈 / 浏览器与网络
- [[concepts/browser/rendering-pipeline]]: 浏览器渲染管线（Parse→Style→Layout→Paint→Composite）
- [[concepts/browser/critical-rendering-path]]: 关键渲染路径优化
- [[concepts/browser/http-evolution]]: HTTP/1.1 → HTTP/2 → HTTP/3 演进
- [[concepts/browser/caching]]: 浏览器缓存（强/协商缓存、Service Worker）
- [[concepts/browser/cors]]: CORS 跨域机制（同源策略、预检）
- [[concepts/browser/websocket]]: WebSocket 全双工通信
- [[concepts/browser/storage]]: 浏览器存储（Cookie/Storage/IndexedDB）
- [[concepts/browser/service-worker]]: Service Worker 与 PWA
- [[concepts/browser/security-model]]: 浏览器安全模型（同源、CSP、沙箱）
- [[concepts/browser/dns-resolution]]: DNS 解析过程与优化
- [[concepts/browser/reflow-repaint]]: 重排与重绘
- [[concepts/browser/web-performance-apis]]: Web Performance API（Navigation/Resource/PerformanceObserver）

### 全栈 / 框架原理
- [[concepts/framework/virtual-dom]]: 虚拟 DOM 与 diff
- [[concepts/framework/reactivity-system]]: 响应式系统（Vue/Solid 信号）
- [[concepts/framework/compile-vs-runtime]]: 编译时 vs 运行时框架
- [[concepts/framework/router-internals]]: 前端路由原理（hash/history）
- [[concepts/framework/state-management]]: 状态管理范式
- [[concepts/framework/component-model]]: 组件模型（class/function/web component）
- [[concepts/framework/ssr-csr-ssg]]: 三种渲染模式
- [[concepts/framework/micro-frontend]]: 微前端架构

### 全栈 / 工程化
- [[concepts/engineering/bundler-internals]]: 打包器内部原理
- [[concepts/engineering/tree-shaking]]: Tree Shaking 死代码消除
- [[concepts/engineering/code-splitting]]: 代码分割与按需加载
- [[concepts/engineering/monorepo]]: Monorepo 工程组织（工具视角）
- [[concepts/engineering/cicd]]: CI/CD 流水线
- [[concepts/engineering/design-patterns]]: 工程层常用设计模式
- [[concepts/engineering/bff-pattern]]: BFF 模式（聚合层）
- [[concepts/engineering/module-federation]]: 模块联邦
- [[concepts/engineering/ast-transform]]: AST 转换（Babel/SWC）
- [[concepts/engineering/package-management]]: 包管理与依赖解析

### 全栈 / 性能
- [[concepts/performance/core-web-vitals]]: Core Web Vitals（LCP/INP/CLS）
- [[concepts/performance/lazy-loading]]: 懒加载策略
- [[concepts/performance/virtual-scrolling]]: 虚拟滚动
- [[concepts/performance/image-optimization]]: 图片优化（格式/尺寸/CDN）
- [[concepts/performance/bundle-optimization]]: 产物体积优化
- [[concepts/performance/memory-optimization]]: 内存优化与泄漏排查
- [[concepts/performance/web-worker]]: Web Worker 多线程
- [[concepts/performance/prefetch-preload]]: 资源预取/预加载

### 全栈 / Node.js 与后端
- [[concepts/nodejs/event-loop]]: Node 事件循环（与浏览器差异）
- [[concepts/nodejs/streams]]: 流（Stream）与背压
- [[concepts/nodejs/middleware-pattern]]: 中间件模式
- [[concepts/nodejs/restful-design]]: RESTful API 设计
- [[concepts/nodejs/graphql]]: GraphQL 接口范式
- [[concepts/nodejs/sql-vs-nosql]]: 关系型 vs 文档型存储
- [[concepts/nodejs/orm-query-builder]]: ORM 与 Query Builder
- [[concepts/nodejs/auth-patterns]]: 鉴权模式（Session/JWT/OAuth）
- [[concepts/nodejs/connection-pool]]: 数据库连接池
- [[concepts/nodejs/message-queue]]: 消息队列（Kafka/RabbitMQ/Redis）

### 全栈 / 安全
- [[concepts/security/xss]]: XSS 跨站脚本攻击
- [[concepts/security/csrf]]: CSRF 跨站请求伪造
- [[concepts/security/cors]]: CORS（安全视角）
- [[concepts/security/jwt]]: JWT 令牌
- [[concepts/security/oauth2]]: OAuth 2.0 授权
- [[concepts/security/https-tls]]: HTTPS 与 TLS
- [[concepts/security/sql-injection]]: SQL 注入与防护

### 全栈 / AI 工程
- [[concepts/ai/llm-integration]]: LLM 集成（API/流式/错误处理）
- [[concepts/ai/prompt-engineering]]: 提示工程
- [[concepts/ai/rag]]: RAG 检索增强生成
- [[concepts/ai/vector-database]]: 向量数据库
- [[concepts/ai/embedding]]: 嵌入向量
- [[concepts/ai/agent-framework]]: Agent 框架（ReAct/工具调用）

### 全栈 / 方法论
- [[concepts/methodology/ddd]]: 领域驱动设计 DDD
- [[concepts/methodology/clean-architecture]]: 整洁架构
- [[concepts/methodology/microservices]]: 微服务架构
- [[concepts/methodology/monorepo]]: Monorepo（架构视角）
- [[concepts/methodology/bff]]: BFF 模式（架构视角）
- [[concepts/methodology/design-patterns]]: 设计模式概览（GoF + 前端常见）

## 实体

- [[entities/react/fiber-node]]: Fiber 节点数据结构（WorkTag 枚举、全部字段详解、创建与复用）
- [[entities/react/react-dom]]: react-dom 包（浏览器渲染器，host config 实现，事件系统）
- [[entities/react/react-hooks]]: React Hooks 实现（dispatcher 机制、hook 链表节点、各 hook 的 mount/update）
- [[entities/react/react-reconciler]]: react-reconciler 包（核心协调，平台无关，host config 接口）
- [[entities/react/react-scheduler]]: react-scheduler 包（MessageChannel 调度、最小堆、5ms 时间片、5 个优先级）
- [[entities/react/update-queue]]: UpdateQueue 数据结构（UpdateQueue/Update 结构、enqueueUpdate、processUpdateQueue、优先级处理）
- [[entities/react/work-in-progress-tree]]: workInProgress 树（双缓冲、createWorkInProgress 复用策略、生命周期）
- [[entities/ai-flow/kiritomoe]]: 技术博主，AI Coding 实践系列作者，AGENTS.md 方法论提出者
- [[entities/fullstack/vite]]: Vite 构建工具（esbuild + Rollup，原生 ESM dev）
- [[entities/fullstack/webpack]]: Webpack 打包工具（loader/plugin 生态、HMR）
- [[entities/fullstack/nodejs]]: Node.js 运行时（V8 + libuv 事件循环）
- [[entities/fullstack/typescript]]: TypeScript 语言（结构化类型、推导）
- [[entities/fullstack/prisma]]: Prisma ORM（schema-first、类型安全）

## 对比

- [[comparisons/react/current-tree-vs-workinprogress]]: current 树 vs workInProgress 树，双缓冲机制与 alternate 关系
- [[comparisons/react/fiber-vs-vdom]]: Fiber 链表树 vs 传统 VDOM，可中断性与优先级调度的底层差异
- [[comparisons/react/lanes-vs-expiration-time]]: 位掩码 Lanes 模型 vs 时间戳 Expiration Time，优先级调度的演进
- [[comparisons/react/memo-vs-usememo-vs-usecallback]]: 组件级 / 值级 / 函数级记忆化三者的作用层次与选择
- [[comparisons/react/mount-vs-update]]: 首次挂载（mountXxx 路径）vs 更新（bailout + updateXxx）的完整对比
- [[comparisons/react/render-vs-commit]]: 可中断纯计算阶段 vs 不可中断 DOM 提交阶段
- [[comparisons/react/sync-vs-concurrent]]: ReactDOM.render（同步）vs createRoot（并发），时间切片与并发特性
- [[comparisons/react/useeffect-vs-uselayouteffect]]: 异步绘制后 vs 同步绘制前，副作用执行时机与适用场景
- [[comparisons/fullstack/webpack-vs-vite]]: 打包器 vs 原生 ESM dev server
- [[comparisons/fullstack/rest-vs-graphql]]: REST vs GraphQL 接口范式
- [[comparisons/fullstack/sql-vs-nosql]]: 关系型 vs 文档型数据库
- [[comparisons/fullstack/ssr-vs-csr-vs-ssg]]: 三种渲染模式对比
- [[comparisons/fullstack/monolith-vs-microservices]]: 单体 vs 微服务
- [[comparisons/fullstack/redux-vs-mobx-vs-zustand]]: 状态管理库三选一
- [[comparisons/fullstack/npm-vs-yarn-vs-pnpm]]: 包管理器对比
- [[comparisons/fullstack/jwt-vs-session]]: JWT 无状态 vs Session 有状态鉴权

## 来源

- [[sources/react/acdlite-react-fiber-architecture]]: Fiber 架构原始解析，Andrew Clark 著，涵盖 Fiber 字段与调度原理
- [[sources/react/dan-abramov-react-as-ui-runtime]]: React 作为 UI 运行时，Dan Abramov 著，涵盖 host tree/reconciliation/hooks 链表
- [[sources/react/kasong-react-source-book]]: React 技术揭秘，kasong 著，中文 React 源码分析全书（v17）
- [[sources/react/react-official-reconciliation]]: React 官方文档 Reconciliation，O(n) diff 算法与 key 规则权威来源
- [[sources/ai-flow/一个文件让 AI Coding 效率翻倍：AGENTS.md 实践指南]]: kiritomoe 著，AGENTS.md 编写指南与五大工程实践
- [[sources/ai-flow/monorepo-harness-plan]]: 全栈 monorepo 的 Harness 引入蓝图
