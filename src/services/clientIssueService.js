import { apiRequest } from "./api";

export async function createClientIssue(payload) {
  return apiRequest("/client-issues", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getMyClientIssues() {
  return apiRequest("/client-issues/mine", {
    method: "GET"
  });
}

export async function getClientIssues(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/client-issues?${query}` : "/client-issues";

  return apiRequest(endpoint, {
    method: "GET"
  });
}

export async function updateClientIssue(id, payload) {
  return apiRequest(`/client-issues/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteClientIssue(id) {
  return apiRequest(`/client-issues/${id}`, {
    method: "DELETE"
  });
}
