# Codebase Structure Guide

This repository is a **Turborepo + pnpm** monorepo for a personal‑finance product. It contains multiple runnable apps (web, api, workers) and shared packages (schemas, types, ui, config, env, logger, db).

Use this as your single source of truth to know **where things go**.

---

## Top‑level Layout

```
personal-finance/
├─ apps/
│  ├─ web/                     # Next.js (App Router) frontend
│  ├─ api/                     # Express (TypeScript) backend
│  ├─ worker/                  # BullMQ background workers
│  └─ admin/                   # (optional) Admin portal
│
├─ packages/
│  ├─ ui/                      # shared React UI components (shadcn wrappers)
│  ├─ schemas/                 # Zod schemas shared across web ↔ api
│  ├─ types/                   # DTOs, enums, shared TypeScript models
│  ├─ config/                  # base tsconfig/eslint/tailwind presets
│  ├─ logger/                  # pino logger factory
│  ├─ env/                     # Zod‑validated environment loader
│  └─ db/                      # Prisma client (+ queries) shared by api/worker
│
├─ infra/
│  ├─ docker/                  # Dockerfiles per app (prod builds)
│  ├─ compose/                 # docker-compose for local stack
│  ├─ terraform/               # IaC for cloud (later)
│  └─ k8s/                     # Kubernetes manifests (later)
│
├─ .github/workflows/          # CI pipelines (build, lint, test, typecheck)
├─ turbo.json                  # Turborepo pipeline & caching
├─ pnpm-workspace.yaml         # Workspace package globs
├─ tsconfig.base.json          # Base TS config used by all packages/apps
├─ package.json                # Root scripts (dev, build, db, docker)
└─ README.md
```

---

## apps/web — Next.js Frontend

**Purpose:** User‑facing dashboard, onboarding, charts, settings, imports.

```
apps/web/
├─ app/                        # App Router
│  ├─ (marketing)/             # Public pages (landing, pricing, docs)
│  ├─ (dashboard)/             # Authenticated app routes
│  ├─ api/                     # Route handlers (small glue only)
│  └─ layout.tsx | page.tsx
├─ src/
│  ├─ components/              # UI components (uses @ui & shadcn/ui)
│  ├─ features/                # Feature folders (transactions, budgets, imports)
│  ├─ hooks/                   # useAuth, useQuery wrappers, etc.
│  ├─ lib/                     # fetcher, date/money utils, constants
│  ├─ styles/                  # tailwind/globals.css
│  └─ types.d.ts               # web‑only types if any
├─ public/                     # static assets
├─ .env.example                # web‑specific envs (NEXT_PUBLIC_*)
├─ next.config.mjs
├─ tailwind.config.ts
└─ package.json
```

**Imports you should use:**
- UI primitives from `@ui` and `@/src/components`
- Request/response schemas from `@schemas`
- Shared enums/models from `@types`

**What goes here:**
- Pages, components, charts (Recharts/Chart.js)
- TanStack Query hooks and mutations
- Client‑side state (Zustand/RTK) for UI state
- Minimal server code in route handlers if needed (auth callbacks, SSR helpers)

---

## apps/api — Express + Prisma Backend

**Purpose:** REST API, auth, business logic, and integrations.

```
apps/api/
├─ src/
│  ├─ app.ts                   # express app (middlewares, routes)
│  ├─ server.ts                # boot server
│  ├─ config/                  # constants, rate limits
│  ├─ libs/                    # prisma, s3, jwt, redis, logger
│  ├─ middlewares/             # auth, error, validation
│  └─ modules/                 # domain modules
│     ├─ auth/                 # signup/login/refresh
│     ├─ users/
│     ├─ accounts/
│     ├─ categories/
│     ├─ transactions/
│     └─ imports/              # CSV/PDF ingestion endpoints
├─ prisma/
│  ├─ schema.prisma            # DB schema (users, accounts, txns, budgets, etc.)
│  └─ migrations/              # Auto‑generated migrations
├─ .env.example
├─ Dockerfile
└─ package.json
```

**Imports you should use:**
- `@db` for Prisma client singleton
- `@env` for validated env access
- `@schemas` for request validation (Zod)
- `@logger` for pino

**What goes here:**
- Controllers (route handlers) and Services (business logic)
- Data access via Prisma
- OpenAPI/Swagger setup (optional but recommended)
- S3 uploads (statement files), JWT auth, rate limiting, Sentry/pino

---

## apps/worker — BullMQ Workers

**Purpose:** Background tasks that must not block HTTP requests.

```
apps/worker/
├─ src/
│  ├─ queues.ts                # Queue definitions (BullMQ)
│  ├─ workers/
│  │  ├─ importCsv.worker.ts   # parses & normalizes CSV statements
│  │  ├─ categorize.worker.ts  # rules/ML categorization
│  │  └─ alerts.worker.ts      # budget/threshold notifications
│  └─ index.ts                 # start workers + graceful shutdown
├─ .env.example
├─ Dockerfile
└─ package.json
```

