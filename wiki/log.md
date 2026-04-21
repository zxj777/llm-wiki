# 操作日志

## [2026-04-21] ingest | 4篇 React 源码核心参考文章
- 源文件: raw/acdlite-react-fiber-architecture.md, raw/dan-abramov-react-as-ui-runtime.md, raw/kasong-react-source-book.md, raw/react-official-reconciliation.md
- 新建页面: wiki/sources/acdlite-react-fiber-architecture.md, wiki/sources/dan-abramov-react-as-ui-runtime.md, wiki/sources/kasong-react-source-book.md, wiki/sources/react-official-reconciliation.md
- 更新页面 sources 字段（15个）: fiber-architecture, reconciliation, fiber-node, fiber-tree, double-buffering, hooks-internals, host-config, render-phase, commit-phase, lanes-model, concurrent-mode, context-propagation, bailout-optimization, topics/source-code, topics/reconciliation
- 新增链接: sources ↔ concepts/entities（15条溯源关系）
- 更新: index.md 新增 ## 来源 区块，页面数 56 → 60

## [2026-04-21] ingest | 批量填充所有 56 个 React 源码 stub 页面
- 更新页面: 全部 56 个 stub 页面（concepts × 20, entities × 7, comparisons × 8, topics × 21）
- 修复: 56 个 stub → active，所有"待补充"已替换为真实技术内容
- 覆盖主题:
  - Concept 页（20个）：Fiber 架构/树/Work Loop/Reconciliation/Render 阶段/Commit 阶段/Hooks 内部/Lanes/并发模式/协作调度/双缓冲/Bailout/合成事件/Context 传播/Suspense/Hydration/Error 传播/Effect List/时间切片/Host Config
  - Entity 页（7个）：Fiber 节点（完整字段表 + WorkTag 枚举）/react-reconciler/react-scheduler/react-dom/react-hooks/workInProgress 树/UpdateQueue
  - Comparison 页（8个）：Fiber vs VDOM / Render vs Commit / Sync vs Concurrent / Mount vs Update / useEffect vs useLayoutEffect / memo vs useMemo vs useCallback / Lanes vs ExpirationTime / current 树 vs workInProgress 树
  - Topic 路径页（21个）：首次渲染/状态更新/Effect 系统/Reconciliation/事件系统/Context/Ref/并发调度/Lanes/Suspense/Bailout/Batching/Transition/Profiler/SSR+Hydration/ErrorBoundary/Portals/StrictMode/自定义渲染器/包架构/源码总入口
- 来源: 基于 acdlite/react-fiber-architecture 及 React 18 源码研究结果

## [2026-04-21] ingest | 填充 9 个 Topic stub 页面 + 更新源码总入口
- 更新页面: wiki/topics/react-transition.md, wiki/topics/react-profiler.md, wiki/topics/react-ssr-hydration.md, wiki/topics/react-error-boundary.md, wiki/topics/react-portals.md, wiki/topics/react-strict-mode.md, wiki/topics/react-custom-renderer.md, wiki/topics/react-package-architecture.md, wiki/topics/react-source-code.md
- 修复: 9 个 stub → active，补全调用链路（源码级函数名）、常见问题（含答案）章节
- 覆盖主题: startTransition/useDeferredValue、Profiler onRender 计时机制、流式 SSR + Selective Hydration、ErrorBoundary throwException/unwindWork、Portal 事件 Fiber 树冒泡、StrictMode 双重渲染/effect、自定义渲染器 hostConfig 接口、React monorepo 包架构与 Hooks 链表原理
- react-source-code.md 新增: 推荐阅读顺序（初学/进阶/深入三条路径）、关键源文件地图（★标注核心文件）、React 18 vs 16/17 差异对比表

## [2026-04-21] ingest | 填充 10 个 Concept stub 页面（React 内部机制）
- 更新页面: wiki/concepts/double-buffering.md, wiki/concepts/bailout-optimization.md, wiki/concepts/synthetic-events.md, wiki/concepts/context-propagation.md, wiki/concepts/suspense-mechanism.md, wiki/concepts/hydration.md, wiki/concepts/error-propagation.md, wiki/concepts/effect-list.md, wiki/concepts/time-slicing.md, wiki/concepts/host-config.md
- 修复: 10 个 stub → active，补全定义、工作原理（含源码级函数名）、优势与局限、应用场景、相关概念章节
- 覆盖主题: 双缓冲、Bailout/memo/useMemo/useCallback、合成事件委托、Context propagateContextChange、Suspense throw promise 机制、Hydration Selective、Error Boundary unwindWork、Effect List subtreeFlags、Time Slicing MessageChannel、Host Config 自定义渲染器

