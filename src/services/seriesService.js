import { apiRequest } from "./api";

export async function getSeries(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/series?${query}` : "/series";

  return apiRequest(endpoint, {
    method: "GET"
  });
}

export async function getSeriesById(id) {
  return apiRequest(`/series/${id}`, {
    method: "GET"
  });
}

export async function createSeries(payload) {
  return apiRequest("/series", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateSeries(id, payload) {
  return apiRequest(`/series/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteSeries(id) {
  return apiRequest(`/series/${id}`, {
    method: "DELETE"
  });
}