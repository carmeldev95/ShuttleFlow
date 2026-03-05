import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { listUsers } from "../controllers/users.controller.js";

export const usersRoutes = Router();

usersRoutes.get("/", requireAuth, requireAdmin, listUsers);