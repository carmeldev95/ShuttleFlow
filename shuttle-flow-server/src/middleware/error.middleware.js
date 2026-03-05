// src/middleware/error.middleware.js
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export function notFound(req, _res, next) {
  const err = new Error(`Not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

export function errorHandler(err, _req, res, _next) {
  const status = Number(err.status || err.statusCode || 500);

  // לוג מסודר
  logger.error({
    message: err.message || "Server error",
    status,
    stack: err.stack,
  });

  // אל תחשוף stack בפרודקשן
  const payload = {
    message: err.message || "Server error",
  };
  if (env.nodeEnv !== "production" && err.stack) payload.stack = err.stack;

  // אם כבר התחילו לשלוח response
  if (res.headersSent) return;

  res.status(status).json(payload);
}