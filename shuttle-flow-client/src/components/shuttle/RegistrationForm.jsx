import { useEffect, useMemo, useState } from "react";
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
import { formatYmd, formatDate, parseYmdToDate } from "../../utils/datetime.js";
import { getSession } from "../../services/auth.service.js";
import { canEditRegistration, getDeadlineHint } from "../../utils/rules.js";

function dayName(ymd) {
    try {
        return parseYmdToDate(ymd).toLocaleDateString("he-IL", { weekday: "long" });
    } catch {
        return "";
    }
}

export default function RegistrationForm({
    mode = "create",
    initial,
    onSubmit,
    onCancel,
    submitLabel,
    disabledReason,
    siteConfigs = [], // [{ _id, key, label, isVisible, shifts: { morning, evening, night } }]
    daysConfig = null, // { locked, allowedDays: [{ date, shifts, closedSites }] }
}) {
    const session = getSession();
    const realAdmin = session?.user?.role === "admin";

    // Admin can preview the form as an employee sees it when the calendar is locked
    const [viewAsEmployee, setViewAsEmployee] = useState(false);
    const canToggleView = realAdmin && !!daysConfig?.locked;
    const isAdmin = realAdmin && !(canToggleView && viewAsEmployee);

    const todayYmd = useMemo(() => formatYmd(new Date()), []);
    const [form, setForm] = useState(() => ({
        date:      initial?.date      || todayYmd,
        shift:     initial?.shift     || SHIFT.MORNING,
        direction: initial?.direction || DIRECTION.PICKUP,
        site:      initial?.site      || SITE.RAMBAM,
    }));

    const [errors, setErrors] = useState({});

    // Locked calendar for employees: only admin-opened days/shifts/sites are selectable
    const dayLocked = !isAdmin && !!daysConfig?.locked;
    const allowedDays = daysConfig?.allowedDays || [];

    const availableDates = useMemo(() => {
        if (!dayLocked) return null;
        // Hide days where every shift is closed — nothing is registerable that day
        const hasOpenShift = (d) => Object.values(SHIFT).some((s) => d.shifts?.[s]?.open !== false);
        const list = allowedDays.filter(hasOpenShift).map((d) => d.date);
        // In edit mode, keeping the original date is always allowed
        if (mode === "edit" && initial?.date && !list.includes(initial.date)) list.push(initial.date);
        return list.slice().sort();
    }, [dayLocked, daysConfig, mode, initial?.date]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedDay = useMemo(
        () => allowedDays.find((d) => d.date === form.date) || null,
        [daysConfig, form.date] // eslint-disable-line react-hooks/exhaustive-deps
    );

    // Available sites based on config + role + per-day lock
    const availableSites = useMemo(() => {
        if (!siteConfigs.length) {
            return Object.values(SITE).map((k) => ({ key: k, label: SITE_LABEL[k] }));
        }
        if (isAdmin || mode === "edit") return siteConfigs;
        let list = siteConfigs.filter((s) => s.isVisible);
        if (dayLocked && selectedDay) {
            const closed = selectedDay.closedSites || [];
            list = list.filter((s) => !closed.includes(s.key));
        }
        return list;
    }, [siteConfigs, isAdmin, mode, dayLocked, selectedDay]);

    // Available shifts based on selected site config + role + per-day lock
    const availableShifts = useMemo(() => {
        if (!siteConfigs.length || isAdmin || mode === "edit") return Object.values(SHIFT);
        const siteConf = siteConfigs.find((s) => s.key === form.site);
        let list = Object.values(SHIFT);
        if (siteConf) list = list.filter((s) => siteConf.shifts?.[s] !== false);
        if (dayLocked && selectedDay?.shifts) {
            list = list.filter((s) => selectedDay.shifts[s]?.open !== false);
        }
        return list;
    }, [siteConfigs, form.site, isAdmin, mode, dayLocked, selectedDay]);

    // Available directions based on role + the selected shift's per-day lock
    const availableDirections = useMemo(() => {
        if (isAdmin || mode === "edit") return Object.values(DIRECTION);
        let list = Object.values(DIRECTION);
        const shiftDirs = dayLocked ? selectedDay?.shifts?.[form.shift]?.directions : null;
        if (shiftDirs) {
            list = list.filter((d) => shiftDirs[d] !== false);
        }
        return list;
    }, [isAdmin, mode, dayLocked, selectedDay, form.shift]);

    // Auto-reset date to the first open day if the current one is closed
    useEffect(() => {
        if (!availableDates?.length) return;
        if (!availableDates.includes(form.date)) {
            setForm((f) => ({ ...f, date: availableDates[0] }));
        }
    }, [availableDates]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-reset direction if it becomes unavailable
    useEffect(() => {
        if (!availableDirections.length) return;
        if (!availableDirections.includes(form.direction)) {
            setForm((f) => ({ ...f, direction: availableDirections[0] || DIRECTION.PICKUP }));
        }
    }, [availableDirections]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-reset site if it becomes unavailable
    useEffect(() => {
        if (!availableSites.length) return;
        const valid = availableSites.find((s) => s.key === form.site);
        if (!valid) setForm((f) => ({ ...f, site: availableSites[0]?.key || SITE.RAMBAM }));
    }, [availableSites]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-reset shift if it becomes unavailable
    useEffect(() => {
        if (!availableShifts.length) return;
        if (!availableShifts.includes(form.shift)) {
            setForm((f) => ({ ...f, shift: availableShifts[0] || SHIFT.MORNING }));
        }
    }, [availableShifts]); // eslint-disable-line react-hooks/exhaustive-deps

    function setField(k, v) {
        setForm((x) => ({ ...x, [k]: v }));
    }

    const employeeLock = useMemo(() => {
        if (isAdmin) return { ok: true, reason: "" };
        if (mode !== "create") return { ok: true, reason: "" };
        return canEditRegistration({ date: form.date, shift: form.shift, direction: form.direction, site: form.site }, new Date());
    }, [isAdmin, mode, form.date, form.shift, form.direction, form.site]);

    // Locked calendar: employees can only pick open days + open shift/site for that day
    const dayLock = useMemo(() => {
        if (isAdmin || !daysConfig?.locked) return { ok: true, reason: "" };
        if (mode === "edit" && form.date === initial?.date) return { ok: true, reason: "" };
        const day = allowedDays.find((d) => d.date === form.date);
        if (!day) {
            return { ok: false, reason: "הרישום ביומן נעול לתאריך זה. ניתן להירשם רק לימים שנפתחו על ידי מנהל" };
        }
        const sh = day.shifts?.[form.shift];
        if (!sh || sh.open === false) {
            return { ok: false, reason: "משמרת זו אינה פתוחה לרישום בתאריך שנבחר" };
        }
        if (sh.directions?.[form.direction] === false) {
            return { ok: false, reason: "סוג הנסיעה (איסוף/פיזור) אינו פתוח למשמרת זו בתאריך שנבחר" };
        }
        if ((day.closedSites || []).includes(form.site)) {
            return { ok: false, reason: "מיקום זה אינו פתוח לרישום בתאריך שנבחר" };
        }
        return { ok: true, reason: "" };
    }, [isAdmin, mode, daysConfig, form.date, form.shift, form.direction, form.site, initial?.date]);

    function validate() {
        const e = {};
        if (!form.date)      e.date      = "חובה לבחור תאריך";
        if (!form.shift)     e.shift     = "חובה לבחור משמרת";
        if (!form.direction) e.direction = "חובה לבחור איסוף/פיזור";
        if (!form.site)      e.site      = "חובה לבחור מיקום";

        if (!isAdmin && !dayLock.ok) {
            e._form = dayLock.reason;
        } else if (!isAdmin && mode === "create" && !employeeLock.ok) {
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

    const disabled = !!disabledReason || (!isAdmin && !dayLock.ok) || (!isAdmin && mode === "create" && !employeeLock.ok);
    const topReason =
        disabledReason ||
        (!isAdmin && !dayLock.ok ? dayLock.reason : "") ||
        (!isAdmin && mode === "create" ? errors._form || employeeLock.reason : "");

    return (
        <form className="form" onSubmit={submit}>
            {canToggleView && (
                <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                    <span className="label" style={{ margin: 0 }}>מצב תצוגה:</span>
                    <button
                        type="button"
                        className={`btn ${!viewAsEmployee ? "btnPrimary" : "btnGhost"}`}
                        onClick={() => setViewAsEmployee(false)}
                    >
                        צפיית אדמין
                    </button>
                    <button
                        type="button"
                        className={`btn ${viewAsEmployee ? "btnPrimary" : "btnGhost"}`}
                        onClick={() => setViewAsEmployee(true)}
                    >
                        צפיית עובד
                    </button>
                </div>
            )}
            {canToggleView && viewAsEmployee && (
                <div className="notice">
                    תצוגת עובד — הטופס מתנהג בדיוק כפי שעובד רגיל רואה אותו (כולל נעילת ימים וחוקי זמן)
                </div>
            )}
            {topReason && <div className="notice noticeDanger">{topReason}</div>}
            {!isAdmin && (
                <div className="notice">
                    {getDeadlineHint(form.shift, form.direction)}
                </div>
            )}
            {dayLocked && (
                <div className={`notice ${availableDates?.length ? "" : "noticeDanger"}`}>
                    {availableDates?.length
                        ? "היומן נעול לרישום חופשי — ניתן לבחור רק מהימים הפתוחים ברשימת התאריכים"
                        : "הרישום נעול כרגע — אין ימים פתוחים לרישום"}
                </div>
            )}

            <div className="grid2">
                {dayLocked ? (
                    <Select
                        label="תאריך"
                        value={form.date}
                        onChange={(e) => setField("date", e.target.value)}
                        error={errors.date}
                        disabled={!!disabledReason || !availableDates?.length}
                    >
                        {!availableDates?.length ? (
                            <option value="">אין ימים פתוחים לרישום</option>
                        ) : (
                            availableDates.map((d) => (
                                <option key={d} value={d}>
                                    {dayName(d)} · {formatDate(d)}
                                </option>
                            ))
                        )}
                    </Select>
                ) : (
                    <Input
                        label="תאריך"
                        type="date"
                        value={form.date}
                        onChange={(e) => setField("date", e.target.value)}
                        error={errors.date}
                        disabled={!!disabledReason}
                    />
                )}

                <Select
                    label="משמרת"
                    value={form.shift}
                    onChange={(e) => setField("shift", e.target.value)}
                    error={errors.shift}
                    disabled={!!disabledReason}
                >
                    {availableShifts.map((k) => (
                        <option key={k} value={k}>{SHIFT_LABEL[k]}</option>
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
                    {availableDirections.map((k) => (
                        <option key={k} value={k}>{DIRECTION_LABEL[k]}</option>
                    ))}
                </Select>

                <Select
                    label="מיקום"
                    value={form.site}
                    onChange={(e) => setField("site", e.target.value)}
                    error={errors.site}
                    disabled={!!disabledReason}
                >
                    {availableSites.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
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
                        <Button type="button" onClick={onCancel}>ביטול</Button>
                    )}
                    <Button type="submit" variant="primary" disabled={disabled}>
                        {submitLabel || (mode === "edit" ? "שמור" : "הרשם")}
                    </Button>
                </div>
            </div>
        </form>
    );
}
