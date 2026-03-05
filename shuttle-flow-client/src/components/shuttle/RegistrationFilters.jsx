// src/components/shuttle/RegistrationFilters.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Select } from "../ui/Select.jsx";
import { SHIFT, SHIFT_LABEL } from "../../utils/constants.js";

function useDebouncedValue(value, delayMs = 1000) {
  const [debounced, setDebounced] = useState(value);
  const tRef = useRef(null);

  // הגנה: אם מישהו שלח 3 במקום 3000
  const ms = Number(delayMs);
  const safeDelay = !Number.isFinite(ms) ? 1000 : ms < 50 ? ms * 1000 : ms;

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setDebounced(value), safeDelay);

    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [value, safeDelay]);

  return debounced;
}

export default function RegistrationFilters({ value, onChange, debounceMs = 1000 }) {
  const v = useMemo(() => value || { date: "", shift: "", q: "" }, [value]);

  // local input state (debounced UX)
  const [qLocal, setQLocal] = useState(v.q || "");
  const qDebounced = useDebouncedValue(qLocal, debounceMs);

  // אם ההורה איפס פילטרים – נסנכרן UI
  useEffect(() => {
    setQLocal(v.q || "");
  }, [v.q]);

  // שולחים להורה רק אחרי debounce, ורק אם באמת השתנה
  useEffect(() => {
    if ((v.q || "") !== qDebounced) {
      onChange?.({ ...v, q: qDebounced });
    }
    // intentionally no onChange in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  function clear() {
    setQLocal("");
    onChange?.({ date: "", shift: "", q: "" });
  }

  return (
    <div className="filterRow">
      <div className="field">
        <div className="label">תאריך</div>
        <input
          type="date"
          value={v.date || ""}
          onChange={(e) => onChange?.({ ...v, date: e.target.value })}
        />
      </div>

      <Select
        label="משמרת"
        value={v.shift || ""}
        onChange={(e) => onChange?.({ ...v, shift: e.target.value })}
      >
        <option value="">הכל</option>
        <option value={SHIFT.MORNING}>{SHIFT_LABEL[SHIFT.MORNING]}</option>
        <option value={SHIFT.EVENING}>{SHIFT_LABEL[SHIFT.EVENING]}</option>
        <option value={SHIFT.NIGHT}>{SHIFT_LABEL[SHIFT.NIGHT]}</option>
      </Select>

      <div className="field filterSearch">
        <div className="label">חיפוש חופשי</div>
        <input
          value={qLocal}
          onChange={(e) => setQLocal(e.target.value)}
          placeholder="חפש לפי שם/טלפון/כתובת/תאריך…"
        />
      </div>

      <button className="btn btnGhost filterClear" type="button" onClick={clear} title="נקה פילטרים">
        נקה
      </button>
    </div>
  );
}