**Imports you should use:**
- `@db` for Prisma
- `@schemas` for parsing/validation
- `@env`, `@logger`

**What goes here:**
- Long‑running/CPU/network heavy jobs (imports, exports, notifications)
- Idempotency and retry logic
- Dead‑letter queues and metrics

---

## packages — Shared Building Blocks

### packages/ui
- **What:** Design system wrappers (shadcn/ui), theme tokens, common components.
- **Use in:** `apps/web` (and `apps/admin`).

### packages/schemas
- **What:** **Zod** schemas for request/response DTOs, filters, and common validators.
- **Use in:** both web and api to guarantee contract parity.

### packages/types
- **What:** Shared enums and TypeScript models (e.g., `AccountType`, `TxnType`, `DTOs`).
- **Use in:** web, api, worker.

### packages/config
- **What:** Central **eslint**, **tsconfig** presets, tailwind preset.
- **Use in:** consumed via `extends` or `presets` from apps/packages.

### packages/logger
- **What:** Pino logger factory (pretty in dev, JSON in prod), pre‑configured bindings.
- **Use in:** all apps.

### packages/env
- **What:** Zod‑validated env loader. One place to parse and type environment variables.
- **Use in:** api and worker (web uses NEXT_PUBLIC_* separately).

### packages/db
- **What:** Prisma client singleton and any reusable query helpers.
- **Use in:** api and worker.

---

## infra — Local & Production Infrastructure

```
infra/
├─ compose/
│  └─ docker-compose.yml       # Local Postgres + Redis + MinIO
├─ docker/                     # Multi‑stage Dockerfiles
├─ terraform/                  # Cloud infra as code (later)
└─ k8s/                        # Deployment manifests (later)
```

**Local services (compose):**
- **Postgres**: primary DB
- **Redis**: queues + cache
- **MinIO**: S3‑compatible storage for statements/exports

---

## Conventions & Principles

- **Layering:** `routes → controllers → services → db`. Controllers are thin; services hold logic.
- **Validation:** All input (body, query, params) is validated via `@schemas` (Zod).
- **Type‑safety:** Shared DTOs/enums live in `packages/types` (import, don’t redefine).
- **Logging:** Use `@logger` only—no `console.log` in app code.
- **Env:** Import from `@env` in server apps; never access `process.env` directly.
- **Error handling:** Throw typed errors from services; centralized `errorHandler` maps to HTTP responses.
- **Background jobs:** Anything slow or retry‑worthy goes to **worker** via BullMQ.
- **Security:** Helmet, rate limits, JWT access (short) + refresh (rotated), minimal PII, dedupe transaction hash.
- **Tests:** Unit (Vitest/Jest), API (Supertest/Pact), E2E (Playwright) — add per module as you build.
- **Git:** Conventional commits, CI runs typecheck/build/lint/test on PR.

---

## Add a New Domain Module (Checklist)

1. **Create folder** under `apps/api/src/modules/<feature>/` with:
   - `*.routes.ts` (Express Router)
   - `*.controller.ts`
   - `*.service.ts`
   - `*.schema.ts` (Zod)
2. **Add Prisma models** in `apps/api/prisma/schema.prisma`; run migration.
3. **Expose schemas** in `packages/schemas/src/<feature>.ts` if used by web.
4. **Add API typing** to web: hooks in `apps/web/src/features/<feature>/api.ts`.
5. **If background work needed**, add worker in `apps/worker/src/workers/<feature>.worker.ts` and queue in `queues.ts`.
6. **Write tests** (unit/API/E2E as relevant).

---

## Environment Variables (Overview)

Each app/package has its own `.env.example`. Typical server envs:

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://dev:dev@localhost:5432/finance
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=finance-statements
S3_ACCESS_KEY_ID=minio
S3_SECRET_ACCESS_KEY=minio123
```

Web (Next.js) uses **`NEXT_PUBLIC_*`** for safe public config.

---

## Daily Commands

At repo root:

```bash
pnpm install                 # install all workspaces
pnpm docker:up               # start Postgres, Redis, MinIO
pnpm db:migrate              # prisma migrate dev (api)
pnpm dev                     # run web, api, worker in parallel
```

Endpoints:
- Web: http://localhost:3000
- API: http://localhost:4000/health
- MinIO: http://localhost:9001 (minio/minio123)

---

## FAQ

**Q: Where do I store shared business rules (e.g., categorization logic)?**  
Use `packages/schemas` for validation and `packages/types` for interfaces. If it’s pure logic shared by api & worker, add a small `packages/core` library (optional).

**Q: Where do I put OpenAPI/Swagger?**  
In `apps/api/src/app.ts` (or `/docs` route). Generate clients in web/worker from the spec if desired.

**Q: Can Prisma be moved out of apps/api?**  
Yes—centralize client in `packages/db` so both `api` and `worker` reuse it.

**Q: Where do I keep feature flags / analytics?**  
Client events in `apps/web`, server events in `apps/api`; shared typing for event names in `packages/types`.
