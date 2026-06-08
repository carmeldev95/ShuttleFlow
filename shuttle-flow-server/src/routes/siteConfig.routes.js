import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  listSiteConfigs,
  createSiteConfig,
  updateSiteConfig,
  deleteSiteConfig,
} from "../controllers/siteConfig.controller.js";
import { ah } from "../utils/asyncHandler.js";

export const siteConfigRoutes = Router();

siteConfigRoutes.use(requireAuth);

siteConfigRoutes.get("/",       ah(listSiteConfigs));
siteConfigRoutes.post("/",      requireAdmin, ah(createSiteConfig));
siteConfigRoutes.patch("/:id",  requireAdmin, ah(updateSiteConfig));
siteConfigRoutes.delete("/:id", requireAdmin, ah(deleteSiteConfig));
