# Phase 3 Plan - AI Features + Infrastructure (Weeks 6-7)

## Implementation Order (Highest Value First)
1. Expense categorization (LLM-powered) + user override flow
2. Cash flow forecasting (time-series baseline model)
3. **Complete maintenance & vendor management UI** + enhance existing backend
4. AI insights feed + accuracy metrics
5. Follow-on AI features (rent optimization, maintenance prediction)

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

### Maintenance & Vendor Management Completion

**Current State**: ✅ Backend API complete, ✅ Database schema ready, ❌ UI placeholder only

**Backend Enhancements Needed:**
- Vendor CRUD API routes (basic structure exists in schema)
- Vendor assignment to maintenance requests (vendorId field exists)
- Vendor performance tracking and analytics endpoints
- Service category filtering and search

**Frontend Implementation Required:**
- **Replace maintenance placeholder page** with full maintenance request management
- **Vendor directory UI**: List, add, edit vendors with service categories
- **Maintenance-Vendor workflow**: Assign vendors to requests, track status
- **Performance dashboard**: Vendor cost analysis, response times, ratings
- **Integration with existing alerts**: Link dashboard alerts to maintenance page

**Existing Infrastructure to Leverage:**
- `MaintenanceRequest` model with proper relationships
- `Vendor` model with service categories and contact info  
- Dashboard integration showing pending maintenance alerts
- AI integration for maintenance request creation/updates

## AI Integration with Vendor Management
- **Smart Vendor Matching**: Use maintenance request categories to auto-suggest appropriate vendors
- **Cost Optimization**: Analyze vendor pricing trends and suggest most cost-effective options
- **Performance Scoring**: Machine learning-based vendor rating system considering cost, speed, and quality
- **Predictive Scheduling**: Recommend optimal vendor assignment based on availability and workload
- **Expense Integration**: Auto-categorize vendor expenses and link to maintenance requests for better reporting

## Testing Strategy
- Mock OpenAI client for deterministic categorization results
- API tests for:
  - `/api/expenses/categorize` (validates schema + AI insight logging)
  - `/api/expenses` (creates expense and logs overrides)
  - `/api/analytics/forecast` (returns projection structure)
  - `/api/vendors` (CRUD operations - **new endpoints to build**)
  - `/api/maintenance/:id/assign-vendor` (vendor assignment workflow - **enhance existing**)
- Frontend smoke tests for:
  - AI suggestion display and override workflow
  - Forecast widget renders and toggles views
  - **New**: Complete maintenance page replacing placeholder
  - **New**: Vendor directory and maintenance assignment UI
  - **New**: Vendor performance analytics dashboard

**Note**: Maintenance API (`/api/maintenance`) already has comprehensive test coverage - focus on vendor endpoints and UI integration tests.

## Success Criteria
- >= 80% expense categorization accuracy on labeled test set
- Forecast endpoint returns projections for any property with >= 3 months of history
- **Maintenance page fully functional** - replacing placeholder with complete UI
- **Complete vendor CRUD** with service category filtering and search
- **Maintenance-to-vendor assignment workflow** functional with status tracking
- **Vendor performance tracking** with cost, time, and quality metrics
- **Dashboard integration** - maintenance alerts link to functional maintenance page
- UI shows confidence + reasoning and allows overrides
- AI insights feed shows last 20 predictions with accuracy metrics
