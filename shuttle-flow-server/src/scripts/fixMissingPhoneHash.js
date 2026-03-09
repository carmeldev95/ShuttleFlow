// src/scripts/fixMissingPhoneHash.js
// Fix employees who are missing phoneHash (cannot log in)
import "dotenv/config";
import mongoose from "mongoose";
import { hmacField, encryptField } from "../utils/cryptoFields.js";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("Missing MONGO_URI");

await mongoose.connect(MONGO_URI);

const User = mongoose.model(
  "UserFix",
  new mongoose.Schema({}, { strict: false }),
  "users"
);

const missing = await User.find({ role: "employee", phoneHash: { $exists: false } }).lean();
console.log(`Found ${missing.length} employees without phoneHash`);

let fixed = 0;
let skipped = 0;

for (const u of missing) {
  if (!u.phone) { console.log(`⚠️  Skipped ${u._id} — no phone`); skipped++; continue; }

  // phone may be a plain string or already encrypted { ct, iv, tag }
  if (typeof u.phone === "object") {
    // already encrypted but no phoneHash — can't recover phone value
    console.log(`⚠️  Skipped ${u._id} — phone already encrypted, no way to compute hash`);
    skipped++;
    continue;
  }

  const normalized = u.phone.replace(/\D/g, "");
  const updates = {
    phoneHash: hmacField(normalized),
    phone: encryptField(normalized),
  };

  await User.updateOne({ _id: u._id }, { $set: updates });
  console.log(`✅ Fixed: ${u._id} (phone: ${normalized})`);
  fixed++;
}

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped`);
await mongoose.disconnect();
