import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth.service.js";
import { startTour } from "../../utils/tour.js";

export default function SideNav({ role, toast, onNavigate }) {
  const nav = useNavigate();
  const linkClass = ({ isActive }) => (isActive ? "active" : "");

  function onLogout() {
    onNavigate?.();
    logout();
    toast?.push({ title: "התנתקת", message: "להתראות 👋" });
    nav("/login", { replace: true });
  }

  function onHelp() {
    onNavigate?.();
    // Ensure the tour starts from the dashboard where all nav links are present
    if (window.location.pathname !== "/") nav("/");
    setTimeout(() => startTour(role), 150);
  }

  return (
    <nav className="sideNav">
      <div className="sideNavLinks nav">
        <NavLink className={linkClass} to="/" data-tour="nav-dashboard" onClick={onNavigate}>
          דשבורד
        </NavLink>

        <NavLink className={linkClass} to="/register" data-tour="nav-register" onClick={onNavigate}>
          הרשמה להסעה
        </NavLink>

        {/* ✅ רק לעובד */}
        {role !== "admin" && (
          <NavLink className={linkClass} to="/my" data-tour="nav-my" onClick={onNavigate}>
            ההרשמות שלי
          </NavLink>
        )}

        {role === "admin" && (
          <>
            <div className="hr" />
            <NavLink className={linkClass} to="/admin" data-tour="nav-admin" onClick={onNavigate}>
              ניהול רישומים
            </NavLink>
            <NavLink className={linkClass} to="/employees" data-tour="nav-employees" onClick={onNavigate}>
              ניהול עובדים
            </NavLink>
            <NavLink className={linkClass} to="/announcements" data-tour="nav-announcements" onClick={onNavigate}>
              הודעות לעובדים
            </NavLink>
            <NavLink className={linkClass} to="/reports" data-tour="nav-reports" onClick={onNavigate}>
              דוחות
            </NavLink>
          </>
        )}
      </div>

      <div className="sideNavFooter">
        <div className="hr" />
        <button
          className="btn btnGhost sideNavHelp"
          type="button"
          onClick={onHelp}
          data-tour="help-btn"
        >
          ❓ הסבר שימוש במערכת
        </button>
        <button
          className="btn btnDanger sideNavLogout"
          type="button"
          onClick={onLogout}
          data-tour="logout-btn"
        >
          יציאה
        </button>
      </div>
    </nav>
  );
}