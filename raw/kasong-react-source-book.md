---
title: "React 技术揭秘"
author: kasong (卡颂)
source_url: https://react.iamkasong.com/
fetched: 2026-04-21
tags: [react, source-code, chinese, internals]
---

# React 技术揭秘

> 打造一本严谨、易懂的 React 源码分析教程

作者：kasong（卡颂）
网址：https://react.iamkasong.com/
B 站导学视频：https://www.bilibili.com/video/BV1Ki4y1u7Vr

## 宗旨
1. 不预设观点 —— 所有观点来自 React 核心团队成员在公开场合的分享
2. 丰富的参考资料 —— 包括在线 Demo、文章、视频
3. 保持更新（当前版本 v17.0.0-alpha）

## 学习路径：从理念到架构到实现到代码（自顶向下）

## 章节目录

### 理念篇
- **第一章 React 理念**
  - React 理念
  - 老的 React 架构（Stack Reconciler）
  - 新的 React 架构（Fiber）
  - Fiber 架构的心智模型
  - Fiber 架构的实现原理
  - Fiber 架构的工作原理
- **第二章 前置知识**
  - 源码的文件结构
  - 调试源码
  - 深入理解 JSX

### 架构篇
- **第三章 render 阶段**
  - 流程概览
  - beginWork
  - completeWork
- **第四章 commit 阶段**
  - 流程概览
  - before mutation 阶段
  - mutation 阶段
  - layout 阶段

### 实现篇
- **第五章 Diff 算法**
  - 概览
  - 单节点 Diff
  - 多节点 Diff
- **第六章 状态更新**
  - 流程概览
  - 心智模型
  - Update 对象
  - 深入理解优先级
  - ReactDOM.render
  - this.setState
- **第七章 Hooks**
  - Hooks 理念
  - 极简 Hooks 实现
  - Hooks 数据结构
  - useState 与 useReducer
  - useEffect
  - useRef
  - useMemo 与 useCallback
- **第八章 Concurrent Mode**
  - 概览
  - Scheduler 的原理与实现
  - Lane 模型
  - 异步可中断更新（进行中）
  - 高优任务打断机制（进行中）
  - batchedUpdates（进行中）
  - Suspense（进行中）

## 核心观点摘要
- React 15 使用递归处理虚拟 DOM（Stack Reconciler），无法中断，导致长任务卡顿
- React 16 引入 Fiber，将递归改为可中断的循环，每个 Fiber 节点是工作单元
- Fiber 架构分为两大阶段：render（可中断）和 commit（同步不可中断）
- Concurrent Mode 通过 Lane 优先级模型和 Scheduler 实现任务调度
