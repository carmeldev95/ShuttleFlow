import { Router } from "express";
import { login, logout, me, refresh, signup } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authRateLimit } from "../middleware/rateLimit.middleware.js";

export const authRoutes = Router();

authRoutes.post("/signup", authRateLimit, signup);
authRoutes.post("/login", authRateLimit, login);


authRoutes.post("/refresh", authRateLimit, refresh);
authRoutes.post("/logout", authRateLimit, logout);

authRoutes.get("/me", requireAuth, me);