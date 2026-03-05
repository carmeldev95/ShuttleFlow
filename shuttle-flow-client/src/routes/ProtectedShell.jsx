import React from "react";
import { Navigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import { getSession } from "../services/auth.service.js";

export default function ProtectedShell() {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return <AppShell />;
}