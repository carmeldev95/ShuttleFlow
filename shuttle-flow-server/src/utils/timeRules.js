// Mirrors your frontend rules. Admin bypass is handled in controller.

export function canEditRegistrationServer(reg, now = new Date()) {
  // if date passed => locked
  const regDate = new Date(reg.date + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (regDate < today) return { ok: false, reason: "עבר מועד ההסעה" };

  const hh = now.getHours();
  const mm = now.getMinutes();
  const minutes = hh * 60 + mm;

  // Rules:
  // - Evening pickup AND Morning dropoff until 10:00
  // - Night (pickup/dropoff) + next-day morning pickup until 16:00
  // This is domain-specific; we apply per shift/direction.
  const isMorning = reg.shift === "morning";
  const isEvening = reg.shift === "evening";
  const isNight = reg.shift === "night";

  const isPickup = reg.direction === "pickup" || reg.direction === "both";
  const isDropoff = reg.direction === "dropoff" || reg.direction === "both";

  if ((isEvening && isPickup) || (isMorning && isDropoff)) {
    if (minutes > 10 * 60) return { ok: false, reason: "נעול אחרי 10:00" };
  }

  if (isNight || (isMorning && isPickup)) {
    if (minutes > 16 * 60) return { ok: false, reason: "נעול אחרי 16:00" };
  }

  return { ok: true, reason: "" };
}