import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // YYYY-MM-DD as string (matches your frontend)
    date: { type: String, required: true, index: true },

    shift: { type: String, enum: ["morning", "evening", "night"], required: true, index: true },
    direction: { type: String, enum: ["pickup", "dropoff", "both"], required: true },
    site: { type: String, enum: ["carmel", "rambam"], required: true },

    // snapshot for reports/history (fields stored encrypted)
    userSnapshot: {
      firstName:  { type: mongoose.Schema.Types.Mixed },
      lastName:   { type: mongoose.Schema.Types.Mixed },
      phone:      { type: mongoose.Schema.Types.Mixed },
      address:    { type: mongoose.Schema.Types.Mixed },
      department: { type: mongoose.Schema.Types.Mixed },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// avoid duplicates per user/date/shift
RegistrationSchema.index({ userId: 1, date: 1, shift: 1 }, { unique: true });

export const Registration = mongoose.model("Registration", RegistrationSchema);