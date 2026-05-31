import { apiRequest } from "./api";

export const PREFERENCE_CACHE_KEY = "smika_preferences_cache_v1";
export const PREFERENCE_EVENT_NAME = "smika-preferences-updated";

function getId(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item._id || item.id || item.productId || item.serieId || item.categoryId || "";
}

function normalizeId(value = "") {
  return value?.toString?.() || "";
}

function uniqueById(items = []) {
  const seen = new Set();

  return items.filter((item) => {
    const id = normalizeId(getId(item));
    const slug = typeof item === "object" ? item.slug || "" : "";
    const key = id || slug;

    if (!key) return false;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export function readCachedPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedPreferences(preferences) {
  try {
    if (!preferences) return;

    localStorage.setItem(PREFERENCE_CACHE_KEY, JSON.stringify(preferences));
    window.dispatchEvent(
      new CustomEvent(PREFERENCE_EVENT_NAME, {
        detail: preferences
      })
    );
  } catch {
    // No rompemos la interfaz si el navegador bloquea localStorage.
  }
}

export function clearCachedPreferences() {
  try {
    localStorage.removeItem(PREFERENCE_CACHE_KEY);
    window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT_NAME, { detail: null }));
  } catch {
    // No rompemos la interfaz si el navegador bloquea localStorage.
  }
}

export function normalizePreferences(preferences = {}) {
  return {
    ...preferences,
    productosFavoritos: uniqueById(preferences.productosFavoritos || []),
    listaDeseos: uniqueById(preferences.listaDeseos || []),
    seriesFavoritas: uniqueById(preferences.seriesFavoritas || []),
    categoriasFavoritas: uniqueById(preferences.categoriasFavoritas || []),
    recibirNotificaciones: preferences.recibirNotificaciones !== false
  };
}

export async function getMyPreferences() {
  const data = await apiRequest("/preferences/me", {
    method: "GET"
  });

  const preferences = normalizePreferences(data.preferences || data.data || data || {});

  writeCachedPreferences(preferences);

  return preferences;
}

export async function toggleFavoriteProduct(productId) {
  const data = await apiRequest(`/preferences/products/${productId}/favorite/toggle`, {
    method: "PATCH"
  });

  const freshPreferences = await getMyPreferences();

  return {
    ...data,
    preferences: freshPreferences
  };
}

export async function toggleWishlistProduct(productId) {
  const data = await apiRequest(`/preferences/wishlist/${productId}/toggle`, {
    method: "PATCH"
  });

  const freshPreferences = await getMyPreferences();

  return {
    ...data,
    preferences: freshPreferences
  };
}

export async function toggleFavoriteSeries(serieId) {
  const data = await apiRequest(`/preferences/series/${serieId}/toggle`, {
    method: "PATCH"
  });

  const freshPreferences = await getMyPreferences();

  return {
    ...data,
    preferences: freshPreferences
  };
}

export async function toggleFavoriteCategory(categoryId) {
  const data = await apiRequest(`/preferences/categories/${categoryId}/toggle`, {
    method: "PATCH"
  });

  const freshPreferences = await getMyPreferences();

  return {
    ...data,
    preferences: freshPreferences
  };
}

export function isProductFavorite(preferences, productIdOrSlug) {
  const value = normalizeId(productIdOrSlug);

  if (!value) return false;

  return (preferences?.productosFavoritos || []).some((product) => {
    return (
      normalizeId(getId(product)) === value ||
      normalizeId(product?.slug) === value ||
      normalizeId(product?.productId) === value
    );
  });
}

export function isProductInWishlist(preferences, productIdOrSlug) {
  const value = normalizeId(productIdOrSlug);

  if (!value) return false;

  return (preferences?.listaDeseos || []).some((product) => {
    return (
      normalizeId(getId(product)) === value ||
      normalizeId(product?.slug) === value ||
      normalizeId(product?.productId) === value
    );
  });
}
