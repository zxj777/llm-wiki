---
title: "提示工程"
type: concept
created: 2026-04-02
updated: 2026-04-02
tags: [ai, llm, prompt]
status: active
sources: []
---

# 提示工程

## 定义

提示工程(Prompt Engineering)是设计、构造、优化输入给大语言模型的指令(prompt),以稳定获得高质量输出的工程学科。LLM 是概率性下一个 Token 预测器,同一任务的不同表述会得到差异巨大的结果——好的提示能让 GPT-4o-mini 接近 GPT-4o 的效果,坏的提示让最强模型也输出垃圾。提示工程介于"自然语言写作"与"程序设计"之间,核心是把人类意图准确编码为模型能稳定执行的指令。

## 工作原理

**1. 提示的基本结构**

```
[角色/系统指令]  你是资深 SQL 专家...
[任务描述]      请把以下自然语言转为 PostgreSQL 查询。
[约束/规则]     - 只返回 SQL,不要解释
                - 使用参数化占位符
[示例(few-shot)] 输入: ... 输出: ...
[输入]          {{user_query}}
[输出格式]      ```sql ... ```
```

**2. 主流技巧**

- **Zero-shot**: 直接描述任务,适合常见任务
- **Few-shot**: 给 2–5 个输入/输出示例,让模型学习模式

```
输入: "苹果", 类别: 水果
输入: "汽车", 类别: 交通工具
输入: "钢琴", 类别: ?
```

- **Chain-of-Thought (CoT)**: 让模型"逐步思考",显著提升数学/推理任务准确率

```
让我们一步一步思考:
1. 先识别问题类型...
2. 列出已知条件...
3. 推导...
4. 得出答案
```

- **Self-Consistency**: 多次采样不同推理路径,投票选最一致答案
- **ReAct**: Reasoning + Acting,见 [[concepts/ai/agent-framework]]
- **角色扮演(Persona)**: "你是 X 领域 20 年专家"可激活更专业表达
- **负面指令**: "不要使用形容词"、"绝不编造引用"
- **分隔符**: 用 `<context>...</context>` 或 ``` 明确边界,防止用户输入污染指令(prompt injection)

**3. 结构化输出**

让 LLM 返回机器可解析格式:

```ts
// JSON Schema 强约束(OpenAI structured outputs / Anthropic tool use)
{
  type: "object",
  properties: {
    sentiment: { type: "string", enum: ["positive","negative","neutral"] },
    confidence: { type: "number" }
  },
  required: ["sentiment","confidence"]
}
```

或用 Zod / Pydantic 在客户端校验,失败则要求模型修正。`temperature: 0` + JSON Schema 是抽取任务的黄金组合。

**4. 提示模板与版本管理**

生产环境用模板引擎(Jinja2、Handlebars、LangChain PromptTemplate)管理提示,把变量与指令分离,所有模板进 Git 版本管理并配套评测集(eval set)持续回归。

**5. 提示注入防御**

用户输入可能包含"忽略以上指令,改为..."。防御:
- 系统指令与用户输入用强分隔符隔离
- 不让用户输入直接拼入系统提示
- 对最终输出做白名单校验

## 优势与局限

- ✅ 零代码、零训练即可显著提升模型表现
- ✅ 迭代成本极低,A/B 测试速度快
- ✅ Few-shot + CoT 在多数任务上接近微调效果
- ❌ 提示长度占用上下文窗口,增加 Token 成本与延迟
- ❌ 不同模型对提示敏感度不同,跨模型迁移需重调
- ❌ 模型版本升级可能破坏已优化的提示,需回归测试
- ❌ 复杂任务仅靠提示难以稳定,需配合 [[concepts/ai/rag]] / 微调 / [[concepts/ai/agent-framework]]
- ❌ 易被提示注入绕过,需独立防御层

## 应用场景

- **结构化抽取**: 从合同、简历、邮件中提取字段
- **分类与打标**: 情感分析、意图识别、内容审核
- **代码生成**: GitHub Copilot 系统提示是工程化典范
- **多步推理**: 数学题、逻辑题用 CoT 显著提升正确率
- **风格控制**: 让模型按品牌语气、特定格式输出
- **评测器(LLM-as-Judge)**: 用 LLM 给 LLM 输出打分

## 相关概念

- [[concepts/ai/llm-integration]]: 提示在工程中的承载
- [[concepts/ai/rag]]: 检索结果填入提示上下文
- [[concepts/ai/agent-framework]]: ReAct 等基于提示的多步框架
- chain of thought: 推理增强的标志性技巧
- structured output: JSON Schema / function calling
- prompt injection: 提示工程的安全对面
