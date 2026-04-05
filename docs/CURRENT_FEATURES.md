# Current Features (Repository Snapshot)

Last updated: 2026-04-05
Scope basis: repository code and familiarization docs only.

Status legend:
- Implemented: working end-to-end for core use cases in code and UI/API surface.
- Partial: usable but constrained, inconsistent, or missing important pieces.
- Placeholder: route/page/surface exists but intentionally not fully implemented.

## Overview

### Production-ready now
- Core API service shape with health check, auth, org-scoped data access, and major domain CRUD routes.
- Web app shell with authenticated pages, dashboard, property/tenant/lease/cashflow/document workflows.
- AI assistant with explicit conversation modes (chat, clarify, draft, result), confirmation flow, and idempotent mutation execution.
- Base security controls for AI interactions (sanitization, moderation, prompt guard, output filtering, logging, budget/rate controls).
- Automated API test suite and Playwright E2E coverage for AI chat CRUD UX.

### Partial but functional
- Org access model (invites + roles) works, but multi-org-per-user is not supported.
- Units and maintenance are operational in backend patterns but not equally surfaced as first-class standalone frontend workflows.
- Insights/analytics are present, but insight productization is split between real APIs and placeholder UX.
- Operational automation exists for deploy docs/scripts, but CI orchestration and distributed runtime hardening are incomplete.

### Placeholder or intentionally incomplete
- Web Insights route is a placeholder screen.
- Web Maintenance route is a placeholder screen.
- Mobile app package exists but is not initialized.

## Personas And Workflows Currently Supported

Primary persona today:
- Property manager/owner operating a single organization workspace.

Secondary persona today:
- Org admin managing teammate invitations and role-based access.

Core workflows currently supported:
- Sign up/login and enter org-scoped workspace.
- Create and manage properties and units.
- Create and manage tenant records and leases.
- Log and review cashflow transactions (income/expense) with filtering.
- Upload and list documents; basic OCR-like text extraction for text files.
- Use dashboard metrics and alerts for occupancy, rent, lease expiration, and maintenance backlog visibility.
- Use AI assistant for read Q&A and write actions with clarify/draft/confirm/result UX.
- Manage org invitations (create/list/revoke/accept).

## Feature Catalog By Domain

## Auth
Status: Implemented

User value:
- Fast onboarding (signup creates organization + owner membership).
- Reliable login and session identity retrieval for app boot.

Key constraints:
- JWT-based auth only; no SSO/OIDC/SAML flow in current code.
- Auth depends on org membership checks for protected endpoints.

Primary code references:
- apps/api/src/routes/auth.ts
- apps/api/src/middleware/auth.ts
- apps/api/src/app.ts
- apps/web/src/components/auth-provider.tsx
- apps/web/src/lib/api.ts

## Org And Access
Status: Partial

User value:
- Owners/admins can invite members, list pending invites, and revoke invites.
- Invite acceptance supports both logged-in and new-user flows.

Key constraints:
- Explicit one-org-per-user constraint is enforced in invite logic.
- Role model is limited to OWNER/ADMIN/MEMBER and tied to membership rows.

Primary code references:
- apps/api/src/routes/org-invites.ts
- apps/api/src/middleware/roles.ts
- apps/api/prisma/schema.prisma
- apps/web/src/app/(app)/settings/org/page.tsx
- apps/web/src/app/invite/InviteClient.tsx

## Properties, Units, Tenants, Leases
Status: Partial

User value:
- End-to-end management of core portfolio entities with org scoping.
- Lease workflows include creation, editing, status transitions, and conflict checks for active occupancy.
- Unit lifecycle includes deactivate/reactivate flows.

Key constraints:
- Some PATCH handlers still pass req.body directly into Prisma update (over-posting risk).
- Units are managed via property context in web UX; no first-class global unit CRUD UI.
- Maintenance has backend data usage but no dedicated complete maintenance management UI route yet.

Primary code references:
- apps/api/src/routes/properties.ts
- apps/api/src/routes/units.ts
- apps/api/src/routes/tenants.ts
- apps/api/src/routes/leases.ts
- apps/web/src/app/(app)/properties/page.tsx
- apps/web/src/app/(app)/tenants/page.tsx
- apps/web/src/app/(app)/units/page.tsx
- apps/web/src/app/(app)/leases/page.tsx

## Cashflow And Expenses
Status: Implemented (cashflow), Partial (legacy expenses AI categorization UX)

User value:
- Cashflow transaction CRUD with filters by type/date/property.
- Unified cashflow page provides portfolio totals and transaction entry workflow.
- API still supports expense categorization and expense creation linked to AI insights.

Key constraints:
- Web expenses route currently redirects to cashflow; legacy expense-categorization UI is commented out.
- AI expense categorization exists at API layer but is not a primary surfaced web workflow today.

Primary code references:
- apps/api/src/routes/cashflow.ts
- apps/api/src/routes/expenses.ts
- apps/web/src/app/(app)/cashflow/page.tsx
- apps/web/src/app/(app)/expenses/page.tsx

## Documents
Status: Partial

User value:
- Document upload and retrieval per org/property.
- Lightweight text extraction for text mime types and persistence of extracted insight artifacts.

Key constraints:
- OCR path is basic and text-only; no robust file-type extraction pipeline.
- File storage is local uploads directory unless overridden.

Primary code references:
- apps/api/src/routes/documents.ts
- apps/api/src/app.ts
- apps/web/src/app/(app)/documents/page.tsx

## Dashboard, Analytics, Insights
Status: Partial

User value:
- Dashboard provides operational metrics and alert summaries.
- Analytics page shows per-property forecast and insight feed.
- Backend insights endpoint and forecast pipeline persist AI insight artifacts.

