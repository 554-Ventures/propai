# PropAI AI Chat — Comprehensive Test Plan (Unified `/ai/chat`)

This test plan covers the unified `/ai/chat` state machine and its supported write actions.

## Core contract (must hold)
- **Single endpoint:** all user messages and confirms go to `POST /ai/chat`.
- **Modes:** `chat | clarify | draft | result`.
- **No writes without confirm:** DB changes happen **only** after `confirm: true`.
- **Pending-action follow-ups:** follow-ups must be scoped to the current `pendingActionId` and **must not be misapplied** to the wrong field/domain.
- **History persistence:** chat sessions/messages must persist across refresh via `ChatSession`/`ChatMessage`.
- **Idempotency:** confirm calls require `clientRequestId`; repeated confirms with same `(pendingActionId, clientRequestId)` must return the same result with no duplicate writes.

---

## Preconditions / fixtures
Create or ensure:
- Org `OrgAlpha`, User A
- Property P1: `Wicker Park Duplex`, address `1830 W North Ave, Chicago, IL 60622`
- Property P2: `Logan Square 3-flat`, address `2543 N Kedzie Ave, Chicago, IL 60647`
- P1 has Unit 1, Unit 2 (if units exist)
- Tenant T1: `Jamie Chen` tied to P1 Unit 1

Observability:
- UI: ChatPane + history drawer
- API: `/ai/chat`, plus list pages to verify created records
- DB: verify record counts and foreign keys

---

## Test matrix (prompts → expected modes → DB effects)

### A) createCashflowTransaction
1. Expense full
- Prompt: `Record an expense of $189.23 for plumbing repairs at Wicker Park Duplex on March 28, 2026.`
- Expect: `draft` → (Confirm) → `result`
- DB: +1 transaction, type=EXPENSE, amount=189.23, date=2026-03-28

2. Expense missing category
- Prompt: `Log an expense $85 yesterday`
- Expect: `clarify` (category choices) → (choice) → `draft` → confirm → `result`
- DB: +1 transaction

3. Regression: "units" must NOT become category
- Prompt: `Create property at 77 W Elm St, Chicago IL. It has 4 units.`
- Expect: property flow (see below), and **no transaction created**

### B) createProperty
4. Property full address
- Prompt: `Create a property called Oak Street Duplex at 123 Oak St, Chicago, IL 60614.`
- Expect: `draft` → confirm → `result`
- DB: +1 property

5. Property missing fields
- Prompt: `Create a property called Oak Street Duplex`
- Expect: `clarify` (address fields) → follow-up provides missing → `draft` → confirm → `result`
- DB: +1 property

### C) createTenant
6. Tenant minimal
- Prompt: `Create tenant Jane Doe`
- Expect: `draft` → confirm → `result`
- DB: +1 tenant

7. Tenant incremental
- Prompt: `Add a tenant for Wicker Park Duplex Unit 2`
- Expect: `clarify` (name at least) → follow-up name → `draft` → confirm → `result`
- DB: +1 tenant

### D) createMaintenanceRequest
8. Maintenance missing property
- Prompt: `Create a maintenance request: No hot water`
- Expect: `clarify` (property choices) → choice → `draft` → confirm → `result`
- DB: +1 maintenance request

9. Maintenance with property name (ambiguous)
- Prompt: `Create a maintenance request: leaking faucet for Oak property`
- Expect: `clarify` (choose which property) unless exact match

---

## Multi-turn & pending-action robustness
10. Follow-up should not corrupt cashflow fields
- Start: `Log an expense $50 today` → expect `clarify` for category
- Follow-up: `add 4 units`
- Expect: **still clarify for category**; must NOT set `category="add 4 units"`

11. Draft edits before confirm
- Prompt: `Log expense $50 today category Utilities`
- Expect: `draft`
- Follow-up: `Actually make it $55`
- Expect: updated `draft` (no execution)

---

## Idempotency
12. Confirm replay
- Get a `draft`.
- Confirm with `clientRequestId=REQ1`.
- Repeat confirm with same `clientRequestId=REQ1`.
- Expect: same `result`, no duplicates.

---

## History persistence
13. Refresh
- Send a message, ensure response stored.
- Hard refresh.
- Expect: history loads the same session and shows messages.

---

## Manual run instructions
- Use browser devtools Network tab; verify all chat traffic hits `POST /ai/chat`.
- After each `result`, validate records show up in their list pages.
- For idempotency, attempt double-confirm (or replay confirm) and verify only one DB row is created.
