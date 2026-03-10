/**
 * Mirrors client rules.js — shift + direction based deadlines.
 * Admin bypass is handled in the controller.
 *
 * | shift   | direction        | deadline             |
 * |---------|------------------|----------------------|
 * | morning | pickup / both    | 16:00 day before     |
 * | morning | dropoff          | 10:00 same day       |
 * | evening | pickup / both    | 10:00 same day       |
 * | evening | dropoff          | 16:00 same day       |
 * | night   | any              | 16:00 same day       |
 */
function getDeadline(shift, direction) {
  const isPickupOrBoth = direction === "pickup" || direction === "both";

  if (shift === "morning") {
    return isPickupOrBoth ? { dayOffset: -1, hour: 16 } : { dayOffset: 0, hour: 10 };
  }
  if (shift === "evening") {
    return isPickupOrBoth ? { dayOffset: 0, hour: 10 } : { dayOffset: 0, hour: 16 };
  }
  // night — any direction
  return { dayOffset: 0, hour: 16 };
}

export function canEditRegistrationServer(reg, now = new Date()) {
  const rideDay = new Date(reg.date + "T00:00:00");
  const { dayOffset, hour } = getDeadline(reg.shift, reg.direction);

  const deadline = new Date(rideDay);
  deadline.setDate(deadline.getDate() + dayOffset);
  deadline.setHours(hour, 0, 0, 0);

  if (now >= deadline) {
    return { ok: false, reason: "הרישום נעול — עבר מועד השינויים" };
  }
  return { ok: true, reason: "" };
}
