import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  getRegistrationDays,
  updateRegistrationDays,
} from "../controllers/registrationDays.controller.js";
import { ah } from "../utils/asyncHandler.js";

export const registrationDaysRoutes = Router();

registrationDaysRoutes.use(requireAuth);

registrationDaysRoutes.get("/",   ah(getRegistrationDays));
registrationDaysRoutes.patch("/", requireAdmin, ah(updateRegistrationDays));
