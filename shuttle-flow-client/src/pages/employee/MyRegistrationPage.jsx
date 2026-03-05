import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import Card from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RegistrationForm from "../../components/shuttle/RegistrationForm.jsx";
import RegistrationTable from "../../components/shuttle/RegistrationTable.jsx";

import { deleteRegistration, listRegistrations, updateRegistration } from "../../services/registrations.service.js";
import { canEditRegistration } from "../../utils/rules.js";

export default function MyRegistrationsPage() {
  const { toast } = useOutletContext();

  const [editing, setEditing] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const all = await listRegistrations(); // employee => only mine
        const sorted = (all || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
        if (!cancelled) setRows(sorted);
      } catch (e) {
        toast?.push?.({ title: "שגיאה", message: e.message, type: "danger" });
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  function onEdit(row) {
    setEditing(row);
  }

  async function onDelete(row) {
    try {
      await deleteRegistration(row._id || row.id);
      toast.push({ title: "בוטל בהצלחה", message: "ההרשמה הוסרה" });
      setRefresh((x) => x + 1);
    } catch (e) {
      toast.push({ title: "לא ניתן לבטל", message: e.message, type: "danger" });
    }
  }

  async function onSave(patch) {
    try {
      await updateRegistration(editing._id || editing.id, patch);
      toast.push({ title: "עודכן בהצלחה", message: "ההרשמה עודכנה" });
      setEditing(null);
      setRefresh((x) => x + 1);
    } catch (e) {
      toast.push({ title: "לא ניתן לעדכן", message: e.message, type: "danger" });
    }
  }

  return (
    <>
      <Card title="ההרשמות שלי" subtitle="עריכה/ביטול בהתאם לחוקי הזמן">
        {loading ? (
          <div className="p">טוען...</div>
        ) : rows.length === 0 ? (
          <EmptyState title="אין הרשמות" subtitle="התחל במסך 'הרשמה להסעה'." />
        ) : (
          <RegistrationTable rows={rows} onEdit={onEdit} onDelete={onDelete} />
        )}
      </Card>

      {editing && <div style={{ height: 12 }} />}

      {editing && (
        <Card
          title="עריכת הרשמה"
          subtitle={`${editing.date} · ${editing.userSnapshot?.firstName || ""} ${editing.userSnapshot?.lastName || ""}`}
        >
          <RegistrationForm
            mode="edit"
            initial={editing}
            onSubmit={onSave}
            onCancel={() => setEditing(null)}
            submitLabel="שמור"
            disabledReason={(() => {
              const lock = canEditRegistration(editing, new Date());
              return lock.ok ? "" : lock.reason;
            })()}
          />
        </Card>
      )}
    </>
  );
}