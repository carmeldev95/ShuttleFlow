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
        re.test(p) ? (
          <mark key={i} className="cbMark">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function UserComboBox({
  label = "עובד",
  users = [],
  value = "",                 // selected userId
  onChange,                   // (userId, userObj) => void
  placeholder = "חפש לפי שם או טלפון...",
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === value) || null,
    [users, value]
  );

  // When closed, show selected user text in the input
  useEffect(() => {
    if (!open && selectedUser) {
      setQuery(`${selectedUser.firstName} ${selectedUser.lastName} · ${selectedUser.phone}`);
    }
    if (!open && !selectedUser) setQuery("");
  }, [selectedUser, open]);

  // Close on outside click
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
    const list = users.slice();

    if (!q) return list.slice(0, 50);

    return list
      .filter((u) => {
        const full = `${u.firstName} ${u.lastName}`.toLowerCase();
        const phone = String(u.phone || "").toLowerCase();
        return full.includes(q) || phone.includes(q);
      })
      .slice(0, 50);
  }, [users, query]);

  function pick(u) {
    onChange?.(u.id, u);
    setOpen(false);
  }

  function clearSelection() {
    onChange?.("", null);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") setOpen(false);
  }

  // query used for highlight only (not when displaying selected state)
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
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />

        {value && !disabled ? (
          <button type="button" className="cbIconBtn" onClick={clearSelection} title="נקה בחירה">
            ✕
          </button>
        ) : (
          <span className="cbIcon" aria-hidden="true">⌄</span>
        )}
      </div>

      {open && !disabled && (
        <div className="cbMenu" role="listbox">
          {filtered.length === 0 ? (
            <div className="cbEmpty">לא נמצאו עובדים</div>
          ) : (
            filtered.map((u) => {
              const name = `${u.firstName} ${u.lastName}`;
              const meta = `${u.phone} · ${u.department}`;

              return (
                <button
                  key={u.id}
                  type="button"
                  className={`cbItem ${u.id === value ? "cbItem--active" : ""}`}
                  onClick={() => pick(u)}
                >
                  <div className="cbItemMain">
                    <div className="cbItemName">
                      <Highlight text={name} query={highlightQuery} />
                    </div>
                    <div className="cbItemMeta">
                      <Highlight text={meta} query={highlightQuery} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}