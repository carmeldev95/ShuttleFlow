import { SiteConfig } from "../models/SiteConfig.js";
import { AppError } from "../utils/errors.js";

const DEFAULTS = [
  { key: "rambam", label: 'רמב"ם', isVisible: true, shifts: { morning: true, evening: true, night: true } },
  { key: "carmel", label: "כרמל",  isVisible: true, shifts: { morning: true, evening: true, night: true } },
];

async function ensureDefaults() {
  const count = await SiteConfig.countDocuments();
  if (count === 0) await SiteConfig.insertMany(DEFAULTS);
}

// GET /api/site-config — admin gets all, employee gets visible only
export async function listSiteConfigs(req, res) {
  await ensureDefaults();
  const isAdmin = req.user?.role === "admin";
  const filter = isAdmin ? {} : { isVisible: true };
  const sites = await SiteConfig.find(filter).sort({ createdAt: 1 }).lean();
  res.json({ sites });
}

// POST /api/site-config — admin only
export async function createSiteConfig(req, res) {
  const { label, isVisible, shifts } = req.body;
  if (!label || !String(label).trim()) throw new AppError("שם המיקום הוא שדה חובה", 400);

  const key = String(label).trim().toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w\u0590-\u05ff]/g, "_");

  const exists = await SiteConfig.findOne({ key });
  if (exists) throw new AppError("מיקום עם שם זה כבר קיים", 409);

  const doc = await SiteConfig.create({
    key,
    label: String(label).trim(),
    isVisible: isVisible !== false,
    shifts: {
      morning: shifts?.morning !== false,
      evening: shifts?.evening !== false,
      night:   shifts?.night   !== false,
    },
  });
  res.status(201).json({ site: doc });
}

// PATCH /api/site-config/:id — admin only
export async function updateSiteConfig(req, res) {
  const { id } = req.params;
  const { label, isVisible, shifts } = req.body;

  const doc = await SiteConfig.findById(id);
  if (!doc) throw new AppError("מיקום לא נמצא", 404);

  if (label !== undefined) {
    if (!String(label).trim()) throw new AppError("שם המיקום לא יכול להיות ריק", 400);
    doc.label = String(label).trim();
  }
  if (isVisible !== undefined) doc.isVisible = Boolean(isVisible);
  if (shifts) {
    if (shifts.morning !== undefined) doc.shifts.morning = Boolean(shifts.morning);
    if (shifts.evening !== undefined) doc.shifts.evening = Boolean(shifts.evening);
    if (shifts.night   !== undefined) doc.shifts.night   = Boolean(shifts.night);
  }

  await doc.save();
  res.json({ site: doc });
}

// DELETE /api/site-config/:id — admin only
export async function deleteSiteConfig(req, res) {
  const { id } = req.params;
  const doc = await SiteConfig.findById(id);
  if (!doc) throw new AppError("מיקום לא נמצא", 404);
  await SiteConfig.deleteOne({ _id: id });
  res.json({ ok: true });
}
