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
  const directToken = localStorage.getItem("smika_token");

  if (directToken && directToken !== "undefined" && directToken !== "null") {
    return directToken;
  }

  const possibleKeys = [
    "smika_auth",
    "smika_user",
    "auth",
    "user",
    "currentUser",
    "authData"
  ];

  for (const key of possibleKeys) {
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

function buildAuthHeaders() {
  const token = getStoredToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || "Ocurrió un error con la lista de pedido"
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

function normalizeVariantPayload(variant = null) {
  if (!variant) return {};

  if (typeof variant === "string") {
    return {
      varianteCodigo: variant
    };
  }

  return {
    ...(variant.codigo || variant.varianteCodigo || variant.code
      ? { varianteCodigo: variant.codigo || variant.varianteCodigo || variant.code }
      : {}),
    ...(variant.nombre || variant.varianteNombre || variant.name
      ? { varianteNombre: variant.nombre || variant.varianteNombre || variant.name }
      : {})
  };
}

export function hasCartToken() {
  return Boolean(getStoredToken());
}

export async function getCart() {
  const response = await fetch(`${API_URL}/cart`, {
    method: "GET",
    headers: buildAuthHeaders()
  });

  return parseResponse(response);
}

export async function addProductToCart(productId, cantidad = 1, variant = null) {
  const response = await fetch(`${API_URL}/cart/add`, {
    method: "POST",
    headers: buildAuthHeaders(),
    body: JSON.stringify({
      producto: productId,
      cantidad,
      ...normalizeVariantPayload(variant)
    })
  });

  return parseResponse(response);
}

export async function updateCartQuantity(productId, cantidad, variant = null) {
  const response = await fetch(`${API_URL}/cart/item`, {
    method: "PUT",
    headers: buildAuthHeaders(),
    body: JSON.stringify({
      producto: productId,
      cantidad,
      ...normalizeVariantPayload(variant)
    })
  });

  return parseResponse(response);
}

export async function removeProductFromCart(productId, variant = null) {
  const response = await fetch(`${API_URL}/cart/item`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
    body: JSON.stringify({
      producto: productId,
      ...normalizeVariantPayload(variant)
    })
  });

  return parseResponse(response);
}

export async function clearCart() {
  const response = await fetch(`${API_URL}/cart/clear`, {
    method: "DELETE",
    headers: buildAuthHeaders()
  });

  return parseResponse(response);
}

export async function generateCartWhatsApp() {
  const response = await fetch(`${API_URL}/cart/whatsapp`, {
    method: "POST",
    headers: buildAuthHeaders()
  });

  return parseResponse(response);
}