## [2026-04-21] lint | 填充 8 个 Comparison stub 页面
- 更新页面: wiki/comparisons/fiber-vs-vdom.md, wiki/comparisons/render-vs-commit.md, wiki/comparisons/sync-vs-concurrent.md, wiki/comparisons/mount-vs-update.md, wiki/comparisons/useeffect-vs-uselayouteffect.md, wiki/comparisons/memo-vs-usememo-vs-usecallback.md, wiki/comparisons/lanes-vs-expiration-time.md, wiki/comparisons/current-tree-vs-workinprogress.md
- 修复: 8 个 stub → active，补全对比表格、分析、结论、相关概念章节
- 更新: wiki/index.md 中 8 条对比条目移除 [stub] 标记，补充摘要描述

## [2026-04-21] ingest | 填充 7 个 Entity stub 页面
- 更新页面: wiki/entities/fiber-node.md, wiki/entities/react-reconciler.md, wiki/entities/react-scheduler.md, wiki/entities/react-dom.md, wiki/entities/react-hooks.md, wiki/entities/work-in-progress-tree.md, wiki/entities/update-queue.md
- 变更: stub → active；补充完整技术内容（WorkTag 枚举、字段详解、核心文件、API、机制、数据结构定义等）
- 新增链接: fiber-node ↔ update-queue, fiber-node ↔ work-in-progress-tree, react-reconciler ↔ react-dom, react-reconciler ↔ react-scheduler, react-hooks ↔ fiber-node

## [2026-04-21] ingest | React 源码阅读 wiki 骨架创建
- 源文件: 无（骨架由 LLM 根据 React 源码知识生成，未来通过 ingest 填充）
- 新建页面:
  - wiki/topics/react-source-code.md（总入口）
  - wiki/topics/react-initial-render.md
  - wiki/topics/react-state-update.md
  - wiki/topics/react-effect-system.md
  - wiki/topics/react-reconciliation.md
  - wiki/topics/react-event-system.md
  - wiki/topics/react-context.md
  - wiki/topics/react-ref-system.md
  - wiki/topics/react-concurrent-scheduler.md
  - wiki/topics/react-lanes.md
  - wiki/topics/react-suspense.md
  - wiki/topics/react-bailout.md
  - wiki/topics/react-batching.md
  - wiki/topics/react-transition.md
  - wiki/topics/react-profiler.md
  - wiki/topics/react-ssr-hydration.md
  - wiki/topics/react-error-boundary.md
  - wiki/topics/react-portals.md
  - wiki/topics/react-strict-mode.md
  - wiki/topics/react-custom-renderer.md
  - wiki/topics/react-package-architecture.md
  - wiki/concepts/fiber-architecture.md, reconciliation.md, commit-phase.md, render-phase.md, work-loop.md
  - wiki/concepts/cooperative-scheduling.md, concurrent-mode.md, lanes-model.md, hooks-internals.md, fiber-tree.md
  - wiki/concepts/synthetic-events.md, bailout-optimization.md, time-slicing.md, double-buffering.md, suspense-mechanism.md
  - wiki/concepts/hydration.md, error-propagation.md, effect-list.md, context-propagation.md, host-config.md
  - wiki/entities/react-reconciler.md, react-scheduler.md, react-dom.md, fiber-node.md
  - wiki/entities/react-hooks.md, work-in-progress-tree.md, update-queue.md
  - wiki/comparisons/fiber-vs-vdom.md, render-vs-commit.md, sync-vs-concurrent.md, mount-vs-update.md
  - wiki/comparisons/useeffect-vs-uselayouteffect.md, memo-vs-usememo-vs-usecallback.md, lanes-vs-expiration-time.md, current-tree-vs-workinprogress.md
- 更新页面: wiki/index.md（全量重写，56 个页面条目）
- 新增链接: 所有页面互相交叉引用（topics ↔ concepts ↔ entities ↔ comparisons）

<!-- 格式：## [YYYY-MM-DD] ingest|query|lint | 标题 -->
