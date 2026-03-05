import React from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../services/auth.service.js";

function isValidSession(session) {
  return Boolean(session?.token && session?.user && session.user.role);
}

export default function RoleRoute({ role, children }) {
  const session = getSession();

  if (!isValidSession(session)) {
    return <Navigate to="/login" replace />;
  }

  if (session.user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}