import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  listActiveAnnouncements,
  listAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcements.controller.js";
import { ah } from "../utils/asyncHandler.js";

export const announcementsRoutes = Router();

announcementsRoutes.use(requireAuth);

announcementsRoutes.get("/",        ah(listActiveAnnouncements));
announcementsRoutes.get("/all",     requireAdmin, ah(listAllAnnouncements));
announcementsRoutes.post("/",       requireAdmin, ah(createAnnouncement));
announcementsRoutes.patch("/:id",   requireAdmin, ah(updateAnnouncement));
announcementsRoutes.delete("/:id",  requireAdmin, ah(deleteAnnouncement));
