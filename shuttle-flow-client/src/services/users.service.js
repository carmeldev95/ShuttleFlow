// src/services/users.service.js
import { apiRequest } from "./apiClient.js";

export async function listUsers() {
  const data = await apiRequest("/users");
  return data.users || [];
}

export async function updateUser(userId, payload) {
  const data = await apiRequest(`/users/${userId}`, { method: "PATCH", body: payload });
  return data.user;
}