export function validatePhone(phone) {
  const p = String(phone || "").trim();
  // very simple IL phone validation (client only)
  if (!/^0\d{8,9}$/.test(p)) return "מספר טלפון לא תקין";
  return null;
}

export function required(v, msg) {
  if (!String(v ?? "").trim()) return msg;
  return null;
}

export function validatePassword(pw) {
  const p = String(pw || "");
  if (p.length < 6) return "סיסמה חייבת להכיל לפחות 6 תווים";
  if (!/^[a-zA-Z0-9]+$/.test(p)) return "סיסמה יכולה להכיל אותיות באנגלית ומספרים בלבד";
  return null;
}