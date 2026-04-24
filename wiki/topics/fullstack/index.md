---
title: 全栈知识库
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [fullstack, frontend, backend, overview]
status: active
sources: []
---

# 全栈知识库

## 概述

全栈（Full-Stack）开发指同时具备前端用户界面、后端服务、数据库、部署运维等多端能力的工程实践。它并不要求每个方向都达到专家深度，但要求开发者理解从浏览器请求发起到数据库落库再到响应渲染的完整链路，能够在合适的层次做出技术决策。

本知识库以「概念优先、可链接、可索引」的方式组织全栈知识，将零散的文章、面试题、源码笔记沉淀为可复用的概念页（concept）、对比页（comparison）和主题页（topic），通过 `[[]]` 双链构成知识网络。所有内容均可追溯到 `raw/` 中的源材料，并由 `index.md` 与 `log.md` 提供全局导航与变更审计。

知识库分为「前端」「后端」两条主干，外加四个跨端共享板块，覆盖语言、运行时、框架、工程化、性能、安全、AI 工程、方法论与面试表达。

## 核心入口

- [[topics/fullstack/frontend]]: 前端开发总入口（语言、浏览器、框架、性能）
- [[topics/fullstack/backend]]: 后端开发总入口（Node.js、API、数据库、安全）

## 共享板块

- [[topics/fullstack/engineering]]: 构建、Monorepo、CI/CD、设计模式（前后端共享）
- [[topics/fullstack/ai-engineering]]: LLM API、RAG、Agent 等 AI 工程实践
- [[topics/fullstack/methodology]]: Git、Code Review、测试策略、敏捷与文档
- [[topics/fullstack/interview]]: 高频面试题与表达框架

## 子领域速查

| 板块 | 入口 | 关键词 |
|------|------|--------|
| JS/TS | [[topics/fullstack/javascript]] | 事件循环、闭包、类型系统 |
| 浏览器/网络 | [[topics/fullstack/browser-network]] | 渲染管线、HTTP、缓存、CORS |
| 框架原理 | [[topics/fullstack/framework]] | Virtual DOM、响应式、SSR |
| 性能 | [[topics/fullstack/performance]] | Core Web Vitals、懒加载 |
| Node.js | [[topics/fullstack/nodejs]] | Stream、中间件、ORM |
| 安全 | [[topics/fullstack/security]] | XSS、CSRF、CSP、TLS |

## 如何使用

1. **浏览**: 从 `frontend` / `backend` 入口开始，按主题逐层下钻到 concept 页
2. **查询**: 直接搜索关键词，或通过 `wiki/index.md` 全局索引定位
3. **学习**: 每个 topic 页底部都有「推荐学习路径」，按初级/进阶/深入三档安排
4. **面试准备**: 直接看 [[topics/fullstack/interview]]，按高频度排序
5. **贡献**: 阅读新材料后，触发 ingest 流程，由 LLM 增量更新对应概念页

## 开放问题

- 如何在前端工程化与后端 BFF/微服务之间划分清晰的边界？
- AI 编码工具普及后，全栈工程师的核心壁垒应该向哪些方向迁移？
