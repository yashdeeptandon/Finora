// apps/api/src/app.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { loggerMiddleware } from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundResponse } from "./utils/response.js";
import { createCsrfMiddleware } from "./middlewares/csrf.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

// 🔹 Security headers
app.use(helmet());

// 🔹 CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// 🔹 Parsers
app.use(express.json());
// ✅ cookie-parser with a secret, required by tiny-csrf
app.use(cookieParser(process.env.COOKIE_SECRET || "super-secret-cookie-key"));

// 🔹 Request tracking + logging
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

// 🔹 Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// 🔹 CSRF protection
const csrfSecret = process.env.CSRF_SECRET;
if (!csrfSecret || csrfSecret.length < 32) {
  throw new Error("CSRF_SECRET must be >= 32 characters long");
}
app.use(
  createCsrfMiddleware({
    secret: csrfSecret,
    tokenPath: "/api/v1/auth/csrf",
    methods: ["POST", "PUT", "PATCH", "DELETE"],
  })
);

// 🔹 Routes
app.get("/health", (_req, res) => res.json({ status: "UP" }));
app.use("/api/v1/auth", authRoutes);

// 🔹 404
app.use((_req, res) => notFoundResponse(res));

// 🔹 Error handler
app.use(errorHandler);

export default app;
