---
title: 自定义渲染器与 hostConfig
type: topic
created: 2026-04-21
updated: 2026-04-21
tags: [react, source-code, custom-renderer, host-config, frontend]
status: active
sources: []
---

# 自定义渲染器与 hostConfig

## 所属主题

[[topics/react/source-code]]

## 阅读目标

搞清楚 `react-reconciler` 包如何通过 `hostConfig` 接口实现渲染器解耦，如何基于它构建自定义渲染器（如 react-three-fiber、react-native、ink）。

## 入口函数/文件

- `packages/react-reconciler/src/ReactFiberReconciler.js` — `createContainer`、`updateContainer`
- `packages/react-reconciler/src/ReactFiberCompleteWork.js` — `completeWork`（调用 hostConfig 的位置）
- `packages/react-reconciler/src/ReactFiberCommitWork.js` — `commitMutationEffects`（调用 commitUpdate 等）

## 调用链路

```
# 步骤 1：实现 hostConfig 并创建 Renderer
import ReactReconciler from 'react-reconciler'

const hostConfig = {
  # --- 必须实现的核心接口 ---

  # 创建实例（对应 createElement）
  createInstance(type, props, rootContainer, hostContext, internalHandle) → instance,
  createTextInstance(text, rootContainer, hostContext, internalHandle) → textInstance,

  # DOM 树构建（completeWork 阶段调用）
  appendInitialChild(parentInstance, child),          # 首次挂载时构建子树
  finalizeInitialChildren(instance, type, props, ...) → Boolean,

  # Mutation 操作（commit 阶段调用）
  appendChild(parentInstance, child),
  appendChildToContainer(container, child),
  insertBefore(parentInstance, child, beforeChild),
  insertInContainerBefore(container, child, beforeChild),
  removeChild(parentInstance, child),
  removeChildFromContainer(container, child),

  # 更新（commit 阶段调用）
  prepareUpdate(instance, type, oldProps, newProps, ...) → updatePayload | null,
  commitUpdate(instance, updatePayload, type, oldProps, newProps, internalHandle),
  commitTextUpdate(textInstance, oldText, newText),

  # 上下文（渲染时调用）
  getRootHostContext(rootContainer) → hostContext,
  getChildHostContext(parentHostContext, type, rootContainer) → hostContext,
  getPublicInstance(instance) → publicInstance,   # ref 的 .current 值

  # 布尔配置
  shouldSetTextContent(type, props) → Boolean,    # 是否直接设置文本（跳过子 fiber）
  supportsMutation: true,       # DOM 风格：直接修改实例
  supportsPersistence: false,   # Immutable 风格：每次更新创建新实例

  # 可选（commit 阶段钩子）
  prepareForCommit(containerInfo) → null | Record,
  resetAfterCommit(containerInfo),
}

const Renderer = ReactReconciler(hostConfig)

# 步骤 2：创建容器（FiberRoot）
const container = Renderer.createContainer(
  rootHostNode,     # 宿主根节点（如 Three.js Scene、Terminal 等）
  ConcurrentRoot,   # tag: LegacyRoot=0 | ConcurrentRoot=1
  null,             # hydrationCallbacks
  false,            # isStrictMode
  null,             # concurrentUpdatesByDefaultOverride
  '',               # identifierPrefix（用于 useId 前缀）
  onRecoverableError,
  null              # transitionCallbacks
)
  → createFiberRoot(containerInfo, tag, ...)  # 内部创建 FiberRoot

# 步骤 3：渲染
Renderer.updateContainer(element, container, null, callback)
  → scheduleUpdateOnFiber(root, fiber, lane)
  → workLoop → beginWork / completeWork
    → completeWork → case HostComponent:
      → createInstance(type, props, ...)       # hostConfig 调用
      → appendAllChildren()
        → appendInitialChild(parent, child)    # hostConfig 调用
  → commitRoot
    → commitMutationEffects
      → commitPlacement → appendChild(...)     # hostConfig 调用
      → commitWork → commitUpdate(...)         # hostConfig 调用

# 实际案例
react-three-fiber (r3f):
  → createInstance → new THREE.Mesh / new THREE.Group（Three.js 对象）
  → appendChild → parent.add(child)（Three.js 场景树操作）
  → commitUpdate → 更新 Three.js 对象属性
  → 使用 ConcurrentRoot + requestAnimationFrame 驱动渲染循环

ink（Terminal UI）:
  → createInstance → { type, props, children: [] }（自定义 ANSI 节点）
  → commitUpdate → 触发终端重绘（stdout 重写）
  → supportsMutation: true，每次 update 触发 stdout 重写
```

## 涉及核心概念

- [[concepts/react/host-config]]
- [[concepts/react/fiber-architecture]]
- [[concepts/react/render-phase]]
- [[concepts/react/commit-phase]]

## 涉及实体

- [[entities/react/react-reconciler]]
- [[entities/react/react-dom]]

## 常见问题

- **`supportsMutation` 和 `supportsPersistence` 有什么区别？**
  `supportsMutation: true`（DOM 模式）：reconciler 在 commit 阶段直接修改现有实例（`commitUpdate`），类似 DOM 的 `element.setAttribute`；`supportsPersistence: true`（持久化/Immutable 模式）：reconciler 不修改旧实例，而是调用 `cloneInstance`/`createContainerChildSet` 等创建新实例，整个子树替换——适合像 React Native 这样通过 bridge 与 native 通信的场景。两种模式互斥，大多数自定义渲染器选择 `supportsMutation`。

- **react-native 使用的是哪种模式？**
  react-native-renderer 使用 `supportsPersistence: true`（持久化模式）。每次更新时，React 通过 `createContainerChildSet` 构建新的子节点集合，通过 `finalizeContainerChildren` 一次性提交给 Native 层，减少 JS→Native bridge 的往返次数。New Architecture（Fabric）下改为同步的 JSI 调用，不再需要异步 bridge。

- **自定义渲染器能使用所有 React hooks 吗？**
  可以使用所有与状态/副作用相关的 hooks（`useState`、`useEffect`、`useRef`、`useContext`、`useReducer` 等），因为这些 hooks 实现在 `react-reconciler` 中，与具体渲染器无关。需要确保 `createContainer` 时传入正确的 `tag`（ConcurrentRoot 支持并发特性），且自定义渲染器正确处理了 commit 阶段的副作用（`prepareForCommit`/`resetAfterCommit`）。

- **`getChildHostContext` 的作用是什么？**
  用于在 Fiber 树中向下传递"宿主上下文"（如 SVG 命名空间、XUL 上下文），允许父节点的类型影响子节点的创建方式。例如在 react-dom 中，`<svg>` 的 `getChildHostContext` 返回 SVG 命名空间上下文，使子节点通过 `document.createElementNS('http://www.w3.org/2000/svg', type)` 创建而非 `document.createElement(type)`。上下文通过 `beginWork → pushHostContext` 入栈，`completeWork → popHostContext` 出栈。

## 延伸阅读

- [[topics/react/package-architecture]]：React 包架构与 renderer 解耦
- [[concepts/react/host-config]]：hostConfig 接口详解
- [[comparisons/react/sync-vs-concurrent]]：渲染器选择同步还是并发模式
