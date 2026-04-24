---
title: "React 初始渲染：createRoot、FiberRoot、根 Fiber、updateContainer 与 updateHostRoot"
source: "Conversation notes"
author:
  - "[[Copilot]]"
published:
created: 2026-04-23
description: "围绕 React 初始渲染过程，对 createRoot、FiberRoot、HostRoot Fiber、createFiber、updateContainer、updateHostRoot 的关系做一份源码阅读笔记。"
tags:
  - "notes"
  - "react"
  - "source-code"
  - "fiber"
  - "reconciler"
---

# React 初始渲染：createRoot、FiberRoot、根 Fiber、updateContainer 与 updateHostRoot

这份笔记不是按源码文件顺序写的，而是按**阅读时最容易混淆的概念**来整理。

核心目标只有一个：

> 搞清楚 `createRoot(container).render(<App />)` 之后，React 是怎么从“创建根”走到“开始处理根 Fiber”的。

---

## 一、先建立最小心智模型

先不要一上来就钻进 `Scheduler`、`lanes`、`microtask`。

初始渲染最重要的主线其实只有三句话：

1. `createRoot`：**创建 React 根运行时，但不真正渲染**
2. `updateContainer`：**把 `<App />` 登记成一次 root update**
3. `updateHostRoot`：**在 render 阶段消费这次 update，并把 `<App />` 展开成子 Fiber**

如果只记这三句，后面很多细节都会顺。

---

## 二、三个最容易混的东西

### 1. DOM container

真实 DOM 节点，也就是 React 最后要挂载进去的地方。

例如：

```js
const container = document.getElementById('root')
```

它不是 Fiber，也不是 FiberRoot。

---

### 2. FiberRoot

`FiberRoot` 不是 Fiber 节点，它是**整棵树的根级运行时对象**。

它更像“后台控制台”或者“根管理对象”，里面放的是整棵树的全局信息：

- `containerInfo`：宿主容器（DOM container）
- `current`：当前生效的根 Fiber
- `pendingLanes` / `suspendedLanes`：整棵树的调度状态
- `callbackNode` / `callbackPriority`：调度器任务信息
- root 级别的 context、cache、hydration、error handling

所以：

- FiberRoot **不在 Fiber 树里**
- FiberRoot **管理 Fiber 树**

---

### 3. 根 Fiber（HostRoot Fiber）

根 Fiber 是 Fiber 树里的第一个节点，`tag` 是 `HostRoot`。

它和普通组件 Fiber 一样，都是 Fiber 节点，只不过它是整棵 Fiber 树的入口节点。

后续 `<App />` 对应的 Fiber，不是最顶层，它会成为根 Fiber 的 `child`。

可以想成：

```txt
HostRootFiber
  -> child: AppFiber
       -> child: divFiber
```

所以：

- 根 Fiber **在 Fiber 树里**
- FiberRoot **在 Fiber 树外**

---

## 三、FiberRoot 和根 Fiber 的关系

两者通过两条引用连起来：

```js
fiberRoot.current = hostRootFiber
hostRootFiber.stateNode = fiberRoot
```

也就是：

```txt
FiberRoot
  └── current ---> HostRootFiber

HostRootFiber
  └── stateNode ---> FiberRoot
```

这是理解后续调用链的关键。

---

## 四、为什么 FiberRoot 要独立存在，不能直接塞进根 Fiber 里

核心原因是：

> `FiberRoot` 表示“整棵树稳定存在的根级状态”，而根 Fiber 只是“某一版树里的一个节点”。

最重要的原因有三个。

### 1. 根 Fiber 有两个版本，但 FiberRoot 只有一个

Fiber 是双缓冲模型。

同一个组件实例通常会有两份 Fiber：

- `current`
- `workInProgress`

根 Fiber 也一样。

如果把 root 级别的全局状态都放到根 Fiber 里，那这些状态就会跟着出现两份，语义会混乱。

现在的设计是：

- `FiberRoot`：稳定存在一份
- `FiberRoot.current`：指向当前生效的根 Fiber
- 根 Fiber 的 `stateNode`：回指 `FiberRoot`

这样根级状态不会跟着 Fiber 版本切换而复制两份。

### 2. FiberRoot 里很多字段不是“节点属性”

