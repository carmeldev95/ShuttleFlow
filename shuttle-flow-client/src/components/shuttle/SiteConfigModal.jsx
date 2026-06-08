import { useEffect, useState } from "react";
import {
  listSiteConfigs,
  createSiteConfig,
  updateSiteConfig,
  deleteSiteConfig,
} from "../../services/siteConfig.service.js";

const SHIFT_LABELS = { morning: "בוקר", evening: "ערב", night: "לילה" };

function ShiftBtn({ active, label, onClick, disabled }) {
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

function SiteRow({ site, onSaved, onDeleted }) {
  const [label, setLabel] = useState(site.label);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const labelChanged = label.trim() !== site.label;

  async function saveLabel() {
    if (!label.trim() || !labelChanged) return;
    setSaving(true);
    try {
      const updated = await updateSiteConfig(site._id, { label: label.trim() });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility() {
    const updated = await updateSiteConfig(site._id, { isVisible: !site.isVisible });
    onSaved(updated);
  }

  async function toggleShift(shift) {
    const updated = await updateSiteConfig(site._id, {
      shifts: { ...site.shifts, [shift]: !site.shifts[shift] },
    });
    onSaved(updated);
  }

  async function doDelete() {
    await deleteSiteConfig(site._id);
    onDeleted(site._id);
  }

  return (
    <div className="siteRow">
      {confirmDel ? (
        <div className="siteRowConfirm">
          <span>למחוק את "{site.label}"?</span>
          <button type="button" className="btn btnDanger" onClick={doDelete}>מחק</button>
          <button type="button" className="btn" onClick={() => setConfirmDel(false)}>ביטול</button>
        </div>
      ) : (
        <>
          <div className="siteRowLabel">
            <input
              className="siteRowInput"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => e.key === "Enter" && saveLabel()}
            />
            {labelChanged && (
              <button type="button" className="btn btnPrimary siteRowSaveBtn" onClick={saveLabel} disabled={saving}>
                {saving ? "..." : "שמור"}
              </button>
            )}
          </div>

          <div className="siteRowControls">
            <button
              type="button"
              className={`btn ${site.isVisible ? "btnPrimary" : "btnGhost"}`}
              onClick={toggleVisibility}
              title="גלוי לעובדים"
            >
              {site.isVisible ? "גלוי" : "מוסתר"}
            </button>

            {Object.keys(SHIFT_LABELS).map((shift) => (
              <ShiftBtn
                key={shift}
                active={site.shifts?.[shift] !== false}
                label={SHIFT_LABELS[shift]}
                onClick={() => toggleShift(shift)}
              />
            ))}

            <button type="button" className="btn btnDanger" onClick={() => setConfirmDel(true)}>
              מחק
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SiteConfigModal({ onClose, onChanged }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    listSiteConfigs()
      .then(setSites)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(updated) {
    setSites((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    onChanged?.();
  }

  function handleDeleted(id) {
    setSites((prev) => prev.filter((s) => s._id !== id));
    onChanged?.();
  }

  async function addSite(e) {
    e.preventDefault();
    setAddError("");
    if (!newLabel.trim()) { setAddError("חובה להזין שם מיקום"); return; }
    setAdding(true);
    try {
      const created = await createSiteConfig({ label: newLabel.trim() });
      setSites((prev) => [...prev, created]);
      setNewLabel("");
      onChanged?.();
    } catch (err) {
      setAddError(err.message || "שגיאה ביצירת מיקום");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="siteConfigModal" onClick={(e) => e.stopPropagation()}>
        <div className="siteConfigHeader">
          <div className="modalTitle">ניהול מיקומים ומשמרות</div>
          <button type="button" className="btn btnGhost" onClick={onClose}>✕</button>
        </div>

        <div className="siteConfigLegend">
          <span>שם</span>
          <span>נראות</span>
          <span>משמרות</span>
          <span></span>
        </div>

        <div className="siteList">
          {loading ? (
            <div className="p">טוען...</div>
          ) : sites.length === 0 ? (
            <div className="p">אין מיקומים. הוסף מיקום למטה.</div>
          ) : (
            sites.map((s) => (
              <SiteRow key={s._id} site={s} onSaved={handleSaved} onDeleted={handleDeleted} />
            ))
          )}
        </div>

        <div className="hr" />

        <form className="siteAddForm" onSubmit={addSite}>
          <div className="label">הוסף מיקום חדש</div>
          <div className="siteAddRow">
            <input
              className="siteRowInput"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="שם המיקום (למשל: נהריה)"
            />
            <button type="submit" className="btn btnPrimary" disabled={adding}>
              {adding ? "מוסיף..." : "הוסף"}
            </button>
          </div>
          {addError && <div className="error">{addError}</div>}
        </form>
      </div>
    </div>
  );
}
