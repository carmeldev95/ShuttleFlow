// src/scripts/seedAdmin.js
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { hmacField } from "../utils/cryptoFields.js";

function normPhone(v) {
  const digits = String(v ?? "").replace(/[^\d]/g, "");
  // אפשר להוסיף פה לוגיקה ל+972 אם תרצה, כרגע משאיר digits בלבד
  return digits || "";
}

const PHONE = normPhone(process.env.SEED_ADMIN_PHONE || "1111111111");
const PASSWORD = String(process.env.SEED_ADMIN_PASSWORD || "Admin123");
const FIRST_NAME = String(process.env.SEED_ADMIN_FIRSTNAME || "מנהל");
const LAST_NAME = String(process.env.SEED_ADMIN_LASTNAME || "3 מערכת");
const ADDRESS = String(process.env.SEED_ADMIN_ADDRESS || "N/A");
const DEPARTMENT = String(process.env.SEED_ADMIN_DEPARTMENT || "Admin");

async function main() {
  if (!process.env.MONGO_URI) throw new Error("Missing MONGO_URI");
  if (!PHONE) throw new Error("SEED_ADMIN_PHONE is empty/invalid after normalization");
  if (!PASSWORD || PASSWORD.length < 6) throw new Error("SEED_ADMIN_PASSWORD too short");

  await mongoose.connect(process.env.MONGO_URI);

  // מצא את כל המשתמשים עם אותו phone (למקרה שנוצרו כפילויות בעבר)
  const candidates = await User.find({ phoneHash: hmacField(PHONE) }).select("+passwordHash +phoneHash");
  if (candidates.length > 1) {
    console.warn(`⚠️ Found ${candidates.length} users with same phone (${PHONE}).`);
    console.warn("   Using the newest as primary. (No deletion performed)");
  }

  // בוחר את החדש ביותר כ-primary
  let user =
    candidates.sort((a, b) => {
      const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bt - at;
    })[0] || null;

  if (user) {
    user.role = "admin";
    user.firstName = FIRST_NAME;
    user.lastName = LAST_NAME;
    user.address = ADDRESS;
    user.department = DEPARTMENT;

    await user.setPassword(PASSWORD);
    await user.save();

    console.log("✅ Admin updated");
    console.log("id:", String(user._id));
    console.log("phone:", PHONE);
    console.log("password:", PASSWORD);
    console.log("role:", user.role);

    return;
  }

  user = new User({
    firstName: FIRST_NAME,
    lastName: LAST_NAME,
    phone: PHONE,
    address: ADDRESS,
    department: DEPARTMENT,
    role: "admin",
  });

  await user.setPassword(PASSWORD);
  await user.save();

  console.log("✅ Admin created");
  console.log("id:", String(user._id));
  console.log("phone:", PHONE);
  console.log("password:", PASSWORD);
  console.log("role:", user.role);
}

main()
  .catch((e) => {
    console.error("❌ seedAdmin failed:", e?.message || e);
    if (e?.stack) console.error(e.stack);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
  });