// src/services/users.service.js
import { apiRequest } from "./apiClient.js";

export async function listUsers() {
  const data = await apiRequest("/users");
  return data.users || [];
}