比如：

- `containerInfo`
- `pendingLanes`
- `callbackNode`
- `timeoutHandle`
- `onRecoverableError`
- `context`

这些更像“整棵树的运行时控制信息”，不是某个节点自己的数据。

### 3. React 希望 HostRoot 也只是一个普通 Fiber 节点

React 的 beginWork / completeWork / reconcileChildren 等树算法，最好统一作用在 Fiber 节点上。

如果把一堆 root 专属字段混进根 Fiber，模型会变重，也不利于统一处理。

---

## 五、`createRoot` 究竟做了什么

`createRoot` **本身不做初始渲染**。

它做的是：

> 为一个 DOM 容器创建 React 的根运行时，并返回一个公开的 `root` 对象。

简化后可以理解成：

```txt
createRoot(container)
-> createContainer(...)
-> createFiberRoot(...)
-> createHostRootFiber(...)
-> createFiber(HostRoot, ...)
-> 把 FiberRoot 和 HostRoot Fiber 互相连起来
-> 返回 ReactDOMRoot
```

### `createRoot` 的结果是什么

1. 有了一个 `FiberRoot`
2. 有了一个 `HostRoot Fiber`
3. `FiberRoot.current` 指向这个 HostRoot Fiber
4. 根 Fiber 的 `stateNode` 回指 FiberRoot
5. 根 Fiber 初始化了 updateQueue
6. 容器被标记为 React root，并注册事件

但是这时候：

> **还没有把 `<App />` 变成 Fiber 子树**

因为 `createRoot` 只是“建根”，不是“渲染”。

---

## 六、`createFiber` 在初始渲染中的位置

`createFiber` 的职责很单纯：

> **创建并初始化一个 Fiber 节点**

它不是“做渲染”，也不是“创建 DOM”。

它更像 Fiber 节点构造器。

`createFiber` 真正常见的使用点有两类：

### 1. 创建根 Fiber

在 `createHostRootFiber` 里：

```js
return createFiber(HostRoot, null, null, mode)
```

### 2. 把 ReactElement 变成普通 Fiber

后续在子节点调和时，会走：

```txt
createFiberFromElement
-> createFiberFromTypeAndProps
-> createFiber
```

所以要区分：

- 根 Fiber：由 `createHostRootFiber -> createFiber` 创建
- 普通组件 Fiber：由 `createFiberFromElement -> createFiber` 创建

---

## 七、`root.render(<App />)` 干了什么

在 `ReactDOMRoot.js` 中：

```js
root.render(children)
```

最终会调用：

```js
updateContainer(children, root, null, null)
```

这里的 `root` 其实是内部的 `FiberRoot`。

---

## 八、`updateContainer` 的职责

`updateContainer` 可以用一句话概括：

> **把“要渲染的 ReactElement 树”包装成一次 root update，挂到 HostRoot Fiber 的 updateQueue 上，然后启动调度。**

它不会直接创建整棵 Fiber 子树。

### 可以把它理解成什么

很粗暴但很好用的类比：

> `root.render(<App />)` 本质上像是对 HostRoot 做了一次 `setState({ element: <App /> })`

当然它不是字面意义的 `setState`，但内部机制很接近：

- `createUpdate`
- `enqueueUpdate`
- `scheduleUpdateOnFiber`

### `updateContainer` 最关键的动作

1. 取出当前根 Fiber

```js
const current = container.current
```

2. 为本次更新分配优先级（lane）

```js
const lane = requestUpdateLane(current)
```

3. 创建 update

```js
const update = createUpdate(lane)
```

4. 把 element 塞进 payload

```js
update.payload = { element }
```

5. 挂进根 Fiber 的 updateQueue

```js
enqueueUpdate(rootFiber, update, lane)
```

6. 启动调度

```js
scheduleUpdateOnFiber(root, rootFiber, lane)
```

### 重点：它只是“登记”

到这一步为止，React 只是记住了：

> 这个 root 下一次 render 时，应该把 `element` 更新成 `<App />`

它**还没有真正开始处理 `<App />`**。

---

## 九、`updateContainer` 之后，怎么走到 `updateHostRoot`

这是今天最容易卡住的地方。

关键结论是：

