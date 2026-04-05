# Security Familiarization

Repository root: /Users/anhbien/Documents/Code/propai  
API app: /Users/anhbien/Documents/Code/propai/apps/api  
Web app: /Users/anhbien/Documents/Code/propai/apps/web

## Security Controls Present Today

Auth and tenant isolation:
- JWT verification and membership check gate each authenticated request.
- Most CRUD routes scope reads/writes by organizationId.

Evidence:
- apps/api/src/middleware/auth.ts
- apps/api/src/app.ts
- apps/api/src/routes/properties.ts
- apps/api/src/routes/tenants.ts

AI integration safeguards:
- Input controls on /api/chat route chain:
  - aiRateLimit
  - aiInputSanitizer
  - aiPromptGuard
  - aiModeration
  - aiBudgetGuard
- Tool call allowlisting and arg validation before execution.
- Output filtering + optional moderation of assistant output.
- Security events persisted to AiSecurityEvent.
- Confirm mutation idempotency via clientRequestId and AiActionExecution unique key.

Evidence:
- apps/api/src/routes/chat.ts
- apps/api/src/lib/ai/tool-arg-validators.ts
- apps/api/src/security/output-filter.ts
- apps/api/src/security/security-logger.ts
- apps/api/src/routes/ai.ts
- apps/api/prisma/schema.prisma

## High-Priority Risks (Current)

1. Middleware parity gap on AI endpoints.
- /api/chat uses full AI security middleware chain.
- /ai/chat route is mounted with requireAuth only and performs its own internal checks, but does not use the same centralized middleware stack.
- Risk: inconsistent enforcement and drift between AI entry points.

Evidence:
- apps/api/src/app.ts
- apps/api/src/routes/chat.ts
- apps/api/src/routes/ai.ts

2. Rate limiting is process-local memory.
- ai-rate-limit uses an in-memory Map, not a shared store.
- Risk: limits do not hold across multiple API instances or restarts.

Evidence:
- apps/api/src/middleware/ai-rate-limit.ts

3. Over-posting risk in patch handlers.
- Some patch handlers pass req.body directly to Prisma update.
- Risk: unintended mutable fields can be written if sent by client.

Evidence:
- apps/api/src/routes/properties.ts
- apps/api/src/routes/tenants.ts

4. Output filter is regex-based only.
- Useful baseline, but pattern-based detection can miss nuanced leakage.
- Risk: false negatives for prompt exfil/social engineering variants.

Evidence:
- apps/api/src/security/output-filter.ts

## Practical Security Starting Points

- Read middleware/auth.ts and app.ts to understand trust boundaries.
- Compare /api/chat and /ai/chat side by side before making AI changes.
- Inspect schema entities for auditability: AiSecurityEvent, AiUsage, AiActionExecution.

## Recommended Immediate Actions

- Unify or centrally compose the AI middleware policy for all AI entry points.
- Replace in-memory AI rate limiting with shared storage for multi-instance deployments.
- Add explicit field allowlists for resource patch endpoints currently using direct req.body updates.
- Add tests that assert identical security behavior for /api/chat and /ai/chat where intended.
