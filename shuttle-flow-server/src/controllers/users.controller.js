// src/controllers/users.controller.js
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { hmacField } from "../utils/cryptoFields.js";
import { normalizePhone } from "../utils/pick.js";

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

/**
 * PATCH /api/users/:id
 * Admin only
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, department, address, role, password } = req.body;

  const user = await User.findById(id).select("+passwordHash +phoneHash");
  if (!user) throw new AppError("משתמש לא נמצא", 404);

  if (phone) {
    const normalized = normalizePhone(phone);
    if (!normalized) throw new AppError("מספר טלפון לא תקין", 400);
    const newHash = hmacField(normalized);
    if (newHash !== user.phoneHash) {
      const exists = await User.findOne({ phoneHash: newHash, _id: { $ne: id } });
      if (exists) throw new AppError("הטלפון כבר שייך למשתמש אחר", 409);
      user.phone = normalized; // pre-save hook will encrypt + update phoneHash
    }
  }

  if (firstName) user.firstName = firstName.trim();
  if (lastName) user.lastName = lastName.trim();
  if (department) user.department = department.trim();
  if (address) user.address = address.trim();
  if (role && ["employee", "admin"].includes(role)) user.role = role;
  if (password && password.length >= 6) {
    await user.setPassword(password);
    user.mustChangePassword = true;
  }

  await user.save();
  res.json({ user: user.toSafeJson() });
});