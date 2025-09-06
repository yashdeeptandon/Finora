You are a senior frontend architect.
Set up a production-grade Next.js 15 (App Router) frontend inside a Turborepo monorepo.

## Tech
- Next.js (App Router, TypeScript, ESM)
- Tailwind + shadcn/ui
- TanStack Query
- react-hook-form + zod
- State: minimal (Zustand if needed)
- Cookie-based session from backend (credentials include; CSRF token)

## Goals
1. Routing & Security
Create a clean architecture that supports:
- Public vs Private routes (route groups)
- Auth bootstrap (SSR) and client-side guard
- 404 (not-found), 401 (unauthorized) and generic error pages
- Central fetch client with `credentials: "include"` + CSRF token handling
- Layout + navigation shell only for authenticated app
- Security headers (CSP, frame-ancestors, referrer policy, etc.)
- Robust loading and error states
- Accessiblity basics (focus management on route errors)

2. Architecture & Structure
Adopt **Atomic Design principles**:
- atoms → minimal UI elements (button, input, label, icon wrapper)
- molecules → composed UI (form field, nav item, card with header)
- organisms → larger UI blocks (nav bar, side bar, table)
- templates → page-level layouts (dashboard shell, auth layout)
- pages → Next.js route pages

Centralize theming:
- Use shadcn/ui + Tailwind theme config
- Maintain `packages/ui` with:
  - `theme.ts` (colors, typography, spacing, shadows)
  - `atoms/`, `molecules/`, `organisms/`
  - Dark mode toggle
- All apps consume this via `@pkg/ui`

3. Directory & Routing Layout
Create this structure inside `apps/web`:

