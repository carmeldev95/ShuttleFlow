import { listRegistrations } from "./registrations.service.js";
import { DIRECTION_LABEL, SHIFT_LABEL, SITE_LABEL } from "../utils/constants.js";

/* ==============================
   Report rows builder (normalized)
   ============================== */

/**
 * Builds normalized report rows for UI/PDF/CSV/Excel.
 * Supports filtering by:
 * - date (YYYY-MM-DD)
 * - shift (morning/evening/night)
 * - site (carmel/rambam)
 * - q (free search)
 */
export function buildReportRows({ date = "", shift = "", site = "", q = "" } = {}) {
  const all = listRegistrations().slice();
  const qq = String(q || "").trim().toLowerCase();

  const filtered = all.filter((r) => {
    if (date && r.date !== date) return false;
    if (shift && r.shift !== shift) return false;
    if (site && r.site !== site) return false;

    if (qq) {
      const name = `${r.userSnapshot?.firstName || ""} ${r.userSnapshot?.lastName || ""}`.toLowerCase();
      const phone = String(r.userSnapshot?.phone || "").toLowerCase();
      const dept = String(r.userSnapshot?.department || "").toLowerCase();
      const address = String(r.userSnapshot?.address || "").toLowerCase();
      const dateStr = String(r.date || "").toLowerCase();

      const shiftLabel = String(SHIFT_LABEL[r.shift] || r.shift || "").toLowerCase();
      const dirLabel = String(DIRECTION_LABEL[r.direction] || r.direction || "").toLowerCase();
      const siteLabel = String(SITE_LABEL[r.site] || r.site || "").toLowerCase();

      const hay = [name, phone, dept, address, dateStr, shiftLabel, dirLabel, siteLabel].join(" ");
      if (!hay.includes(qq)) return false;
    }

    return true;
  });

  // Newest first
  filtered.sort((a, b) => (a.date < b.date ? 1 : -1));

  return filtered.map((r) => ({
    "תאריך": r.date,
    "משמרת": SHIFT_LABEL[r.shift] || r.shift,
    "סוג": DIRECTION_LABEL[r.direction] || r.direction,
    "מיקום": SITE_LABEL[r.site] || r.site,
    "שם פרטי": r.userSnapshot?.firstName || "",
    "שם משפחה": r.userSnapshot?.lastName || "",
    "טלפון": r.userSnapshot?.phone || "",
    "מחלקה": r.userSnapshot?.department || "",
    "כתובת": r.userSnapshot?.address || "",
  }));
}

/* ==============================
   PDF (print-to-PDF) + logo base64
   ============================== */

/**
 * Usage (recommended):
 * const logo = await getLogoDataUrl("/logo.png");
 * const html = buildHtml().replaceAll("__LOGO__", logo);
 * await openHtmlAsPdf({ title: "...", html });
 */
export async function openHtmlAsPdf({
  title = "Shuttle Flow Report",
  html,
  logoUrl = "/logo.png", // put in public/logo.png
}) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("הדפדפן חסם חלון קופץ. אפשר חלונות קופצים ואז לנסות שוב.");
    return;
  }

  // If caller didn't inject logo, we try to inject it automatically
  let finalHtml = String(html ?? "");
  if (finalHtml.includes("__LOGO__")) {
    const logoDataUrl = await getLogoDataUrl(logoUrl);
    finalHtml = finalHtml.replaceAll("__LOGO__", logoDataUrl);
  }

  w.document.open();
  w.document.write(`<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    /* Print setup */
    @page { size: A4; margin: 14mm; }
    html, body { height: 100%; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      background: white;
      margin: 0;
      direction: rtl;
    }

    /* Layout */
    .wrap { max-width: 900px; margin: 0 auto; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      object-fit: contain;
      background: #fff;
    }
    .brandTitle { font-weight: 900; font-size: 18px; letter-spacing: .2px; }
    .brandSub { color: #64748b; font-size: 12px; margin-top: 2px; }
    .meta {
      text-align: left;
      color: #64748b;
      font-size: 12px;
      line-height: 1.6;
      white-space: nowrap;
    }

    .card {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 12px;
      margin-bottom: 12px;
      background: #fff;
    }
    .cardTitle { font-weight: 900; font-size: 14px; margin-bottom: 8px; }

    /* Table */
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      overflow: hidden;
    }
    thead th {
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      padding: 9px 10px;
      font-size: 12px;
      text-align: right;
      white-space: nowrap;
    }
    tbody td {
      padding: 9px 10px;
      border-bottom: 1px solid #eef2ff;
      font-size: 12px;
      vertical-align: top;
    }
    tbody tr:nth-child(even) td { background: #fbfdff; }
    tbody tr:last-child td { border-bottom: 0; }
    .nowrap { white-space: nowrap; }

    /* Badges */
    .pill{
      display: inline-block;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1d4ed8;
      white-space: nowrap;
    }

    /* Footer */
    .footer {
      margin-top: 10px;
      color: #94a3b8;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }

    /* Print tweaks */
    @media print {
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    ${finalHtml}
  </div>

  <script>
    (function(){
      // Wait for images to load then print
      const imgs = Array.from(document.images || []);
      if (!imgs.length) {
        setTimeout(() => window.print(), 250);
        return;
      }
      let left = imgs.length;
      const done = () => {
        left--;
        if (left <= 0) setTimeout(() => window.print(), 120);
      };
      imgs.forEach(img => {
        if (img.complete) return done();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    })();
  </script>
</body>
</html>`);
  w.document.close();
}

