# Wiki 索引

> 最后更新: 2026-04-24 | 页面总数: 67

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

## 实体

- [[entities/react/fiber-node]]: Fiber 节点数据结构（WorkTag 枚举、全部字段详解、创建与复用）
- [[entities/react/react-dom]]: react-dom 包（浏览器渲染器，host config 实现，事件系统）
- [[entities/react/react-hooks]]: React Hooks 实现（dispatcher 机制、hook 链表节点、各 hook 的 mount/update）
- [[entities/react/react-reconciler]]: react-reconciler 包（核心协调，平台无关，host config 接口）
- [[entities/react/react-scheduler]]: react-scheduler 包（MessageChannel 调度、最小堆、5ms 时间片、5 个优先级）
- [[entities/react/update-queue]]: UpdateQueue 数据结构（UpdateQueue/Update 结构、enqueueUpdate、processUpdateQueue、优先级处理）
- [[entities/react/work-in-progress-tree]]: workInProgress 树（双缓冲、createWorkInProgress 复用策略、生命周期）
- [[entities/ai-flow/kiritomoe]]: 技术博主，AI Coding 实践系列作者，AGENTS.md 方法论提出者

## 对比

- [[comparisons/react/current-tree-vs-workinprogress]]: current 树 vs workInProgress 树，双缓冲机制与 alternate 关系
- [[comparisons/react/fiber-vs-vdom]]: Fiber 链表树 vs 传统 VDOM，可中断性与优先级调度的底层差异
- [[comparisons/react/lanes-vs-expiration-time]]: 位掩码 Lanes 模型 vs 时间戳 Expiration Time，优先级调度的演进
- [[comparisons/react/memo-vs-usememo-vs-usecallback]]: 组件级 / 值级 / 函数级记忆化三者的作用层次与选择
- [[comparisons/react/mount-vs-update]]: 首次挂载（mountXxx 路径）vs 更新（bailout + updateXxx）的完整对比
- [[comparisons/react/render-vs-commit]]: 可中断纯计算阶段 vs 不可中断 DOM 提交阶段
- [[comparisons/react/sync-vs-concurrent]]: ReactDOM.render（同步）vs createRoot（并发），时间切片与并发特性
- [[comparisons/react/useeffect-vs-uselayouteffect]]: 异步绘制后 vs 同步绘制前，副作用执行时机与适用场景

## 来源

- [[sources/react/acdlite-react-fiber-architecture]]: Fiber 架构原始解析，Andrew Clark 著，涵盖 Fiber 字段与调度原理
- [[sources/react/dan-abramov-react-as-ui-runtime]]: React 作为 UI 运行时，Dan Abramov 著，涵盖 host tree/reconciliation/hooks 链表
- [[sources/react/kasong-react-source-book]]: React 技术揭秘，kasong 著，中文 React 源码分析全书（v17）
- [[sources/react/react-official-reconciliation]]: React 官方文档 Reconciliation，O(n) diff 算法与 key 规则权威来源
- [[sources/ai-flow/一个文件让 AI Coding 效率翻倍：AGENTS.md 实践指南]]: kiritomoe 著，AGENTS.md 编写指南与五大工程实践
- [[sources/ai-flow/monorepo-harness-plan]]: 全栈 monorepo 的 Harness 引入蓝图
