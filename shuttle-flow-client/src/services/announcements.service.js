import { apiRequest } from "./apiClient.js";

export async function listActiveAnnouncements() {
  const data = await apiRequest("/announcements");
  return data.announcements || [];
}

export async function listAllAnnouncements() {
  const data = await apiRequest("/announcements/all");
  return data.announcements || [];
}

export async function createAnnouncement(payload) {
  const data = await apiRequest("/announcements", { method: "POST", body: payload });
  return data.announcement;
}

export async function updateAnnouncement(id, payload) {
  const data = await apiRequest(`/announcements/${id}`, { method: "PATCH", body: payload });
  return data.announcement;
}

export async function deleteAnnouncement(id) {
  const data = await apiRequest(`/announcements/${id}`, { method: "DELETE" });
  return !!data?.ok;
}
