# Finora 💰

A **full-stack TypeScript** app for managing money.  
Log and categorize expenses, forecast future spending, set budgets, and track financial goals—all in one place.

---

## ✨ Features

- 📊 **Expense tracking** – add, import, and categorize transactions
- 📅 **Future planning** – forecast upcoming bills and recurring expenses
- 💡 **Budgeting** – create monthly/annual budgets by category
- 🔔 **Alerts & reminders** – get notified when spending exceeds thresholds
- 📈 **Analytics dashboard** – charts for spend trends, category breakdowns, and savings progress

---

## 🛠 Tech Stack

**Frontend**

- [Next.js (App Router)](https://nextjs.org/) + TypeScript
- [TailwindCSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query) for server state
- [Recharts](https://recharts.org/) for visualizations

**Backend**

- [Express.js](https://expressjs.com/) + TypeScript
- [Prisma](https://www.prisma.io/) ORM with [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/) + [BullMQ](https://docs.bullmq.io/) for jobs/queues
- [JWT Auth](https://jwt.io/) with access + refresh tokens

**Infra & Tooling**

- [Docker](https://www.docker.com/) + docker-compose (Postgres, Redis, MinIO)
- [S3 storage](https://min.io/) for statements/exports
- [Sentry](https://sentry.io/) + [pino](https://getpino.io/) for logs/errors
- [Turborepo](https://turbo.build/repo) + [pnpm](https://pnpm.io/) monorepo

---

## 📂 Monorepo Structure

personal-finance/
├─ apps/
│ ├─ web/ # Next.js frontend
│ ├─ api/ # Express backend
│ ├─ worker/ # BullMQ workers
│ └─ admin/ # (optional) Admin portal
│
├─ packages/
│ ├─ ui/ # shared UI components
│ ├─ schemas/ # Zod schemas
│ ├─ types/ # shared TS types/enums
│ ├─ config/ # eslint, tsconfig, tailwind presets
│ ├─ logger/ # pino logger
│ ├─ env/ # zod env loader
│ └─ db/ # prisma client
│
├─ infra/ # docker, compose, terraform, k8s
├─ .github/ # CI workflows
└─ README.md

🧑‍💻 Development

Code style: ESLint + Prettier enforced
Commits: Conventional Commits (feat:, fix:, chore:…)
CI/CD: GitHub Actions (lint, typecheck, build, test)
Testing: Jest/Vitest for unit, Supertest for API, Playwright for E2E

Open:

Web → http://localhost:3000
API → http://localhost:4000/health
MinIO Console → http://localhost:9001
(user: minio, pass: minio123)
