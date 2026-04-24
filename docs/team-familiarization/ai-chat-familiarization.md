# AI Chat Familiarization

## Purpose
This document gives a concise, end-to-end view of the AI chat feature across frontend, API routes, backend tool orchestration, persistence, and safety controls.

## High-Level Architecture
- Primary conversational endpoint: `POST /ai/chat` (unified state machine for read, clarify, draft, result).
- History and session endpoints: `/api/chat/history`, `/api/chat/sessions`, and session clear/delete under `/api/chat/sessions/:id`.
- Frontend chat UI sends all conversational turns to `/ai/chat`, while loading/switching session history via `/api/chat/*`.
- Data persists to `ChatSession`, `ChatMessage`, `ToolCallLog`, `AiActionLog`, `AiActionExecution`, `AiUsage`, and `AiSecurityEvent`.

## Frontend Flow
Main UI lives in:
- `apps/web/src/components/chat-pane.tsx`
- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/components/dashboard-ai-chat.tsx`
- `apps/web/src/lib/chat-events.ts`

How it works:
1. User submits message from `ChatPane`.
2. Frontend calls `POST /ai/chat`.
3. Backend returns one of four modes:
   - `chat`: normal assistant reply.
   - `clarify`: write intent detected but required fields missing.
   - `draft`: write plan ready, waiting for confirm.
   - `result`: confirmed action executed and receipt/result returned.
4. Frontend renders mode-specific UI:
   - clarify chips/options,
   - draft card with field preview,
   - confirm/cancel buttons,
   - result receipt.
5. Session list/load/clear/new calls `/api/chat/history` and `/api/chat/sessions`.

## Backend/API Flow
Key routes:
- `apps/api/src/routes/ai.ts`
- `apps/api/src/routes/chat.ts`
- Mounted in `apps/api/src/app.ts`

### Unified `/ai/chat` behavior
- Auth required (mounted under `/ai` with `requireAuth`).
- Handles three major paths:
  1. Confirm path (`confirm: true`): executes pending action with idempotency key.
  2. Pending follow-up path (`pendingActionId`): merges user follow-up into incomplete draft.
  3. New message path: chooses write planning vs read chat.

State machine response contract:
- `mode=chat`: read response.
- `mode=clarify`: missing fields for a write action.
- `mode=draft`: proposed write action awaiting explicit confirm.
- `mode=result`: action executed and receipt returned.

### Legacy/read route `/api/chat`
- Supports read-oriented tool loop and safety middleware chain.
- Also owns chat history/session management endpoints currently used by frontend.

## Tooling Layers
Read tools:
- `apps/api/src/lib/ai/chat-tools.ts`
- Includes tools like rent collected, outstanding rent, property expenses, lease ending, document search, property resolution/listing.

Write tools:
- `apps/api/src/lib/ai/action-tools.ts`
- Supports create/update/delete for:
  - cashflow transactions,
  - properties,
  - tenants,
  - maintenance requests.

Planning/patch helpers:
- `apps/api/src/lib/ai/agent-planner.ts`
- `apps/api/src/lib/ai/pending-action-extractor.ts`
- `apps/api/src/lib/ai/tool-arg-validators.ts`

## Persistence Model
Defined in `apps/api/prisma/schema.prisma`:
- `ChatSession`: chat container, optional title/summary/property scope.
- `ChatMessage`: user/assistant turns, optional metadata.
- `ToolCallLog`: per-message tool execution logs.
- `AiUsage`: token and cost tracking per response.
- `AiSecurityEvent`: security moderation/guardrail events.
- `AiActionLog`: pending/confirmed/failed/canceled write action workflow.
- `AiActionExecution`: idempotent confirm executions (`@@unique([actionId, clientRequestId])`).

## Safety, Cost, and Memory
Key modules:
- `apps/api/src/middleware/ai-rate-limit.ts`
- `apps/api/src/middleware/ai-input-sanitizer.ts`
- `apps/api/src/middleware/ai-prompt-guard.ts`
- `apps/api/src/security/moderation.ts`
- `apps/api/src/lib/ai/rolling-summary.ts`

Implemented controls:
- Rate limits (user and IP windows).
- Input sanitization and prompt-injection guard.
- Moderation and output filtering.
- Usage/cost logging.
- Rolling session summary + automatic session title generation.

## Confirm and Idempotency Contract
On confirm requests to `/ai/chat`:
- `pendingActionId` is required.
- `clientRequestId` is required.
- Backend returns the same stored result for repeated confirms with the same `(actionId, clientRequestId)`.
- Execution state is persisted in `AiActionExecution` and reflected in `AiActionLog`.

## Test Coverage Snapshot
Primary tests:
- `apps/api/src/__tests__/ai-chat.integration.test.ts`
- `apps/api/src/__tests__/ai-chat-idempotency.test.ts`
- `apps/api/src/__tests__/ai-chat.readonly.test.ts`
- `apps/api/src/__tests__/ai-chat.rolling-summary.test.ts`

Covered scenarios include:
- clarify -> draft -> result transitions,
- unrelated follow-up protection,
- confirm idempotency,
- offline JSON tool-message flows,
- rolling summary updates.

## Practical Mental Model
Think of AI chat as a hybrid system:
- Read assistant mode: answers via safe tool-backed retrieval.
- Write assistant mode: drafts deterministic tool actions, then requires explicit user confirmation before mutation.

Current integration intentionally keeps frontend simple:
- one conversational endpoint (`/ai/chat`) for turns and confirms,
- one history/session surface (`/api/chat/*`) for persistence UX.