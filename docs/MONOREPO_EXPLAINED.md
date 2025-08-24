# Monorepo Explained: Why Multiple package.json, Turborepo, pnpm Workspaces

This document explains **why we set up the Finora repo** with multiple `package.json` files, Turborepo, pnpm workspaces, and shared packages. It’s written in plain language for clarity.

---

## 🚩 The Problem We’re Solving

You’re building **more than one thing**:

- A **web app** (Next.js dashboard)
- An **API** (Express backend)
- **Background workers** (BullMQ jobs)
- Plus **shared code** (schemas, types, UI components)

Options:
- **Single folder project** → fast to start, messy later (duplicate code, spaghetti imports).
- **Multiple repos** → boundaries are clear, but managing versions and dependencies is painful.
- **Monorepo** (our choice) → one repo, many packages/apps, with clean boundaries and shared code **without copy-paste**.

---

## 📦 Why Multiple `package.json` Files?

Each app or library is its **own project**:
- `apps/web/package.json`: dependencies & scripts for the Next.js app.
- `apps/api/package.json`: dependencies & scripts for the Express API.
- `apps/worker/package.json`: dependencies & scripts for BullMQ jobs.
- `packages/ui/package.json`: a library of shared UI components.
- `packages/schemas/package.json`: Zod schemas, used by both web & API.
- `packages/types/package.json`: TypeScript types/enums shared everywhere.

The **root `package.json`** orchestrates everything: run all dev servers, lint, build, etc.

---

## 🌀 What Turborepo Does

[Turborepo](https://turbo.build) is a **task runner for monorepos**:
- **Orchestrates scripts** across apps (`dev`, `build`, `lint`).
- **Caches** outputs → unchanged apps/packages don’t rebuild.
- **Runs in parallel** → start web, api, worker at once with `pnpm dev`.

Example pipeline (`turbo.json`):
```json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

So when you type:
```bash
pnpm dev
```
Turbo starts `dev` scripts in all apps, in parallel, with caching.

---

## 🧩 What pnpm Workspaces Do

`pnpm-workspace.yaml` tells pnpm that `apps/*` and `packages/*` belong to one workspace.

Benefits:
- **One install** for all → `pnpm install` installs deps everywhere.
- **Linked local packages** → `@pkg/ui` points to your local `packages/ui` instead of npm.
- **One lockfile** → consistent versions across all apps.

This allows code like:
```ts
import { CreateTxnSchema } from "@pkg/schemas";
```
to just work, without publishing.

---

## 📚 Why Shared Packages?

Instead of a single `utils/` folder, we create real packages in `packages/`:
- They can have their **own dependencies** (e.g., Zod for schemas).
- They can be **tested & versioned** independently.
- They are **imported cleanly** like npm libraries (`@pkg/ui`).
- They can be **published later** (e.g., SDKs).

---

## ⚙️ Why `transpilePackages` in Next.js?

Next.js builds **only the web app folder**. Our shared packages (`packages/ui`, `packages/schemas`, `packages/types`) live outside `apps/web` and contain TypeScript/ESM.

We add this to `apps/web/next.config.ts`:
```ts
const nextConfig = {
  transpilePackages: ["@pkg/ui", "@pkg/schemas", "@pkg/types"]
}
```

This tells Next: *also compile those workspace packages*. Without it, you get "Module not found" or syntax errors.

---

## 🗂 Why Path Aliases?

- `@/*` → imports **inside the app**. Example: `@/features/transactions`.
- `@pkg/*` → imports **from shared packages**. Example: `@pkg/schemas`.

Aliases are defined in `tsconfig.base.json` so all apps use the same rules.

---

## ⚡ How it Works (Step by Step)

1. Run:
   ```bash
   pnpm --filter @app/web dev
   ```

2. pnpm resolves imports:
   - Sees `@pkg/schemas` → symlinked to `packages/schemas`.

3. Next.js starts dev server:
   - Because of `transpilePackages`, it compiles `@pkg/ui`, `@pkg/schemas`, `@pkg/types` too.

4. When you change code in `packages/schemas/src/index.ts`:
   - HMR updates the web app instantly.

---

## ✅ Advantages

- **No duplicate code** → one schema used by API + frontend.
- **Type-safe end-to-end** → change a type once, everything updates.
- **Fast builds** → Turbo caches outputs.
- **Fast installs** → pnpm links local packages.
- **Scales well** → add apps/workers/admin portals easily.

---

## ⚠️ Trade-offs

- More setup upfront.
- Need to understand pnpm linking & Next transpile rules.
- Enforce boundaries via lint rules (to prevent imports going “everywhere”).

---

## 🗺 When NOT to Use Monorepo

- You’re building a tiny app (one web frontend, one small backend).
- You don’t need code sharing.
- You don’t want the extra structure.

But for **Finora** (web + API + workers + shared schemas), **monorepo is the right call**.

---

## 📊 Visual Diagram

See `monorepo_diagram.png` in this repo for a picture of how apps, packages, and root configs connect.

---
