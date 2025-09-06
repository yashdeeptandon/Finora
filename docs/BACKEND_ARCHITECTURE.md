You are an expert TypeScript backend architect.
I want you to design and scaffold a production-ready Express.js backend inside a monorepo (pnpm + Turborepo).

### Requirements
- Language: TypeScript (strict), Node.js (ESM, moduleResolution: NodeNext)
- App: Express.js in `apps/api`
- ORM: Prisma (Postgres), DB client imported from @pkg/db
- Shared schemas: Zod, imported from @pkg/schemas
- Logger: Centralized logger based on Pino in @pkg/logger
  - Support for pretty logs in dev, JSON logs in prod
  - Include request id, timestamp, log level
  - Middleware to log all incoming requests and outgoing responses
- Security:
  - Use Helmet for common security headers
  - Enable CORS (configurable whitelist)
  - Rate limiting middleware
- Error handling:
  - Global error handler that catches sync/async errors
  - Log errors via @pkg/logger
  - Send sanitized error response
- Response structure:
  - Always return a **central response body format**:
    ```json
    {
      "success": boolean,
      "data": any | null,
      "error": {
        "code": string | null,
        "message": string | null,
        "details": any | null
      },
      "meta": {
        "requestId": string,
        "timestamp": string
      }
    }
    ```
  - Create helper functions `successResponse(res, data)` and `errorResponse(res, code, message, details?)`.
- Features:
  - Health check endpoint `/health`
  - Example module `auth/` with signup + login routes (use Zod validation + Prisma)
  - Each module in `apps/api/src/modules/<feature>` follows:
    - `<feature>.routes.ts` (Express Router)
    - `<feature>.controller.ts` (input/output handling)
    - `<feature>.service.ts` (business logic)
    - `<feature>.schema.ts` (Zod validation)
- Observability:
  - Attach requestId to each request (use `cls-hooked` or async local storage)
  - Log request/response with requestId
- Scripts:
  - `pnpm --filter @app/api dev` → runs with tsx watch
  - `pnpm --filter @app/api build` → compiles to dist/
  - `pnpm --filter @app/api start` → runs compiled server

### Deliverables
1. `apps/api/src/app.ts`: Express app with middlewares (helmet, cors, json, logger, rateLimiter).
2. `apps/api/src/server.ts`: boots the server, handles graceful shutdown.
3. `apps/api/src/middlewares/`: logger, errorHandler, requestId.
4. `apps/api/src/utils/response.ts`: centralized response helpers.
5. `apps/api/src/modules/auth/`: demo routes, controllers, services, schemas.
6. Integration with @pkg/logger and @pkg/db.
7. README section explaining architecture and how to add a new module.

Make the code clean, idiomatic, and production-ready.
