// src/services/auth.service.js
import { apiRequest } from "./apiClient.js";

const KEY = "sf_session_v1";

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

/* ======================
   API calls
   ====================== */

export async function signup(payload) {
  // payload: { email,password,firstName,lastName,phone,address,department }
  const data = await apiRequest("/auth/signup", { method: "POST", body: payload });
  setSession({ token: data.token, user: data.user });
  return data.user;
}

export async function login(payload) {
  // payload: { email,password }
  const data = await apiRequest("/auth/login", { method: "POST", body: payload });
  setSession({ token: data.token, user: data.user });
  return data.user;
}

export async function logout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
}

export async function me() {
  const data = await apiRequest("/auth/me");
  // keep token from existing session
  const cur = getSession();
  if (cur?.token && data?.user) setSession({ token: cur.token, user: data.user });
  return data.user;
}

export async function changePassword(newPassword) {
  const data = await apiRequest("/auth/change-password", { method: "POST", body: { newPassword } });
  const cur = getSession();
  if (cur) setSession({ ...cur, user: data.user });
  return data.user;
}