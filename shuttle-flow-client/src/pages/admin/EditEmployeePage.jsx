import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Select } from "../../components/ui/Select.jsx";
import UserComboBox from "../../components/ui/UserComboBox.jsx";
import { listUsers, updateUser } from "../../services/users.service.js";
import { departments } from "../../data/departments.js";
import { required, validatePhone, validatePassword } from "../../utils/validators.js";

const EMPTY_FORM = {
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

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(() => setGlobalError("שגיאה בטעינת רשימת עובדים"));
  }, []);

  function setField(k, v) {
    setForm((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function onUserSelect(userId, userObj) {
    setSelectedUserId(userId);
    setErrors({});
    setGlobalError("");
    if (!userObj) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      firstName: userObj.firstName || "",
      lastName: userObj.lastName || "",
      phone: userObj.phone || "",
      department: userObj.department || deps[0] || "",
      address: userObj.address || "",
      password: "",
      role: userObj.role || "employee",
    });
  }

  function validate() {
    const e = {};
    e.firstName = required(form.firstName, "חובה למלא שם פרטי");
    e.lastName = required(form.lastName, "חובה למלא שם משפחה");
    e.address = required(form.address, "חובה למלא כתובת");
    e.department = required(form.department, "חובה לבחור מחלקה");
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) e.phone = phoneErr;
    if (form.password) {
      e.password = validatePassword(form.password);
    }
    Object.keys(e).forEach((k) => e[k] == null && delete e[k]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    setGlobalError("");
    if (!validate()) return;

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
      address: form.address.trim(),
      role: form.role,
    };
    if (form.password) payload.password = form.password;

    try {
      setLoading(true);
      await updateUser(selectedUserId, payload);
      toast?.push({ title: "נשמר בהצלחה", type: "success" });
      setForm((f) => ({ ...f, password: "" }));
      // עדכון הרשימה המקומית
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUserId
            ? { ...u, ...payload }
            : u
        )
      );
    } catch (err) {
      setGlobalError(err.message || "שגיאה בשמירה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card title="עריכת פרטי עובד">
        <div style={{ marginBottom: 16 }}>
          <UserComboBox
            label="בחר עובד לעריכה"
            users={users}
            value={selectedUserId}
            onChange={onUserSelect}
          />
        </div>

        {selectedUserId && (
          <form className="form" onSubmit={submit}>
            {globalError && (
              <div className="notice noticeDanger" style={{ marginBottom: 12 }}>
                {globalError}
              </div>
            )}

            <div className="grid2">
              <Input
                label="שם פרטי"
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                error={errors.firstName}
              />
              <Input
                label="שם משפחה"
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                error={errors.lastName}
              />
            </div>

            <div className="grid2">
              <Input
                label="טלפון"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                error={errors.phone}
                placeholder="05XXXXXXXX"
              />
              <Select
                label="מחלקה"
                value={form.department}
                onChange={(e) => setField("department", e.target.value)}
                error={errors.department}
              >
                {deps.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="כתובת מגורים (עיר, רחוב, מספר בית)"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              error={errors.address}
            />

            <div className="grid2">
              <Input
                label="סיסמה חדשה"
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                error={errors.password}
                placeholder="השאר ריק לאי-שינוי"
                autoComplete="new-password"
              />
              <Select
                label="תפקיד"
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
              >
                <option value="employee">עובד</option>
                <option value="admin">מנהל</option>
              </Select>
            </div>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "שומר..." : "שמור שינויים"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
