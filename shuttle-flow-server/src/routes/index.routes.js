import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { usersRoutes } from "./users.routes.js";
import { registrationsRoutes } from "./registrations.routes.js";

export const indexRoutes = Router();

indexRoutes.use("/auth", authRoutes);
indexRoutes.use("/users", usersRoutes);
indexRoutes.use("/registrations", registrationsRoutes);