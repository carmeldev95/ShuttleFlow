import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import Card from "../../components/ui/Card.jsx";
import RegistrationForm from "../../components/shuttle/RegistrationForm.jsx";
import UserComboBox from "../../components/ui/UserComboBox.jsx";

import { listUsers } from "../../services/users.service.js";
import { getSession } from "../../services/auth.service.js";
import { createMyRegistration, adminCreateRegistration } from "../../services/registrations.service.js";

export default function NewRegistrationPage() {
  const { toast } = useOutletContext();
  const session = getSession();
  const isAdmin = session?.user?.role === "admin";

  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAdmin) return;
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

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  async function onSubmit(form) {
    try {
      // עובד רגיל יוצר לעצמו
      if (!isAdmin) {
        await createMyRegistration(form);
        toast.push({ title: "נרשמת בהצלחה", message: "הרישום נשמר" });
        return;
      }

      // אדמין חייב לבחור עובד
      if (!selectedUserId) {
        toast.push({
          title: "בחר עובד",
          message: "חובה לבחור עובד לפני רישום",
          type: "danger",
        });
        return;
      }

      const chosen = userById.get(selectedUserId);
      if (!chosen) {
        toast.push({ title: "עובד לא נמצא", message: "נסה לבחור שוב", type: "danger" });
        return;
      }

      await adminCreateRegistration({ userId: selectedUserId, ...form });
      toast.push({ title: "נוצר רישום", message: "הרישום נשמר" });
      setSelectedUserId("");
    } catch (e) {
      toast.push({ title: "לא ניתן לשמור", message: e.message, type: "danger" });
    }
  }

  return (
    <Card title="הרשמה להסעה" subtitle="בחר תאריך/משמרת וסוג (איסוף/פיזור) ומיקום">
      {isAdmin && (
        <>
          <UserComboBox
            label="עובד"
            users={users}
            value={selectedUserId}
            onChange={(id) => setSelectedUserId(id)}
            placeholder={loadingUsers ? "טוען עובדים..." : "חפש עובד לפי שם או טלפון..."}
            disabled={loadingUsers}
          />
          <div className="hr" />
        </>
      )}

      <RegistrationForm onSubmit={onSubmit} submitLabel="שמור רישום" />
    </Card>
  );
}