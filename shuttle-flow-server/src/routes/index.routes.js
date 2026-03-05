// src/routes/index.routes.js
import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { usersRoutes } from "./users.routes.js";
import { registrationsRoutes } from "./registrations.routes.js";

export const indexRoutes = Router();

// ✅ Health בתוך /api
indexRoutes.get("/health", (_req, res) => res.json({ ok: true }));

indexRoutes.use("/auth", authRoutes);
indexRoutes.use("/users", usersRoutes);
indexRoutes.use("/registrations", registrationsRoutes);