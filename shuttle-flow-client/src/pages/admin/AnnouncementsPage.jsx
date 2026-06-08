import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import {
  listAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../services/announcements.service.js";

const EMPTY_FORM = { title: "", body: "" };

function AnnouncementRow({ item, onEdit, onToggle, onDelete }) {
  return (
    <div className={`announcementRow ${item.isActive ? "announcementActive" : "announcementInactive"}`}>
      <div className="announcementMeta">
        <span className={`badge ${item.isActive ? "" : "badgeMuted"}`}>
          {item.isActive ? "פעיל" : "מושבת"}
        </span>
        {item.title && <strong className="announcementTitle">{item.title}</strong>}
      </div>
      <div className="announcementBody">{item.body}</div>
      <div className="announcementActions">
        <button className="btn" type="button" onClick={() => onEdit(item)}>
          עריכה
        </button>
        <button
          className={`btn ${item.isActive ? "btnGhost" : "btnPrimary"}`}
          type="button"
          onClick={() => onToggle(item)}
        >
          {item.isActive ? "השבת" : "הפעל"}
        </button>
        <button className="btn btnDanger" type="button" onClick={() => onDelete(item)}>
          מחק
        </button>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const { toast } = useOutletContext();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const all = await listAllAnnouncements();
      setItems(all);
    } catch (e) {
      toast?.push({ title: "שגיאה", message: e.message, type: "danger" });
    } finally {
      setLoading(false);
    }
  }

  function setField(k, v) {
    setForm((x) => ({ ...x, [k]: v }));
    setFormErrors((e) => ({ ...e, [k]: undefined }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item._id);
    setForm({ title: item.title || "", body: item.body || "" });
    setFormErrors({});
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  }

  function validateForm() {
    const e = {};
    if (!form.body.trim()) e.body = "תוכן ההודעה הוא שדה חובה";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitForm(ev) {
    ev.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateAnnouncement(editingId, { title: form.title, body: form.body });
        setItems((prev) => prev.map((x) => (x._id === editingId ? updated : x)));
        toast?.push({ title: "עודכן", message: "ההודעה עודכנה" });
      } else {
        const created = await createAnnouncement({ title: form.title, body: form.body, isActive: true });
        setItems((prev) => [created, ...prev]);
        toast?.push({ title: "נוצרה", message: "ההודעה נוצרה ופעילה" });
      }
      cancelForm();
    } catch (e) {
      toast?.push({ title: "שגיאה", message: e.message, type: "danger" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item) {
    try {
      const updated = await updateAnnouncement(item._id, { isActive: !item.isActive });
      setItems((prev) => prev.map((x) => (x._id === item._id ? updated : x)));
      toast?.push({ title: updated.isActive ? "הופעל" : "הושבת", message: item.title || item.body.slice(0, 30) });
    } catch (e) {
      toast?.push({ title: "שגיאה", message: e.message, type: "danger" });
    }
  }

  async function handleDelete(item) {
    try {
      await deleteAnnouncement(item._id);
      setItems((prev) => prev.filter((x) => x._id !== item._id));
      toast?.push({ title: "נמחקה", message: "ההודעה נמחקה" });
    } catch (e) {
      toast?.push({ title: "שגיאה", message: e.message, type: "danger" });
    } finally {
      setConfirmDelete(null);
    }
  }

  const activeCount = items.filter((x) => x.isActive).length;

  return (
    <>
      {confirmDelete && (
        <div className="modalOverlay">
          <div className="modalCard">
            <div className="modalTitle">מחיקת הודעה</div>
            <div className="modalMsg">
              למחוק את ההודעה "{confirmDelete.title || confirmDelete.body.slice(0, 40)}"?
            </div>
            <div className="modalActions">
              <button className="btn" type="button" onClick={() => setConfirmDelete(null)}>ביטול</button>
              <button className="btn btnDanger" type="button" onClick={() => handleDelete(confirmDelete)}>מחק</button>
            </div>
          </div>
        </div>
      )}

      <Card
        title="הודעות לעובדים"
        subtitle={`${activeCount} הודעות פעילות — יוצגו לעובדים בכניסה למערכת`}
        right={
          <button className="btn btnPrimary" type="button" onClick={showForm ? cancelForm : openCreate}>
            {showForm ? "סגור" : "הודעה חדשה"}
          </button>
        }
      >
        {showForm && (
          <>
            <form className="form" onSubmit={submitForm}>
              <Input
                label="כותרת (אופציונלי)"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="כותרת קצרה לתיאור ההודעה"
              />
              <div className="field">
                <div className="label">תוכן ההודעה *</div>
                <textarea
                  className="textarea"
                  rows={4}
                  value={form.body}
                  onChange={(e) => setField("body", e.target.value)}
                  placeholder="כתוב את תוכן ההודעה כאן..."
                />
                {formErrors.body && <div className="error">{formErrors.body}</div>}
              </div>
              <div className="row">
                <button className="btn" type="button" onClick={cancelForm}>ביטול</button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? "שומר..." : editingId ? "שמור שינויים" : "צור הודעה"}
                </Button>
              </div>
            </form>
            <div className="hr" />
          </>
        )}

        {loading ? (
          <div className="p">טוען...</div>
        ) : items.length === 0 ? (
          <div className="p">אין הודעות עדיין. לחץ "הודעה חדשה" כדי להוסיף.</div>
        ) : (
          <div className="announcementList">
            {items.map((item) => (
              <AnnouncementRow
                key={item._id}
                item={item}
                onEdit={openEdit}
                onToggle={handleToggle}
                onDelete={(item) => setConfirmDelete(item)}
              />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
