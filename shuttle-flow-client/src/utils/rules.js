import { DIRECTION, SHIFT } from "./constants.js";
import { parseYmdToDate } from "./datetime.js";

function getDeadline(shift, direction) {
  const isPickupOrBoth = direction === DIRECTION.PICKUP || direction === DIRECTION.BOTH;

  if (shift === SHIFT.MORNING) {
    return isPickupOrBoth
      ? { dayOffset: -1, hour: 16 }  // 16:00 day before
      : { dayOffset: 0,  hour: 10 }; // 10:00 same day
  }
  if (shift === SHIFT.EVENING) {
    return isPickupOrBoth
      ? { dayOffset: 0, hour: 10 }   // 10:00 same day
      : { dayOffset: 0, hour: 16 };  // 16:00 same day
  }
  // NIGHT — any direction
  return { dayOffset: 0, hour: 16 }; // 16:00 same day
}

export function getDeadlineHint(shift, direction) {
  const { dayOffset, hour } = getDeadline(shift, direction);
  const timeStr = `${hour}:00`;
  const dayStr = dayOffset < 0 ? "ביום שלפני" : "באותו יום";
  return `ניתן להירשם עד ${timeStr} ${dayStr}`;
}

export function canEditRegistration(reg, now = new Date()) {
  const rideDay = parseYmdToDate(reg.date);
  const { dayOffset, hour } = getDeadline(reg.shift, reg.direction);

  const deadline = new Date(rideDay);
  deadline.setDate(deadline.getDate() + dayOffset);
  deadline.setHours(hour, 0, 0, 0);

  if (now >= deadline) {
    return {
      ok: false,
      reason: `${getDeadlineHint(reg.shift, reg.direction)} — הרישום נעול`,
    };
  }
  return { ok: true, reason: "" };
}
