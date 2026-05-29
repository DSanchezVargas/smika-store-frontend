const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getCleanApiUrl() {
  return API_URL.replace(/\/$/, "");
}

function getStoredToken() {
  const token = localStorage.getItem("smika_token");

  if (!token || token === "undefined" || token === "null") {
    return "";
  }

  return token;
}

export const apiRequest = async (endpoint, options = {}) => {
  const token = getStoredToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getCleanApiUrl()}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || "Ocurrió un error en la solicitud."
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

export function getApiBaseUrl() {
  return getCleanApiUrl();
}