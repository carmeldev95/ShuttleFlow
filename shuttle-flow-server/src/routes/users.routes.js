import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { listUsers, createUser, updateUser } from "../controllers/users.controller.js";
import { ah } from "../utils/asyncHandler.js";

export const usersRoutes = Router();

usersRoutes.get("/", requireAuth, requireAdmin, ah(listUsers));
usersRoutes.post("/", requireAuth, requireAdmin, ah(createUser));
usersRoutes.patch("/:id", requireAuth, requireAdmin, ah(updateUser));