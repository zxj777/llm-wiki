---
title: AI 工程实践
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [ai, llm, rag, prompt-engineering, fullstack]
status: active
sources: []
---

# AI 工程实践

## 概述

AI 工程（AI Engineering）是把大语言模型（LLM）能力工程化、产品化的实践，目标不是训练模型，而是「围绕已有模型构建可靠、可观测、可扩展的应用」。它要求工程师同时具备前后端能力（API 集成、流式响应、状态管理）与新的 AI-Native 思维（提示词设计、上下文工程、评估体系、Agent 编排）。

典型架构包括：LLM API 调用层、Prompt 与上下文管理层、RAG 检索增强层（向量数据库 + 召回 + 重排）、Agent 与工具调用层（Function Calling / MCP）、评估与可观测性层。每一层都有对应的失败模式（幻觉、上下文溢出、工具误用、成本失控）和对应的工程手段。

## 核心概念

- llm api integration: OpenAI / Anthropic / 国产模型 SDK 与协议
- [[concepts/ai/prompt-engineering]]: System Prompt、Few-shot、CoT、结构化输出
- rag architecture: 切片、嵌入、检索、重排、生成
- [[concepts/ai/vector-database]]: pgvector / Qdrant / Milvus 选型
- ai agent design: ReAct、Plan-Execute、多 Agent 协作
- streaming response: SSE / WebSocket、token-level 渲染、中断处理

## 关联板块

- AI 编码工具体系：[[topics/ai-flow/ai-coding]]（已有独立专题）
- 后端：[[topics/fullstack/nodejs]]（流式响应、消息队列、连接池）
- 安全：[[topics/fullstack/security]]（Prompt Injection 与数据泄漏防护）

## 推荐学习路径

**初级**
1. 调通一次 OpenAI / Claude API，理解 messages、temperature、max_tokens
2. 实现一个最简的「问答机器人」前后端
3. 学习 Markdown 流式渲染与中断

**进阶**
1. [[concepts/ai/prompt-engineering]]：系统提示模板、结构化输出（JSON Mode / Tool Calling）
2. rag architecture：从 0 搭一个检索增强问答
3. streaming response：SSE 服务端推流 + 前端打字机效果
4. 评估体系：ground truth、人评、自动评估（LLM-as-Judge）

**深入**
1. ai agent design：多步骤工具调用、记忆、回滚
2. [[concepts/ai/vector-database]]：分片、量化、混合检索
3. 成本与可观测性：Token 计费、Trace、缓存、降级
4. 安全：Prompt Injection 防御、敏感信息脱敏

## 开放问题

- RAG 与超长上下文（百万 token）模型的边界在哪里，何时该选哪个？
- 多 Agent 协作模式何时优于单一 Agent + 工具调用？
