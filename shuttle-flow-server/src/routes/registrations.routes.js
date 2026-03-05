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

export const registrationsRoutes = Router();

registrationsRoutes.use(requireAuth);

// list (admin: all, employee: only mine) + supports ?date=YYYY-MM-DD&shift=morning|evening|night
registrationsRoutes.get("/", listRegistrations);

// employee create for self
registrationsRoutes.post("/", createRegistration);

// admin create for specific user
registrationsRoutes.post("/admin", requireAdmin, adminCreateRegistration);

// update/delete (admin or owner)
registrationsRoutes.patch("/:id", updateRegistration);
registrationsRoutes.delete("/:id", deleteRegistration);