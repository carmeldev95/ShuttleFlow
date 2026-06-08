import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Select } from "../../components/ui/Select.jsx";
import UserComboBox from "../../components/ui/UserComboBox.jsx";
import DepartmentComboBox from "../../components/ui/DepartmentComboBox.jsx";
import { listUsers, createUser, updateUser } from "../../services/users.service.js";
import { departments } from "../../data/departments.js";
import { required, validatePhone, validatePassword } from "../../utils/validators.js";

const EMPTY_EDIT_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  department: "",
  address: "",
  password: "",
  role: "employee",
};

const EMPTY_CREATE_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  department: "",
  address: "",
  password: "",
  role: "employee",
};

export default function EditEmployeePage() {
  const { toast } = useOutletContext();
  const deps = useMemo(() => departments, []);

  const [mode, setMode] = useState("edit"); // "edit" | "create"

  // --- edit state ---
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [editGlobalError, setEditGlobalError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // --- create state ---
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE_FORM, department: deps[0] || "" });

  const [createErrors, setCreateErrors] = useState({});
  const [createGlobalError, setCreateGlobalError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(() => setEditGlobalError("שגיאה בטעינת רשימת עובדים"));
  }, []);

  // ── edit helpers ──
  function setEditField(k, v) {
    setEditForm((x) => ({ ...x, [k]: v }));
    setEditErrors((e) => ({ ...e, [k]: undefined }));
  }

  function onUserSelect(userId, userObj) {
    setSelectedUserId(userId);
    setEditErrors({});
    setEditGlobalError("");
    if (!userObj) {
      setEditForm(EMPTY_EDIT_FORM);
      return;
    }
    setEditForm({
      firstName: userObj.firstName || "",
      lastName: userObj.lastName || "",
      phone: userObj.phone || "",
      department: userObj.department || deps[0] || "",
      address: userObj.address || "",
      password: "",
      role: userObj.role || "employee",
    });
  }

  function validateEdit() {
    const e = {};
    e.firstName = required(editForm.firstName, "חובה למלא שם פרטי");
    e.lastName = required(editForm.lastName, "חובה למלא שם משפחה");
    e.address = required(editForm.address, "חובה למלא כתובת");
    e.department = required(editForm.department, "חובה לבחור מחלקה");
    const phoneErr = validatePhone(editForm.phone);
    if (phoneErr) e.phone = phoneErr;
    if (editForm.password) e.password = validatePassword(editForm.password);
    Object.keys(e).forEach((k) => e[k] == null && delete e[k]);
    setEditErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    setEditGlobalError("");
    if (!validateEdit()) return;

    const payload = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      phone: editForm.phone.trim(),
      department: editForm.department.trim(),
      address: editForm.address.trim(),
      role: editForm.role,
    };
    if (editForm.password) payload.password = editForm.password;

    try {
      setEditLoading(true);
      const updated = await updateUser(selectedUserId, payload);
      toast?.push({ title: "נשמר בהצלחה", type: "success" });
      setEditForm((f) => ({ ...f, password: "" }));
      setUsers((prev) => prev.map((u) => (u.id === selectedUserId ? { ...u, ...updated } : u)));
    } catch (err) {
      setEditGlobalError(err.message || "שגיאה בשמירה");
    } finally {
      setEditLoading(false);
    }
  }

  // ── create helpers ──
  function setCreateField(k, v) {
    setCreateForm((x) => ({ ...x, [k]: v }));
    setCreateErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validateCreate() {
    const e = {};
    e.firstName = required(createForm.firstName, "חובה למלא שם פרטי");
    e.lastName = required(createForm.lastName, "חובה למלא שם משפחה");
    e.address = required(createForm.address, "חובה למלא כתובת");
    e.department = required(createForm.department, "חובה לבחור מחלקה");
    e.password = validatePassword(createForm.password);
    const phoneErr = validatePhone(createForm.phone);
    if (phoneErr) e.phone = phoneErr;
    Object.keys(e).forEach((k) => e[k] == null && delete e[k]);
    setCreateErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submitCreate(e) {
    e.preventDefault();
    setCreateGlobalError("");
    if (!validateCreate()) return;

    const payload = {
      firstName: createForm.firstName.trim(),
      lastName: createForm.lastName.trim(),
      phone: createForm.phone.trim(),
      department: createForm.department.trim(),
      address: createForm.address.trim(),
      password: createForm.password,
      role: createForm.role,
    };

    try {
      setCreateLoading(true);
      const newUser = await createUser(payload);
      toast?.push({ title: "העובד נוצר בהצלחה", message: `${newUser.firstName} ${newUser.lastName}` });
      setCreateForm({ ...EMPTY_CREATE_FORM, department: deps[0] || "" });
      setUsers((prev) => [newUser, ...prev]);
    } catch (err) {
      setCreateGlobalError(err.message || "שגיאה ביצירת עובד");
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <Card
      title="ניהול עובדים"
      right={
        <div className="row" style={{ gap: 8 }}>
          <button
            type="button"
            className={`btn ${mode === "edit" ? "btnPrimary" : "btnGhost"}`}
            onClick={() => setMode("edit")}
          >
            עריכת עובד
          </button>
          <button
            type="button"
            className={`btn ${mode === "create" ? "btnPrimary" : "btnGhost"}`}
            onClick={() => setMode("create")}
          >
            הוספת עובד
          </button>
        </div>
      }
    >
      {mode === "edit" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <UserComboBox
              label="בחר עובד לעריכה"
              users={users.filter((u) => u.role !== "admin")}
              value={selectedUserId}
              onChange={onUserSelect}
            />
          </div>

          {selectedUserId && (
            <form className="form" onSubmit={submitEdit}>
              {editGlobalError && (
                <div className="notice noticeDanger">{editGlobalError}</div>
              )}

              <div className="grid2">
                <Input
                  label="שם פרטי"
                  value={editForm.firstName}
                  onChange={(e) => setEditField("firstName", e.target.value)}
                  error={editErrors.firstName}
                />
                <Input
                  label="שם משפחה"
                  value={editForm.lastName}
                  onChange={(e) => setEditField("lastName", e.target.value)}
                  error={editErrors.lastName}
                />
              </div>

              <div className="grid2">
                <Input
                  label="טלפון"
                  value={editForm.phone}
                  onChange={(e) => setEditField("phone", e.target.value)}
                  error={editErrors.phone}
                  placeholder="05XXXXXXXX"
                />
                <DepartmentComboBox
                  options={deps}
                  value={editForm.department}
                  onChange={(v) => setEditField("department", v)}
                  error={editErrors.department}
                />
              </div>

              <Input
                label="כתובת מגורים (עיר, רחוב, מספר בית)"
                value={editForm.address}
                onChange={(e) => setEditField("address", e.target.value)}
                error={editErrors.address}
              />

              <div className="grid2">
                <Input
                  label="סיסמה חדשה"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditField("password", e.target.value)}
                  error={editErrors.password}
                  placeholder="השאר ריק לאי-שינוי"
                  autoComplete="new-password"
                />
                <Select
                  label="תפקיד"
                  value={editForm.role}
                  onChange={(e) => setEditField("role", e.target.value)}
                >
                  <option value="employee">עובד</option>
                  <option value="admin">מנהל</option>
                </Select>
              </div>

              <Button variant="primary" type="submit" disabled={editLoading}>
                {editLoading ? "שומר..." : "שמור שינויים"}
              </Button>
            </form>
          )}
        </>
      )}

      {mode === "create" && (
        <form className="form" onSubmit={submitCreate}>
          {createGlobalError && (
            <div className="notice noticeDanger">{createGlobalError}</div>
          )}

          <div className="grid2">
            <Input
              label="שם פרטי"
              value={createForm.firstName}
              onChange={(e) => setCreateField("firstName", e.target.value)}
              error={createErrors.firstName}
            />
            <Input
              label="שם משפחה"
              value={createForm.lastName}
              onChange={(e) => setCreateField("lastName", e.target.value)}
              error={createErrors.lastName}
            />
          </div>

          <Input
            label="כתובת מגורים (עיר, רחוב, מספר בית)"
            value={createForm.address}
            onChange={(e) => setCreateField("address", e.target.value)}
            error={createErrors.address}
          />

          <div className="grid2">
            <Input
              label="טלפון"
              value={createForm.phone}
              onChange={(e) => setCreateField("phone", e.target.value)}
              error={createErrors.phone}
              placeholder="05XXXXXXXX"
              autoComplete="tel"
            />
            <DepartmentComboBox
              options={deps}
              value={createForm.department}
              onChange={(v) => setCreateField("department", v)}
              error={createErrors.department}
            />
          </div>

          <div className="grid2">
            <Input
              label="סיסמה"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateField("password", e.target.value)}
              error={createErrors.password}
              autoComplete="new-password"
            />
            <Select
              label="תפקיד"
              value={createForm.role}
              onChange={(e) => setCreateField("role", e.target.value)}
            >
              <option value="employee">עובד</option>
              <option value="admin">מנהל</option>
            </Select>
          </div>

          <Button variant="primary" type="submit" disabled={createLoading}>
            {createLoading ? "יוצר..." : "צור עובד"}
          </Button>
        </form>
      )}
    </Card>
  );
}
