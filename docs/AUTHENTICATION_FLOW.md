You are an expert TypeScript full-stack engineer. Implement a **production-grade, cookie-based session authentication** system for a Turborepo monorepo with:

- apps/web: Next.js (App Router, TypeScript, Tailwind, shadcn/ui, TanStack Query, react-hook-form, zod)
- apps/api: Express.js (TypeScript), Prisma ORM, PostgreSQL
- apps/worker: BullMQ (Redis) for background jobs (emails, cleanup)
- packages/schemas: shared Zod schemas for request/response DTOs
- packages/types: shared enums & types
- packages/env: zod-validated env loader
- packages/logger: pino logger
- infra/compose: docker-compose for Postgres + Redis + Mailhog (SMTP dev)

## Architecture & Principles
- **Session-based auth** using **secure, httpOnly cookies** (no bearer tokens).
- **Session store:** Redis (via `connect-redis` or custom store). Support **sliding expiration** (extend on use).
- **CSRF protection:** required for any state-changing endpoints (double-submit token or header-based anti-CSRF token).
- **Same-site settings:** Default `SameSite=Strict` for first-party; if cross-domain in dev, document `SameSite=None; Secure` requirements.
- **Email verification** and **password reset** via signed tokens (hashed at rest).
- **Optional 2FA (TOTP)** behind feature flag.
- **Uniform errors** and **audit logging**. No user enumeration.

## Database (Prisma models)
Create/adjust Prisma schema with indexes:

- User { id, email (unique, lowercase), emailVerifiedAt DateTime?, name, passwordHash, twoFASecret?, createdAt, updatedAt }
- Session { id (cuid), userId, salt, csrfSecret, ip?, userAgent?, createdAt, lastSeenAt, expiresAt, revokedAt? }
  - `salt` used to bind/rotate cookie signature; `csrfSecret` to derive per-request CSRF tokens.
- VerificationToken { id, userId, tokenHash, type: 'email_verify' | 'password_reset', expiresAt, usedAt? }
- AuditLog { id, userId?, event, ip?, userAgent?, createdAt }
- (Optional) OAuthAccount { id, userId, provider, providerAccountId, accessToken?, refreshToken?, expiresAt? } (feature-gated)
- (Optional) Role, UserRole for RBAC: seed roles user/admin.

## Cookies & Security
- Issue **one session cookie**: `sid` (opaque session id reference), `httpOnly`, `Secure` (always in prod), `SameSite=Strict` (or `None` when cross-site), `Path=/`, `domain` configurable via env.
- Store session data in **Redis** keyed by `sid` (or a server-generated id) with TTL matching `expiresAt`.
- **Rotate session id** on login and sensitive actions (password change, enabling 2FA).
- **Sliding expiration**: bump Redis TTL & `expiresAt` on each authenticated request within a max cap.
- **CSRF**:
  - Generate a derived **CSRF token** per session using `csrfSecret` and a nonce.
  - Expose token via **GET /v1/auth/csrf** and in SSR responses (e.g., header `x-csrf-token`) for forms.
  - Require header `x-csrf-token` (or hidden input) on **non-GET** requests. Validate against session’s secret (double-submit or HMAC).
- **Rate limiting** on /auth routes (per IP + per-email), and a lockout/backoff after N failed logins.
- **User enumeration** hardening: same response shape/timing whether email exists or not.

## API Endpoints (Express, under /v1)
All state-changing POST/PATCH/DELETE endpoints require **CSRF** (except `/signin` and `/signup` where you can fetch CSRF first or allow internal flow). All authenticated routes require `requireSession` middleware.

- **CSRF**
  - GET /v1/auth/csrf → 200 { csrfToken } (reads from session if present; else issues temp pre-auth token cookie if you prefer)

- **Auth**
  - POST /v1/auth/signup { email, password, name? } → 201 { message } and send verification email if email verification enabled.
  - POST /v1/auth/signin { email, password, otp? } → 204 (sets session cookie) + returns { user } if you prefer; rotate session id; write AuditLog.
  - POST /v1/auth/signout → 204 (CSRF) revoke current session in Redis + clear cookie.
  - GET  /v1/auth/me → 200 { user } uses session cookie only (no tokens).
  - POST /v1/auth/verify-email { token } → 204 marks user verified.
  - POST /v1/auth/request-email-verification → 204 (CSRF) resend verification mail.
  - POST /v1/auth/request-password-reset { email } → 204 (always same response).
  - POST /v1/auth/reset-password { token, newPassword } → 204 invalidate prior sessions for that user.
  - PATCH /v1/auth/change-password { currentPassword, newPassword } → 204 (CSRF) rotate session id and revoke other sessions.

- **2FA (feature-gated)**
  - POST /v1/auth/2fa/setup → { otpauthUrl, qrPngDataUrl } (CSRF)
  - POST /v1/auth/2fa/enable { otp } → 204 (CSRF)
  - POST /v1/auth/2fa/disable { otp } → 204 (CSRF)

- **Admin**
  - GET /v1/admin/users → 200 [...] (requires `requireRole("admin")`)

