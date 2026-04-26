# PropAI In-App AI Agent 2.0 Implementation Summary

Created: 2026-04-26
Related plan: `docs/AI_AGENT_2_IMPLEMENTATION_PLAN.md`
Commit: `1574fe5d9cac91e7010467ca5f897e9d5ba09d10`

## Summary

This change delivered the first functional pass of PropAI Agent 2.0 as a fresh in-app AI agent path under `/api/agent`. The implementation keeps OpenAI as the provider, moves Agent 2.0 to a stronger configurable model, adds per-user markdown context files, supports server-sent event streaming to the web assistant, and preserves the draft-confirm safety model for AI-initiated writes.

The new agent is intentionally separate from the legacy assistant orchestration. It selectively reuses proven primitives such as authentication context, org scoping, AI guardrails, usage/cost tracking, write validation, idempotent execution, audit logging, and rolling chat summaries.

## What Was Accomplished

### Fresh Agent 2.0 API

- Added a new primary route at `/api/agent`.
- Implemented a fresh chat orchestration path instead of routing through the legacy assistant endpoints.
- Added SSE event delivery for assistant turns, tool status updates, drafts, clarification requests, errors, and completion events.
- Added session and history endpoints for the Agent 2.0 sidebar experience.
- Added confirm and cancel endpoints for pending AI write actions.
- Added a manual context regeneration endpoint at `/api/agent/context/regenerate`.

Key file:
- `apps/api/src/routes/agent.ts`

### User Context Files

- Added a context generation service for authenticated users.
- Context is generated from organization-scoped data only.
- Context files are written to `data/user-context/{organizationId}/{userId}.md`, with support for `AI_CONTEXT_DIR`.
- Context files include user profile, properties, tenants, financial summary, outstanding payments, and open maintenance requests.
- Context writes use a temp-file-then-rename flow for safer updates.
- Chat continues even if context generation or reading fails.
- Stale or missing context triggers best-effort regeneration.

Key file:
- `apps/api/src/lib/ai/user-context-service.ts`

### Context Refresh After Mutations

- Added middleware that triggers best-effort context refresh after successful protected CRUD mutations.
- Applied the middleware to property, tenant, unit, lease, maintenance, vendor, expense, cashflow, and document route groups.
- Added duplicate-listener protection for requests that pass through multiple mounted route groups.
- Excluded AI/chat/auth routes from the generic mutation refresh hook to avoid recursion and duplicate side effects.
- Added weekly in-process context regeneration startup logic, disabled in test and configurable by env.

Key files:
- `apps/api/src/middleware/agent-context-refresh.ts`
- `apps/api/src/app.ts`
- `apps/api/src/index.ts`

### Agent Tool Registry

- Added a dedicated Agent 2.0 tool registry with clear public tool names.
- Added read tools:
  - `get_properties`
  - `get_tenants`
  - `get_financials`
- Added write tool mappings:
  - `create_property` -> existing `createProperty`
  - `create_tenant` -> existing `createTenant`
  - `log_payment` -> existing `createCashflowTransaction`
- Kept `userId` and `organizationId` server-derived from auth context, never from model output.
- Added missing-field detection and human-readable draft summaries for Agent 2.0 write tools.
- Confirmed writes refresh user context best-effort.

Key file:
- `apps/api/src/lib/ai/agent2-tools.ts`

### Safety, Guardrails, And Auditability

- Applied AI rate limit and budget guard to `/api/agent`.
- Applied input sanitization, prompt guard, and moderation to Agent 2.0 chat turns.
- Kept output filtering and optional output moderation on generated assistant text.
- Blocked unsupported tool calls and logged security events.
- Preserved draft-before-confirm behavior for writes.
- Preserved idempotency protection using action ID plus client request ID.
- Preserved AI usage tracking and cost calculation.
- Preserved action execution logging through existing AI action tables.

Key files:
- `apps/api/src/routes/agent.ts`
- `apps/api/src/app.ts`
- `apps/api/src/security/ai-policy-engine.ts`

### Stronger Agent Model Configuration

- Added a dedicated Agent 2.0 model getter.
- Agent 2.0 now defaults to `gpt-4.1` unless overridden by `AI_AGENT_MODEL` or `OPENAI_MODEL`.
- Legacy assistant model behavior remains isolated.

Key file:
- `apps/api/src/lib/openai.ts`

### Web Assistant Integration

- Rewired the existing sidebar assistant to call `/api/agent` instead of legacy chat/action endpoints.
- Added browser streaming support using `fetch` and `ReadableStream` parsing.
- Added handling for Agent 2.0 SSE events including sessions, message deltas, tool progress, drafts, clarification, errors, and completion.
- Rewired confirm and cancel actions to `/api/agent/confirm` and `/api/agent/cancel`.
- Rewired session history and session management to `/api/agent/history` and `/api/agent/sessions`.
- Exported `API_URL` so the streaming client can use the same configured API base URL.

Key files:
- `apps/web/src/components/chat-pane.tsx`
- `apps/web/src/lib/api.ts`

### Supporting Product And Platform Updates

- Added the Agent 2.0 implementation plan as a committed planning artifact.
- Added the original in-app agent planning note for reference.
- Added a product overview document.
- Included related property, document, maintenance, unit cashflow, and AI policy updates that support the broader Agent 2.0 and property operations direction.

Key files:
- `docs/AI_AGENT_2_IMPLEMENTATION_PLAN.md`
- `propai/docs/PropAI - In-App AI Agent 2.md`
- `PRODUCT_OVERVIEW.md`

## Validation Completed

- Editor diagnostics were clean for the new/touched Agent 2.0 implementation files before commit.
- The Agent 2.0 route, tool registry, context service, context refresh middleware, route mounting, server scheduler wiring, web chat pane, and API URL export were checked for diagnostics.
- No automated test suite was run as part of this functional pass, matching the request to focus on functionality rather than new test implementation.

## Current Status And Follow-Ups

- SSE streaming now consumes OpenAI Responses stream deltas and forwards assistant text progressively through `message_delta` events, while still preserving the final response snapshot for tool calls, usage tracking, and persistence.
- Manual smoke testing is still needed for context regeneration, read tools, draft/clarify flows, confirm/cancel, idempotency, and context refresh after writes.
- The generated runtime context file under `apps/api/data/user-context/...` was intentionally left uncommitted.
- Context refresh observability is minimal and can be improved with admin/debug metadata.
- Maintenance-specific Agent 2.0 tools, RAG, proactive suggestions, and multi-step action chaining remain future enhancements.

## Suggested Manual Smoke Scenarios

- Generate context for a seeded user with `POST /api/agent/context/regenerate`.
- Ask: "List my properties" and verify scoped property data.
- Ask: "Show my tenants" and verify tenant data.
- Ask: "How much rent did I collect last month?" and verify financial output.
- Ask: "Add tenant Jane Doe" and verify missing fields are requested together.
- Provide missing fields and verify a draft summary is shown.
- Confirm the draft and verify the write executes once.
- Repeat confirm with the same client request ID and verify no duplicate write occurs.
- Cancel a draft and verify no mutation occurs.
- Confirm a write and verify user context refreshes best-effort.
- Attempt cross-org references and verify denial.
- Trigger rate limiting and verify a friendly error path.