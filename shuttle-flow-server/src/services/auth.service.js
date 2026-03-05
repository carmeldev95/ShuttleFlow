// src/services/auth.service.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";

/* ==============================
   Access Token (JWT)
   ============================== */

export function createAccessToken(user) {
  const payload = {
    sub: String(user._id),
    role: user.role,
  };

  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  });
}

/**
 * Verify JWT access token and return decoded payload.
 * Throws AppError(401) on invalid/expired token.
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwt.accessSecret);
  } catch (e) {
    throw new AppError("Invalid token", 401);
  }
}

/* ==============================
   Refresh Token (DB + Cookie)
   ============================== */

function randomToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseDurationToMs(str) {
  const s = String(str || "").trim();
  const m = s.match(/^(\d+)\s*([smhd])$/i);
  if (!m) return 14 * 24 * 60 * 60 * 1000; // default 14d
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult =
    unit === "s"
      ? 1000
      : unit === "m"
      ? 60 * 1000
      : unit === "h"
      ? 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;
  return n * mult;
}

export async function issueRefreshTokenCookie(res, user) {
  const token = randomToken();
  const tokenHash = hashToken(token);

  const ttlMs = parseDurationToMs(env.jwt.refreshExpires);
  const expiresAt = new Date(Date.now() + ttlMs);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    revokedAt: null,
  });

  const isSecure = !!env.cookie.secure;
  res.cookie(env.cookie.name, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export function clearRefreshTokenCookie(res) {
  const isSecure = !!env.cookie.secure;
  res.clearCookie(env.cookie.name, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    path: "/",
  });
}

/**
 * Rotate refresh token:
 * - verify old token exists, not revoked, not expired
 * - revoke old token
 * - issue new cookie + store new token record
 * Returns { user }
 */
export async function rotateRefreshToken(refreshTokenPlain, res) {
  if (!refreshTokenPlain) throw new AppError("Missing refresh token", 401);

  const tokenHash = hashToken(String(refreshTokenPlain));
  const rec = await RefreshToken.findOne({ tokenHash });

  if (!rec) throw new AppError("Invalid refresh token", 401);
  if (rec.revokedAt) throw new AppError("Refresh token revoked", 401);
  if (rec.expiresAt && rec.expiresAt.getTime() < Date.now()) {
    throw new AppError("Refresh token expired", 401);
  }

  // revoke old token record
  rec.revokedAt = new Date();
  await rec.save();

  const user = await User.findById(rec.userId);
  if (!user) throw new AppError("User not found", 401);

  // issue new refresh token cookie + record
  await issueRefreshTokenCookie(res, user);

  return { user };
}