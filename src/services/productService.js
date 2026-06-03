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

function buildHeaders({ withAuth = false, noCache = false } = {}) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (noCache) {
    headers["Cache-Control"] = "no-cache";
    headers.Pragma = "no-cache";
  }

  if (withAuth) {
    const token = getStoredToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function getProducts(params = {}) {
  const query = new URLSearchParams({
    ...params,
    _t: Date.now().toString()
  }).toString();

  const url = `${API_URL}/products?${query}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: buildHeaders({ noCache: true })
  });

  return parseResponse(response);
}

export async function getProductByIdOrSlug(idOrSlug) {
  const response = await fetch(`${API_URL}/products/${idOrSlug}?_t=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
    headers: buildHeaders({ noCache: true })
  });

  return parseResponse(response);
}

export async function createProduct(payload) {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    cache: "no-store",
    headers: buildHeaders({
      withAuth: true,
      noCache: true
    }),
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
}

export async function updateProduct(productId, payload) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "PUT",
    cache: "no-store",
    headers: buildHeaders({
      withAuth: true,
      noCache: true
    }),
    body: JSON.stringify(payload)
  });

  return parseResponse(response);
}

export async function deleteProduct(productId) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "DELETE",
    cache: "no-store",
    headers: buildHeaders({
      withAuth: true,
      noCache: true
    })
  });

  return parseResponse(response);
}