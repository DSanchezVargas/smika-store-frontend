import { apiRequest } from "./api";

export async function getProductTypes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = query ? `/product-types?${query}` : "/product-types";

  return apiRequest(endpoint, {
    method: "GET"
  });
}

export async function getProductTypeById(id) {
  return apiRequest(`/product-types/${id}`, {
    method: "GET"
  });
}

export async function createProductType(payload) {
  return apiRequest("/product-types", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateProductType(id, payload) {
  return apiRequest(`/product-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function deleteProductType(id) {
  return apiRequest(`/product-types/${id}`, {
    method: "DELETE"
  });
}