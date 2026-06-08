import mongoose from "mongoose";

const SiteConfigSchema = new mongoose.Schema(
  {
    key:       { type: String, required: true, unique: true },
    label:     { type: String, required: true },
    isVisible: { type: Boolean, default: true },
    shifts: {
      morning: { type: Boolean, default: true },
      evening: { type: Boolean, default: true },
      night:   { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const SiteConfig = mongoose.model("SiteConfig", SiteConfigSchema);
