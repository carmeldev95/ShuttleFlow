import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import Card from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RegistrationFilters from "../../components/shuttle/RegistrationFilters.jsx";
import RegistrationTable from "../../components/shuttle/RegistrationTable.jsx";
import RegistrationForm from "../../components/shuttle/RegistrationForm.jsx";
import UserComboBox from "../../components/ui/UserComboBox.jsx";

import { listUsers } from "../../services/users.service.js";
import { getSession } from "../../services/auth.service.js";
import {
  adminCreateRegistration,
  deleteRegistration,
  listRegistrations,
  updateRegistration,
} from "../../services/registrations.service.js";

function ConfirmModal({
  open,
  title,
  message,
  confirmText = "אישור",
  cancelText = "ביטול",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <div className="modalTitle">{title}</div>
        <div className="modalMsg">{message}</div>

        <div className="modalActions">
          <button className="btn" type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn ${danger ? "btnDanger" : "btnPrimary"}`}
            type="button"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function rowMatchesQuery(r, q) {
  const s = String(q || "").trim().toLowerCase();
  if (!s) return true;

  const parts = [
    r.date,
    r.shiftLabel,
    r.directionLabel,
    r.siteLabel,
    r.userSnapshot?.firstName,
    r.userSnapshot?.lastName,
    r.userSnapshot?.phone,
    r.userSnapshot?.address,
    r.userSnapshot?.department,
  ]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());

  return parts.some((p) => p.includes(s));
}

export default function AdminRegistrationsPage() {
  const { toast } = useOutletContext();
  const session = getSession();
  const isAdmin = session?.user?.role === "admin";

  const [filters, setFilters] = useState({ date: "", shift: "", q: "" });

  const [editing, setEditing] = useState(null);
  const [createMode, setCreateMode] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState("");

  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);

  const [refresh, setRefresh] = useState(0);

  const [confirm, setConfirm] = useState({
    open: false,
    action: null,
    title: "",
    message: "",
    danger: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoadingUsers(true);
      try {
        const all = await listUsers();
        const onlyEmployees = (all || []).filter((u) => u.role !== "admin");
        if (!cancelled) setUsers(onlyEmployees);
      } catch (e) {
        toast?.push?.({ title: "שגיאה", message: e.message, type: "danger" });
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }

    if (isAdmin) loadUsers();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      setLoadingRows(true);
      try {
        // ✅ שרת: רק date/shift
        const all = await listRegistrations({ date: filters.date, shift: filters.shift });
        const sorted = (all || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
        if (!cancelled) setRows(sorted);
      } catch (e) {
        toast?.push?.({ title: "שגיאה", message: e.message, type: "danger" });
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoadingRows(false);
      }
    }

    loadRows();
    return () => {
      cancelled = true;
    };
  }, [filters.date, filters.shift, refresh]); // ✅ q לא טוען מחדש מהשרת

  // ✅ חיפוש חופשי = סינון לוקאלי
  const filteredRows = useMemo(() => {
    const q = filters.q || "";
    return (rows || []).filter((r) => rowMatchesQuery(r, q));
  }, [rows, filters.q]);

  function openConfirm(opts) {
    setConfirm({
      open: true,
      title: opts.title,
      message: opts.message,
      danger: !!opts.danger,
      action: opts.action,
    });
  }

  function closeConfirm() {
    setConfirm({ open: false, action: null, title: "", message: "", danger: false });
  }

  function onEdit(row) {
    setEditing(row);
    setCreateMode(false);
  }

  function requestDelete(row) {
    openConfirm({
      title: "ביטול רישום",
      message: `לבטל את הרישום של ${row.userSnapshot?.firstName || ""} ${row.userSnapshot?.lastName || ""}?`,
      danger: true,
      action: async () => {
        try {
          await deleteRegistration(row._id || row.id);
          toast.push({ title: "בוטל", message: "הרישום הוסר" });
          setRefresh((x) => x + 1);
        } catch (e) {
          toast.push({ title: "שגיאה", message: e.message, type: "danger" });
        } finally {
          closeConfirm();
        }
      },
    });
  }

  function requestSave(patch) {
    openConfirm({
      title: "שמירת שינויים",
      message: "האם לשמור את השינויים?",
      action: async () => {
        try {
          await updateRegistration(editing._id || editing.id, patch);
          toast.push({ title: "עודכן", message: "הרישום עודכן" });
          setEditing(null);
          setRefresh((x) => x + 1);
        } catch (e) {
          toast.push({ title: "שגיאה", message: e.message, type: "danger" });
        } finally {
          closeConfirm();
        }
      },
    });
  }

  async function onCreate(form) {
    if (!selectedUserId) {
      toast.push({ title: "בחר עובד", message: "יש לבחור עובד", type: "danger" });
      return;
    }

    const user = userById.get(selectedUserId);
    if (!user) {
      toast.push({ title: "עובד לא נמצא", message: "נסה לבחור שוב", type: "danger" });
      return;
    }

    try {
      await adminCreateRegistration({ userId: selectedUserId, ...form });
      toast.push({ title: "נוצר", message: "הרישום נשמר" });
      setCreateMode(false);
      setSelectedUserId("");
      setRefresh((x) => x + 1);
    } catch (e) {
      toast.push({ title: "שגיאה", message: e.message, type: "danger" });
    }
  }

  return (
    <>
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        danger={confirm.danger}
        onCancel={closeConfirm}
        onConfirm={() => confirm.action?.()}
      />

      <Card
        title="ניהול רישומים"
        subtitle="צפייה, עריכה וביטול רישומי עובדים (לאדמין אין נעילה)"
        right={
          <button
            className="btn btnPrimary"
            type="button"
            onClick={() => {
              setCreateMode((x) => !x);
              setEditing(null);
            }}
          >
            {createMode ? "סגור" : "הוסף רישום"}
          </button>
        }
      >
        {createMode && (
          <>
            <div className="notice">הוספת רישום: בחר עובד ולאחר מכן מלא את פרטי ההסעה</div>

            <UserComboBox
              label="עובד"
              users={users}
              value={selectedUserId}
              onChange={(id) => setSelectedUserId(id)}
              placeholder={loadingUsers ? "טוען עובדים..." : "חפש עובד לפי שם או טלפון"}
              disabled={loadingUsers}
            />

            <div className="hr" />
            <RegistrationForm onSubmit={onCreate} submitLabel="צור רישום" />
            <div className="hr" />
          </>
        )}

        {editing && (
          <>
            <div className="notice">
              עריכת רישום עבור {editing.userSnapshot?.firstName || ""} {editing.userSnapshot?.lastName || ""}
            </div>

            <RegistrationForm
              mode="edit"
              initial={editing}
              onSubmit={requestSave}
              onCancel={() => setEditing(null)}
              submitLabel="שמור"
              disabledReason=""
            />

            <div className="hr" />
          </>
        )}

        <RegistrationFilters value={filters} onChange={setFilters} debounceMs={3000} />
        <div className="hr" />

        {loadingRows ? (
          <div className="p">טוען רישומים...</div>
        ) : filteredRows.length === 0 ? (
          <EmptyState title="אין תוצאות" subtitle="נסה לשנות פילטרים." />
        ) : (
          <RegistrationTable rows={filteredRows} mode="admin" onEdit={onEdit} onDelete={requestDelete} />
        )}
      </Card>
    </>
  );
}