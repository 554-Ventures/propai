# Testing

## Backend API
Prereqs: Postgres running via Docker, migrations applied.

```bash
# from repo root
DATABASE_URL=postgresql://propai:propai@localhost:5432/propai \
JWT_SECRET=dev-secret \
pnpm -C apps/api test
```

## Manual API Smoke Test
```bash
# Signup
curl -X POST http://localhost:4000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@propai.com","password":"Password123!","name":"Demo"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@propai.com","password":"Password123!"}'

# Use token to create property
curl -X POST http://localhost:4000/properties \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{"name":"Oak Street Duplex","addressLine1":"123 Oak St","city":"Austin","state":"TX","postalCode":"78701"}'

# List properties
curl -H 'Authorization: Bearer <TOKEN>' http://localhost:4000/properties

# AI: Categorize expense
curl -X POST http://localhost:4000/api/expenses/categorize \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{"description":"Monthly power bill","amount":120,"vendor":"City Electric"}'

# AI: Forecast cash flow
curl -H 'Authorization: Bearer <TOKEN>' \
  "http://localhost:4000/api/analytics/forecast?property_id=<PROPERTY_ID>&time_range=monthly"
```

## Frontend Smoke Test
```bash
# In one terminal
pnpm -C apps/api dev

# In another terminal
pnpm -C apps/web dev
```
- Visit http://localhost:3000
- Sign up
- Go to Properties → Add Property → Save
- Confirm property appears in list
- Go to Expenses → request AI suggestion → save expense
- Go to Analytics → confirm forecast and insights render
