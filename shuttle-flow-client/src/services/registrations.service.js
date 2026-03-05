// src/services/registrations.service.js
import { apiRequest } from "./apiClient.js";
import { SHIFT_LABEL, DIRECTION_LABEL, SITE_LABEL } from "../utils/constants.js";

/**
 * אצלך ב-constants הערכים הם lowercase:
 * shift: "morning" | "evening" | "night"
 * direction: "pickup" | "dropoff" | "both"
 * site: "carmel" | "rambam"
 *
 * לכן אנחנו מנרמלים ל-lowercase (לא ל-UPPERCASE!)
 */
const normEnum = (v) => String(v ?? "").trim().toLowerCase();

function normalizeRow(r) {
  if (!r) return r;

  const shift = normEnum(r.shift);
  const direction = normEnum(r.direction);
  const site = normEnum(r.site);

  const id = r.id || r._id || r?.row?.id || r?.row?._id;

  return {
    ...r,
    id,

    // שומרים raw (lowercase) כדי שכל הפילטרים יעבדו מול השרת
    shift,
    direction,
    site,

    // ✅ תצוגה בעברית בכל האפליקציה
    shiftLabel: SHIFT_LABEL[shift] || shift || "-",
    directionLabel: DIRECTION_LABEL[direction] || direction || "-",
    siteLabel: SITE_LABEL[site] || site || "-",
  };
}

/**
 * השרת שלך מחזיר לפעמים:
 * - GET: מערך rows ישירות
 * - או { rows: [...] }
 */
function extractRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

// list registrations
export async function listRegistrations({ date = "", shift = "" } = {}) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (shift) params.set("shift", shift); // חשוב: להעביר lowercase כמו בשרת

  const qs = params.toString();
  const data = await apiRequest(`/registrations${qs ? `?${qs}` : ""}`);

  const rows = extractRows(data);
  return rows.map(normalizeRow);
}

// employee create for self
export async function createMyRegistration(form) {
  // אצלך השרת מחזיר כרגע { id } ולא בהכרח { row }
  const data = await apiRequest("/registrations", { method: "POST", body: form });

  // אם השרת יחזיר בעתיד {row} – נתמוך בזה
  const row = data?.row || data;

  // אם חזר רק id – נבנה אובייקט מינימלי לתצוגה (המסך גם ככה עושה refresh אחרי יצירה ברוב המקרים)
  if (row && row.id && !row.shift) {
    return normalizeRow({ id: row.id, ...form });
  }

  if (row && row._id && !row.shift) {
    return normalizeRow({ _id: row._id, ...form });
  }

  return normalizeRow(row?.shift ? row : { ...form, ...(row?.id ? { id: row.id } : {}) });
}

// admin create for specific user
export async function adminCreateRegistration({ userId, ...form }) {
  // אם אין לך route כזה בשרת עדיין, זה יזרוק 404 — זה בסדר, אבל הקוד כאן נכון לצד לקוח
  const data = await apiRequest("/registrations/admin", {
    method: "POST",
    body: { userId, ...form },
  });

  const row = data?.row || data;

  if (row && row.id && !row.shift) {
    return normalizeRow({ id: row.id, userId, ...form });
  }

  if (row && row._id && !row.shift) {
    return normalizeRow({ _id: row._id, userId, ...form });
  }

  return normalizeRow(row?.shift ? row : { userId, ...form, ...(row?.id ? { id: row.id } : {}) });
}

export async function updateRegistration(id, patch) {
  const data = await apiRequest(`/registrations/${id}`, { method: "PATCH", body: patch });

  // אצלך השרת מחזיר { ok: true } — אז נחזיר row מינימלי כדי שה-UI לא יישבר
  if (data?.row) return normalizeRow(data.row);

  // אם אין row, נחזיר אובייקט מעודכן מקומית
  return normalizeRow({ id, ...patch });
}

export async function deleteRegistration(id) {
  const data = await apiRequest(`/registrations/${id}`, { method: "DELETE" });
  return !!data?.ok;
}