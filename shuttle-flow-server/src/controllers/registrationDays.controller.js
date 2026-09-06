import { RegistrationDaysConfig } from "../models/RegistrationDaysConfig.js";
import { AppError } from "../utils/errors.js";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

async function getOrCreateConfig() {
  let cfg = await RegistrationDaysConfig.findOne();
  if (!cfg) cfg = await RegistrationDaysConfig.create({});
  return cfg;
}

function toJson(cfg) {
  return {
    locked: !!cfg.locked,
    allowedDates: (cfg.allowedDates || []).slice().sort(),
  };
}

// GET /api/registration-days — any authenticated user (employees need it for the form)
export async function getRegistrationDays(req, res) {
  const cfg = await getOrCreateConfig();
  res.json({ config: toJson(cfg) });
}

// PATCH /api/registration-days — admin only
// body: { locked?: boolean, allowedDates?: string[] }
export async function updateRegistrationDays(req, res) {
  const { locked, allowedDates } = req.body;

  const cfg = await getOrCreateConfig();

  if (locked !== undefined) cfg.locked = Boolean(locked);

  if (allowedDates !== undefined) {
    if (!Array.isArray(allowedDates)) throw new AppError("allowedDates חייב להיות מערך", 400);
    const cleaned = [];
    for (const d of allowedDates) {
      const v = String(d ?? "").trim();
      if (!YMD_RE.test(v)) throw new AppError(`תאריך לא תקין: ${v || "(ריק)"}`, 400);
      if (!cleaned.includes(v)) cleaned.push(v);
    }
    cfg.allowedDates = cleaned.sort();
  }

  await cfg.save();
  res.json({ config: toJson(cfg) });
}
