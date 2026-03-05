import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth.service.js";

export default function SideNav({ role, toast }) {
  const nav = useNavigate();
  const linkClass = ({ isActive }) => (isActive ? "active" : "");

  function onLogout() {
    logout();
    toast?.push({ title: "התנתקת", message: "להתראות 👋" });
    nav("/login", { replace: true });
  }

  return (
    <nav className="sideNav">
      <div className="sideNavLinks nav">
        <NavLink className={linkClass} to="/">
          דשבורד
        </NavLink>

        <NavLink className={linkClass} to="/register">
          הרשמה להסעה
        </NavLink>

        {/* ✅ רק לעובד */}
        {role !== "admin" && (
          <NavLink className={linkClass} to="/my">
            ההרשמות שלי
          </NavLink>
        )}

        {role === "admin" && (
          <>
            <div className="hr" />
            <NavLink className={linkClass} to="/admin">
              ניהול רישומים
            </NavLink>
            <NavLink className={linkClass} to="/reports">
              דוחות
            </NavLink>
          </>
        )}
      </div>

      <div className="sideNavFooter">
        <div className="hr" />
        <button className="btn btnDanger sideNavLogout" type="button" onClick={onLogout}>
          יציאה
        </button>
      </div>
    </nav>
  );
}