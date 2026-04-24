# AI Chat Rewrite Plan (Option B)

## Objective
Rewrite PropAI chat assistant into a reliable, language-agnostic orchestration model that:
- Understands user intent in any language.
- Executes tasks only through guarded, deterministic server actions.
- Uses chat-first clarification (no form filling), with selectable controls only for finite options.

## Non-Negotiable Constraints
1. No hardcoded natural-language parser as decision truth (no create/add/edit/delete keyword routing).
2. No mutation execution from raw model text.
3. No mutation forms in UI; clarification through chat text and finite option controls only.
4. Tenant isolation + authorization enforced server-side for every read/write.
5. High-impact mutations require explicit confirm and idempotency key.

## Target Runtime Architecture
1. Planner stage (LLM, strict JSON schema)
   - Output intent: `read | write | clarify`.
   - For write, output canonical action + arguments.
2. Policy stage (deterministic)
   - Enforce RBAC, tenant boundaries, risk, budget/rate constraints.
3. Executor stage (deterministic)
   - Execute only allowlisted tools with schema validation.
   - Return execution receipt and normalized result payload.
4. Response stage
   - Compose chat-safe output, never claiming success without receipt.

## Workstream Delegation

### PropAI Product Manager (planning/coordination)
- Define rollout phases and acceptance criteria.
- Freeze v1 action surface (top workflows).
- Track API/UI contract changes and migration risks.
- Own go/no-go checklist for production rollout.

### Senior API Engineer (backend orchestration)
- Remove hard dependency on keyword heuristics for intent routing.
- Make planner output the primary source of action intent.
- Expand clarify contract to describe input mode (`single_select`, `multi_select`, `free_text`).
- Keep confirms idempotent and auditable.
- Preserve backward compatibility while frontend migrates.

### Senior Frontend Web Engineer (chat UX)
- Render clarify prompts from backend contract.
- Show option chips/checkboxes only for finite options.
- Keep all free-text clarification in chat messages (no form renderer).
- Keep draft confirmation as read-only summary + confirm/cancel.

### Coding Agent (this implementation pass)
- Implement foundational API + frontend contract updates.
- Keep changes incremental and backward compatible.
- Validate affected tests and report gaps.

## Phase Plan

### Phase 1 (now)
- Add/standardize clarify metadata contract.
- Update frontend clarify renderer for contract-driven controls.
- Gate keyword heuristic parser behind explicit feature flag (off by default).

### Phase 2
- Add policy engine module with explicit decision logs.
- Add risk tiers per tool/action and auto-confirm rules for low-risk operations.
- Add locale-aware value resolvers (date/currency/number normalization).

### Phase 3
- Add attack-simulation suite and multilingual intent benchmarks.
- Add observability dashboards for intent confidence, clarify rate, and execution success.

## Acceptance Criteria (Phase 1)
1. Backend can emit clarify prompts with input mode + options.
2. Frontend renders finite options as controls and never renders generic forms.
3. Free-text clarifications remain chat-only.
4. Heuristic natural-language parser is opt-in via environment flag.
5. Existing confirm idempotency behavior remains unchanged.
