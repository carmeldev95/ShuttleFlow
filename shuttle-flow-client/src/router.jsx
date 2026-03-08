import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import AppShell from "./components/layout/AppShell.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/auth/SignupPage.jsx";

import DashboardPage from "../src/pages/employee/DashboardPage.jsx";
import NewRegistrationPage from "../src/pages/employee/NewRegistrationPage.jsx";
import MyRegistrationsPage from "../src/pages/employee/MyRegistrationPage.jsx";

import AdminRegistrationsPage from "../src/pages/admin/AdminRegistrationsPage.jsx";
import ReportsPage from "../src/pages/admin/ReportsPage.jsx";
import EditEmployeePage from "../src/pages/admin/EditEmployeePage.jsx";

import { getSession } from "../src/services/auth.service.js";

/**
 * IMPORTANT:
 * אל תעשה requireAuth(element) בזמן יצירת ה-router.
 * במקום זה, נרנדר Wrapper (ProtectedShell / RoleRoute) שקורא getSession בזמן render.
 */

function ProtectedShell() {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function RoleRoute({ role, children }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },

  {
    path: "/",
    element: <ProtectedShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "register", element: <NewRegistrationPage /> },
      { path: "my", element: <MyRegistrationsPage /> },

      {
        path: "admin",
        element: (
          <RoleRoute role="admin">
            <AdminRegistrationsPage />
          </RoleRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <RoleRoute role="admin">
            <ReportsPage />
          </RoleRoute>
        ),
      },
      {
        path: "employees",
        element: (
          <RoleRoute role="admin">
            <EditEmployeePage />
          </RoleRoute>
        ),
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);