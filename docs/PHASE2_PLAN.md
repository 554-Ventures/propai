# Phase 2 Plan (Weeks 3–5) — Core Features

## Goals
- Stand up usable backend API with auth scaffolding, properties/units/tenants CRUD, and tests
- Stand up Next.js web app with auth flow, basic layout/nav, and property/tenant management UI
- Enable local dev with Postgres via Docker and clear setup/test instructions
- Reach a testable milestone: create + list properties via API or UI

## Backend Tasks
### 1) Prisma + Database
- Define Prisma schema for Phase 1 entities (Users, Properties, Units, Tenants, Leases, Payments, MaintenanceRequests, Vendors, Expenses, Documents, Notifications)
- Add enums for status fields (lease status, maintenance status, payment status)
- Create initial migration baseline
- Seed/dev data (optional minimal)

### 2) Auth Scaffolding
- **Decision: NextAuth** for web authentication (credentials flow to start)
- Backend API uses bearer token auth (JWT) as a placeholder and will be aligned with NextAuth JWT session in Phase 2.1
- Define user model, password hashing, and login/signup endpoints (if backend handles creds)
- Add auth middleware for protected routes

### 3) Core APIs
- Properties CRUD (list/create/read/update/delete)
- Units CRUD (nested under property)
- Tenants CRUD (list/create/read/update/delete)
- Basic pagination and ownership filtering (userId)

### 4) Testing
- Add API test setup (supertest + jest or vitest)
- Test auth + property endpoints
- Add minimal test data helpers

## Frontend Tasks
### 1) App Scaffold
- Next.js 14 App Router + TypeScript
- Tailwind + shadcn/ui
- Basic global layout (header, sidebar/nav)

### 2) Auth Flow
- Login / signup pages
- Hook into backend auth endpoints (or NextAuth credentials provider)
- Store token/session for API calls

### 3) Property Management UI
- Properties list
- Add property form
- Edit property form
- Units list (per property)

### 4) Tenant Management UI
- Tenants list
- Add tenant form
- Edit tenant form

## Testing Strategy
- Backend: unit/integration tests for auth + properties API
- Frontend: smoke test for properties list/add flow
- Manual test checklist in docs/TESTING.md

## Integration Checkpoints
1) **Checkpoint A**: Backend auth + properties endpoints functional
2) **Checkpoint B**: Frontend can login and list/create properties
3) **Checkpoint C**: Tenants CRUD end-to-end

## Risks / Dependencies
- Auth choice integration between web and API
- Prisma migration and Postgres availability

