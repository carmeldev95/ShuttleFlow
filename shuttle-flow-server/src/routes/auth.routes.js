import { Router } from "express";
import { login, logout, me, refresh, signup, changePassword } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authRateLimit } from "../middleware/rateLimit.middleware.js";
import { ah } from "../utils/asyncHandler.js";

export const authRoutes = Router();

authRoutes.post("/signup", authRateLimit, ah(signup));
authRoutes.post("/login", authRateLimit, ah(login));

authRoutes.post("/refresh", authRateLimit, ah(refresh));
authRoutes.post("/logout", authRateLimit, ah(logout));

authRoutes.get("/me", requireAuth, ah(me));
authRoutes.post("/change-password", requireAuth, ah(changePassword));