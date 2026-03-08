import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },

    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    department: { type: String, required: true, trim: true, maxlength: 120 },
    address: { type: String, required: true, trim: true, maxlength: 240 },

    role: { type: String, enum: ["employee", "admin"], default: "employee" },

    mustChangePassword: { type: Boolean, default: false },

    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

// Normalize phone digits on save
userSchema.pre("save", function (next) {
  if (this.phone) this.phone = String(this.phone).replace(/[^\d]/g, "");
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
    firstName: this.firstName,
    lastName: this.lastName,
    phone: this.phone,
    department: this.department,
    address: this.address,
    role: this.role,
    mustChangePassword: this.mustChangePassword ?? false,
  };
};

export const User = mongoose.model("User", userSchema);