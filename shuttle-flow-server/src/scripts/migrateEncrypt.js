// src/scripts/migrateEncrypt.js
// One-time migration: encrypt all plain-text PII fields in the users collection
import "dotenv/config";
import mongoose from "mongoose";
import { encryptField, hmacField } from "../utils/cryptoFields.js";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("Missing MONGO_URI");

await mongoose.connect(MONGO_URI);

// Use strict: false to read raw documents without the encrypted schema
const User = mongoose.model(
  "UserMigrate",
  new mongoose.Schema({}, { strict: false }),
  "users"
);

const users = await User.find({});
let migrated = 0;
let skipped = 0;

for (const user of users) {
  // If firstName is already an object {ct,iv,tag} — already encrypted, skip
  if (typeof user.firstName !== "string") {
    skipped++;
    continue;
  }

  const updates = {};

  for (const field of ["firstName", "lastName", "department", "address"]) {
    if (typeof user[field] === "string") {
      updates[field] = encryptField(user[field]);
    }
  }

  if (typeof user.phone === "string") {
    const normalized = user.phone.replace(/\D/g, "");
    updates.phone = encryptField(normalized);
    updates.phoneHash = hmacField(normalized);
  }

  await User.updateOne({ _id: user._id }, { $set: updates });
  console.log(`✅ Migrated: ${user._id} (${user.firstName} ${user.lastName})`);
  migrated++;
}

console.log(`\nDone: ${migrated} migrated, ${skipped} already encrypted`);
await mongoose.disconnect();
