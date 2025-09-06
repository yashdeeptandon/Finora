import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import csrf from "tiny-csrf";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { loggerMiddleware } from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { successResponse, notFoundResponse } from "./utils/response.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

// behind proxy/load balancer? enable this so secure cookies & rate-limit work correctly
app.set("trust proxy", 1);

// request context & logging early
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

// security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: "http://localhost:3000", // or ["http://localhost:3000"]
    credentials: true,
  })
);

// parsers BEFORE tiny-csrf
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET ?? "cookie-parser-secret"));

const csrfSecret = process.env.CSRF_SECRET;
if (!csrfSecret || csrfSecret.length < 32) {
  throw new Error(`CSRF_SECRET must be at least 32 characters. Got length ${csrfSecret?.length}`);
}

app.use(
  csrf(csrfSecret, ["POST", "PUT", "PATCH", "DELETE"])
);


// optional: expose a CSRF token endpoint (client includes it as x-csrf-token)
app.get("/api/v1/auth/csrf", (req, res) => {
  // tiny-csrf adds req.csrfToken()
  // you can also set it in a cookie if you prefer double-submit
  const token = req.csrfToken();
  return res.status(200).json({ success: true, data: { csrfToken: token }, error: null, meta: { timestamp: new Date().toISOString() } });
});

// rate limiting (tune as needed)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// health
app.get("/health", (_req, res) => {
  successResponse(res, { status: "UP" });
});

// routes (fix: add leading slash)
app.use("/api/v1/auth", authRoutes);

// 404 (must be before error handler)
app.use((req, res) => {
  notFoundResponse(res, "ROUTE_NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`);
});

// central error handler (last)
app.use(errorHandler);

export default app;
