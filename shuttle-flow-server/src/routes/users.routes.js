import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { listUsers, updateUser } from "../controllers/users.controller.js";

export const usersRoutes = Router();

usersRoutes.get("/", requireAuth, requireAdmin, listUsers);
usersRoutes.patch("/:id", requireAuth, requireAdmin, updateUser);