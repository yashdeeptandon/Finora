// apps/api/src/middlewares/createCsrfMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import express from "express";
import csrf from "tiny-csrf";

type HttpMethod =
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "GET"
  | "OPTIONS"
  | "HEAD";

export function createCsrfMiddleware(options: {
  secret: string;                    // must be >= 32 chars
  tokenPath?: string;                // where frontend fetches token
  methods?: readonly HttpMethod[];   // which methods to protect
  secureCookies?: boolean;           // override cookie.secure flag
}) {
  const {
    secret,
    tokenPath = "/api/v1/auth/csrf",
    methods = ["POST", "PUT", "PATCH", "DELETE"] as const,
    secureCookies,
  } = options;

  const router = express.Router();

  // 1️⃣ always run verify → attaches req.csrfToken()
  const verify = csrf(secret, methods as HttpMethod[]);
  router.use(verify);

  // 2️⃣ token mint endpoint
  router.get(tokenPath, (req: Request, res: Response, _next: NextFunction) => {

    const token: string = req.csrfToken();

    console.log("Set cookies:", res.getHeader("Set-Cookie"));


    return res.status(200).json({
      success: true,
      data: { csrfToken: token }, // send token in JSON for client use
      error: null,
      meta: { timestamp: new Date().toISOString() },
    });
  });

  return router;
}
