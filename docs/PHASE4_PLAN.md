# Phase 4 Plan — Polish & Launch (Week 8)

## Dashboard Implementation Plan

### Key Metrics
- **Occupancy rate**: active leases / total units (show % + occupied/total).
- **Total income**: sum of paid payments.
- **Outstanding rent**: sum of unpaid/late payments past due.
- **Maintenance costs**: sum of maintenance costs logged.
- **Portfolio counts**: properties, units, tenants, active leases.

### Alerts
- **Late payments**: payments past due (status `LATE` or unpaid with due date < today).
- **Expiring leases**: leases ending in the next 30 days.
- **Pending maintenance**: maintenance requests in `PENDING` or `IN_PROGRESS`.

### Charts
- **Cash flow trend**: reuse `/api/analytics/forecast` for projection.
- **Income vs expenses**: simple bar chart using last 6–12 months.

### API Endpoints
- `GET /api/dashboard/metrics`
- `GET /api/dashboard/alerts`

---

## Document Storage + OCR Plan

### Storage (MVP)
- Local disk storage (apps/api/uploads) with unique filenames.
- Optional S3/R2 support via env flag for production.

### API Endpoints
- `POST /api/documents/upload`
  - `multipart/form-data` with fields:
    - `file` (required)
    - `propertyId` (optional)
    - `leaseId` (optional)
    - `type` (optional: LEASE/RECEIPT/INSPECTION/INSURANCE/TAX/OTHER)
    - `name` (optional)
- `GET /api/documents?propertyId=...`

### OCR (Optional MVP)
- Basic text extraction for text/pdf files.
- Store OCR output as AIInsight `DOCUMENT_OCR` for traceability.

---

## Deployment Checklist (Vercel + Railway/Fly.io)

### API (Railway/Fly)
- [ ] Create Postgres instance
- [ ] Configure `DATABASE_URL`
- [ ] Set `JWT_SECRET`
- [ ] Configure `CORS_ORIGIN` to Vercel URL
- [ ] Set `OPENAI_API_KEY` + `OPENAI_MODEL`
- [ ] Configure storage env (local in dev, S3 in prod)
- [ ] Add `/health` check

### Web (Vercel)
- [ ] Set `NEXT_PUBLIC_API_URL` to API URL
- [ ] Verify routing for app pages

---

## GitHub Repo Setup Tasks
- [ ] Initialize repo and set default branch `main`
- [ ] Add `.env.example` files
- [ ] Add README with setup + deploy guide
- [ ] Add basic GitHub Actions workflow (optional)

---

## Production Readiness Checklist
- [ ] Health check endpoint passes
- [ ] API logs configured
- [ ] Secrets stored in platform env vars
- [ ] Error handling with friendly UI states
- [ ] Mobile responsiveness verified
- [ ] Uploads validated and virus scan note for future

---

## Launch Tasks
- [ ] Smoke test core flows (login → dashboard → add property → upload doc)
- [ ] Verify Stripe/Plaid disabled in MVP if not configured
- [ ] Create demo data
- [ ] Confirm analytics + AI endpoints respond
- [ ] Announce launch + collect feedback
