---
title: "内存优化与泄漏检测"
type: concept
created: 2026-04-21
updated: 2026-04-21
tags: [performance, memory, leak, devtools, frontend]
status: active
sources: []
---

# 内存优化与泄漏检测

## 定义

内存优化关注降低 JS 堆与 DOM 内存占用，并消除"内存泄漏"——即不再使用却被引用而无法被 GC 回收的对象。长时间运行的 SPA、IM、画布编辑器等场景尤其敏感，泄漏积累会导致页面变慢、崩溃，甚至浏览器 Tab 被系统杀死。

## 工作原理

**常见泄漏模式**：

1. **事件监听未移除**：组件卸载时忘记 `removeEventListener`，DOM 已脱离但 listener 持有闭包。
2. **定时器**：`setInterval` 未 `clearInterval`，回调持续持有外部作用域。
3. **闭包持 DOM**：闭包中引用了已被移除的 DOM 节点（"Detached DOM"），节点无法回收。
4. **全局变量**：`window.cache.push(largeObj)` 无清理策略。
5. **错误的缓存**：用普通 `Map`/`Set` 缓存对象，永久持有；应改用 `WeakMap`/`WeakSet`，键被回收时缓存自动消失。

**DevTools Memory 面板**：
- *Heap Snapshot* 多次快照对比，过滤 "Detached" 找游离 DOM；按 `Retainers` 链反查持有者。
- *Allocation Timeline* / *Allocation Sampling* 录制一段操作期间的分配，定位频繁分配函数。
- 顶部"垃圾桶"按钮强制 GC，确认对象是真泄漏还是尚未回收。

**典型修复模式**：

```js
// React: useEffect 返回清理函数
useEffect(() => {
  const onScroll = () => {/*...*/};
  window.addEventListener('scroll', onScroll);
  const t = setInterval(tick, 1000);
  return () => {
    window.removeEventListener('scroll', onScroll);
    clearInterval(t);
  };
}, []);

// fetch 取消：AbortController
const ctrl = new AbortController();
fetch(url, { signal: ctrl.signal });
// 卸载时 ctrl.abort();
```

```js
// 用 WeakMap 缓存与 DOM 关联的元数据
const meta = new WeakMap();
meta.set(node, { x: 1 }); // node 被 GC 时自动失效
```

监控线上：`performance.memory.usedJSHeapSize`（Chrome 限定，且为粗粒度）、`PerformanceObserver` 的 `measureUserAgentSpecificMemory()`（更准但需隔离上下文）。

## 优势与局限

- ✅ 提升长会话稳定性，降低崩溃率
- ✅ DevTools 工具链成熟
- ❌ 真实场景下复现路径难找
- ❌ Heap Snapshot 体积大、对比耗时
- ❌ 部分泄漏来自第三方依赖难以修复

## 应用场景

- 长时间运行的 IM、协作编辑、监控大屏
- Canvas/WebGL/视频会议类应用
- 路由频繁切换的中后台
- Electron / 桌面端 Web 容器

## 相关概念

- [[concepts/js/garbage-collection]]: 理解可达性与 GC 策略
- [[concepts/js/weakref-finalization]]: 弱引用与终结器在缓存中的应用