Key constraints:
- Dedicated web insights route is currently placeholder UX.
- Forecasting uses simple linear regression baseline and may not capture complex seasonality.

Primary code references:
- apps/api/src/routes/dashboard.ts
- apps/api/src/routes/analytics.ts
- apps/api/src/routes/insights.ts
- apps/web/src/app/(app)/dashboard/page.tsx
- apps/web/src/app/(app)/analytics/page.tsx
- apps/web/src/app/(app)/insights/page.tsx

## AI Assistant
Status: Implemented (core), Partial (policy consistency)

User value:
- Unified assistant UX supports read answers and write actions with explicit state machine:
  - chat
  - clarify
  - draft
  - result
- Confirmed mutations are idempotent through clientRequestId + persisted action execution keying.
- Write action toolset includes create/update/delete for property, tenant, cashflow transaction, and maintenance request.

Key constraints:
- Security middleware parity differs between /api/chat and /ai/chat entry points.
- Clarification heuristics are intentionally conservative and currently richer for some action types than others.

Primary code references:
- apps/api/src/routes/ai.ts
- apps/api/src/routes/chat.ts
- apps/api/src/lib/ai/action-tools.ts
- apps/api/src/lib/ai/tool-arg-validators.ts
- apps/web/src/components/chat-pane.tsx
- apps/web/tests/chat-crud.spec.ts
- apps/api/src/__tests__/ai-actions.test.ts
- apps/api/src/__tests__/ai-chat-idempotency.test.ts

## Security And Guardrails
Status: Partial

User value:
- Defense-in-depth controls for AI misuse and unsafe output reduce abuse and leakage risk.
- Auditability through AI usage/security/tool logs supports investigation and governance.

Key constraints:
- Rate limiting currently uses in-process memory, so behavior is not shared across replicas/restarts.
- Output filtering is regex/pattern based and can miss nuanced attacks.
- AI policy enforcement is split between centralized middleware path and route-internal checks.

Primary code references:
- apps/api/src/middleware/ai-rate-limit.ts
- apps/api/src/middleware/ai-input-sanitizer.ts
- apps/api/src/middleware/ai-prompt-guard.ts
- apps/api/src/middleware/ai-moderation.ts
- apps/api/src/middleware/ai-budget-guard.ts
- apps/api/src/security/output-filter.ts
- apps/api/src/security/security-logger.ts
- apps/api/src/routes/chat.ts
- apps/api/src/routes/ai.ts
- docs/AI_SECURITY.md

## Testing And Quality
Status: Partial

User value:
- Strong API and AI workflow regression protection through Vitest/Supertest.
- UI-level AI chat workflow coverage through Playwright, including multi-draft and confirmation behavior.
- Local pre-commit lint/type-check automation improves baseline code quality.

Key constraints:
- No repository CI workflow is currently present.
- Coverage thresholds/reporting are not configured in Vitest.
- Playwright requires manually running dependent services (no webServer orchestration in config).

Primary code references:
- package.json
- apps/api/package.json
- apps/api/vitest.config.ts
- apps/api/src/__tests__
- apps/web/playwright.config.ts
- apps/web/tests/ai-chat.spec.ts
- apps/web/tests/chat-crud.spec.ts

## Known Gaps And Non-Goals Right Now

Known gaps:
- No initialized mobile app implementation despite workspace package presence.
- Insights and maintenance standalone web routes are placeholders.
- Inconsistent AI middleware composition between assistant endpoints.
- Process-local rate limits are insufficient for horizontally scaled API deployment.
- Some update handlers accept unallowlisted request bodies.
- No built-in CI workflow and no enforced coverage thresholds.

Current non-goals (as implied by code/docs state):
- Multi-org tenancy per user in org access model.
- Fully mature OCR/document intelligence pipeline.
- Advanced forecasting/ML model stack beyond current linear-regression baseline.
- Fully automated end-to-end test orchestration in deployment pipeline.

## Operational Readiness Notes

Deployment basics in repo:
- Documented target deploy shape: Railway for API + PostgreSQL, Vercel/Cloudflare Pages style for web depending on guide variant.
- API health endpoint exists and is used as readiness verification baseline.
- Railway service configuration is present for Node start/restart policy.

Testing basics in repo:
- Workspace test entrypoint runs recursive package tests.
- API test script resets test DB, regenerates Prisma client, and executes Vitest.
- Web E2E script runs Playwright tests.

Monitoring basics in repo/docs:
- AI usage, tool-call, and security event persistence exists for auditing and cost/security visibility.
- Deployment docs point to platform logs (Railway/Vercel/Cloudflare) for runtime/build troubleshooting.

Primary operational references:
- DEPLOY_GUIDE.md
- docs/DEPLOYMENT.md
- docs/PRODUCTION_CHECKLIST.md
- apps/api/src/routes/health.ts
- apps/api/railway.json
- package.json
- apps/api/package.json
- apps/web/package.json
- docs/AI_SECURITY.md

## Suggested Next 3 Product Priorities

1. Unify AI security policy enforcement across all assistant endpoints.
- Why now: highest risk-reduction leverage for a core product surface already in active use.
- Grounding: documented parity gap between /api/chat and /ai/chat plus existing guardrail modules.

2. Finish the analytics/insights/maintenance product surface from partial to coherent workflows.
- Why now: backend capabilities and dashboard signals already exist, but dedicated user journeys are fragmented or placeholder.
- Grounding: placeholder insights and maintenance routes, existing analytics/insights/dashboard APIs.

3. Raise operational confidence with CI + distributed-safe controls.
- Why now: current quality gates are mostly local; scaling and release confidence need automation.
- Grounding: no .github workflow, no coverage thresholds, process-local AI rate limits.
