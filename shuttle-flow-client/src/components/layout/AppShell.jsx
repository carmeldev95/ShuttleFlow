import { useState } from "react";
import { Outlet } from "react-router-dom";
import SideNav from "./SideNav.jsx";
import Toast from "../ui/Toast.jsx";
import ChangePasswordModal from "../ui/ChangePasswordModal.jsx";
import { useToast } from "../../hooks/useToast.js";
import { getSession } from "../../services/auth.service.js";
import Brand from "../ui/Brand.jsx";

export default function AppShell() {
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const [menuOpen, setMenuOpen] = useState(false);
  const session = getSession();
  const toast = useToast();

  const user = session?.user;
  if (!session?.token || !user) return null;

  return (
    <>
      <div className="container">
        <div className="shell">
          <aside className={`sidebar ${menuOpen ? "sidebarOpen" : ""}`}>
            <div className="sidebarHeader">
              <Brand size={100} />
              <button
                type="button"
                className="navToggle"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "סגור תפריט" : "פתח תפריט"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>

            <div className="sidebarBody">
              <div className="p" style={{ marginTop: 6 }}>
                {user.firstName} {user.lastName}
              </div>
              <div className="badge">{user.role === "admin" ? "מנהל" : "עובד"}</div>

              <div className="hr" />

              <SideNav
                role={user.role}
                toast={toast}
                onNavigate={() => setMenuOpen(false)}
              />
            </div>
          </aside>

          <main className="main">
            <Outlet context={{ toast }} />
          </main>
        </div>
      </div>

      <Toast toasts={toast.toasts} />

      {user.mustChangePassword && (
        <ChangePasswordModal onSuccess={refresh} toast={toast} />
      )}
    </>
  );
}
