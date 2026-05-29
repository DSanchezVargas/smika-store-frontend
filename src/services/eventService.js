import { apiRequest } from "./api";

export async function getEvents(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/events?${query}` : "/events";

  return apiRequest(endpoint, {
    method: "GET"
  });
}

export async function getEventById(id) {
  return apiRequest(`/events/${id}`, {
    method: "GET"
  });
}

export async function createEvent(payload) {
  return apiRequest("/events", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateEvent(id, payload) {
  return apiRequest(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteEvent(id) {
  return apiRequest(`/events/${id}`, {
    method: "DELETE"
  });
}