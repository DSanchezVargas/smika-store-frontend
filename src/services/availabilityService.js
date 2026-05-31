import { apiRequest } from "./api";

export async function getAvailabilities(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/availabilities?${query}` : "/availabilities";

  return apiRequest(endpoint, {
    method: "GET"
  });
}

export async function getAvailabilityById(id) {
  return apiRequest(`/availabilities/${id}`, {
    method: "GET"
  });
}

export async function createAvailability(payload) {
  return apiRequest("/availabilities", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateAvailability(id, payload) {
  return apiRequest(`/availabilities/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteAvailability(id, payload = {}) {
  return apiRequest(`/availabilities/${id}`, {
    method: "DELETE",
    body: JSON.stringify(payload)
  });
}

export async function syncAvailabilities() {
  return apiRequest("/availabilities/sync", {
    method: "POST"
  });
}