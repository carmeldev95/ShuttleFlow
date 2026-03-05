// src/controllers/users.controller.js
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/users
 * Admin only (או לפי מה שהגדרת ב-routes)
 */
export const listUsers = asyncHandler(async (_req, res) => {
  // לא להשתמש ב-lean כדי לשמור methods (לא חובה פה, אבל לא מזיק)
  const users = await User.find().sort({ createdAt: -1 });

  // מחזירים מידע בטוח (לא כולל passwordHash)
  const out = users.map((u) => (u.toSafeJson ? u.toSafeJson() : u));

  res.json({ users: out });
});