## Middleware & Services (apps/api)
- `sessionMiddleware`:
  - Parse `sid` cookie, load session from Redis/DB, validate `expiresAt`, attach `req.user`.
  - On success, apply **sliding expiration** & optionally rotate `sid` periodically.
- `requireSession`: 401 if no valid session.
- `csrfMiddleware`: on non-GET/HEAD/OPTIONS, require `x-csrf-token` and validate against session’s `csrfSecret` (HMAC or double-submit).
- `rateLimitMiddleware`: tighter on `/signin`, `/signup`, `/request-*`.
- `errorHandler`: return `{ error: { code, message } }`, hide internals; map Zod errors.
- `mailQueue`: enqueue verification/reset emails; apps/worker consumes and sends via provider driver (Resend/Postmark/SES). Add Mailhog for dev.
- `auditService`: write AuditLog for signin_success, signin_failed, signup, signout, verify_sent, verified, reset_requested, reset_completed, password_changed.

## Zod Schemas (packages/schemas)
Define shared schemas for all requests/responses used by web & api: SignUp, SignIn, RequestReset, ResetPassword, ChangePassword, VerifyEmail, MeResponse, etc. Export inferred types. Validate query/params too where applicable.

## Frontend (apps/web, Next.js App Router)
- Routes:
  - /sign-in, /sign-up, /verify-email, /forgot-password, /reset-password, /settings/profile, /settings/security, /logout
- **Fetching**:
  - Use `fetch` with `credentials: "include"` for all API calls (cookies must be sent).
  - Get CSRF token at app bootstrap or per form: call `/v1/auth/csrf` and set header `x-csrf-token` for POST/PATCH/DELETE.
- **Guards**:
  - Middleware or server components that call `/v1/auth/me` during SSR. Redirect unauthenticated users to /sign-in.
- **Forms**:
  - react-hook-form + zodResolver; show friendly errors without leaking which field failed server-side beyond generic messaging.
- **UI**:
  - shadcn/ui: Input, Button, Card, Alert, Toaster. Provide UX for verification/resets.
- **State**:
  - TanStack Query for `/me`, `signin`, `signout`, `requestReset`, `reset`, `requestVerify`, `verifyEmail`. On sign-in success, invalidate and refetch `me`.
- **Cross-domain dev**:
  - If web runs on http://localhost:3000 and API on http://localhost:4000, configure CORS on API to allow credentials and set cookie with `SameSite=None; Secure` (dev https via mkcert or use same-origin proxy). Prefer same-domain in dev to avoid SameSite issues.

## Security Hardening
- Password hashing via bcrypt with 12+ salt rounds.
- Normalize emails to lowercase; timing-safe compare for hashes.
- Don’t log PII, secrets, or tokens; use pino structured logs. Add Sentry hooks.
- Set `Secure`, `HttpOnly`, `SameSite` correctly; `domain` via env.
- CSRF required on all state mutations (except possibly /signin and /signup if you bootstrap CSRF first).
- Lockout/backoff after repeated signin failures.
- Rotate session id after signin and password change; optionally on interval (e.g., every 12h).
- Revoke all other sessions on password reset/change.

## Infra
- `infra/compose/docker-compose.yml` with services: postgres, redis, mailhog.
- `.env.example` for api/worker/web including:
  - DATABASE_URL, REDIS_URL, SESSION_COOKIE_NAME, SESSION_TTL_MINUTES, SESSION_DOMAIN, SESSION_SECURE=true, SESSION_SAMESITE=strict|none, CSRF_SECRET_KEY, SMTP_HOST/PORT/USER/PASS, APP_URL, API_URL.
- Health endpoints for readiness/liveness.
- CI (GitHub Actions): typecheck, lint, build, test.

## Testing
- Unit: session service (create, extend, rotate, revoke), csrf utils, password hashing.
- API (Supertest): signup → verify → signin → me; change password; request/reset; CSRF required on mutations; lockout.
- E2E (optional, Playwright): end-to-end signup→verify→signin→logout.

## Deliverables
1) Prisma models & initial migration; seed script for admin role/user.
2) Express middlewares: session loader, csrf, rate limit, requireSession, error handler.
3) Auth controllers/services; audit logs; mail queue + worker with templates and Mailhog support.
4) Next.js pages for all auth flows; SSR guards; fetch wrappers using credentials & CSRF header.
5) Shared Zod schemas & types; packages/env for typed env; packages/logger.
6) docker-compose for Postgres/Redis/Mailhog; .env.example files.
7) README section explaining cookie-based auth, CSRF, and dev proxy settings.
8) Tests covering sign-up/verify/sign-in/me/change-password/reset-password and session rotation.

## Definition of Done
- Can: sign up → receive verification email → verify → sign in (sets cookie) → /me works.
- Can: sign out → cookie cleared → /me returns 401.
- Can: change password → rotates session & revokes others.
- CSRF enforced on all mutations (observed 403 when missing/bad token).
- Sliding expiration works; sessions expire when idle beyond TTL.
- Lockout triggers after repeated failed signins; audit logs recorded.
- All DTOs validated via shared schemas; CI tests pass.
