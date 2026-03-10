// src/components/shuttle/RegistrationTable.jsx
import { useMemo, useState } from "react";
import Button from "../ui/Button.jsx";
import { canEditRegistration } from "../../utils/rules.js";
import { formatDate, formatTimestamp } from "../../utils/datetime.js";

function SortIcon({ dir }) {
  if (!dir) return <span className="sortIcon sortIcon--off">↕</span>;
  return dir === "asc" ? <span className="sortIcon">▲</span> : <span className="sortIcon">▼</span>;
}

export default function RegistrationTable({
  rows,
  mode = "employee", // employee | admin
  onEdit,
  onDelete,
  now = new Date(),
  pageSize = 10,
}) {
  const [sort, setSort] = useState({ key: "date", dir: "desc" }); // default newest first
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");

  const canActForRow = (r) => {
    const lock = canEditRegistration(r, now);
    return mode === "admin" ? { ok: true, reason: "" } : lock;
  };

  const sorted = useMemo(() => {
    const copy = (rows || []).slice();

    const getValue = (r, key) => {
      switch (key) {
        case "date":
          return r.createdAt ? new Date(r.createdAt).getTime() : (r.date || "");
        case "shift":
          return r.shiftLabel || r.shift || "";
        case "direction":
          return r.directionLabel || r.direction || "";
        case "site":
          return r.siteLabel || r.site || "";
        case "name":
          return `${r.userSnapshot?.firstName || ""} ${r.userSnapshot?.lastName || ""}`.trim();
        case "phone":
          return r.userSnapshot?.phone || "";
        case "address":
          return r.userSnapshot?.address || "";
        default:
          return "";
      }
    };

    copy.sort((a, b) => {
      const av = getValue(a, sort.key);
      const bv = getValue(b, sort.key);

      if (typeof av === "number" && typeof bv === "number") {
        return sort.dir === "asc" ? av - bv : bv - av;
      }

      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as === bs) return 0;
      const res = as > bs ? 1 : -1;
      return sort.dir === "asc" ? res : -res;
    });

    return copy;
  }, [rows, sort]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageRows = useMemo(() => {
    const p = Math.min(Math.max(page, 1), totalPages);
    const start = (p - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize, totalPages]);

  function toggleSort(key) {
    setPage(1);
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  const sortDirFor = (key) => (sort.key === key ? sort.dir : "");

  function goPage(p) {
    setPage(Math.min(Math.max(p, 1), totalPages));
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="tableWrap">
      <table className="table tableSaas">
        <thead>
          <tr>
            <th className="colDate thSortable" onClick={() => toggleSort("date")} role="button">
              תאריך <SortIcon dir={sortDirFor("date")} />
            </th>
            <th className="thSortable" onClick={() => toggleSort("shift")} role="button">
              משמרת <SortIcon dir={sortDirFor("shift")} />
            </th>
            <th className="thSortable" onClick={() => toggleSort("direction")} role="button">
              סוג <SortIcon dir={sortDirFor("direction")} />
            </th>
            <th className="thSortable" onClick={() => toggleSort("site")} role="button">
              מיקום <SortIcon dir={sortDirFor("site")} />
            </th>
            <th className="thSortable" onClick={() => toggleSort("name")} role="button">
              עובד <SortIcon dir={sortDirFor("name")} />
            </th>
            <th className="colPhone thSortable" onClick={() => toggleSort("phone")} role="button">
              טלפון <SortIcon dir={sortDirFor("phone")} />
            </th>
            <th className="colAddress thSortable" onClick={() => toggleSort("address")} role="button">
              כתובת <SortIcon dir={sortDirFor("address")} />
            </th>
            {mode === "admin" && <th className="colTimestamp">נוצר</th>}
            <th className="colActions">פעולות</th>
          </tr>
        </thead>

        <tbody>
          {pageRows.map((r) => {
            const lock = canActForRow(r);
            const selected = selectedId === (r.id || r._id);

            return (
              <tr
                key={r.id || r._id}
                className={selected ? "rowSelected" : ""}
                onClick={() => setSelectedId(r.id || r._id)}
                title={selected ? "נבחר" : "לחץ לבחירה"}
              >
                <td className="colDate">{formatDate(r.date)}</td>
                <td>{r.shiftLabel || r.shift || "-"}</td>
                <td>{r.directionLabel || r.direction || "-"}</td>
                <td>{r.siteLabel || r.site || "-"}</td>

                <td>
                  {r.userSnapshot?.firstName} {r.userSnapshot?.lastName}
                </td>
                <td className="colPhone">{r.userSnapshot?.phone || "-"}</td>
                <td className="colAddress">{r.userSnapshot?.address || "-"}</td>

                {mode === "admin" && (
                  <td className="colTimestamp" style={{ whiteSpace: "pre", fontSize: "0.8rem" }}>
                    {formatTimestamp(r.createdAt)}
                  </td>
                )}

                <td className="colActions" onClick={(e) => e.stopPropagation()}>
                  <div className="actions">
                    <Button
                      onClick={() => onEdit?.(r)}
                      disabled={!lock.ok}
                      title={!lock.ok ? lock.reason : ""}
                    >
                      עריכה
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => onDelete?.(r)}
                      disabled={!lock.ok}
                      title={!lock.ok ? lock.reason : ""}
                    >
                      ביטול
                    </Button>
                  </div>

                  {mode !== "admin" && !lock.ok && <div className="lockHint">{lock.reason}</div>}
                </td>
              </tr>
            );
          })}

          {pageRows.length === 0 && (
            <tr>
              <td colSpan={mode === "admin" ? 9 : 8} className="tableEmpty">
                אין נתונים להצגה
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="tableFooter">
        <div className="tableMeta">
          מציג {from}-{to} מתוך {total}
        </div>

        <div className="pager">
          <button className="btn btnGhost" disabled={page <= 1} onClick={() => goPage(page - 1)}>
            הקודם
          </button>

          <div className="pagerPages">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
              .map((p) => (
                <button
                  key={p}
                  className={`pagerBtn ${p === page ? "pagerBtn--active" : ""}`}
                  onClick={() => goPage(p)}
                >
                  {p}
                </button>
              ))}
          </div>

          <button className="btn btnGhost" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
            הבא
          </button>
        </div>
      </div>
    </div>
  );
}