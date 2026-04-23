---
title: "React 技术揭秘"
type: source
created: 2026-04-21
updated: 2026-04-23
tags: [react, source-code, chinese, internals, book]
status: active
sources: [raw/react/kasong-react-source-book.md]
---

# React 技术揭秘

> 作者：kasong（卡颂）
> 网址：https://react.iamkasong.com/
> B 站视频：https://www.bilibili.com/video/BV1Ki4y1u7Vr
> 版本：v17.0.0-alpha

## 核心论点

- 从**理念 → 架构 → 实现 → 代码**自顶向下学习 React 源码，避免直接陷入代码细节
- React 15 的 Stack Reconciler 使用递归同步处理，无法中断，是性能瓶颈的根源
- React 16 引入 Fiber，将递归改为可中断的循环，每个 Fiber 节点是独立的工作单元
- Fiber 架构分两大阶段：render 阶段（可中断）和 commit 阶段（同步不可中断）

## 关键概念

- [[concepts/react/fiber-architecture]]: Fiber 心智模型、实现原理、工作原理
- [[concepts/react/render-phase]]: beginWork + completeWork 流程
- [[concepts/react/commit-phase]]: before mutation / mutation / layout 三子阶段
- [[concepts/react/reconciliation]]: 单节点 Diff 和多节点 Diff 算法
- [[concepts/react/hooks-internals]]: Hooks 数据结构、mount/update 路径
- [[concepts/react/concurrent-mode]]: Scheduler 原理、Lane 模型
- [[concepts/react/lanes-model]]: 优先级模型详解
- [[entities/react/react-scheduler]]: Scheduler 实现（MessageChannel、最小堆）
- [[entities/react/update-queue]]: Update 对象与 UpdateQueue 结构

## 摘要

**学习路径设计：** 本书刻意不从 API（如 `ReactDOM.render`、`useState`）入手，而是从"React 理念"这一最高抽象层次开始，逐步下沉到架构，再到具体实现。这种自顶向下的方式更符合认知规律，避免在源码细节中迷失。

**Stack Reconciler vs Fiber：** React 15 的递归协调（Stack Reconciler）在遇到复杂组件树时，主线程被长时间占用，无法响应用户输入。React 16 用 Fiber 将递归改为循环，每处理一个 Fiber 节点后都可以检查是否需要让出主线程，实现了协作式多任务。

**Render 阶段（可中断）：** 从根节点出发，对每个 Fiber 节点执行 `beginWork`（生成子 Fiber）和 `completeWork`（生成 DOM 实例、收集副作用）。这个阶段是纯计算，可以随时被高优先级任务中断和重做。

**Commit 阶段（不可中断）：** 分三个子阶段顺序执行：before mutation（`getSnapshotBeforeUpdate`、异步调度 useEffect）、mutation（真正操作 DOM）、layout（`componentDidMount`/`componentDidUpdate`、同步执行 useLayoutEffect）。

**Concurrent Mode：** 通过 Scheduler 实现基于优先级的任务调度，使用 Lane 位掩码模型表示优先级，支持时间切片、高优先级打断低优先级等特性。

## 引用片段

> 从理念到架构，从架构到实现，从实现到具体代码。这是一个自顶向下、抽象程度递减，符合认知的过程。

> React 15 使用递归处理虚拟 DOM（Stack Reconciler），无法中断，导致长任务卡顿。

> React 16 引入 Fiber，将递归改为可中断的循环，每个 Fiber 节点是工作单元。

> Fiber 架构分为两大阶段：render（可中断）和 commit（同步不可中断）。
