# PropAI PRD (Phase 1 Draft)

## 1. Overview
PropAI is an AI-powered property management platform for individual landlords and small property management companies. The MVP focuses on core property, tenant, rent, maintenance, financial tracking, and document storage workflows, with foundational AI features that improve pricing, forecasting, and expense categorization.

## 2. Goals
- Reduce time to onboard a new property and tenant to under 10 minutes.
- Provide reliable rent tracking and payment reminders.
- Centralize maintenance requests and vendor coordination.
- Produce tax-ready financial reports with minimal manual effort.
- Deliver explainable AI insights with confidence indicators and user override.

## 3. Target Users
- Independent landlords with 1 to 20 units.
- Small property management companies with 20 to 200 units.

## 4. Success Metrics (v1.0)
- 80%+ expense auto-categorization accuracy.
- Tax reports generated in under 5 seconds.
- Mobile app supports offline access for core tasks.
- AI rent suggestions within 5% of market rate.

## 5. Scope
### In Scope (MVP)
- Property and unit management
- Tenant management and lease storage
- Rent collection tracking and reminders
- Maintenance requests and vendor tracking
- Financial tracking and reporting
- Document storage with OCR
- AI features: rent optimization, maintenance prediction, cash flow forecasting, tax insights, tenant risk scoring, smart expense categorization
- Dashboard with KPIs and alerts

### Out of Scope (MVP)
- Full accounting suite (general ledger, payroll)
- Advanced owner portals and multi-owner distributions
- Internationalization and multi-currency support

## 6. User Stories
### Property Manager
- As a PM, I can add properties and units with key details.
- As a PM, I can upload photos, leases, and receipts.
- As a PM, I can see rent status and late fees per tenant.
- As a PM, I can track maintenance requests end-to-end.
- As a PM, I can generate profit and loss reports by property.
- As a PM, I can export tax-ready reports for my accountant.

### Tenant
- As a tenant, I can submit maintenance requests with photos.
- As a tenant, I can view rent status and payment history.

## 7. Functional Requirements
### Property and Unit Management
- CRUD for properties and units
- Track beds, baths, square footage, amenities
- Store expenses by property

### Tenant and Lease Management
- Tenant profiles with lease terms
- Digital lease storage and retrieval
- In-app messaging (Phase 1: PM -> tenant, tenant -> PM)

### Rent Collection and Tracking
- Rent ledger and payment history
- Late fee calculation rules
- Payment reminders and notifications
- Integrations: Stripe for card and ACH, optional Plaid for bank linking

### Maintenance
- Tenant submissions with photos and descriptions
- Assignment to vendor or owner
- Status flow: pending -> in-progress -> completed
- Cost tracking and vendor directory

### Financials and Reporting
- Income and expense categories
- Monthly and annual reports
- P and L per property
- Schedule E-ready export

### Document Storage and OCR
- Centralized document repository
- OCR for receipts and invoices
- Search and tagging

### AI Features (Phase 1)
- Rent price optimization with comparable market insights
- Maintenance prediction based on property age and history
- Cash flow forecasting by property and portfolio
- Tax insights and deductible expense flags
- Tenant risk scoring based on payment patterns
- Smart expense categorization from receipts and transactions

### Dashboard and Analytics
- Portfolio overview with occupancy, income, and outstanding balances
- Alerts for late payments, expiring leases, and pending maintenance
- Charts for income and expense trends

## 8. Non-Functional Requirements
- Security: encryption in transit and at rest; row-level security
- Compliance: GDPR-ready and fair housing guidelines
- Performance: key reports under 5 seconds
- Offline support for mobile core flows

## 9. Data Model (Phase 1)
- Users
- Properties
- Units
- Tenants
- Leases
- Payments
- Maintenance Requests
- Vendors
- Expenses
- Documents
- Notifications

## 10. Integrations
- Stripe for payments
- Gmail API for importing existing workflows
- Google Calendar for renewals and maintenance
- Optional: Plaid for bank integrations

## 11. Milestones
- Phase 1 (Weeks 1-2): Repo setup, auth, property CRUD, base UI
- Phase 2 (Weeks 3-5): Tenants, rent tracking, maintenance, financials
- Phase 3 (Weeks 6-7): AI features
- Phase 4 (Week 8): Dashboard, OCR, polish, and launch

## 12. Risks and Mitigations
- AI accuracy: show confidence and allow overrides
- Payment compliance: follow PCI best practices and use Stripe checkout
- Data privacy: implement strict role-based access and RLS

## 13. Open Questions
- Authentication provider choice (NextAuth vs Clerk)
- ORM choice (Prisma vs Drizzle)
- Final hosting targets (Railway vs Fly)
- OCR provider selection (cloud vs local)

