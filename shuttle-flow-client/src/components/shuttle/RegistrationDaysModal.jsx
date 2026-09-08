import { useEffect, useState } from "react";
import {
  getRegistrationDays,
  updateRegistrationDays,
} from "../../services/registrationDays.service.js";
import { listSiteConfigs } from "../../services/siteConfig.service.js";
import { parseYmdToDate, formatDate } from "../../utils/datetime.js";

const SHIFT_LABELS = { morning: "בוקר", evening: "ערב", night: "לילה" };
const DIRECTION_LABELS = { pickup: "איסוף", dropoff: "פיזור", both: "איסוף + פיזור" };

function makeShift() {
  return { open: true, directions: { pickup: true, dropoff: true, both: true } };
}

function dayName(ymd) {
  try {
    return parseYmdToDate(ymd).toLocaleDateString("he-IL", { weekday: "long" });
  } catch {
    return "";
  }
}

function ToggleBtn({ active, label, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`btn shiftToggleBtn ${active ? "shiftToggleActive" : "shiftToggleOff"}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default function RegistrationDaysModal({ onClose, onChanged }) {
  const [config, setConfig] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getRegistrationDays(), listSiteConfigs()])
      .then(([cfg, siteList]) => {
        setConfig(cfg);
        setSites(siteList || []);
      })
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
    if (config.allowedDays.some((d) => d.date === newDate)) {
      setError("התאריך כבר ברשימה");
      return;
    }
    const day = {
      date: newDate,
      shifts: { morning: makeShift(), evening: makeShift(), night: makeShift() },
      closedSites: [],
    };
    save({ allowedDays: [...config.allowedDays, day] });
    setNewDate("");
  }

  function removeDate(ymd) {
    save({ allowedDays: config.allowedDays.filter((d) => d.date !== ymd) });
  }

  function updateDay(ymd, updater) {
    const next = config.allowedDays.map((d) => (d.date === ymd ? updater(d) : d));
    save({ allowedDays: next });
  }

  function toggleShift(day, shift) {
    updateDay(day.date, (d) => {
      const sh = d.shifts?.[shift] || makeShift();
      return { ...d, shifts: { ...d.shifts, [shift]: { ...sh, open: sh.open === false } } };
    });
  }

  function toggleShiftDirection(day, shift, direction) {
    updateDay(day.date, (d) => {
      const sh = d.shifts?.[shift] || makeShift();
      const directions = { ...sh.directions, [direction]: sh.directions?.[direction] === false };
      return { ...d, shifts: { ...d.shifts, [shift]: { ...sh, directions } } };
    });
  }

  function toggleSite(day, siteKey) {
    const closed = new Set(day.closedSites || []);
    if (closed.has(siteKey)) closed.delete(siteKey);
    else closed.add(siteKey);
    updateDay(day.date, (d) => ({ ...d, closedSites: [...closed] }));
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
                ? "היומן נעול — עובדים יכולים להירשם רק לימים שברשימה למטה. לכל יום אפשר לפתוח/לסגור משמרות, ובכל משמרת פתוחה לפתוח/לסגור סוגי נסיעה, וכן מיקומים. אדמין אינו מוגבל."
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
              {config.allowedDays.length === 0 ? (
                <div className="p">
                  {config.locked
                    ? "אין ימים פתוחים — עובדים לא יכולים להירשם כלל."
                    : "אין ימים ברשימה. הרשימה רלוונטית רק כשהיומן נעול."}
                </div>
              ) : (
                config.allowedDays.map((day) => (
                  <div key={day.date} className="dayRow">
                    <div className="dayRowHead">
                      <span className="dayRowDate">
                        {dayName(day.date)} · {formatDate(day.date)}
                      </span>
                      <button
                        type="button"
                        className="btn btnDanger"
                        onClick={() => removeDate(day.date)}
                        disabled={saving}
                      >
                        הסר
                      </button>
                    </div>

                    <div className="dayShiftsWrap">
                      {Object.keys(SHIFT_LABELS).map((shift) => {
                        const sh = day.shifts?.[shift] || {};
                        const open = sh.open !== false;
                        return (
                          <div key={shift} className={`dayShiftBlock ${open ? "" : "dayShiftClosed"}`}>
                            <div className="dayShiftHead">
                              <ToggleBtn
                                active={open}
                                label={SHIFT_LABELS[shift]}
                                onClick={() => toggleShift(day, shift)}
                                disabled={saving}
                              />
                              <span className="dayShiftState">{open ? "פתוחה" : "סגורה"}</span>
                            </div>

                            {open && (
                              <div className="dayShiftDirections">
                                <span className="dayRowLabel">סוג נסיעה:</span>
                                {Object.keys(DIRECTION_LABELS).map((direction) => (
                                  <ToggleBtn
                                    key={direction}
                                    active={sh.directions?.[direction] !== false}
                                    label={DIRECTION_LABELS[direction]}
                                    onClick={() => toggleShiftDirection(day, shift, direction)}
                                    disabled={saving}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="dayRowSection">
                      <span className="dayRowLabel">מיקומים:</span>
                      {sites.length === 0 ? (
                        <span className="p" style={{ margin: 0 }}>אין מיקומים מוגדרים</span>
                      ) : (
                        sites.map((s) => (
                          <ToggleBtn
                            key={s.key}
                            active={!(day.closedSites || []).includes(s.key)}
                            label={s.label}
                            onClick={() => toggleSite(day, s.key)}
                            disabled={saving}
                          />
                        ))
                      )}
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
