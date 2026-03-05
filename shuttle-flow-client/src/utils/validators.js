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