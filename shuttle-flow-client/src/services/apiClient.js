
import { getSession, setSession, clearSession } from "./auth.service.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

function buildUrl(path) {
  if (String(path).startsWith("http")) return path;
  return `${API_BASE}${String(path).startsWith("/") ? "" : "/"}${path}`;
}

function isAuthEndpoint(path) {
  const p = String(path || "");
  return (
    p.includes("/auth/login") ||
    p.includes("/auth/signup") ||
    p.includes("/auth/refresh") ||
    p.includes("/auth/logout")
  );
}

async function safeParseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function requestRaw(
  path,
  { method = "GET", body, headers = {}, retry = true } = {}
) {
  const session = getSession();
  const url = buildUrl(path);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include", // חשוב כדי שה-refresh cookie יעבוד
    });
  } catch (e) {
    // שגיאת רשת (ERR_CONNECTION_REFUSED וכו')
    const err = new Error("לא ניתן להתחבר לשרת (Network error)");
    err.cause = e;
    err.isNetworkError = true;
    throw err;
  }

  // ✅ refresh רק לבקשות “רגילות”, לא ל-auth endpoints
  if (res.status === 401 && retry && !isAuthEndpoint(path)) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return requestRaw(path, { method, body, headers, retry: false });
    }
    clearSession();
  }

  return res;
}

export async function apiRequest(path, options) {
  const res = await requestRaw(path, options);
  const data = await safeParseJson(res);

  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

let refreshPromise = null;

async function tryRefresh() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;

      const data = await res.json();
      if (data?.token && data?.user) {
        setSession({ token: data.token, user: data.user });
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}