---
title: "设计一个独立开发者的 AI 团队"
date: "2026-05-11 10:00:00"
description: "一份关于如何使用专家型 AI 角色，同时避免把独立项目变成流程表演的简明设计笔记。"
cover: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1600&auto=format&fit=crop"
tags: ["AI Agent", "产品", "工程"]
---

## The Principle

A solo developer does not need a heavy process. A solo developer does need clear thinking.

The useful version of an AI team is not twelve agents talking forever. It is one orchestrator that brings in a specialist only when the current stage needs that perspective.

## Gate Order

The current workflow follows this order:

1. Intake
2. Product
3. UX
4. Architecture
5. Build
6. Integration
7. QA
8. Security
9. Code review
10. Docs
11. Release

The main rule is simple: no implementation before acceptance criteria and architecture exist; no release before validation gates are handled.

## What Good Handoffs Look Like

A good handoff is short and concrete. It names the role, findings, deliverables, blockers, validation performed, and recommended next role. That is enough structure to keep momentum without losing context.
