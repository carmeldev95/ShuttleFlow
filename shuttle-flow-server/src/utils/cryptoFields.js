import crypto from "crypto";
import { env } from "../config/env.js";

const KEY = Buffer.from(env.fieldEncKeyBase64, "base64"); // 32 bytes

export function encryptField(plainText) {
  if (plainText === null || plainText === undefined) return null;
  const text = String(plainText);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ct: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptField(payload) {
  if (!payload) return "";
  // Legacy: plain string stored before encryption was enabled
  if (typeof payload === "string") return payload;
  const { ct, iv, tag } = payload;
  if (!ct || !iv || !tag) return "";

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    KEY,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  const plain = Buffer.concat([
    decipher.update(Buffer.from(ct, "base64")),
    decipher.final(),
  ]);

  return plain.toString("utf8");
}

// Deterministic HMAC for lookup (e.g. phone index)
export function hmacField(value) {
  return crypto.createHmac("sha256", KEY).update(String(value)).digest("hex");
}

// helper for mongoose schema type
export const EncryptedFieldSchema = {
  ct: { type: String, required: true },
  iv: { type: String, required: true },
  tag: { type: String, required: true },
};
export function decryptFieldsSafe(obj) {
  try {
    return obj; // ← אם אין הצפנה כרגע, פשוט מחזירים כמו שהוא
    // אם יש לך decryptFields(obj) אמיתי:
    // return decryptFields(obj);
  } catch {
    // במקרה של דאטה ישן / מפתח שונה — לא להפיל את השרת
    return obj;
  }
}