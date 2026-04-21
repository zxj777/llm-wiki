---
title: "React Fiber Architecture"
author: acdlite (Andrew Clark)
source_url: https://github.com/acdlite/react-fiber-architecture
fetched: 2026-04-21
tags: [react, fiber, architecture, internals]
---

# React Fiber Architecture

## Introduction

React Fiber is an ongoing reimplementation of React's core algorithm. It is the culmination of over two years of research by the React team.

The goal of React Fiber is to increase its suitability for areas like animation, layout, and gestures. Its headline feature is **incremental rendering**: the ability to split rendering work into chunks and spread it out over multiple frames.

Other key features include the ability to pause, abort, or reuse work as new updates come in; the ability to assign priority to different types of updates; and new concurrency primitives.

### About this document

Fiber introduces several novel concepts that are difficult to grok solely by looking at code. This document began as a collection of notes I took as I followed along with Fiber's implementation in the React project. As it grew, I realized it may be a helpful resource for others, too.

Please note that I am not on the React team, and do not speak from any authority. **This is not an official document**.

## What is reconciliation?

**reconciliation**: The algorithm React uses to diff one tree with another to determine which parts need to be changed.

**update**: A change in the data used to render a React app. Usually the result of `setState`. Eventually results in a re-render.

The central idea of React's API is to think of updates as if they cause the entire app to re-render. Reconciliation is the algorithm behind what is popularly understood as the "virtual DOM."

Key points:
- Different component types are assumed to generate substantially different trees. React will not attempt to diff them, but rather replace the old tree completely.
- Diffing of lists is performed using keys. Keys should be "stable, predictable, and unique."

## Reconciliation versus rendering

The DOM is just one of the rendering environments React can render to. React is designed so that reconciliation and rendering are separate phases. The reconciler does the work of computing which parts of a tree have changed; the renderer then uses that information to actually update the rendered app.

## Scheduling

React's Design Principles: React is not a generic data processing library. It is a library for building user interfaces.

- In a UI, it's not necessary for every update to be applied immediately.
- Different types of updates have different priorities — an animation update needs to complete more quickly than an update from a data store.
- A push-based approach requires the app to decide how to schedule work. A pull-based approach allows the framework (React) to be smart and make those decisions.

## What is a fiber?

We need to be able to:
- pause work and come back to it later.
- assign priority to different types of work.
- reuse previously completed work.
- abort work if it's no longer needed.

A fiber represents a **unit of work**. Fiber is reimplementation of the stack, specialized for React components. You can think of a single fiber as a **virtual stack frame**.

### Structure of a fiber

A fiber is a JavaScript object that contains information about a component, its input, and its output.

#### `type` and `key`
The type describes the component. For composite components, the type is the function or class. For host components (`div`, `span`), the type is a string.

#### `child` and `sibling`
Point to other fibers, describing the recursive tree structure. The child fiber corresponds to the value returned by a component's render method. Child fibers form a singly-linked list.

#### `return`
The return fiber is the fiber to which the program should return after processing the current one (parent fiber).

#### `pendingProps` and `memoizedProps`
Props are the arguments of a function. `pendingProps` are set at beginning of execution, `memoizedProps` at the end. When `pendingProps === memoizedProps`, the fiber's previous output can be reused.

#### `pendingWorkPriority`
A number indicating the priority of work. A larger number indicates lower priority.

#### `alternate`
At any time, a component instance has at most two fibers: the current fiber and the work-in-progress fiber. The alternate of the current fiber is the work-in-progress, and vice versa.

#### `output`
Every fiber eventually has output, but output is created only at leaf nodes by **host components**. Output is transferred up the tree and eventually given to the renderer.
