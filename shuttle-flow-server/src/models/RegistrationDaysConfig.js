import mongoose from "mongoose";

// Singleton document — controls which days are open for employee registration
const RegistrationDaysConfigSchema = new mongoose.Schema(
  {
    locked:       { type: Boolean, default: false },
    allowedDates: { type: [String], default: [] }, // YYYY-MM-DD
  },
  { timestamps: true }
);

export const RegistrationDaysConfig = mongoose.model(
  "RegistrationDaysConfig",
  RegistrationDaysConfigSchema
);