apps/web/
├─ app/
│  ├─ (public)/
│  │  ├─ layout.tsx                   # marketing layout (no auth)
│  │  ├─ page.tsx                     # landing
│  │  ├─ pricing/page.tsx
│  │  └─ auth/
│  │     ├─ sign-in/page.tsx
│  │     ├─ sign-up/page.tsx
│  │     ├─ verify-email/page.tsx
│  │     ├─ forgot-password/page.tsx
│  │     └─ reset-password/page.tsx
│  ├─ (app)/
│  │  ├─ layout.tsx                   # authenticated shell (sidebar/topbar)
│  │  ├─ page.tsx                     # dashboard (protected)
│  │  ├─ transactions/page.tsx
│  │  ├─ budgets/page.tsx
│  │  └─ settings/
│  │     ├─ profile/page.tsx
│  │     └─ security/page.tsx
│  ├─ api/route-handlers-if-needed    # tiny glue only
│  ├─ middleware.ts                   # auth redirect + security headers
│  ├─ not-found.tsx                   # 404
│  ├─ unauthorized/page.tsx           # 401/403 presentation
│  ├─ error.tsx                       # global error boundary (RSC)
│  └─ loading.tsx
├─ src/
│  ├─ lib/
│  │  ├─ env.ts                       # NEXT_PUBLIC_* reads
│  │  ├─ api.ts                       # fetch wrapper (credentials+CSRF, error handling)
│  │  ├─ auth.ts                      # server helpers (getMe, requireAuth)
│  │  └─ csp.ts                       # CSP builder
│  ├─ providers/
│  │  ├─ query-client.tsx             # TanStackQuery provider with rehydration
│  │  └─ toaster-provider.tsx
│  ├─ hooks/
│  │  ├─ useAuth.ts                   # client hook based on /me cache
│  │  └─ useOneFlightRefresh.ts       # optional dedup for refresh
│  ├─ components/
│  │  ├─ app-shell.tsx                # sidebar/topbar
│  │  ├─ guarded.tsx                  # <Guarded> client component for extra protection
│  │  └─ forms/*                      # shadcn + rhf wrappers
│  ├─ styles/globals.css
│  └─ types.d.ts
├─ next.config.ts
├─ tailwind.config.ts
└─ package.json


4. Auth & Guards
- Cookie-based sessions from API. All requests use `fetch` with `credentials: "include"`.
- Implement `GET /v1/auth/csrf` call on app bootstrap; store token in memory and send as `x-csrf-token` on POST/PATCH/DELETE.
- **Server-side guard**:
  - In `(app)/layout.tsx`, call a **server helper** `requireAuth()` that fetches `/v1/auth/me`. If 401 → `redirect("/auth/sign-in")`.
  - Pass the `user` to the layout (for shell).
- **Client-side guard**:
  - Provide `<Guarded role?: "admin" | "user">` that reads `useAuth()` (TanStack Query keyed by "me") and:
    - shows skeleton while loading,
    - redirects to `/unauthorized` when role check fails.
- Hydrate `/me` in `(app)/layout.tsx` via `dehydrate` to avoid double fetching.

5. UI & Design
- Theme tokens in Tailwind config + `@pkg/ui/theme.ts`
- Components export from `@pkg/ui`
- Use `clsx` + `tailwind-variants` for consistency
- Accessibility: keyboard navigation, ARIA where needed

### Fetch Client
- `lib/api.ts` exports `apiGet/ apiPost/ apiPatch/ apiDelete` wrappers:
  - `credentials: "include"`, `headers: { "x-csrf-token": token }` for mutations
  - Parse JSON; on 401 inside app routes, redirect to `/auth/sign-in`
  - Surface API’s unified response shape `{ success, data, error, meta }`
  - Map `error.code` to friendly toasts

### Middleware (edge)
- `middleware.ts`:
  - Add **security headers** for all routes:
    - `Content-Security-Policy` (script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https://api.localhost:*; frame-ancestors 'none'; base-uri 'self') ← keep flexible for dev
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY` (or via CSP)
    - `Permissions-Policy` (geolocation=(), camera=(), microphone=())
  - Optionally redirect `/` to `(public)` landing when not authenticated (read cookie presence heuristically); **final auth decision stays on server helpers**.
  - Exclude `/_next`, `/public`, and static assets.

### Pages
- `not-found.tsx`: friendly 404 with link back.
- `unauthorized/page.tsx`: show code 401/403 and link to sign-in.
- `error.tsx`: render fallback UI, reset boundary; log to Sentry if available.
- Marketing routes in `(public)` must NOT import server-only modules.

### Forms & UX
- Use shadcn/ui + react-hook-form + zodResolver on:
  - sign-in, sign-up, forgot/reset, change-password, 2FA setup
- Show progressive toasts, disable while submitting, handle API `error.code` consistently.

### Query & Cache
- Query keys: `["me"]`, `["transactions", params]`, etc.
- Use `staleTime` sensible defaults; optimistic updates when safe.
- Invalidate `["me"]` on sign-in/out; reset on logout.

### Security
- Never expose secrets; only read `NEXT_PUBLIC_*`.
- Use `headers()`/`cookies()` only in **server components**.
- Sanitize all external HTML (if any).
- Disallow `dangerouslySetInnerHTML` unless sanitized.
- Ensure `<Link prefetch>` used appropriately.
- Strict Typescript + ESLint accessibility rules.

### Deliverables
1) The full folder structure and the files listed above, with working code.
2) `middleware.ts` with security headers.
3) `lib/api.ts` with CSRF integration and unified error handling.
4) `(app)/layout.tsx` implementing `requireAuth()` SSR guard and shell.
5) Public auth pages (sign-in/sign-up/forgot/reset/verify) in `(public)/auth`.
6) 404, 401(unauthorized), error, loading pages.
7) `providers/query-client.tsx` + `toaster-provider.tsx`.
8) `hooks/useAuth.ts` and `<Guarded>` component.
9) Example protected page in `(app)/page.tsx` showing the logged-in user.
10) Minimal tests for `lib/api.ts` (error mapping) and `requireAuth()` (redirect on 401).

### Acceptance
- Visiting any route under `(app)` when not authenticated redirects to `/auth/sign-in`.
- Visiting `(public)` while authenticated can redirect to dashboard (optional).
- Hitting an unknown route shows `not-found`.
- Hitting a protected route without role shows `/unauthorized`.
- All mutations include `x-csrf-token` and send cookies.
- Security headers present in responses (verify via DevTools).
