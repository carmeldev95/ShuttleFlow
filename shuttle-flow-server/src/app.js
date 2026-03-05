import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { indexRoutes } from "./routes/index.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // ✅ CORS: allow local dev origins (localhost/127.0.0.1 + vite ports)
  const allowedOrigins = new Set([
    env.clientOrigin,               // e.g. http://localhost:5173
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://localhost:4173"
  ]);

  app.use(
    cors({
      origin: (origin, cb) => {
        // requests like curl/postman have no origin -> allow
        if (!origin) return cb(null, true);
        if (allowedOrigins.has(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 204,
    })
  );

  // logs
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api", indexRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}