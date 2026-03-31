# Local Setup

## Prereqs
- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

## 1) Start Postgres
```bash
docker-compose up -d
```

## 2) Install dependencies
```bash
pnpm install
```

## 3) Configure API env
```bash
cp apps/api/.env.example apps/api/.env
```
Update values as needed.

## 4) Run migrations
```bash
pnpm -C apps/api prisma generate
pnpm -C apps/api prisma migrate dev --name init
```

## 5) Start API
```bash
pnpm -C apps/api dev
```

## 6) Start Web
```bash
pnpm -C apps/web dev
```
