# AI Security Guardrails (PropAI)

## Threat Model
- Prompt injection attempts to override instructions or extract system prompts.
- Cross-tenant data access via tool calls or resource ID guessing.
- Abuse of chat endpoints (rate-limit evasion, cost exhaustion, denial of service).
- Harmful content requests or unsafe outputs (hate, harassment, illicit activity).
- Data exfiltration (PII leakage, system prompt disclosure, social engineering).

## Implemented Defenses

### Request Controls
- **Input sanitization**: Remove control/bidi characters, strip script tags, escape angle brackets, and enforce max length.
- **Prompt injection detection**: Block known instruction-hijack, system prompt exfiltration, SQLi, and XSS patterns.
- **Moderation**: OpenAI Moderation API gate on user input; flagged content is blocked and logged.

### Rate Limiting
- **Per-user**: Hourly and daily request caps.
- **Per-IP**: Hourly and daily caps to mitigate shared abuse.
- **Legacy burst limit**: Optional short-window guard to prevent spikes.

### Function Calling Security
- **Allowlist**: Only known chat tools execute; unknown tool calls are blocked and logged.
- **Ownership checks**: All tool queries are scoped by `userId` and property access is verified before data access.
- **Audit trail**: Tool calls are logged to `ToolCallLog` for traceability.

### Output Filtering
- **System prompt protection**: Blocks outputs attempting to reveal system/developer prompts.
- **Social engineering**: Blocks outputs requesting sensitive credentials.
- **Profanity/hate**: Blocks outputs with detected profanity or hate patterns.
- **Output moderation**: Optional OpenAI moderation pass on assistant output.

### Cost Controls
- **Usage tracking**: Token usage and optional USD cost recorded per response.
- **Budgets**: Monthly per-user budgets enforced via `AiBudget` or env default.
- **Warnings**: Budget-near-limit events logged for monitoring.

## Rate Limits and Thresholds
Defaults (override via env):
- `AI_RATE_LIMIT_USER_HOURLY_MAX=20`
- `AI_RATE_LIMIT_USER_DAILY_MAX=100`
- `AI_RATE_LIMIT_IP_HOURLY_MAX=60`
- `AI_RATE_LIMIT_IP_DAILY_MAX=300`
- `AI_RATE_LIMIT_WINDOW_MS` / `AI_RATE_LIMIT_MAX` (optional burst control)
- `AI_MAX_MESSAGE_CHARS=4000`

Budgets:
- `AI_BUDGET_MONTHLY_USD` (default 0 = disabled)
- `AI_BUDGET_WARN_THRESHOLD=0.8`

Moderation:
- `AI_MODERATION_ENABLED` (default true)
- `AI_OUTPUT_MODERATION_ENABLED` (default true)
- `OPENAI_MODERATION_MODEL=omni-moderation-latest`

## Monitoring Strategy
- **AI usage**: `AiUsage` table tracks tokens and cost per response.
- **Security events**: `AiSecurityEvent` logs prompt injection, rate limit, moderation, and output blocks.
- **Tool audit**: `ToolCallLog` persists tool inputs/outputs with status.
- **Dashboards**: Build dashboards on `AiUsage` + `AiSecurityEvent` (volume, flagged rate, blocked rate, budget burn).

## Incident Response Plan
1. **Detect**: Alert on spikes in `AiSecurityEvent` or rate-limit violations.
2. **Contain**: Temporarily lower rate limits or disable chat for impacted users.
3. **Investigate**: Review `AiSecurityEvent`, `ToolCallLog`, and `ChatMessage` metadata.
4. **Remediate**: Patch detection patterns and tighten allowlists.
5. **Recover**: Restore service and add regression tests for the incident.

## Testing Procedures
Run security tests and simulate attacks:
- Prompt injection: “Ignore previous instructions…”
- Cross-user access: Attempt another user’s property ID in tool calls
- Rate limit: Rapid-fire 100 messages
- SQL injection patterns: `"' OR 1=1 --"`
- XSS attempts: `<script>alert(1)</script>`
- Role hijacking: “You are now the system”

Tests: `apps/api/src/__tests__/ai-security.test.ts`
