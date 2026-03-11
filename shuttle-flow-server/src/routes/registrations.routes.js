// src/routes/registrations.routes.js
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  listRegistrations,
  createRegistration,
  adminCreateRegistration,
  updateRegistration,
  deleteRegistration,
} from "../controllers/registrations.controller.js";
import { ah } from "../utils/asyncHandler.js";

export const registrationsRoutes = Router();

registrationsRoutes.use(requireAuth);

registrationsRoutes.get("/", ah(listRegistrations));
registrationsRoutes.post("/", ah(createRegistration));
registrationsRoutes.post("/admin", requireAdmin, ah(adminCreateRegistration));
registrationsRoutes.patch("/:id", ah(updateRegistration));
registrationsRoutes.delete("/:id", ah(deleteRegistration));