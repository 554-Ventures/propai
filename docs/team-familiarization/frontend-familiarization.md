# Frontend Familiarization

Repository root: /Users/anhbien/Documents/Code/propai  
Web app: /Users/anhbien/Documents/Code/propai/apps/web  
API dependency: /Users/anhbien/Documents/Code/propai/apps/api  
Mobile future app: /Users/anhbien/Documents/Code/propai/apps/mobile

## What the Frontend Is Today

- Framework: Next.js 14 app router with React 18 and TypeScript.
- UI baseline: custom components under src/components and app-router pages under src/app.
- API client: src/lib/api.ts using NEXT_PUBLIC_API_URL (default http://localhost:4000) and bearer token auth.

Evidence:
- apps/web/package.json
- apps/web/src/app/layout.tsx
- apps/web/src/lib/api.ts

## First Files to Read

- apps/web/src/app/layout.tsx: root layout and global provider wiring.
- apps/web/src/app/page.tsx: root landing and auth redirect behavior.
- apps/web/src/components/app-shell.tsx: nav shell, responsive assistant pane, auth menu.
- apps/web/src/components/chat-pane.tsx: AI transcript UI and action confirmation UX.
- apps/web/src/components/dashboard-ai-chat.tsx: dashboard launcher that sends events to chat.

## Structure Map

- src/app/(auth): auth views.
- src/app/(app): authenticated product views (dashboard, tenants, properties, etc.).
- src/components: shell, auth, chat, and UI primitives.
- tests: Playwright E2E specs.

Evidence:
- apps/web/src/app directory tree
- apps/web/src/components directory tree
- apps/web/tests

## AI UI Contract and Behavior

- Frontend expects /ai/chat mode values: chat, clarify, draft, result.
- Draft cards render summary, fields, and action controls.
- Pending action state is explicit via pendingActionId and supports continuing a selected draft.
- Confirm path sends clientRequestId for idempotent backend execution.
- Transcript supports multiple drafts with explicit Continue/New action controls.

Evidence:
- apps/web/src/components/chat-pane.tsx
- apps/web/tests/chat-crud.spec.ts

## Mobile App Status and Next-Step Readiness

Current status:
- apps/mobile exists as a workspace package but is not initialized.
- All mobile scripts are placeholders that echo not initialized.

Evidence:
- apps/mobile/package.json

Next-step readiness:
- Backend is API-first and token-based, so mobile can reuse the same endpoint surface.
- Immediate prerequisites for mobile kickoff:
  - Define mobile framework choice and project bootstrap in apps/mobile.
  - Reuse auth token contract from web api client behavior.
  - Prioritize parity for AI chat mode handling (chat/clarify/draft/result) because this is the most stateful UI workflow.

## Frontend Risks to Watch

- Playwright config has no webServer block, so E2E depends on manually running app services.
- UI logic in chat-pane is state-heavy; regressions are most likely around pendingActionId and multi-draft flows.

Evidence:
- apps/web/playwright.config.ts
- apps/web/src/components/chat-pane.tsx

## Next Actions for New Frontend Contributors

- Start from app-shell + chat-pane to understand interaction model.
- Run existing chat E2E specs before touching chat UX state transitions.
- Keep API mode contract alignment explicit when changing frontend AI behavior.
