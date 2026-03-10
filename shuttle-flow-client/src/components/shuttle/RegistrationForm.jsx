import { useMemo, useState } from "react";
import Button from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { Select } from "../ui/Select.jsx";
import {
    DIRECTION,
    DIRECTION_LABEL,
    SHIFT,
    SHIFT_LABEL,
    SITE,
    SITE_LABEL,
} from "../../utils/constants.js";
import { formatYmd } from "../../utils/datetime.js";
import { getSession } from "../../services/auth.service.js";
import { canEditRegistration, getDeadlineHint } from "../../utils/rules.js";

export default function RegistrationForm({
    mode = "create", // create | edit
    initial,
    onSubmit,
    onCancel,
    submitLabel,
    disabledReason, // מיועד בעיקר ל-edit/נעילה חיצונית
}) {
    const session = getSession();
    const isAdmin = session?.user?.role === "admin";

    const todayYmd = useMemo(() => formatYmd(new Date()), []);
    const [form, setForm] = useState(() => ({
        date: initial?.date || todayYmd,
        shift: initial?.shift || SHIFT.MORNING,
        direction: initial?.direction || DIRECTION.PICKUP,
        site: initial?.site || SITE.CARMEL,
    }));

    const [errors, setErrors] = useState({});

    function setField(k, v) {
        setForm((x) => ({ ...x, [k]: v }));
    }

    // ✅ נעילה לעובד בזמן יצירה (לא לאדמין)
    const employeeLock = useMemo(() => {
        if (isAdmin) return { ok: true, reason: "" };
        if (mode !== "create") return { ok: true, reason: "" };

        // “רישום מדומה” בשביל אותו validator
        const probe = {
            date: form.date,
            shift: form.shift,
            direction: form.direction,
            site: form.site,
        };

        return canEditRegistration(probe, new Date()); // { ok, reason }
    }, [isAdmin, mode, form.date, form.shift, form.direction, form.site]);

    function validate() {
        const e = {};
        if (!form.date) e.date = "חובה לבחור תאריך";
        if (!form.shift) e.shift = "חובה לבחור משמרת";
        if (!form.direction) e.direction = "חובה לבחור איסוף/פיזור";
        if (!form.site) e.site = "חובה לבחור מיקום";

        // ✅ לעובד: לא מאפשרים רישום למשמרת שעברה/נעולה לפי הכללים
        if (!isAdmin && mode === "create" && !employeeLock.ok) {
            e._form = employeeLock.reason || "לא ניתן להירשם להסעה שכבר עברה";
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function submit(ev) {
        ev.preventDefault();
        if (!validate()) return;
        onSubmit?.(form);
    }

    // disabledReason חיצוני (למשל edit נעול) גובר
    const disabled = !!disabledReason || (!isAdmin && mode === "create" && !employeeLock.ok);
    const topReason =
        disabledReason || (!isAdmin && mode === "create" ? errors._form || employeeLock.reason : "");

    return (
        <form className="form" onSubmit={submit}>
            {topReason && <div className="notice noticeDanger">{topReason}</div>}
            {!isAdmin && (
                <div className="notice">
                    {getDeadlineHint(form.shift, form.direction)}
                </div>
            )}

            <div className="grid2">
                <Input
                    label="תאריך"
                    type="date"
                    value={form.date}
                    onChange={(e) => setField("date", e.target.value)}
                    error={errors.date}
                    disabled={!!disabledReason}
                />

                <Select
                    label="משמרת"
                    value={form.shift}
                    onChange={(e) => setField("shift", e.target.value)}
                    error={errors.shift}
                    disabled={!!disabledReason}
                >
                    {Object.values(SHIFT).map((k) => (
                        <option key={k} value={k}>
                            {SHIFT_LABEL[k]}
                        </option>
                    ))}
                </Select>
            </div>

            <div className="grid2">
                <Select
                    label="איסוף / פיזור"
                    value={form.direction}
                    onChange={(e) => setField("direction", e.target.value)}
                    error={errors.direction}
                    disabled={!!disabledReason}
                >
                    {Object.values(DIRECTION).map((k) => (
                        <option key={k} value={k}>
                            {DIRECTION_LABEL[k]}
                        </option>
                    ))}
                </Select>

                <Select
                    label="מיקום"
                    value={form.site}
                    onChange={(e) => setField("site", e.target.value)}
                    error={errors.site}
                    disabled={!!disabledReason}
                >
                    {Object.values(SITE).map((k) => (
                        <option key={k} value={k}>
                            {SITE_LABEL[k]}
                        </option>
                    ))}
                </Select>
            </div>

            {errors._form && <div className="notice noticeDanger">{errors._form}</div>}

            <div className="row" style={{ marginTop: 6 }}>
                <div className="p" style={{ margin: 0 }}>
                    {mode === "edit" ? "עריכת הרשמה קיימת" : "יצירת הרשמה חדשה"}
                </div>

                <div className="actions">
                    {onCancel && (
                        <Button type="button" onClick={onCancel}>
                            ביטול
                        </Button>
                    )}
                    <Button type="submit" variant="primary" disabled={disabled}>
                        {submitLabel || (mode === "edit" ? "שמור" : "הרשם")}
                    </Button>
                </div>
            </div>
        </form>
    );
}