> `updateHostRoot` 不是 `updateContainer` 直接调用的。  
> 它是在 render 阶段，由 `beginWork` 根据 `HostRoot` 分支调到的。

---

## 十、把调用链压成最真实的函数顺序

从：

```js
root.render(<App />)
```

开始，大致链路是：

```txt
root.render(<App />)
-> updateContainer(...)
-> createUpdate(...)
-> enqueueUpdate(...)
-> scheduleUpdateOnFiber(...)
-> ensureRootIsScheduled(...)
-> 调度器安排处理这个 root
-> performWorkOnRoot(...)
-> renderRootSync / renderRootConcurrent
-> prepareFreshStack(...)
-> createWorkInProgress(root.current, null)
-> workLoopSync / workLoopConcurrent
-> performUnitOfWork(workInProgress)
-> beginWork(current, workInProgress, lanes)
-> case HostRoot
-> updateHostRoot(current, workInProgress, lanes)
```

如果觉得太长，先只看下面这条更短的版本：

```txt
updateContainer
-> 把 { element: <App /> } 放进根 Fiber 的 updateQueue

render 开始
-> 基于 root.current 创建 workInProgress 根 Fiber
-> beginWork(根 Fiber)
-> 因为 tag 是 HostRoot
-> updateHostRoot(...)
```

这条已经够用了。

---

## 十一、真正的断点在这里：`createWorkInProgress(root.current, null)`

前面之所以容易“看着像跳了”，是因为缺了这一句的心智模型。

在 render 开始时，React 会做：

```js
const rootWorkInProgress = createWorkInProgress(root.current, null)
workInProgress = rootWorkInProgress
```

这句话的意思是：

- `root.current`：当前页面正在使用的那份根 Fiber
- `createWorkInProgress(...)`：创建/复用它的另一份版本
- `workInProgress`：这次 render 真正要处理的根 Fiber

也就是：

```txt
current 根 Fiber  --->  workInProgress 根 Fiber
```

接下来 work loop 处理的，不是 `FiberRoot`，而是这份 `workInProgress 根 Fiber`。

---

## 十二、为什么 `beginWork` 会调用 `updateHostRoot`

因为 work loop 会执行：

```js
performUnitOfWork(workInProgress)
```

里面又会调：

```js
beginWork(current, workInProgress, renderLanes)
```

而 `beginWork` 内部是按 Fiber `tag` 分发的：

```js
switch (workInProgress.tag) {
  case HostRoot:
    return updateHostRoot(current, workInProgress, renderLanes)
}
```

由于这里处理的是**根 Fiber 的 workInProgress 版本**，它的 `tag` 就是 `HostRoot`，所以自然会进入：

```js
updateHostRoot(...)
```

所以要把这件事理解成：

> `updateHostRoot` 不是“凭空被调用”  
> 而是 work loop 开始处理根 Fiber 时，`beginWork` 看到它是 `HostRoot`，于是分发到了 `updateHostRoot`

---

## 十三、`updateHostRoot` 真正做了什么

`updateHostRoot` 的职责是：

> **消费根 Fiber 上已经登记好的 updateQueue，拿到新的 `element`，然后开始调和子节点。**

最关键的几步是：

1. 克隆并处理 updateQueue

```js
cloneUpdateQueue(current, workInProgress)
processUpdateQueue(workInProgress, nextProps, null, renderLanes)
```

2. 拿到更新后的 root state

```js
const nextState = workInProgress.memoizedState
const nextChildren = nextState.element
```

3. 调和 children

```js
reconcileChildren(current, workInProgress, nextChildren, renderLanes)
```

于是 `<App />` 才真正开始变成子 Fiber 树。

---

## 十四、`{ element: <App /> }` 是怎么变成 `nextChildren` 的

在 `updateContainer` 里，update 的 payload 是：

```js
update.payload = { element: <App /> }
```

后面 `updateHostRoot` 调用：

```js
processUpdateQueue(...)
```

会把这个 payload 合并到 root state 里。

所以 root state 会从：

```js
{
  element: null,
  isDehydrated: false,
  cache: ...
}
```

变成：

```js
{
  element: <App />,
  isDehydrated: false,
  cache: ...
}
```

然后：

```js
const nextChildren = nextState.element
```

