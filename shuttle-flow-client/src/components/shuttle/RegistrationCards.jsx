import { formatDate } from "../../utils/datetime.js";

export default function RegistrationCards({ rows }) {
  return (
    <div className="regGrid">
      {(rows || []).map((r) => (
        <div key={r.id || r._id} className="regCard">
          <div className="regTop">
            <div className="regDate">{formatDate(r.date)}</div>
            <div className="regPill">{r.shiftLabel || "-"}</div>
          </div>

          <div className="regRow">
            <span className="regLabel">סוג</span>
            <span className="regVal">{r.directionLabel || "-"}</span>
          </div>

          <div className="regRow">
            <span className="regLabel">מיקום</span>
            <span className="regVal">{r.siteLabel || "-"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}