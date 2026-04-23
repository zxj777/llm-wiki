---
title: Fiber 树结构
type: concept
created: 2026-04-21
updated: 2026-04-23
tags: [react, fiber, tree]
status: active
sources: [raw/react/acdlite-react-fiber-architecture.md, raw/react/dan-abramov-react-as-ui-runtime.md]
---

# Fiber 树结构

## 定义

Fiber 树是 React 在内存中维护的应用 UI 描述，由 `FiberNode` 通过 **child / sibling / return** 三种指针构成的**链表树**（而非普通对象树）。链表树的设计使 React 能以迭代（而非递归）方式遍历整棵树，从而实现可中断的渲染。

## 工作原理

### 三指针链表结构

每个 `FiberNode` 只持有三条指针：

| 指针 | 含义 |
|------|------|
| `child` | 指向**第一个子节点** |
| `sibling` | 指向**下一个兄弟节点** |
| `return` | 指向**父节点** |

多个子节点通过 `sibling` 串联成单向链表，父节点只直接持有第一个子节点。

### 示例：`<App><Header /><Main /></App>`

**React 元素树（逻辑视图）**

```
App
├── Header
└── Main
```

**对应的 Fiber 链表树**

```
FiberRoot
  └─child─→ App
               └─child─→ Header ──sibling──→ Main
                          └─return─→ App      └─return─→ App
```

- `App.child` → `Header`
- `Header.sibling` → `Main`
- `Header.return` → `App`
- `Main.sibling` → `null`
- `Main.return` → `App`

若 `Main` 有子节点 `List`：

```
Main
  └─child─→ List
              └─return─→ Main
```

### 深度优先遍历顺序

[[concepts/react/work-loop]] 以以下规则遍历 Fiber 树：

1. **向下**：优先走 `child`，进入第一个子节点。
2. **向右**：没有 `child` 时（叶节点），走 `sibling` 进入兄弟节点。
3. **向上**：没有 `sibling` 时，沿 `return` 上溯到父节点，再尝试父节点的 `sibling`。

遍历顺序（beginWork → completeWork）：

```
beginWork(App)
  beginWork(Header) → completeWork(Header)
  beginWork(Main)
    beginWork(List) → completeWork(List)
  completeWork(Main)
completeWork(App)
```

这个顺序保证了子节点总是在父节点之前完成（completeWork），从而可以安全地向上冒泡 `flags`。

### 双缓冲（Double Buffering）

React 同时维护**两棵** Fiber 树：

- **current 树**：当前渲染到屏幕上的树，`root.current` 指向其根节点。
- **workInProgress 树**：后台正在构建的新树，每个节点通过 `alternate` 字段指向 current 树中的对应节点（反之亦然）。

```
current:         App ←──alternate──→ App'        :workInProgress
                  │                    │
               Header              Header'
```

render 阶段在 workInProgress 树上进行所有修改，commit 完成后执行：

```js
root.current = finishedWork; // 原子切换
```

下次渲染时，原 current 树的节点可以被复用为新的 workInProgress 节点（通过 `alternate`），减少内存分配。

## 优势与局限

- ✅ **可中断遍历**：链表迭代（while 循环）可以在任意节点后暂停，保存 `workInProgress` 指针即可下次继续，这是递归方案无法实现的。
- ✅ **双缓冲零闪烁**：用户始终看到完整的 current 树，workInProgress 在后台完成后才切换。
- ✅ **节点复用**：`alternate` 指针使新旧节点之间可以互相复用，降低 GC 压力。
- ❌ **比 VDOM 对象树更复杂**：三条指针 + 双缓冲 + alternate 引用，心智模型比简单的嵌套对象树难理解得多。
- ❌ **指针错误难排查**：手动维护 child/sibling/return 的一致性是潜在 bug 来源。

## 应用场景

Fiber 树结构是整个 React 渲染流水线（render → commit）的数据基础，所有组件树操作都通过对 Fiber 树的读写完成。理解 Fiber 树是理解 [[concepts/react/reconciliation]]、[[concepts/react/render-phase]]、[[concepts/react/commit-phase]] 的前提。

## 相关概念

- [[concepts/react/fiber-architecture]]：Fiber 架构（FiberNode 字段定义）
- [[concepts/react/double-buffering]]：双缓冲
- [[entities/react/fiber-node]]：Fiber 节点数据结构
- [[entities/react/work-in-progress-tree]]：workInProgress 树
