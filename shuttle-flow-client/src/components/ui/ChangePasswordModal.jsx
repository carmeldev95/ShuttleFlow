import { useState } from "react";
import { changePassword } from "../../services/auth.service.js";
import { validatePassword } from "../../utils/validators.js";
import Button from "./Button.jsx";
import { Input } from "./Input.jsx";

export default function ChangePasswordModal({ onSuccess, toast }) {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(k, v) {
    setForm((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate() {
    const e = {};
    const pwErr = validatePassword(form.password);
    if (pwErr) e.password = pwErr;
    if (!form.confirm) {
      e.confirm = "חובה לאשר סיסמה";
    } else if (form.password !== form.confirm) {
      e.confirm = "הסיסמאות אינן תואמות";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    try {
      setLoading(true);
      await changePassword(form.password);
      toast?.push({ title: "הסיסמה עודכנה בהצלחה", type: "success" });
      onSuccess();
    } catch (err) {
      setGlobalError(err.message || "שגיאה בעדכון הסיסמה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modalOverlay">
      <div className="modalBox">
        <h2 className="modalTitle">נדרש לשנות סיסמה</h2>
        <p className="modalDesc">
          הסיסמה שלך אופסה על ידי מנהל. יש להגדיר סיסמה חדשה לפני המשך השימוש במערכת.
        </p>

        {globalError && (
          <div className="notice noticeDanger" style={{ marginBottom: 12 }}>
            {globalError}
          </div>
        )}

        <form className="form" onSubmit={submit}>
          <Input
            label="סיסמה חדשה"
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            error={errors.password}
            placeholder="לפחות 6 תווים, אותיות אנגלית ומספרים"
            autoComplete="new-password"
          />
          <Input
            label="אישור סיסמה"
            type="password"
            value={form.confirm}
            onChange={(e) => setField("confirm", e.target.value)}
            error={errors.confirm}
            placeholder="הזן שוב את הסיסמה"
            autoComplete="new-password"
          />
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "שומר..." : "שמור סיסמה"}
          </Button>
        </form>
      </div>
    </div>
  );
}