因此 `nextChildren` 就是 `<App />`。

---

## 十五、`reconcileChildren` 之后发生什么

`reconcileChildren` 继续往下走，最终会把 ReactElement 转成普通 Fiber：

```txt
reconcileChildren
-> mountChildFibers / reconcileChildFibers
-> createFiberFromElement
-> createFiberFromTypeAndProps
-> createFiber
```

也就是说：

- `updateContainer`：登记 `<App />`
- `updateHostRoot`：取出 `<App />`
- `reconcileChildren`：把 `<App />` 展开为 Fiber 子树

---

## 十六、关于“current 是当前生效的根 Fiber”，为什么会有 current

因为 React 用的是双缓冲模型。

对同一个组件实例，通常会有两份 Fiber：

- `current`
- `workInProgress`

根 Fiber 也一样。

所以对一个 `FiberRoot` 来说，会有两份根 Fiber 版本：

```txt
current <----alternate----> workInProgress
```

但同一时刻只有一个是当前生效的：

- `FiberRoot.current` 指向已经 commit 的那个版本
- 另一份是 render 中正在构建的新版本

提交完成后，`FiberRoot.current` 会切换过去。

所以并不是“同时有多个生效的根 Fiber”，而是：

> 同一个 root 会维护两份根 Fiber，在 current 和 workInProgress 之间切换

---

## 十七、最短总结

如果只保留今天讨论的最核心版本，可以记成下面这组句子。

### 1. `createRoot`

`createRoot` 只负责**创建根运行时**：

- 创建 `FiberRoot`
- 创建 `HostRoot Fiber`
- 把两者连起来

它**不负责真正渲染 `<App />`**。

### 2. `FiberRoot`

`FiberRoot` 是**整棵树的根管理对象**，不是 Fiber 节点。

### 3. 根 Fiber

根 Fiber 是 Fiber 树里的第一个节点，`tag = HostRoot`。

### 4. `updateContainer`

`updateContainer` 负责**登记一次 root update**，把 `{ element: <App /> }` 放进根 Fiber 的 updateQueue。

### 5. `updateHostRoot`

`updateHostRoot` 负责**在 render 阶段消费这次 update**，拿到新的 `element`，并进入 `reconcileChildren`。

### 6. 两者关系

可以一句话记忆：

> `updateContainer` 负责“记账”，`updateHostRoot` 负责“结账”。

---

## 十八、一张最终关系图

在 `createRoot(container)` 之后、`root.render(<App />)` 之前：

```txt
DOM Container
   ^
   |
FiberRoot ------------------------------+
  current --------------------------+   |
                                     |   |
HostRoot Fiber (current)             |   |
  stateNode -------------------------+---+
  child = null
```

在 `root.render(<App />)` 之后，render 开始时：

```txt
FiberRoot
  current ---> HostRoot Fiber (current)
                 alternate ---> HostRoot Fiber (workInProgress)

HostRoot Fiber (current)
  updateQueue: 包含 { element: <App /> } 这次 update

workLoop
  -> beginWork(workInProgress HostRoot Fiber)
  -> updateHostRoot(...)
  -> reconcileChildren(...)
  -> child 变成 App Fiber
```

---

## 十九、源码阅读时的推荐抓手

如果后面继续顺着初始渲染往下读，建议按这条顺序看：

1. `ReactDOMRoot.js`：`createRoot` / `root.render`
2. `ReactFiberReconciler.js`：`createContainer` / `updateContainer`
3. `ReactFiberRoot.js`：`createFiberRoot`
4. `ReactFiber.js`：`createHostRootFiber` / `createFiber`
5. `ReactFiberWorkLoop.js`：`scheduleUpdateOnFiber`、render work loop
6. `ReactFiberBeginWork.js`：`beginWork` / `updateHostRoot`
7. `ReactChildFiber.js`：`reconcileChildren` 如何创建子 Fiber

---

## 二十、最后的一句话版本

> `createRoot` 只是把“React 根”搭起来；  
> `updateContainer` 只是把 `<App />` 登记为一次 root update；  
> 真正开始处理 `<App />`，是在 render 阶段 `beginWork` 命中 `HostRoot` 分支后，由 `updateHostRoot` 完成的。
