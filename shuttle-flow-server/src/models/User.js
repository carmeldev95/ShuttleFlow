import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { encryptField, decryptField, hmacField } from "../utils/cryptoFields.js";

const userSchema = new mongoose.Schema(
  {
    firstName:  { type: mongoose.Schema.Types.Mixed, required: true },
    lastName:   { type: mongoose.Schema.Types.Mixed, required: true },

    phone:      { type: mongoose.Schema.Types.Mixed, required: true },
    phoneHash:  { type: String, unique: true, index: true, select: false },

    department: { type: mongoose.Schema.Types.Mixed, required: true },
    address:    { type: mongoose.Schema.Types.Mixed, required: true },

    role: { type: String, enum: ["employee", "admin"], default: "employee" },

    mustChangePassword: { type: Boolean, default: false },

    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

// Encrypt PII fields + compute phoneHash before save
userSchema.pre("save", function (next) {
  for (const field of ["firstName", "lastName", "department", "address"]) {
    if (typeof this[field] === "string") {
      this[field] = encryptField(this[field]);
    }
  }
  if (typeof this.phone === "string") {
    const normalized = this.phone.replace(/\D/g, "");
    this.phoneHash = hmacField(normalized);
    this.phone = encryptField(normalized);
  }
  next();
});

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(String(plain), 10);
};

userSchema.methods.checkPassword = async function (plain) {
  return bcrypt.compare(String(plain), this.passwordHash);
};

userSchema.methods.toSafeJson = function () {
  return {
    id: String(this._id),
    firstName:          decryptField(this.firstName),
    lastName:           decryptField(this.lastName),
    phone:              decryptField(this.phone),
    department:         decryptField(this.department),
    address:            decryptField(this.address),
    role:               this.role,
    mustChangePassword: this.mustChangePassword ?? false,
  };
};

export const User = mongoose.model("User", userSchema);
