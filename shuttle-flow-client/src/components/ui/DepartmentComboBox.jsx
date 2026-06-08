import { useEffect, useMemo, useRef, useState } from "react";

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }) {
  const q = (query || "").trim();
  if (!q) return <>{text}</>;
  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = String(text).split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) ? <mark key={i} className="cbMark">{p}</mark> : <span key={i}>{p}</span>
      )}
    </>
  );
}

export default function DepartmentComboBox({
  label = "מחלקה",
  options = [],
  value = "",
  onChange,
  error,
  placeholder = "חפש מחלקה...",
  disabled = false,
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // sync display text when value changes externally
  useEffect(() => {
    if (!open) setQuery(value || "");
  }, [value, open]);

  // close on outside click
  useEffect(() => {
    function onDocDown(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  function pick(dept) {
    onChange?.(dept);
    setOpen(false);
  }

  function clear() {
    onChange?.("");
    setQuery("");
    setOpen(false);
  }

  const highlightQuery = open ? query.trim() : "";

  return (
    <div className={`cb ${disabled ? "cb--disabled" : ""}`} ref={wrapRef}>
      {label && <div className="label">{label}</div>}

      <div className={`cbControl ${open ? "cbControl--open" : ""}`}>
        <input
          className="cbInput"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />

        {value && !disabled ? (
          <button type="button" className="cbIconBtn" onClick={clear} title="נקה בחירה">
            ✕
          </button>
        ) : (
          <span className="cbIcon" aria-hidden="true">⌄</span>
        )}
      </div>

      {open && !disabled && (
        <div className="cbMenu" role="listbox">
          {filtered.length === 0 ? (
            <div className="cbEmpty">לא נמצאה מחלקה</div>
          ) : (
            filtered.map((dept) => (
              <button
                key={dept}
                type="button"
                className={`cbItem ${dept === value ? "cbItem--active" : ""}`}
                onClick={() => pick(dept)}
              >
                <div className="cbItemMain">
                  <div className="cbItemName">
                    <Highlight text={dept} query={highlightQuery} />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}
