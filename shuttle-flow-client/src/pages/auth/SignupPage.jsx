import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Select } from "../../components/ui/Select.jsx";
import { departments } from "../../data/departments.js";
import { signup } from "../../services/auth.service.js";
import { required, validatePhone } from "../../utils/validators.js";
import Brand from "../../components/ui/Brand.jsx";

export default function SignupPage() {
  const nav = useNavigate();
  const deps = useMemo(() => departments, []);
  const defaultDepartment = deps?.[0] || "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    department: defaultDepartment,
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(k, v) {
    setForm((x) => ({ ...x, [k]: v }));
  }

  function validate() {
    const e = {};
    e.firstName = required(form.firstName, "חובה למלא שם פרטי");
    e.lastName = required(form.lastName, "חובה למלא שם משפחה");
    e.address = required(form.address, "חובה למלא כתובת");
    e.department = required(form.department, "חובה לבחור מחלקה");
    e.password = required(form.password, "חובה למלא סיסמה");

    const phoneErr = validatePhone(form.phone);
    if (phoneErr) e.phone = phoneErr;

    Object.keys(e).forEach((k) => e[k] == null && delete e[k]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    const payload = {
      firstName: String(form.firstName || "").trim(),
      lastName: String(form.lastName || "").trim(),
      address: String(form.address || "").trim(),
      phone: String(form.phone || "").trim(),
      department: String(form.department || "").trim(),
      password: String(form.password || ""),
    };

    try {
      setLoading(true);
      await signup(payload);               // ✅ חשוב
      nav("/", { replace: true });
    } catch (err) {
      setError(err.message || "שגיאה בהרשמה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authShell">
      <div className="authCard">
        <Card subtitle="הרשמה למערכת" right={<span className="badge">sign up</span>}>
          <Brand size={200} />

          {error && <div className="notice noticeDanger authError">{error}</div>}

          <form className="form" onSubmit={submit}>
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

            <Input
              label=" כתובת מגורים(עיר ,רחוב , מספר בית)"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              error={errors.address}
            />

            <div className="grid2">
              <Input
                label="טלפון"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                error={errors.phone}
                placeholder="05XXXXXXXX"
                autoComplete="tel"
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
              label="סיסמה"
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "שומר..." : "צור משתמש"}
            </Button>

            <div className="p" style={{ marginTop: 6 }}>
              יש לך משתמש?{" "}
              <Link to="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
                התחברות
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}