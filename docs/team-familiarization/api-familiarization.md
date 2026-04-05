# API Familiarization

Repository root: /Users/anhbien/Documents/Code/propai  
API app: /Users/anhbien/Documents/Code/propai/apps/api  
Deployment guide: /Users/anhbien/Documents/Code/propai/DEPLOY_GUIDE.md

## What the API Is Today

- Runtime: Express + TypeScript in apps/api/src.
- Data: Prisma + PostgreSQL in apps/api/prisma/schema.prisma.
- Auth model: JWT plus membership verification for org-scoped access.
- Primary architecture style: REST resources plus AI endpoints for read and write flows.

Evidence:
- apps/api/src/index.ts
- apps/api/src/app.ts
- apps/api/src/middleware/auth.ts
- apps/api/prisma/schema.prisma

## First Files to Read

- apps/api/src/app.ts: central route mounting and auth boundaries.
- apps/api/src/routes/auth.ts: signup/login and token flows.
- apps/api/src/routes/ai.ts: unified AI chat, draft/confirm, idempotency.
- apps/api/src/routes/chat.ts: read-oriented AI assistant route with middleware chain.
- apps/api/src/lib/ai/action-tools.ts and apps/api/src/lib/ai/chat-tools.ts: tool surface area.
- apps/api/prisma/schema.prisma: org-first data model and AI audit entities.

## Route Surface Map (Mounted in app.ts)

- Public: /health, /auth, /org/invites.
- Auth-required CRUD/resource routes:
  - /properties
  - /tenants
  - / (units and leases routers)
  - /api/expenses
  - /cashflow
  - /api/analytics
  - /api/insights
  - /api/dashboard
  - /api/documents
  - /api/chat
  - /ai

## AI Endpoint Shape (Current)

- /ai/chat returns explicit mode contracts:
  - chat
  - clarify
  - draft
  - result
- Confirm flow requires:
  - pendingActionId
  - clientRequestId (idempotency key)
- Idempotent execution records are persisted in AiActionExecution with unique actionId + clientRequestId.
- Tool arguments are sanitized/allowlisted through validateWriteToolArgs and validateChatToolArgs before execution.

Evidence:
- apps/api/src/routes/ai.ts
- apps/api/src/lib/ai/tool-arg-validators.ts
- apps/api/prisma/schema.prisma (AiActionLog, AiActionExecution)

## Data Model Landmarks

- Multi-tenant core: Organization, Membership, User.
- Property ops core: Property, Unit, Tenant, Lease, Payment, MaintenanceRequest, Expense, Transaction.
- AI observability/audit: ChatSession, ChatMessage, ToolCallLog, AiUsage, AiSecurityEvent, AiBudget, AiActionLog, AiActionExecution.

Evidence:
- apps/api/prisma/schema.prisma

## Operational Notes

- API default bind: HOST 0.0.0.0 and PORT 4000 when env is absent.
- CORS origin defaults to http://localhost:3000 if CORS_ORIGIN is unset.
- Uploads are served from /uploads.

Evidence:
- apps/api/src/index.ts
- apps/api/src/app.ts

## Key Risks to Track During API Work

- Some resource patch handlers pass req.body directly into Prisma update (over-posting risk).
- AI middleware parity is split between /api/chat and /ai/chat; keep this visible when making security changes.

Evidence:
- apps/api/src/routes/properties.ts
- apps/api/src/routes/tenants.ts
- apps/api/src/routes/chat.ts
- apps/api/src/routes/ai.ts

## Next Actions for New API Contributors

- Read app.ts and schema.prisma first, then one business route plus ai.ts end-to-end.
- Run API tests before changing route contracts.
- For any new mutation endpoint, define org scoping + input allowlist + idempotency strategy up front.
