import { apiRequest } from "./apiClient.js";

export async function getRegistrationDays() {
  const data = await apiRequest("/registration-days");
  return data.config || { locked: false, allowedDates: [] };
}

export async function updateRegistrationDays(payload) {
  const data = await apiRequest("/registration-days", { method: "PATCH", body: payload });
  return data.config || { locked: false, allowedDates: [] };
}
