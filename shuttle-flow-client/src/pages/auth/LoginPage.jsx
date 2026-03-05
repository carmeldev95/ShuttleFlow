import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { login } from "../../services/auth.service.js";
import Brand from "../../components/ui/Brand.jsx";
export default function LoginPage() {
    const nav = useNavigate();
    const [form, setForm] = useState({ phone: "", password: "" });
    const [error, setError] = useState("");

    function setField(k, v) {
        setForm((x) => ({ ...x, [k]: v }));
    }

   async function submit(e) {
        e.preventDefault();
        setError("");
        try {
            login(form);
            nav("/", { replace: true });
        } catch (err) {
            setError(err.message || "שגיאה בהתחברות");
        }
    }

    return (
        <div className="authShell">
            <div className="authCard">
                <Card
                    subtitle="התחברות למערכת"
                    right={<span className="badge">Login</span>}
                >
                    <Brand size={200} />
                    {error && <div className="notice noticeDanger" style={{ marginBottom: 10 }}>{error}</div>}

                    <form className="form" onSubmit={submit}>
                        <Input
                            label="טלפון"
                            value={form.phone}
                            onChange={(e) => setField("phone", e.target.value)}
                            placeholder="05XXXXXXXX"
                        />
                        <Input
                            label="סיסמה"
                            type="password"
                            value={form.password}
                            onChange={(e) => setField("password", e.target.value)}
                            placeholder="••••••••"
                        />

                        <Button variant="primary" type="submit">
                            התחבר
                        </Button>

                        <div className="p" style={{ marginTop: 6 }}>
                            אין לך משתמש? <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 700 }}>הרשמה</Link>
                        </div>

                        <div className="notice" style={{ marginTop: 8 }}>
                            השימוש במערכת הינה עבור עובדי בית חולים כרמל שאין להם גישה למערכת ההיסעים.
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}