/**
 * Fetch logo and convert to base64 (data URL).
 * If fetch fails, returns original url (still may work if it's reachable).
 */
export async function getLogoDataUrl(url = "/logo.png") {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return url;
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    return url;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/* ==============================
   CSV + Excel export
   ============================== */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

/**
 * Export any array of objects (same keys) to CSV.
 * Adds UTF-8 BOM so Excel will display Hebrew correctly.
 */
export function exportCsvFromObjects({ filename = "shuttle-flow-report.csv", rows }) {
  const safeRows = rows || [];
  const BOM = "\uFEFF";

  if (safeRows.length === 0) {
    const blob = new Blob([BOM], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, filename);
    return;
  }

  const headers = Object.keys(safeRows[0]);
  const lines = [];
  lines.push(headers.map(csvEscape).join(","));

  for (const r of safeRows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }

  const csvText = BOM + lines.join("\r\n");
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

/**
 * Backwards compatible helper (accepts raw registrations objects),
 * but recommended usage is:
 * exportCsvFromObjects({ rows: buildReportRows(...) })
 */
export function exportRegistrationsCsv({ filename = "shuttle-flow-report.csv", rows }) {
  if (rows && rows.length && typeof rows[0] === "object" && "תאריך" in rows[0]) {
    return exportCsvFromObjects({ filename, rows });
  }

  const normalized = (rows || []).map((r) => ({
    "תאריך": r.date || "",
    "משמרת": SHIFT_LABEL[r.shift] || r.shift,
    "סוג": DIRECTION_LABEL[r.direction] || r.direction,
    "מיקום": SITE_LABEL[r.site] || r.site,
    "שם פרטי": r.userSnapshot?.firstName || "",
    "שם משפחה": r.userSnapshot?.lastName || "",
    "טלפון": r.userSnapshot?.phone || "",
    "מחלקה": r.userSnapshot?.department || "",
    "כתובת": r.userSnapshot?.address || "",
  }));

  return exportCsvFromObjects({ filename, rows: normalized });
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Excel export without libraries:
 * Generates an .xls file containing an HTML table (RTL + Hebrew).
 * Accepts normalized report objects (Hebrew keys).
 */
export function exportExcelFromObjects({
  filename = "shuttle-flow-report.xls",
  title = "Shuttle Flow Report",
  rows,
}) {
  const safeRows = rows || [];
  const headers = safeRows.length ? Object.keys(safeRows[0]) : [];

  const tableHead = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");

  const tableRows = safeRows
    .map((obj) => {
      const tds = headers
        .map((h) => {
          const val = obj[h] ?? "";
          const isText = h.includes("טלפון") || h.includes("תאריך");
          return isText
            ? `<td style="mso-number-format:'@'">${escapeHtml(val)}</td>`
            : `<td>${escapeHtml(val)}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; direction: rtl; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; vertical-align: top; }
  th { background: #f3f4f6; font-weight: 800; white-space: nowrap; }
</style>
</head>
<body>
  <h2 style="margin:0 0 10px">${escapeHtml(title)}</h2>
  <table>
    <thead><tr>${tableHead}</tr></thead>
    <tbody>
      ${tableRows || `<tr><td colspan="${Math.max(1, headers.length)}" style="color:#6b7280;text-align:center">אין נתונים</td></tr>`}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  downloadBlob(blob, filename);
}

/**
 * Backwards compatible helper for raw registrations:
 * recommended usage is:
 * exportExcelFromObjects({ rows: buildReportRows(...) })
 */
export function exportRegistrationsExcel({
  filename = "shuttle-flow-report.xls",
  title = "Shuttle Flow Report",
  rows,
}) {
  if (rows && rows.length && typeof rows[0] === "object" && "תאריך" in rows[0]) {
    return exportExcelFromObjects({ filename, title, rows });
  }

  const normalized = (rows || []).map((r) => ({
    "תאריך": r.date || "",
    "משמרת": SHIFT_LABEL[r.shift] || r.shift,
    "סוג": DIRECTION_LABEL[r.direction] || r.direction,
    "מיקום": SITE_LABEL[r.site] || r.site,
    "שם פרטי": r.userSnapshot?.firstName || "",
    "שם משפחה": r.userSnapshot?.lastName || "",
    "טלפון": r.userSnapshot?.phone || "",
    "מחלקה": r.userSnapshot?.department || "",
    "כתובת": r.userSnapshot?.address || "",
  }));

  return exportExcelFromObjects({ filename, title, rows: normalized });
}

/* ==============================
   Helpers
   ============================== */

export function fileStamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}${m}${day}_${hh}${mm}`;
}