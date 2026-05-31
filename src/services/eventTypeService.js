import { apiRequest } from "./api";

export async function getEventTypes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/event-types?${query}` : "/event-types";

  return apiRequest(endpoint, {
    method: "GET"
  });
}

export async function getEventTypeById(id) {
  return apiRequest(`/event-types/${id}`, {
    method: "GET"
  });
}

export async function createEventType(payload) {
  return apiRequest("/event-types", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateEventType(id, payload) {
  return apiRequest(`/event-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteEventType(id) {
  return apiRequest(`/event-types/${id}`, {
    method: "DELETE"
  });
}