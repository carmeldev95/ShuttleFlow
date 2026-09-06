import { useEffect, useState } from "react";
import {
  getRegistrationDays,
  updateRegistrationDays,
} from "../../services/registrationDays.service.js";
import { parseYmdToDate, formatDate } from "../../utils/datetime.js";

function dayName(ymd) {
  try {
    return parseYmdToDate(ymd).toLocaleDateString("he-IL", { weekday: "long" });
  } catch {
    return "";
  }
}

export default function RegistrationDaysModal({ onClose, onChanged }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getRegistrationDays()
      .then(setConfig)
      .catch((e) => setError(e.message || "שגיאה בטעינת ההגדרות"))
      .finally(() => setLoading(false));
  }, []);

  async function save(payload) {
    setSaving(true);
    setError("");
    try {
      const updated = await updateRegistrationDays(payload);
      setConfig(updated);
      onChanged?.(updated);
    } catch (e) {
      setError(e.message || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  function toggleLocked() {
    save({ locked: !config.locked });
  }

  function addDate(e) {
    e.preventDefault();
    setError("");
    if (!newDate) {
      setError("יש לבחור תאריך");
      return;
    }
    if (config.allowedDates.includes(newDate)) {
      setError("התאריך כבר ברשימה");
      return;
    }
    save({ allowedDates: [...config.allowedDates, newDate] });
    setNewDate("");
  }

  function removeDate(ymd) {
    save({ allowedDates: config.allowedDates.filter((d) => d !== ymd) });
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="siteConfigModal" onClick={(e) => e.stopPropagation()}>
        <div className="siteConfigHeader">
          <div className="modalTitle">ניהול ימי רישום</div>
          <button type="button" className="btn btnGhost" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="p">טוען...</div>
        ) : !config ? (
          <div className="error">{error || "שגיאה בטעינת ההגדרות"}</div>
        ) : (
          <>
            <div className="notice">
              {config.locked
                ? "היומן נעול — עובדים יכולים להירשם רק לימים שברשימה למטה. אדמין אינו מוגבל."
                : "היומן פתוח — עובדים יכולים להירשם לכל יום (בכפוף לחוקי הזמן הרגילים)."}
            </div>

            <div className="row" style={{ gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                className={`btn ${config.locked ? "btnDanger" : "btnPrimary"}`}
                onClick={toggleLocked}
                disabled={saving}
              >
                {config.locked ? "🔒 היומן נעול — לחץ לפתיחה" : "🔓 היומן פתוח — לחץ לנעילה"}
              </button>
            </div>

            <div className="hr" />

            <div className="label">ימים פתוחים לרישום</div>

            <div className="siteList">
              {config.allowedDates.length === 0 ? (
                <div className="p">
                  {config.locked
                    ? "אין ימים פתוחים — עובדים לא יכולים להירשם כלל."
                    : "אין ימים ברשימה. הרשימה רלוונטית רק כשהיומן נעול."}
                </div>
              ) : (
                config.allowedDates.map((ymd) => (
                  <div key={ymd} className="siteRow">
                    <div className="siteRowLabel">
                      <span>{dayName(ymd)} · {formatDate(ymd)}</span>
                    </div>
                    <div className="siteRowControls">
                      <button
                        type="button"
                        className="btn btnDanger"
                        onClick={() => removeDate(ymd)}
                        disabled={saving}
                      >
                        הסר
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hr" />

            <form className="siteAddForm" onSubmit={addDate}>
              <div className="label">פתח יום לרישום</div>
              <div className="siteAddRow">
                <input
                  className="siteRowInput"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                <button type="submit" className="btn btnPrimary" disabled={saving}>
                  {saving ? "שומר..." : "הוסף"}
                </button>
              </div>
              {error && <div className="error">{error}</div>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
