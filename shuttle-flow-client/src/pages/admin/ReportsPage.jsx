import { useEffect, useMemo, useState } from "react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { getSession } from "../../services/auth.service.js";
import { listRegistrations } from "../../services/registrations.service.js";
import {
  SHIFT,
  SHIFT_LABEL,
  SITE,
  SITE_LABEL,
  DIRECTION_LABEL,
} from "../../utils/constants.js";
import { formatDate } from "../../utils/datetime.js";
import {
  openHtmlAsPdf,
  exportRegistrationsCsv,
  exportRegistrationsExcel,
} from "../../services/reports.service.js";

function nowIL() {
  return new Date();
}

export default function ReportsPage() {
  const session = getSession();

  const [from, setFrom] = useState(""); // YYYY-MM-DD
  const [to, setTo] = useState(""); // YYYY-MM-DD
  const [shift, setShift] = useState("");
  const [site, setSite] = useState("");

  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const rows = await listRegistrations(); // ✅ מחזיר מערך מנורמל (כולל shiftLabel וכו')
        if (!cancelled) setAll(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!cancelled) {
          setAll([]);
          setLoadError(e?.message || "שגיאה בטעינת רשומות");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const inRange = (d) => {
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    return (all || [])
      .filter((r) => {
        if ((from || to) && !inRange(r.date)) return false;
        if (shift && r.shift !== shift) return false;
        if (site && r.site !== site) return false;
        return true;
      })
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [all, from, to, shift, site]);

  const totals = useMemo(() => {
    const total = rows.length;
    const byShift = { morning: 0, evening: 0, night: 0 };
    const bySite = { carmel: 0, rambam: 0 };

    rows.forEach((r) => {
      if (byShift[r.shift] != null) byShift[r.shift] += 1;
      if (bySite[r.site] != null) bySite[r.site] += 1;
    });

    return { total, byShift, bySite };
  }, [rows]);

  function buildReportHtml() {
    const ts = nowIL();
    const printedAt = `${formatDate(ts.toISOString())} ${String(ts.getHours()).padStart(2, "0")}:${String(
      ts.getMinutes()
    ).padStart(2, "0")}`;

    const filterText =
      [
        from ? `מ- ${formatDate(from)}` : null,
        to ? `עד ${formatDate(to)}` : null,
        shift ? `משמרת: ${SHIFT_LABEL[shift] || shift}` : null,
        site ? `מיקום: ${SITE_LABEL[site] || site}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "ללא פילטרים";

    const logoSrc = "/logo.png";

    const summaryHtml = `
      <div class="card">
        <div class="cardTitle">סיכום</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
          <div class="card" style="margin:0;border-radius:12px;">
            <div style="color:#64748b;font-size:12px;">סה״כ רשומות</div>
            <div style="font-weight:900;font-size:18px;margin-top:2px;">${totals.total}</div>
          </div>
          <div class="card" style="margin:0;border-radius:12px;">
            <div style="color:#64748b;font-size:12px;">לפי משמרות</div>
            <div style="margin-top:6px;font-size:12px;line-height:1.6;">
              בוקר: <b>${totals.byShift.morning}</b> · ערב: <b>${totals.byShift.evening}</b> · לילה: <b>${totals.byShift.night}</b>
            </div>
          </div>
          <div class="card" style="margin:0;border-radius:12px;">
            <div style="color:#64748b;font-size:12px;">לפי מיקום</div>
            <div style="margin-top:6px;font-size:12px;line-height:1.6;">
              כרמל: <b>${totals.bySite.carmel}</b> · רמב״ם: <b>${totals.bySite.rambam}</b>
            </div>
          </div>
        </div>
      </div>
    `;

    const tableRowsHtml = rows
      .map((r) => {
        const name = `${r.userSnapshot?.firstName || ""} ${r.userSnapshot?.lastName || ""}`.trim();
        const phone = r.userSnapshot?.phone || "-";
        const address = r.userSnapshot?.address || "-";

        // ✅ עדיפות ל-labelים בעברית שמגיעים מה-service
        const shiftTxt = r.shiftLabel || SHIFT_LABEL[r.shift] || r.shift || "-";
        const dirTxt = r.directionLabel || DIRECTION_LABEL[r.direction] || r.direction || "-";
        const siteTxt = r.siteLabel || SITE_LABEL[r.site] || r.site || "-";

        return `
          <tr>
            <td class="nowrap">${formatDate(r.date)}</td>
            <td><span class="pill">${escapeHtml(shiftTxt)}</span></td>
            <td>${escapeHtml(dirTxt)}</td>
            <td>${escapeHtml(siteTxt)}</td>
            <td>${escapeHtml(name) || "-"}</td>
            <td class="nowrap">${escapeHtml(phone)}</td>
            <td>${escapeHtml(address)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <div class="header">
        <div class="brand">
          <img class="logo" src="${logoSrc}" alt="logo" />
          <div>
            <div class="brandTitle">Shuttle Flow · דוח רישומי הסעות</div>
            <div class="brandSub">${escapeHtml(filterText)}</div>
          </div>
        </div>

        <div class="meta">
          <div>הופק על ידי: ${escapeHtml(session?.user?.firstName || "")} ${escapeHtml(session?.user?.lastName || "")}</div>
          <div>הודפס: ${escapeHtml(printedAt)}</div>
        </div>
      </div>

      ${summaryHtml}

      <div class="card">
        <div class="cardTitle">פירוט רשומות</div>
        <table>
          <thead>
            <tr>
              <th class="nowrap">תאריך</th>
              <th>משמרת</th>
              <th>סוג</th>
              <th>מיקום</th>
              <th>עובד</th>
              <th class="nowrap">טלפון</th>
              <th>כתובת</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml || `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:14px;">אין נתונים להצגה</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div>Shuttle Flow</div>
        <div>סה״כ: ${totals.total}</div>
      </div>
    `;
  }

  function onExportPdf() {
    const html = buildReportHtml();
    openHtmlAsPdf({ title: "Shuttle Flow Report", html });
  }

  function fileStamp() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}${m}${day}_${hh}${mm}`;
  }

  function onExportCsv() {
    exportRegistrationsCsv({
      filename: `shuttle-flow-report_${fileStamp()}.csv`,
      rows,
    });
  }

  function onExportExcel() {
    exportRegistrationsExcel({
      filename: `shuttle-flow-report_${fileStamp()}.xls`,
      title: "Shuttle Flow · דוח רישומי הסעות",
      rows,
    });
  }

  return (
    <Card
      title="דוחות"
      subtitle="סינון והפקת דוח רישומים — ניתן לייצא כ־PDF"
      right={
        <div className="row" style={{ gap: 8 }}>
          <Button variant="primary" onClick={onExportPdf} disabled={loading}>
            ייצוא PDF
          </Button>

          <button className="btn btnExcel" onClick={onExportExcel} disabled={loading}>
            Excel
          </button>

          <button className="btn btnCsv" onClick={onExportCsv} disabled={loading}>
            CSV
          </button>
        </div>
      }
    >
      <div className="filterRow">
        <div className="field">
          <div className="label">מתאריך</div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>

        <div className="field">
          <div className="label">עד תאריך</div>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <div className="field">
          <div className="label">משמרת</div>
          <select value={shift} onChange={(e) => setShift(e.target.value)}>
            <option value="">הכל</option>
            <option value={SHIFT.MORNING}>{SHIFT_LABEL[SHIFT.MORNING]}</option>
            <option value={SHIFT.EVENING}>{SHIFT_LABEL[SHIFT.EVENING]}</option>
            <option value={SHIFT.NIGHT}>{SHIFT_LABEL[SHIFT.NIGHT]}</option>
          </select>
        </div>

        <div className="field">
          <div className="label">מיקום</div>
          <select value={site} onChange={(e) => setSite(e.target.value)}>
            <option value="">הכל</option>
            <option value={SITE.CARMEL}>{SITE_LABEL[SITE.CARMEL]}</option>
            <option value={SITE.RAMBAM}>{SITE_LABEL[SITE.RAMBAM]}</option>
          </select>
        </div>
      </div>

      <div className="hr" />

      {loadError ? (
        <div className="notice noticeDanger">
          <b>שגיאה:</b> {loadError}
        </div>
      ) : (
        <div className="notice">
          <b>תצוגה מקדימה:</b> נמצאו <b>{totals.total}</b> רשומות.
          &nbsp; ניתן לייצא ל־PDF מעוצב באמצעות הכפתור למעלה.
        </div>
      )}

      <div className="hr" />

      <div className="tableWrap">
        <table className="table tableSaas">
          <thead>
            <tr>
              <th className="colDate">תאריך</th>
              <th>משמרת</th>
              <th>סוג</th>
              <th>מיקום</th>
              <th>עובד</th>
              <th className="colPhone">טלפון</th>
              <th className="colAddress">כתובת</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r) => (
              <tr key={r.id || r._id}>
                <td className="colDate">{formatDate(r.date)}</td>
                <td>{r.shiftLabel || SHIFT_LABEL[r.shift] || r.shift}</td>
                <td>{r.directionLabel || DIRECTION_LABEL[r.direction] || r.direction}</td>
                <td>{r.siteLabel || SITE_LABEL[r.site] || r.site}</td>
                <td>
                  {r.userSnapshot?.firstName} {r.userSnapshot?.lastName}
                </td>
                <td className="colPhone">{r.userSnapshot?.phone || "-"}</td>
                <td className="colAddress">{r.userSnapshot?.address || "-"}</td>
              </tr>
            ))}

            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="tableEmpty">
                  אין נתונים להצגה
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={7} className="tableEmpty">
                  טוען...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 30 && (
        <div className="p" style={{ marginTop: 10 }}>
          מציג תצוגה מקדימה של 30 רשומות ראשונות. ה־PDF יכלול את כולן.
        </div>
      )}
    </Card>
  );
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}