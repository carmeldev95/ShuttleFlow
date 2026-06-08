import { Announcement } from "../models/Announcement.js";
import { AppError } from "../utils/errors.js";

// GET /api/announcements — all authenticated users, returns only active
export async function listActiveAnnouncements(_req, res) {
  const items = await Announcement.find({ isActive: true }).sort({ createdAt: -1 }).lean();
  res.json({ announcements: items });
}

// GET /api/announcements/all — admin only, returns all
export async function listAllAnnouncements(_req, res) {
  const items = await Announcement.find().sort({ createdAt: -1 }).lean();
  res.json({ announcements: items });
}

// POST /api/announcements — admin only
export async function createAnnouncement(req, res) {
  const { title, body, isActive } = req.body;
  if (!body || !String(body).trim()) throw new AppError("תוכן ההודעה הוא שדה חובה", 400);

  const doc = await Announcement.create({
    title: String(title || "").trim(),
    body: String(body).trim(),
    isActive: isActive !== false,
    createdBy: req.user.id,
  });
  res.status(201).json({ announcement: doc });
}

// PATCH /api/announcements/:id — admin only
export async function updateAnnouncement(req, res) {
  const { id } = req.params;
  const { title, body, isActive } = req.body;

  const doc = await Announcement.findById(id);
  if (!doc) throw new AppError("הודעה לא נמצאה", 404);

  if (title !== undefined) doc.title = String(title).trim();
  if (body !== undefined) {
    if (!String(body).trim()) throw new AppError("תוכן ההודעה לא יכול להיות ריק", 400);
    doc.body = String(body).trim();
  }
  if (isActive !== undefined) doc.isActive = Boolean(isActive);

  await doc.save();
  res.json({ announcement: doc });
}

// DELETE /api/announcements/:id — admin only
export async function deleteAnnouncement(req, res) {
  const { id } = req.params;
  const doc = await Announcement.findById(id);
  if (!doc) throw new AppError("הודעה לא נמצאה", 404);
  await Announcement.deleteOne({ _id: id });
  res.json({ ok: true });
}
