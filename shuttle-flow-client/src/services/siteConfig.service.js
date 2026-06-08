import { apiRequest } from "./apiClient.js";

export async function listSiteConfigs() {
  const data = await apiRequest("/site-config");
  return data.sites || [];
}

export async function createSiteConfig(payload) {
  const data = await apiRequest("/site-config", { method: "POST", body: payload });
  return data.site;
}

export async function updateSiteConfig(id, payload) {
  const data = await apiRequest(`/site-config/${id}`, { method: "PATCH", body: payload });
  return data.site;
}

export async function deleteSiteConfig(id) {
  const data = await apiRequest(`/site-config/${id}`, { method: "DELETE" });
  return !!data?.ok;
}
