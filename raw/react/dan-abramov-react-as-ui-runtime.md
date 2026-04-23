---
title: "React as a UI Runtime"
author: Dan Abramov
source_url: https://overreacted.io/react-as-a-ui-runtime/
fetched: 2026-04-21
tags: [react, runtime, reconciliation, internals]
---

# React as a UI Runtime

Most tutorials introduce React as a UI library. But this post talks about React as a programming runtime.

## Host Tree

React programs usually output **a tree that may change over time**. We call it a "host tree" because it is part of the host environment outside React (like DOM or iOS).

React makes a bet on two principles:
- **Stability**: The host tree is relatively stable; most updates don't radically change its overall structure.
- **Regularity**: The host tree can be broken down into UI patterns that look and behave consistently.

## Host Instances

The host tree consists of nodes called "host instances". In DOM, these are regular DOM nodes (`document.createElement('div')`). They have their own properties and may contain other host instances as children.

## Renderers

A renderer teaches React to talk to a specific host environment. React DOM, React Native, and Ink are renderers. Renderers can work in "mutating" mode (like DOM) or "persistent" mode (clone-based, used in React Fabric).

## React Elements

A React element is a plain JavaScript object describing a host instance:
```js
// <button className="blue" />
{ type: 'button', props: { className: 'blue' } }
```

React elements are immutable and don't have persistent identity — they're meant to be re-created and thrown away. Think of them as frames in a movie.

## Reconciliation

React's job is to make the host tree match the provided React element tree.

**Key rule**: If an element type in the same place in the tree "matches up" between the previous and next renders, React reuses the existing host instance.

- Same type in same position → update props, reuse instance
- Different type → remove old, create new

## Conditions

React handles conditional rendering by tracking positions in the tree. Using null as a placeholder preserves position of other children.

## Lists and Keys

With dynamic lists, use `key` to let React identify which items are "conceptually the same" even if positions change. Keys should be stable, predictable, and unique within the parent.

## Components

Components are functions that return React elements. They enable creating a "toolbox" of reusable UI pieces. React components are assumed to be pure with respect to their props.

## State

React keeps component state paired with the position of that component in the tree. When a component unmounts, its state is destroyed. When it re-mounts, state starts fresh.

## Consistency

React keeps all subtree updates batched so that the user never sees a half-updated state. The separation between render phase (pure computation) and commit phase (DOM updates) enables this.

## Memoization

`React.memo` compares previous and next props — if unchanged, skips re-rendering. Child components also use their parent's props as "cache key."

## Raw Models

React doesn't use a fine-grained reactivity system. It re-renders the entire component subtree starting from a setState call, then reconciles to decide what DOM operations are actually needed.

## Batching

React batches multiple setState calls that happen in the same event handler into a single re-render.

## Call Tree vs Call Stack

React maintains its own "call tree" (the fiber tree) in memory. Unlike the call stack which gets destroyed when a function returns, the fiber tree persists to maintain local state.

## Context

Context lets "broadcast" data to the whole subtree without threading props through every level. `createContext` creates a context object; Provider sets the value; `useContext` reads it.

## Effects

Effects let React components perform side effects after rendering. `useEffect` runs after the browser has painted. Effects are not "reactive subscriptions" — they fire on every render by default.

## Custom Hooks

Custom Hooks let you extract stateful logic into a reusable function. They're just functions that call built-in hooks.

## Static Use Order

Hooks must be called in the same order every render — this is how React associates hook calls with their internal state slots (a linked list on the fiber).
