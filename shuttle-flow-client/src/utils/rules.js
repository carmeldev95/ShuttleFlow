import { DIRECTION, SHIFT } from "./constants.js";
import { addDays, parseYmdToDate, timeToMinutes } from "./datetime.js";

/**
 * Configurable cutover times (ride "moment" per shift)
 * This is used for "after ride time => locked"
 */
const CUTOVER_MINUTES = {
  [SHIFT.MORNING]: 7 * 60,   // 07:00
  [SHIFT.EVENING]: 15 * 60,  // 15:00
  [SHIFT.NIGHT]: 23 * 60,    // 23:00
};

const DEADLINE_10 = 10 * 60; // 10:00
const DEADLINE_16 = 16 * 60; // 16:00

export function canEditRegistration(reg, now = new Date()) {
  const rideDay = parseYmdToDate(reg.date);
  const rideMoment = new Date(rideDay);
  rideMoment.setMinutes(CUTOVER_MINUTES[reg.shift] ?? CUTOVER_MINUTES[SHIFT.MORNING]);

  // 1) after ride moment => locked
  if (now.getTime() >= rideMoment.getTime()) {
    return { ok: false, reason: "לא ניתן לערוך/לבטל לאחר מועד ההסעה" };
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minutesNow = timeToMinutes(now);

  const tomorrow = addDays(today, 1);

  const isToday = sameYmd(reg.date, today);
  const isTomorrowMorningPickup =
    reg.shift === SHIFT.MORNING &&
    reg.direction === DIRECTION.PICKUP &&
    sameYmd(reg.date, tomorrow);

  // A) Evening pickup OR Morning dropoff (for today) until 10:00
  if (
    isToday &&
    ((reg.shift === SHIFT.EVENING && reg.direction === DIRECTION.PICKUP) ||
      (reg.shift === SHIFT.MORNING && reg.direction === DIRECTION.DROPOFF))
  ) {
    if (minutesNow > DEADLINE_10) {
      return { ok: false, reason: "שינויים עבור איסוף ערב / פיזור בוקר אפשריים עד 10:00" };
    }
    return { ok: true, reason: "" };
  }

  // B) Night pickup/dropoff for today until 16:00
  if (isToday && reg.shift === SHIFT.NIGHT) {
    if (minutesNow > DEADLINE_16) {
      return { ok: false, reason: "שינויים עבור משמרת לילה אפשריים עד 16:00" };
    }
    return { ok: true, reason: "" };
  }

  // C) Tomorrow morning pickup until 16:00 (day before)
  if (isTomorrowMorningPickup) {
    if (minutesNow > DEADLINE_16) {
      return { ok: false, reason: "איסוף למשמרת בוקר של מחר ניתן לשנות עד 16:00" };
    }
    return { ok: true, reason: "" };
  }

  // Default: allow until rideMoment
  return { ok: true, reason: "" };
}

function sameYmd(ymd, dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return ymd === `${y}-${m}-${d}`;
}