// src/scripts/migrateEncryptRegistrations.js
// One-time migration: encrypt all plain-text PII fields in userSnapshot (registrations collection)
import "dotenv/config";
import mongoose from "mongoose";
import { encryptField } from "../utils/cryptoFields.js";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("Missing MONGO_URI");

await mongoose.connect(MONGO_URI);

// strict: false — read raw documents without the encrypted schema
const Reg = mongoose.model(
  "RegMigrate",
  new mongoose.Schema({}, { strict: false }),
  "registrations"
);

// Only fetch docs where userSnapshot.firstName is still a plain string
const regs = await Reg.find({ "userSnapshot.firstName": { $type: "string" } });
let migrated = 0;
let skipped = 0;

for (const reg of regs) {
  const snap = reg.userSnapshot;
  if (!snap || typeof snap.firstName !== "string") {
    skipped++;
    continue;
  }

  const updates = {};

  for (const field of ["firstName", "lastName", "department", "address"]) {
    if (typeof snap[field] === "string") {
      updates[`userSnapshot.${field}`] = encryptField(snap[field]);
    }
  }

  if (typeof snap.phone === "string") {
    const normalized = snap.phone.replace(/\D/g, "");
    updates["userSnapshot.phone"] = encryptField(normalized);
  }

  await Reg.updateOne({ _id: reg._id }, { $set: updates });
  console.log(`✅ Migrated: ${reg._id}`);
  migrated++;
}

console.log(`\nDone: ${migrated} migrated, ${skipped} already encrypted`);
await mongoose.disconnect();
