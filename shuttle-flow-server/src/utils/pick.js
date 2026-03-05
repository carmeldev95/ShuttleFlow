// src/utils/pick.js

/**
 * Picks a subset of keys from an object.
 * Usage: pick(req.body, ["firstName","lastName"])
 */
export function pick(obj, keys = []) {
  const out = {};
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  }
  return out;
}

/**
 * Normalize Israeli phone numbers to digits-only.
 * Examples:
 *  - "050-1234567" -> "0501234567"
 *  - "+972501234567" -> "0501234567"
 *  - "972501234567" -> "0501234567"
 */
export function normalizePhone(phone) {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";

  // Convert IL country code to leading 0
  if (digits.startsWith("972")) {
    const rest = digits.slice(3); // e.g. 501234567
    // if number doesn't start with 0 after removing 972, add it
    return rest.startsWith("0") ? rest : `0${rest}`;
  }

  return digits;
}