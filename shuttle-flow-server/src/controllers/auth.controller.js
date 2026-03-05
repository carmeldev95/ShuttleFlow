// src/controllers/auth.controller.js
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { normalizePhone } from "../utils/pick.js";
import { env } from "../config/env.js";

import {
  createAccessToken,
  issueRefreshTokenCookie,
  clearRefreshTokenCookie,
  rotateRefreshToken,
} from "../services/auth.service.js";

function requireFields(obj, fields) {
  const missing = [];
  for (const f of fields) {
    const v = obj?.[f];
    if (v === undefined || v === null || String(v).trim() === "") missing.push(f);
  }
  return missing;
}

/**
 * POST /api/auth/signup
 * body: { firstName,lastName,phone,password,address,department }
 */
export async function signup(req, res) {
  const { firstName, lastName, phone, password, address, department } = req.body;

  const missing = requireFields(req.body, [
    "firstName",
    "lastName",
    "phone",
    "password",
    "address",
    "department",
  ]);
  if (missing.length) {
    throw new AppError(`חסרים שדות: ${missing.join(", ")}`, 400);
  }

  const ph = normalizePhone(phone);
  if (!ph) throw new AppError("מספר טלפון לא תקין", 400);

  const pass = String(password || "");
  if (pass.length < 6) throw new AppError("סיסמה קצרה מדי (מינימום 6 תווים)", 400);

  const exists = await User.findOne({ phone: ph });
  if (exists) throw new AppError("הטלפון כבר רשום במערכת", 409);

  const user = new User({
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    phone: ph,
    address: String(address).trim(),
    department: String(department).trim(),
    role: "employee",
  });

  await user.setPassword(pass);
  await user.save();

  const token = createAccessToken(user);
  await issueRefreshTokenCookie(res, user);

  res.status(201).json({ token, user: user.toSafeJson() });
}

/**
 * POST /api/auth/login
 * body: { phone,password }
 */
export async function login(req, res) {
  const { phone, password } = req.body;

  const missing = requireFields(req.body, ["phone", "password"]);
  if (missing.length) throw new AppError(`חסרים שדות: ${missing.join(", ")}`, 400);

  const ph = normalizePhone(phone);
  if (!ph) throw new AppError("מספר טלפון לא תקין", 400);

  const user = await User.findOne({ phone: ph }).select("+passwordHash");
  if (!user) throw new AppError("Invalid credentials", 401);

  const ok = await user.checkPassword(password);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const token = createAccessToken(user);
  await issueRefreshTokenCookie(res, user);

  res.json({ token, user: user.toSafeJson() });
}

/**
 * POST /api/auth/logout
 */
export async function logout(_req, res) {
  clearRefreshTokenCookie(res);
  res.json({ ok: true });
}

/**
 * POST /api/auth/refresh
 * Uses refresh cookie, rotates it, returns new access token.
 */
export async function refresh(req, res, next) {
  try {
    const cookieName = env?.cookie?.name || "sf_refresh";
    const refreshToken = req.cookies?.[cookieName] || req.cookies?.sf_refresh;

    if (!refreshToken) throw new AppError("Missing refresh token", 401);

    const { user } = await rotateRefreshToken(refreshToken, res);
    const token = createAccessToken(user);

    res.json({ token, user: user.toSafeJson() });
  } catch (e) {
    // אם ה-refresh לא תקין/בוטל – מנקים cookie כדי למנוע לופ
    if (e?.status === 401) {
      clearRefreshTokenCookie(res);
    }
    next(e);
  }
}

/**
 * GET /api/auth/me
 */
export async function me(req, res) {
  res.json({ user: req.user });
}