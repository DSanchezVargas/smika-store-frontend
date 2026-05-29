const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getTokenFromObject(value) {
  if (!value || typeof value !== "object") return "";

  return (
    value.token ||
    value.accessToken ||
    value.jwt ||
    value.user?.token ||
    value.user?.accessToken ||
    value.data?.token ||
    value.data?.accessToken ||
    ""
  );
}

function getStoredToken() {
  const possibleTokenKeys = [
    "smika_token",
    "token",
    "authToken",
    "accessToken",
    "smika_auth_token"
  ];

  for (const key of possibleTokenKeys) {
    const value = localStorage.getItem(key);

    if (value && value !== "undefined" && value !== "null") {
      return value;
    }
  }

  const possibleObjectKeys = [
    "smika_auth",
    "smika_user",
    "auth",
    "user",
    "currentUser",
    "authData"
  ];

  for (const key of possibleObjectKeys) {
    try {
      const rawValue = localStorage.getItem(key);

      if (!rawValue || rawValue === "undefined" || rawValue === "null") {
        continue;
      }

      const parsedValue = JSON.parse(rawValue);
      const token = getTokenFromObject(parsedValue);

      if (token) return token;
    } catch {
      continue;
    }
  }

  return "";
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Ocurrió un error con productos");
  }

  return data;
}

function buildHeaders({ withAuth = false } = {}) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (withAuth) {
    const token = getStoredToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_URL}/products?${query}` : `${API_URL}/products`;

  const response = await fetch(url);

  return parseResponse(response);
}

export async function getProductByIdOrSlug(idOrSlug) {
  const response = await fetch(`${API_URL}/products/${idOrSlug}`);

  return parseResponse(response);
}

export async function createProduct(payload) {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: buildHeaders({
      withAuth: true
    }),
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
}

export async function updateProduct(productId, payload) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "PUT",
    headers: buildHeaders({
      withAuth: true
    }),
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
}

export async function deleteProduct(productId) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "DELETE",
    headers: buildHeaders({
      withAuth: true
    })
  });

  return parseResponse(response);
}