// src/utils/constants.js
export const SHIFT = {
  MORNING: "morning",
  EVENING: "evening",
  NIGHT: "night",
};

export const DIRECTION = {
  PICKUP: "pickup",
  DROPOFF: "dropoff",
  BOTH: "both",
};

export const SITE = {
  CARMEL: "carmel",
  RAMBAM: "rambam",
};

export const SHIFT_LABEL = {
  [SHIFT.MORNING]: "בוקר",
  [SHIFT.EVENING]: "ערב",
  [SHIFT.NIGHT]: "לילה",
};

export const DIRECTION_LABEL = {
  [DIRECTION.PICKUP]: "איסוף",
  [DIRECTION.DROPOFF]: "פיזור",
  [DIRECTION.BOTH]:"איסוף + פיזור",
};

export const SITE_LABEL = {
  [SITE.CARMEL]: 'כרמל',
  [SITE.RAMBAM]: 'רמב"ם',
};