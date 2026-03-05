// src/middleware/auth.middleware.js
import { verifyAccessToken } from "../services/auth.service.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new AppError("Missing token", 401);

    const payload = verifyAccessToken(token); // { sub, role, iat, exp }
    if (!payload?.sub) throw new AppError("Invalid token", 401);

    const userDoc = await User.findById(payload.sub);
    if (!userDoc) throw new AppError("User not found", 401);

    req.user = userDoc.toSafeJson ? userDoc.toSafeJson() : userDoc;
    next();
  } catch (e) {
    next(e);
  }
}

/**
 * requireRole("admin")  -> רק אדמין
 * requireRole(["admin","employee"]) -> כמה תפקידים
 */
export function requireRole(roleOrRoles) {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];

  return (req, _res, next) => {
    try {
      if (!req.user) throw new AppError("Unauthorized", 401);

      const role = req.user.role;
      if (!role) throw new AppError("Unauthorized", 401);

      if (!roles.includes(role)) throw new AppError("Forbidden", 403);

      next();
    } catch (e) {
      next(e);
    }
  };
}

export const requireAdmin = requireRole("admin");