import { RegistrationDaysConfig, normalizeAllowedDays } from "../models/RegistrationDaysConfig.js";
import { AppError } from "../utils/errors.js";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const SHIFT_KEYS = ["morning", "evening", "night"];
const DIRECTION_KEYS = ["pickup", "dropoff", "both"];

async function getOrCreateConfig() {
  let cfg = await RegistrationDaysConfig.findOne();
  if (!cfg) cfg = await RegistrationDaysConfig.create({});
  return cfg;
}

function toJson(cfg) {
  const days = normalizeAllowedDays(cfg).sort((a, b) => (a.date < b.date ? -1 : 1));
  return {
    locked: !!cfg.locked,
    allowedDays: days,
  };
}

// GET /api/registration-days — any authenticated user (employees need it for the form)
export async function getRegistrationDays(req, res) {
  const cfg = await getOrCreateConfig();
  res.json({ config: toJson(cfg) });
}

// PATCH /api/registration-days — admin only
// body: { locked?: boolean, allowedDays?: [{ date, shifts, closedSites }] }
export async function updateRegistrationDays(req, res) {
  const { locked, allowedDays } = req.body;

  const cfg = await getOrCreateConfig();

  if (locked !== undefined) cfg.locked = Boolean(locked);

  if (allowedDays !== undefined) {
    if (!Array.isArray(allowedDays)) throw new AppError("allowedDays חייב להיות מערך", 400);

    const cleaned = [];
    const seen = new Set();
    for (const raw of allowedDays) {
      const date = String(raw?.date ?? "").trim();
      if (!YMD_RE.test(date)) throw new AppError(`תאריך לא תקין: ${date || "(ריק)"}`, 400);
      if (seen.has(date)) continue;
      seen.add(date);

      // Each shift: { open, directions: { pickup, dropoff, both } }
      const shifts = {};
      for (const sk of SHIFT_KEYS) {
        const rs = raw?.shifts?.[sk];
        const directions = {};
        for (const dk of DIRECTION_KEYS) {
          directions[dk] = rs?.directions?.[dk] !== false;
        }
        shifts[sk] = { open: rs?.open !== false, directions };
      }

      const closedSites = Array.isArray(raw?.closedSites)
        ? [...new Set(raw.closedSites.map((s) => String(s).trim()).filter(Boolean))]
        : [];

      cleaned.push({ date, shifts, closedSites });
    }

    cleaned.sort((a, b) => (a.date < b.date ? -1 : 1));
    cfg.allowedDays = cleaned;
    cfg.markModified("allowedDays");
    // drop any legacy field once we've written the new shape
    cfg.allowedDates = undefined;
  }

  await cfg.save();
  res.json({ config: toJson(cfg) });
}
