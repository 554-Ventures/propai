# Testing Familiarization

Repository root: /Users/anhbien/Documents/Code/propai  
API app: /Users/anhbien/Documents/Code/propai/apps/api  
Web app: /Users/anhbien/Documents/Code/propai/apps/web  
Mobile future app: /Users/anhbien/Documents/Code/propai/apps/mobile

## How to Run Tests from Current Scripts

Workspace level:
- pnpm test
  - Runs tests recursively across workspaces via pnpm -r test.

API tests:
- pnpm -C apps/api test
  - Resets test DB with Prisma migrate reset.
  - Regenerates Prisma client.
  - Runs Vitest suite.
- pnpm -C apps/api test:integration
  - Runs targeted ai-chat.integration.test.ts flow.

Web E2E tests:
- pnpm -C apps/web test:e2e
  - Runs Playwright tests in apps/web/tests.

Evidence:
- package.json (repo root)
- apps/api/package.json
- apps/web/package.json

## Current Coverage Areas

API (Vitest + Supertest):
- Auth and org invite flows.
- Core domain routes (properties, units, tenants, cashflow, forecast).
- AI safety and behavior:
  - ai-security.test.ts for sanitizer logic.
  - ai-chat-idempotency.test.ts for confirm idempotency behavior.
  - ai-actions.test.ts and ai-chat.integration.test.ts for planning/confirm/cancel and chat workflows.
  - ai-chat.readonly.test.ts and ai-chat.rolling-summary.test.ts for mode and memory behavior.

Web (Playwright):
- chat-crud.spec.ts covers draft/clarify/confirm flows, including delete action scenarios and multiple pending drafts.
- ai-chat.spec.ts and chat-crud.spec.ts provide UI-level AI chat behavior checks.

Evidence:
- apps/api/src/__tests__
- apps/web/tests

## Key Gaps and Constraints

- No coverage thresholds or coverage reporting config in Vitest config.
- Playwright config has no webServer startup block; tests assume running app services.
- No initialized mobile app tests because apps/mobile is scaffold placeholder only.
- No .github/workflows test automation present in repository currently.

Evidence:
- apps/api/vitest.config.ts
- apps/web/playwright.config.ts
- apps/mobile/package.json
- .github directory state

## Onboarding Test Execution Order

1. API: run pnpm -C apps/api test and confirm DB reset behavior works locally.
2. Web: start required services, then run pnpm -C apps/web test:e2e.
3. Full workspace: run pnpm test before merging cross-app changes.

## Suggested Next Actions

- Add Vitest coverage settings and minimum thresholds for critical API modules.
- Add deterministic Playwright startup orchestration for API and web in CI.
- Add first mobile test harness when apps/mobile framework is initialized.
