---
title: "Harness Engineering"
type: concept
created: 2026-04-23
updated: 2026-04-23
tags: [ai-coding, harness-engineering, automation, best-practices]
status: active
sources: [raw/ai-flow/一个文件让 AI Coding 效率翻倍：AGENTS.md 实践指南.md]
---

# Harness Engineering

## 定义

Harness Engineering（Harness 工程）是让 AI Agent 能自主完成 **「改 → 构建 → 启动 → 验证」闭环** 的工程方法。它通过构建一套反馈回路，使 AI 能够在最小的人类干预下持续迭代和验证自己的工作成果。

## 四条核心原则

### 1. Map, not Manual（地图而非手册）

项目上下文文件（如 AGENTS.md）应该是一张导航地图，约 200 行，告诉 Agent「去哪里找什么」。详细内容放在链接的文档里，而不是全部塞进上下文文件。什么都重要的时候，什么都不重要——过长的上下文会稀释 AI 对关键规则的关注。

### 2. 渐进式披露

信息按重要性分层披露：
- **第一层（AGENTS.md）**：AI 不知道就会写出错误代码的信息
- **第二层（docs/ 链接）**：AI 不知道只会写出不够好代码的信息
- **第三层（源码）**：AI 需要具体实现细节时直接读取

### 3. 机械验证而非人工检查

验证闭环是 Harness Engineering 的核心落地：
- **后端**：bash / curl 验证接口，启动服务后调接口、解析响应、确认数据正确
- **前端**：Agent Browser 验证页面渲染、交互、布局
- **质量检查**：lint、format、build、test 通过自动化命令矩阵完成

验证手段必须足够机械化和稳定，让 Agent 在 shell 中执行时不会因为兼容性问题卡住。

### 4. Bad Case 驱动迭代

不要试图一次性设计完美的系统。从实际使用中发现的 bad case 出发：
1. AI 犯了一个错误
2. 思考：「如果上下文文件里多写一条规则，AI 是不是就不会犯这个错」
3. 判断改哪里：全局规则 → AGENTS.md，模块细节 → 对应 docs/

## 与 AGENTS.md 的关系

Harness Engineering 是一套工程方法论，AGENTS.md 是这套方法的核心入口文件之一。完整的 Harness 工程还包括：

- **AGENTS.md**：AI 理解项目的核心上下文
- **docs/**：各模块的详细开发手册
- **scripts/**：构建、启动、验证脚本（人和 AI 共用）
- **lint / 检查脚本**：自动化规则检查
- **参考项目**：通过 git submodule 引入的源码级上下文

这些组件共同构成一个反馈回路：AI 读 AGENTS.md 理解项目 → 写代码 → 自动检查 → 启动验证 → 根据结果修正。人类的角色是**设计这个回路**，而不是在回路中的每一步都亲自操作。

## 应用场景

- **夜间自主执行**：睡前设计好 Spec，让 Agent 自主执行，第二天早上验收结果
- **全栈开发**：monorepo 结构下，AI 在同一窗口中完成前后端联动开发
- **私域组件开发**：通过引入参考项目源码，让 AI 获得训练数据中没有的上下文
- **团队知识沉淀**：把散落在 Wiki、聊天记录、口头约定中的编码规范结构化写入 AGENTS.md

## 相关概念

- [[concepts/ai-flow/agents-md]]: Harness Engineering 的核心上下文文件
- [[entities/ai-flow/kiritomoe]]: Harness Engineering 理念的提出者和推广者
