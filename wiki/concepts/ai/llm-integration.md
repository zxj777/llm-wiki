---
title: "LLM 集成"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [ai, llm, integration]
status: active
sources: []
---

# LLM 集成

## 定义

LLM 集成(LLM Integration)指将大语言模型(如 GPT-4、Claude、Gemini、DeepSeek、Qwen 等)通过 API 接入业务应用,使产品具备自然语言理解、生成、推理能力。集成不是简单的"调一次接口",而是涉及鉴权与配额、流式响应、超时与重试、错误降级、成本控制、提示模板管理、上下文窗口管理、结构化输出解析、安全过滤等一整套工程问题。LLM 的概率性、非幂等、高延迟、按 Token 计费等特性,使其与传统确定性 API 集成模式截然不同。

## 工作原理

**1. 基础调用(以 OpenAI 兼容 API 为例)**

```ts
const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: '解释量子纠缠' }
    ],
    temperature: 0.7,
    max_tokens: 800
  })
});
```

**2. 流式响应(Server-Sent Events / Streaming)**

LLM 生成耗时长(数秒到分钟),阻塞返回会让用户等待"白屏"。流式逐 Token 推送,首 Token 延迟(TTFT)从数秒降至数百毫秒。

```ts
const res = await openai.chat.completions.create({
  model: 'gpt-4o', stream: true, messages
});
for await (const chunk of res) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
}
```

前端通常用 `EventSource` 或 fetch + ReadableStream 接收,Vercel AI SDK 等封装了 React Hook(`useChat`)简化体验。

**3. 错误处理与重试**

LLM API 常见错误:
- `429` 限流 → 指数退避重试
- `5xx` 服务端错误 → 重试 + 切换备用提供商
- `context_length_exceeded` → 截断历史 / 改用更大窗口模型
- `content_filter` → 拒绝并提示
- 网络超时 → 设置合理 timeout(30–120s)+ AbortController

```ts
async function callWithRetry(fn, max=3) {
  for (let i=0; i<max; i++) {
    try { return await fn(); }
    catch (e) {
      if (e.status===429 || e.status>=500) {
        await sleep(2**i * 1000);
        continue;
      }
      throw e;
    }
  }
}
```

**4. 成本与上下文管理**

按输入/输出 Token 计费,长上下文易爆炸:
- 用 `tiktoken` 预估 Token 数
- 滑动窗口 / 摘要压缩历史对话
- 选择合适模型(简单任务用 mini/haiku,复杂任务用 opus/o1)
- 缓存提示前缀(prompt caching)节省成本

**5. 抽象层与多提供商**

生产中常用 LangChain、LiteLLM、Vercel AI SDK 抽象统一接口,支持 OpenAI/Anthropic/Bedrock/本地模型互换,故障时自动切换备用。

## 优势与局限

- ✅ 几行代码即可让产品具备 NLP 能力
- ✅ 流式响应大幅提升交互体验
- ✅ 按需计费,无需自建推理基础设施
- ❌ 概率性输出难以保证一致性,需 [[concepts/ai/prompt-engineering]] + 结构化输出 + 校验
- ❌ 延迟高(秒级),不适合关键路径同步调用,常需异步队列
- ❌ 成本随用量线性增长,长对话与多轮 [[concepts/ai/agent-framework]] 极易超预算
- ❌ 数据出境/隐私合规约束,敏感场景需私有化部署或脱敏
- ❌ 提供商单点故障,需多供应商 fallback

## 应用场景

- **智能客服 / Copilot**:基于产品文档的问答(常配合 [[concepts/ai/rag]])
- **内容生成**:文案、摘要、翻译、代码补全
- **结构化抽取**:从非结构化文本提取 JSON(用 function calling / JSON Schema)
- **分类与打标签**:替代传统 NLP 分类器,零样本/少样本即可
- **Agent 工作流**:多步推理、工具调用,见 [[concepts/ai/agent-framework]]

## 相关概念

- [[concepts/ai/prompt-engineering]]: 决定输出质量的关键
- [[concepts/ai/rag]]: 让 LLM 基于私有知识回答
- [[concepts/ai/agent-framework]]: 在 LLM 上构建多步任务系统
- [[concepts/ai/embedding]]: 长上下文压缩与检索的基础
- streaming response: SSE 与流式 UI 模式
- token cost optimization: 成本控制策略
