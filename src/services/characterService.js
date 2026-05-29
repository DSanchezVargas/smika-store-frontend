import { apiRequest } from "./api";

export async function getCharacters(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/characters?${query}` : "/characters";

  return apiRequest(endpoint, {
    method: "GET"
  });
}

export async function getCharacterById(id) {
  return apiRequest(`/characters/${id}`, {
    method: "GET"
  });
}

export async function createCharacter(payload) {
  return apiRequest("/characters", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateCharacter(id, payload) {
  return apiRequest(`/characters/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteCharacter(id) {
  return apiRequest(`/characters/${id}`, {
    method: "DELETE"
  });
}