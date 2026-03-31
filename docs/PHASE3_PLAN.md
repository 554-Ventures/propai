# Phase 3 Plan - AI Features (Weeks 6-7)

## Implementation Order (Highest Value First)
1. Expense categorization (LLM-powered) + user override flow
2. Cash flow forecasting (time-series baseline model)
3. AI insights feed + accuracy metrics
4. Follow-on AI features (rent optimization, maintenance prediction)

## LLM Provider Decision
**Provider**: OpenAI (Responses API)
**Rationale**: Strong structured-output support, mature Node SDK, and clear guidance for server-side API key handling.

## Integration Plan (OpenAI)
- Add `OPENAI_API_KEY` and `OPENAI_MODEL` env vars to API config.
- Implement `src/lib/openai.ts` client wrapper.
- Use a constrained JSON schema for categorization outputs (category, confidence, reasoning).
- Add basic rate limiting middleware for AI endpoints.
- Log all AI predictions in `AIInsight` table with confidence + reasoning.

## Data Requirements
### Expense Categorization
- Inputs: description, amount, vendor
- Optional: property_id, previous category overrides
- Output: category (string), confidence (0-1), reasoning
- Persist: input/output payloads, confidence, and any user overrides

### Cash Flow Forecasting
- Inputs: property_id, time_range (monthly | annual), historical payment/expense data
- Aggregation: monthly totals for income + expenses
- Output: projection series with net cash flow, plus confidence estimate
- Persist: forecast output and confidence for analytics feed

## Testing Strategy
- Mock OpenAI client for deterministic categorization results
- API tests for:
  - `/api/expenses/categorize` (validates schema + AI insight logging)
  - `/api/expenses` (creates expense and logs overrides)
  - `/api/analytics/forecast` (returns projection structure)
- Frontend smoke tests for:
  - AI suggestion display and override workflow
  - Forecast widget renders and toggles views

## Success Criteria
- >= 80% expense categorization accuracy on labeled test set
- Forecast endpoint returns projections for any property with >= 3 months of history
- UI shows confidence + reasoning and allows overrides
- AI insights feed shows last 20 predictions with accuracy metrics
