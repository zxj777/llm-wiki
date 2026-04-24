---
title: "Agent 框架"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [ai, llm, agent]
status: active
sources: []
---

# Agent 框架

## 定义

Agent 框架(Agent Framework)是把 LLM 从"被动应答的聊天机器人"改造为"能自主规划、调用工具、多步执行任务的智能体"的工程框架。Agent 的核心循环是:**接收目标 → 思考(Reasoning) → 选择工具(Action) → 观察结果(Observation) → 继续思考...直到完成**。框架负责调度此循环、管理工具注册、维护中间状态、控制最大步数与成本。代表项目有 LangChain/LangGraph、AutoGPT、CrewAI、Microsoft AutoGen、OpenAI Assistants/Swarm、Anthropic 的 Computer Use 等。

## 工作原理

**1. ReAct 范式(Yao et al. 2022,Agent 的事实标准)**

让 LLM 交替输出 Thought / Action / Observation:

```
Question: 北京今天比上海热多少度?
Thought: 我需要先查北京气温,再查上海气温,然后相减。
Action: weather(city="北京")
Observation: 北京今天 28℃
Thought: 现在查上海。
Action: weather(city="上海")
Observation: 上海今天 22℃
Thought: 28 - 22 = 6 度。
Final Answer: 北京比上海热 6 度。
```

**2. 工具调用(Function Calling / Tool Use)**

主流 LLM(GPT-4、Claude、Gemini)原生支持结构化工具调用——把工具描述以 JSON Schema 传给模型,模型返回要调用的工具名与参数,框架执行后把结果回传:

```ts
const tools = [{
  name: 'search_db',
  description: '在订单数据库中查询',
  parameters: {
    type: 'object',
    properties: {
      order_id: { type: 'string' }
    },
    required: ['order_id']
  }
}];

while (true) {
  const res = await llm.chat({ messages, tools });
  if (res.tool_calls?.length) {
    for (const call of res.tool_calls) {
      const result = await invokeTool(call.name, call.args);
      messages.push({ role: 'tool', tool_call_id: call.id, content: result });
    }
  } else {
    return res.content;  // 最终答案
  }
}
```

**3. 多步推理与规划**

- **Plan-and-Execute**: 先让 LLM 生成多步计划,再逐步执行,适合复杂任务
- **Reflexion**: 失败后让 LLM 反思错误,改进下一次尝试
- **Tree of Thoughts**: 探索多条推理分支,搜索最优路径
- **LangGraph**: 用有向图显式建模 Agent 状态机,支持回环、人工审批节点

**4. 多 Agent 协作**

- **CrewAI**: 角色分工(研究员、写手、审稿),顺序/并行协作
- **AutoGen**: Agent 间对话式协作
- **OpenAI Swarm**: 轻量 handoff 模式,Agent 之间转交任务

```python
# CrewAI 示例
researcher = Agent(role='研究员', goal='收集资料', tools=[search])
writer = Agent(role='写手', goal='写报告', tools=[])
crew = Crew(agents=[researcher, writer], tasks=[t1, t2], process=Process.sequential)
crew.kickoff()
```

**5. 记忆与上下文**

- **短期记忆**: 当前会话历史(滑动窗口/摘要压缩)
- **长期记忆**: 向量库存储历史交互,需要时检索([[concepts/ai/rag]] 模式)
- **工作记忆**: scratchpad/中间结果

**6. 关键工程要点**

- **最大步数限制**: 防止死循环烧钱
- **成本/Token 监控**: 每步累加,超阈值中止
- **可观测性**: LangSmith / Langfuse / Helicone 追踪每步 Thought/Action
- **沙箱执行**: 代码执行类工具必须隔离(Docker/E2B/Pyodide)
- **人工介入(Human-in-the-loop)**: 高风险动作前请求确认

## 优势与局限

- ✅ 解锁需要多步推理、外部数据、副作用的复杂任务
- ✅ 工具化设计可无限扩展能力(搜索、SQL、代码执行、API)
- ✅ 与 [[concepts/ai/rag]] 结合形成 Agentic RAG,处理多跳问题
- ✅ 多 Agent 协作分解复杂工作流
- ❌ 错误累积:每步小错误最终放大成大错
- ❌ 成本不可控,失控的循环可烧出天价账单
- ❌ 延迟高,多步串行常需数十秒
- ❌ 调试困难,失败原因散落在多步推理链中
- ❌ 当前 Agent 在长任务上可靠性仍不足生产级,需大量护栏

## 应用场景

- **代码 Agent**: Cursor、Devin、Aider、Copilot Workspace 自主修改代码库
- **浏览器自动化**: Computer Use、Browser Use 操作真实网页
- **数据分析**: 自然语言转 SQL + 执行 + 可视化
- **客服自动化**: 查订单、改地址、发优惠券等多步操作
- **研究助手**: 多源搜索 + 综合 + 写报告
- **DevOps**: 自动诊断告警、生成修复 PR

## 相关概念

- [[concepts/ai/llm-integration]]: Agent 的底层调用
- [[concepts/ai/prompt-engineering]]: ReAct 等模式本质是提示设计
- [[concepts/ai/rag]]: Agentic RAG / 工具中检索能力
- function calling: 工具调用的协议基础
- langgraph: 状态图 Agent 建模
- mcp: Model Context Protocol,工具标准化
