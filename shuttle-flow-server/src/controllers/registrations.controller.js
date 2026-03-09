// src/controllers/registrations.controller.js
import { Registration } from "../models/Registration.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { encryptField, decryptField } from "../utils/cryptoFields.js";

const ALLOWED_SHIFTS = ["morning", "evening", "night"];
const ALLOWED_DIRECTIONS = ["pickup", "dropoff", "both"];
const ALLOWED_SITES = ["carmel", "rambam"];

const norm = (v) => String(v ?? "").trim().toLowerCase();

function mapMongoError(e) {
  // unique index userId+date+shift => duplicate
  if (e?.code === 11000) return new AppError("כבר קיימת הרשמה למשמרת הזו בתאריך הזה", 409);
  if (e?.name === "ValidationError") return new AppError("שדות לא תקינים (בדוק משמרת/סוג/מיקום)", 400);
  return e;
}

function toRow(doc) {
  if (!doc) return doc;
  const snap = doc.userSnapshot || {};
  return {
    ...doc,
    id: String(doc._id),
    userId: String(doc.userId),
    createdBy: String(doc.createdBy),
    userSnapshot: {
      firstName:  decryptField(snap.firstName),
      lastName:   decryptField(snap.lastName),
      phone:      decryptField(snap.phone),
      address:    decryptField(snap.address),
      department: decryptField(snap.department),
    },
  };
}

/**
 * GET /api/registrations?date=YYYY-MM-DD&shift=morning|evening|night
 * Admin -> all
 * Employee -> only his
 */
export async function listRegistrations(req, res) {
  const isAdmin = req.user?.role === "admin";
  const userId = req.user?.id;

  const date = String(req.query?.date || "").trim();
  const shift = norm(req.query?.shift || "");

  const filter = isAdmin ? {} : { userId };

  if (date) filter.date = date;
  if (shift) {
    if (!ALLOWED_SHIFTS.includes(shift)) throw new AppError("Shift לא תקין", 400);
    filter.shift = shift;
  }

  const regs = await Registration.find(filter).sort({ createdAt: -1, date: -1 }).lean();
  res.json((regs || []).map(toRow));
}

/**
 * POST /api/registrations
 * Employee creates for himself
 * body: { date, shift, direction, site }
 */
export async function createRegistration(req, res, next) {
  try {
    const { date, shift, direction, site } = req.body;

    if (!date || !shift || !direction || !site) throw new AppError("Missing required fields", 400);

    const s = norm(shift);
    const d = norm(direction);
    const si = norm(site);

    if (!ALLOWED_SHIFTS.includes(s) || !ALLOWED_DIRECTIONS.includes(d) || !ALLOWED_SITES.includes(si)) {
      throw new AppError("שדות לא תקינים (בדוק משמרת/סוג/מיקום)", 400);
    }

    // req.user is already decrypted (from toSafeJson in middleware)
    const snap = {
      firstName:  encryptField(req.user.firstName),
      lastName:   encryptField(req.user.lastName),
      phone:      encryptField(req.user.phone),
      address:    encryptField(req.user.address),
      department: encryptField(req.user.department),
    };

    const doc = await Registration.create({
      userId: req.user.id,
      date: String(date).trim(),
      shift: s,
      direction: d,
      site: si,
      userSnapshot: snap,
      createdBy: req.user.id,
    });

    const row = await Registration.findById(doc._id).lean();
    res.status(201).json({ row: toRow(row) });
  } catch (e) {
    next(mapMongoError(e));
  }
}

/**
 * POST /api/registrations/admin
 * Admin creates for a specific user
 * body: { userId, date, shift, direction, site }
 */
export async function adminCreateRegistration(req, res, next) {
  try {
    const { userId, date, shift, direction, site } = req.body;

    if (!userId || !date || !shift || !direction || !site) {
      throw new AppError("Missing required fields", 400);
    }

    const s = norm(shift);
    const d = norm(direction);
    const si = norm(site);

    if (!ALLOWED_SHIFTS.includes(s) || !ALLOWED_DIRECTIONS.includes(d) || !ALLOWED_SITES.includes(si)) {
      throw new AppError("שדות לא תקינים (בדוק משמרת/סוג/מיקום)", 400);
    }

    const target = await User.findById(userId);
    if (!target) throw new AppError("User not found", 404);
    const safeTarget = target.toSafeJson();

    const snap = {
      firstName:  encryptField(safeTarget.firstName),
      lastName:   encryptField(safeTarget.lastName),
      phone:      encryptField(safeTarget.phone),
      address:    encryptField(safeTarget.address),
      department: encryptField(safeTarget.department),
    };

    const doc = await Registration.create({
      userId,
      date: String(date).trim(),
      shift: s,
      direction: d,
      site: si,
      userSnapshot: snap,
      createdBy: req.user.id, // admin id
    });

    const row = await Registration.findById(doc._id).lean();
    res.status(201).json({ row: toRow(row) });
  } catch (e) {
    next(mapMongoError(e));
  }
}

/**
 * PATCH /api/registrations/:id
 * admin or owner
 */
export async function updateRegistration(req, res, next) {
  try {
    const { id } = req.params;

    const r = await Registration.findById(id);
    if (!r) throw new AppError("Registration not found", 404);

    const isAdmin = req.user?.role === "admin";
    if (!isAdmin && String(r.userId) !== String(req.user.id)) throw new AppError("Forbidden", 403);

    const allowed = ["date", "shift", "direction", "site"];
    for (const k of allowed) {
      if (!(k in req.body)) continue;

      if (k === "date") r.date = String(req.body.date).trim();

      if (k === "shift") {
        const v = norm(req.body.shift);
        if (!ALLOWED_SHIFTS.includes(v)) throw new AppError("Shift לא תקין", 400);
        r.shift = v;
      }

      if (k === "direction") {
        const v = norm(req.body.direction);
        if (!ALLOWED_DIRECTIONS.includes(v)) throw new AppError("סוג לא תקין", 400);
        r.direction = v;
      }

      if (k === "site") {
        const v = norm(req.body.site);
        if (!ALLOWED_SITES.includes(v)) throw new AppError("מיקום לא תקין", 400);
        r.site = v;
      }
    }

    await r.save();

    const row = await Registration.findById(id).lean();
    res.json({ row: toRow(row) });
  } catch (e) {
    next(mapMongoError(e));
  }
}

/**
 * DELETE /api/registrations/:id
 * admin or owner
 */
export async function deleteRegistration(req, res, next) {
  try {
    const { id } = req.params;

    const r = await Registration.findById(id);
    if (!r) throw new AppError("Registration not found", 404);

    const isAdmin = req.user?.role === "admin";
    if (!isAdmin && String(r.userId) !== String(req.user.id)) throw new AppError("Forbidden", 403);

    await Registration.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (e) {
    next(mapMongoError(e));
  }
}