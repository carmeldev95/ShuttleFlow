import mongoose from "mongoose";

// A single open day. Each shift can be opened/closed, and within an open shift
// each direction (pickup/dropoff/both) can be opened/closed independently.
// Sites are controlled per-day via a "closed list" so new sites stay open by default.
const AllowedDaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    // Mixed to stay forgiving across shape changes; normalized on read/write.
    shifts:      { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    closedSites: { type: [String], default: [] },
  },
  { _id: false }
);

// Singleton document — controls which days are open for employee registration
const RegistrationDaysConfigSchema = new mongoose.Schema(
  {
    locked:      { type: Boolean, default: false },
    allowedDays: { type: [AllowedDaySchema], default: [] },
    // legacy: array of date strings (pre per-day config) — read-only fallback
    allowedDates: { type: [String], default: undefined },
  },
  { timestamps: true }
);

// Normalize one shift value into { open, directions } from any historical shape:
//  - object { open, directions }           → current shape
//  - boolean                               → old (shift open flag), directions from dayDirections
function normShift(raw, dayDirections) {
  if (raw && typeof raw === "object") {
    return {
      open: raw.open !== false,
      directions: {
        pickup:  raw.directions?.pickup  !== false,
        dropoff: raw.directions?.dropoff !== false,
        both:    raw.directions?.both    !== false,
      },
    };
  }
  return {
    open: raw !== false,
    directions: {
      pickup:  dayDirections?.pickup  !== false,
      dropoff: dayDirections?.dropoff !== false,
      both:    dayDirections?.both    !== false,
    },
  };
}

// Normalize any stored shape into a consistent allowedDays array
export function normalizeAllowedDays(cfg) {
  if (!cfg) return [];

  if (Array.isArray(cfg.allowedDays) && cfg.allowedDays.length) {
    return cfg.allowedDays.map((d) => ({
      date: d.date,
      shifts: {
        // d.directions is a legacy day-level field; used only if shift was a boolean
        morning: normShift(d.shifts?.morning, d.directions),
        evening: normShift(d.shifts?.evening, d.directions),
        night:   normShift(d.shifts?.night,   d.directions),
      },
      closedSites: Array.isArray(d.closedSites) ? d.closedSites.slice() : [],
    }));
  }

  // Legacy: plain date strings — all shifts, directions and sites open
  if (Array.isArray(cfg.allowedDates) && cfg.allowedDates.length) {
    return cfg.allowedDates.map((date) => ({
      date,
      shifts: {
        morning: normShift(true),
        evening: normShift(true),
        night:   normShift(true),
      },
      closedSites: [],
    }));
  }

  return [];
}

export const RegistrationDaysConfig = mongoose.model(
  "RegistrationDaysConfig",
  RegistrationDaysConfigSchema
);
