import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  createProduct as apiCreateProduct,
  deleteProduct as apiDeleteProduct,
  getProducts as apiGetProducts,
  updateProduct as apiUpdateProduct
} from "../services/productService";

import {
  createSeries as apiCreateSeries,
  deleteSeries as apiDeleteSeries,
  getSeries as apiGetSeries,
  updateSeries as apiUpdateSeries
} from "../services/seriesService";

import {
  createCharacter as apiCreateCharacter,
  deleteCharacter as apiDeleteCharacter,
  getCharacters as apiGetCharacters,
  updateCharacter as apiUpdateCharacter
} from "../services/characterService";

import {
  createEvent as apiCreateEvent,
  deleteEvent as apiDeleteEvent,
  getEvents as apiGetEvents,
  updateEvent as apiUpdateEvent
} from "../services/eventService";

const AdminDataContext = createContext(null);

const STORAGE_KEY = "smika_admin_data_v1";

function createSlug(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isMongoObjectId(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

function getId(item) {
  return item?._id || item?.id || "";
}

function getRelatedName(value, fallback = "") {
  if (value && typeof value === "object") {
    return value.nombre || value.titulo || value.name || fallback || "";
  }

  if (isMongoObjectId(value)) {
    return fallback || "";
  }

  return value || fallback || "";
}

function getImageSource(image) {
  if (!image) return "";

  if (typeof image === "string") return image.trim();

  if (typeof image === "object") {
    return (
      image.finalPreview ||
      image.url ||
      image.preview ||
      image.src ||
      image.imagen ||
      ""
    ).trim();
  }

  return "";
}

function normalizeImagesFromPayload(payload = {}) {
  const imagesFromArray = Array.isArray(payload.imagenes)
    ? payload.imagenes.map(getImageSource).filter(Boolean)
    : [];

  const imagesFromText = payload.imagenesTexto
    ? payload.imagenesTexto
        .split(",")
        .map((image) => image.trim())
        .filter(Boolean)
    : [];

  const mainImage = getImageSource(payload.imagen || payload.image);

  const images = [mainImage, ...imagesFromArray, ...imagesFromText].filter(
    Boolean
  );

  return [...new Set(images)];
}

function normalizeEstadoToDisponibilidad(estado = "") {
  const cleanEstado = estado.toString().toLowerCase();

  if (cleanEstado.includes("preventa")) return "preventa";
  if (cleanEstado.includes("pedido")) return "por_pedido";
  if (cleanEstado.includes("agotado")) return "agotado";

  return "stock";
}

function normalizeProductFromApi(product = {}) {
  const mongoId = getId(product);

  const serieNombre = getRelatedName(
    product.serie,
    product.serieNombre || product.series || ""
  );

  const eventoNombre = getRelatedName(
    product.evento,
    product.eventoNombre || product.event || ""
  );

  const categoriaNombre = getRelatedName(
    product.categoria,
    product.categoriaNombre || product.category || ""
  );

  const origenNombre = getRelatedName(
    product.origen,
    product.origenNombre || product.pais || ""
  );

  const precio = Number(
    product.precioReferencial ?? product.precio ?? product.price ?? 0
  );

  return {
    ...product,

    id: mongoId,
    _id: mongoId,

    nombre: product.nombre || product.name || "Producto Smika",
    slug: product.slug || createSlug(product.nombre || product.name || mongoId),

    serie: serieNombre,
    serieNombre,

    evento: eventoNombre,
    eventoNombre,

    categoria: categoriaNombre,
    categoriaNombre,

    origen: origenNombre,
    origenNombre,

    tipo: product.tipoProducto || product.tipo || product.type || "Producto",
    tipoProducto:
      product.tipoProducto || product.tipo || product.type || "Producto",

    personaje:
      product.personajeNombre ||
      product.personaje ||
      product.personajesNombre?.[0] ||
      "",

    personajesNombre: Array.isArray(product.personajesNombre)
      ? product.personajesNombre
      : [],

    precio,
    price: precio,
    precioReferencial: precio,

    stock: Number(product.stock || 0),
    tiempoEstimado: product.tiempoEstimado || "",

    estado: product.estado || "Activo",
    disponibilidad:
      product.disponibilidad ||
      normalizeEstadoToDisponibilidad(product.estado || "Activo"),

    activo: product.activo !== false,
    imagenes: Array.isArray(product.imagenes) ? product.imagenes : []
  };
}

function normalizeSeriesFromApi(serie = {}) {
  const mongoId = getId(serie);

  const categoriaNombre = getRelatedName(
    serie.categoriaPrincipal,
    serie.categoriaPrincipalNombre ||
      serie.categoriaNombre ||
      serie.categoria ||
      "Series"
  );

  const origenNombre = getRelatedName(
    serie.origen,
    serie.origenNombre || serie.pais || "Variado"
  );

  const imagenes = normalizeImagesFromPayload({
    imagen: serie.imagen,
    imagenes: serie.imagenes
  });

  const mainImage = serie.imagen || imagenes[0] || "";

  return {
    ...serie,

    id: mongoId,
    _id: mongoId,

    nombre: serie.nombre || serie.name || "Serie Smika",
    slug: serie.slug || createSlug(serie.nombre || mongoId),

    descripcion: serie.descripcion || "",

    imagen: mainImage,
    imagenes,

    categoria: categoriaNombre,
    categoriaNombre,
    categoriaPrincipalNombre: categoriaNombre,

    subcategoriaNombre:
      getRelatedName(serie.subcategoria, serie.subcategoriaNombre || "") || "",

    origen: origenNombre,
    origenNombre,

    pais: serie.pais || "V",
    tipo: serie.tipo || serie.categoria || "Historia",
    genero: serie.genero || "",

    autor:
      serie.autor ||
      serie.creadoresNombre?.join(", ") ||
      serie.creadores?.map((creator) => creator.nombre).join(", ") ||
      "",

    creadoresNombre: Array.isArray(serie.creadoresNombre)
      ? serie.creadoresNombre
      : [],

    destacada: Boolean(serie.destacada),
    activa: serie.activa !== false && serie.activo !== false,
    activo: serie.activa !== false && serie.activo !== false,

    orden: Number(serie.orden || 0)
  };
}

function normalizeCharacterFromApi(character = {}) {
  const mongoId = getId(character);

  const serieNombre = getRelatedName(
    character.serie,
    character.serieNombre || character.serieTexto || "Sin serie definida"
  );

  return {
    ...character,

    id: mongoId,
    _id: mongoId,

    nombre: character.nombre || character.name || "Personaje Smika",
    slug: character.slug || createSlug(character.nombre || mongoId),

    tipo: character.tipo || "Personaje",
    descripcion: character.descripcion || "",
    imagen: character.imagen || "",

    serie: serieNombre,
    serieNombre,

    estado:
      character.estado || (character.needsReview ? "Faltan detalles" : "Completo"),
    needsReview: Boolean(character.needsReview),

    activo: character.activo !== false
  };
}

function normalizeEventFromApi(event = {}) {
  const mongoId = getId(event);

  const titulo = event.titulo || event.nombre || event.name || "Evento Smika";

  const serieNombre = getRelatedName(
    event.serie,
    event.serieNombre || event.serieTexto || ""
  );

  const categoriaNombre = getRelatedName(
    event.categoria,
    event.categoriaNombre || "Eventos"
  );

  const origenNombre = getRelatedName(
    event.origen,
    event.origenNombre || event.pais || "Variado"
  );

  const imagenes = normalizeImagesFromPayload({
    imagen: event.imagen,
    imagenes: event.imagenes
  });

  const mainImage = event.imagen || imagenes[0] || "";

  return {
    ...event,

    id: mongoId,
    _id: mongoId,

    nombre: titulo,
    titulo,
    slug: event.slug || createSlug(titulo || mongoId),

    descripcion: event.descripcion || "",

    imagen: mainImage,
    imagenes,

    categoria: categoriaNombre,
    categoriaNombre,

    serie: serieNombre,
    serieNombre,

    origen: origenNombre,
    origenNombre,

    pais: event.pais || "V",
    tipo: event.tipo || event.tipoEvento || "Otro",
    tipoEvento: event.tipoEvento || event.tipo || "Otro",

    fechaInicio: event.fechaInicio || "",
    fechaFin: event.fechaFin || "",

    estado: event.estado || "proximo",
    destacado: Boolean(event.destacado),

    productos: Array.isArray(event.productos) ? event.productos : [],

    activo: event.activo !== false
  };
}

function buildProductPayloadForApi(payload = {}) {
  const precio = Number(
    payload.precioReferencial ?? payload.precio ?? payload.price ?? 0
  );

  const tipoProducto =
    payload.tipoProducto || payload.tipo || payload.type || "Producto";

  const estado = payload.estado || "Activo";

  const disponibilidad =
    payload.disponibilidad || normalizeEstadoToDisponibilidad(estado);

  const serieValue = payload.serie || payload.serieNombre || "";
  const eventoValue = payload.evento || payload.eventoNombre || "";
  const categoriaValue = payload.categoria || payload.categoriaNombre || "";
  const origenValue = payload.origen || payload.origenNombre || "Variado";

  return {
    nombre: payload.nombre || payload.name || "",
    descripcion:
      payload.descripcion ||
      "Producto registrado desde el panel administrador de Smika Store.",

    precioReferencial: precio,
    precio,
    price: precio,
    precioAnterior:
      payload.precioAnterior !== undefined && payload.precioAnterior !== ""
        ? Number(payload.precioAnterior)
        : null,

    imagenes: Array.isArray(payload.imagenes) ? payload.imagenes : [],

    categoria: isMongoObjectId(categoriaValue) ? categoriaValue : "",
    categoriaNombre: isMongoObjectId(categoriaValue)
      ? payload.categoriaNombre || ""
      : categoriaValue || "Productos",

    serie: isMongoObjectId(serieValue) ? serieValue : "",
    serieNombre: isMongoObjectId(serieValue)
      ? payload.serieNombre || ""
      : serieValue,

    evento: isMongoObjectId(eventoValue) ? eventoValue : "",
    eventoNombre: isMongoObjectId(eventoValue)
      ? payload.eventoNombre || ""
      : eventoValue,

    origen: isMongoObjectId(origenValue) ? origenValue : "",
    origenNombre: isMongoObjectId(origenValue)
      ? payload.origenNombre || ""
      : origenValue,

    personajes: Array.isArray(payload.personajes)
      ? payload.personajes.filter(isMongoObjectId)
      : [],

    personajesNombre: Array.isArray(payload.personajesNombre)
      ? payload.personajesNombre
      : payload.personaje
      ? [payload.personaje]
      : [],

    personajeNombre: payload.personajeNombre || payload.personaje || "",

    marca: payload.marca || "Smika Store",
    tipoProducto,

    material: payload.material || "",
    tamano: payload.tamano || "",

    disponibilidad,
    estado,

    stock: Number(payload.stock || 0),
    tiempoEstimado: payload.tiempoEstimado || "",

    adulto: Boolean(payload.adulto),
    esNuevo: payload.esNuevo !== undefined ? Boolean(payload.esNuevo) : true,
    esDestacado:
      payload.esDestacado !== undefined ? Boolean(payload.esDestacado) : false,

    activo:
      payload.activo !== undefined ? Boolean(payload.activo) : estado !== "Inactivo"
  };
}

function buildSeriesPayloadForApi(payload = {}) {
  const imagenes = normalizeImagesFromPayload(payload);
  const mainImage = getImageSource(payload.imagen) || imagenes[0] || "";

  return {
    nombre: payload.nombre || payload.name || "",
    descripcion: payload.descripcion || "",

    imagen: mainImage,
    imagenes,

    categoriaPrincipal: isMongoObjectId(payload.categoriaPrincipal)
      ? payload.categoriaPrincipal
      : "",

    categoriaPrincipalNombre:
      payload.categoriaPrincipalNombre ||
      payload.categoriaNombre ||
      payload.categoria ||
      "Series",

    subcategoria: isMongoObjectId(payload.subcategoria)
      ? payload.subcategoria
      : "",

    subcategoriaNombre: payload.subcategoriaNombre || "",

    origen: isMongoObjectId(payload.origen) ? payload.origen : "",
    origenNombre:
      payload.origenNombre || payload.paisNombre || payload.origen || "Variado",

    pais: payload.pais || "V",

    tipo: payload.tipo || "Historia",
    genero: payload.genero || "",

    creadores: Array.isArray(payload.creadores)
      ? payload.creadores.filter(isMongoObjectId)
      : [],

    creadoresNombre: Array.isArray(payload.creadoresNombre)
      ? payload.creadoresNombre
      : payload.autor
      ? [payload.autor]
      : [],

    destacada: Boolean(payload.destacada),
    activa:
      payload.activa !== undefined
        ? Boolean(payload.activa)
        : payload.activo !== undefined
        ? Boolean(payload.activo)
        : true,

    activo:
      payload.activo !== undefined
        ? Boolean(payload.activo)
        : payload.activa !== undefined
        ? Boolean(payload.activa)
        : true,

    orden:
      payload.orden !== undefined && payload.orden !== ""
        ? Number(payload.orden)
        : 0
  };
}

function buildCharacterPayloadForApi(payload = {}) {
  const serieValue = payload.serie || payload.serieNombre || "";

  return {
    nombre: payload.nombre || payload.name || "",
    tipo: payload.tipo || "Personaje",
    descripcion: payload.descripcion || "",
    imagen: payload.imagen || "",

    serie: isMongoObjectId(serieValue) ? serieValue : "",
    serieNombre: isMongoObjectId(serieValue)
      ? payload.serieNombre || ""
      : serieValue || "Sin serie definida",

    estado:
      payload.estado || (payload.needsReview ? "Faltan detalles" : "Completo"),
    needsReview: Boolean(payload.needsReview),

    activo: payload.activo !== undefined ? Boolean(payload.activo) : true
  };
}

function buildEventPayloadForApi(payload = {}) {
  const titulo = payload.titulo || payload.nombre || payload.name || "";
  const serieValue = payload.serie || payload.serieNombre || "";
  const categoriaValue = payload.categoria || payload.categoriaNombre || "";
  const origenValue = payload.origen || payload.origenNombre || payload.pais || "";

  const imagenes = normalizeImagesFromPayload(payload);
  const mainImage = getImageSource(payload.imagen) || imagenes[0] || "";

  return {
    titulo,
    nombre: titulo,
    descripcion: payload.descripcion || "",

    imagen: mainImage,
    imagenes,

    categoria: isMongoObjectId(categoriaValue) ? categoriaValue : "",
    categoriaNombre: isMongoObjectId(categoriaValue)
      ? payload.categoriaNombre || ""
      : categoriaValue || "Eventos",

    serie: isMongoObjectId(serieValue) ? serieValue : "",
    serieNombre: isMongoObjectId(serieValue)
      ? payload.serieNombre || ""
      : serieValue,

    origen: isMongoObjectId(origenValue) ? origenValue : "",
    origenNombre: isMongoObjectId(origenValue)
      ? payload.origenNombre || ""
      : origenValue || "Variado",

    pais: payload.pais || "V",

    tipoEvento: payload.tipoEvento || payload.tipo || "Otro",

    fechaInicio: payload.fechaInicio || null,
    fechaFin: payload.fechaFin || null,

    estado: payload.estado || "proximo",
    destacado: Boolean(payload.destacado),

    productos: Array.isArray(payload.productos)
      ? payload.productos.filter(isMongoObjectId)
      : [],

    activo: payload.activo !== undefined ? Boolean(payload.activo) : true
  };
}

const defaultAdminData = {
  products: [],
  series: [],
  events: [],
  characters: [],
  users: []
};

function getInitialAdminData() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (!storedData) return defaultAdminData;

    const parsedData = JSON.parse(storedData);

    return {
      ...defaultAdminData,
      ...parsedData,
      products: [],
      series: [],
      events: [],
      characters: []
    };
  } catch (error) {
    console.error("No se pudo leer la información local de Smika.", error);
    return defaultAdminData;
  }
}

export function AdminDataProvider({ children }) {
  const [adminData, setAdminData] = useState(getInitialAdminData);
  const [storageError, setStorageError] = useState("");

  const [productLoadError, setProductLoadError] = useState("");
  const [seriesLoadError, setSeriesLoadError] = useState("");
  const [charactersLoadError, setCharactersLoadError] = useState("");
  const [eventsLoadError, setEventsLoadError] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const updateCollection = (collectionName, updater) => {
    setAdminData((currentData) => {
      const currentCollection = currentData[collectionName] || [];

      const nextCollection =
        typeof updater === "function" ? updater(currentCollection) : updater;

      return {
        ...currentData,
        [collectionName]: nextCollection
      };
    });
  };

  const refreshProducts = async () => {
    setLoadingProducts(true);
    setProductLoadError("");

    try {
      const data = await apiGetProducts({
        activos: "false"
      });

      const productsFromApi = data.products || data.productos || data.data || [];
      const normalizedProducts = productsFromApi
        .map(normalizeProductFromApi)
        .filter((product) => isMongoObjectId(product._id || product.id));

      updateCollection("products", normalizedProducts);

      return normalizedProducts;
    } catch (error) {
      setProductLoadError(
        error.message || "No se pudieron cargar los productos desde MongoDB."
      );

      return [];
    } finally {
      setLoadingProducts(false);
    }
  };

  const refreshSeries = async () => {
    setLoadingSeries(true);
    setSeriesLoadError("");

    try {
      const data = await apiGetSeries({
        activos: "false"
      });

      const seriesFromApi = data.series || data.data || [];
      const normalizedSeries = seriesFromApi
        .map(normalizeSeriesFromApi)
        .filter((serie) => isMongoObjectId(serie._id || serie.id));

      updateCollection("series", normalizedSeries);

      return normalizedSeries;
    } catch (error) {
      setSeriesLoadError(
        error.message || "No se pudieron cargar las series desde MongoDB."
      );

      return [];
    } finally {
      setLoadingSeries(false);
    }
  };

  const refreshCharacters = async () => {
    setLoadingCharacters(true);
    setCharactersLoadError("");

    try {
      const data = await apiGetCharacters({
        activos: "false"
      });

      const charactersFromApi = data.characters || data.data || [];
      const normalizedCharacters = charactersFromApi
        .map(normalizeCharacterFromApi)
        .filter((character) => isMongoObjectId(character._id || character.id));

      updateCollection("characters", normalizedCharacters);

      return normalizedCharacters;
    } catch (error) {
      setCharactersLoadError(
        error.message || "No se pudieron cargar los personajes desde MongoDB."
      );

      return [];
    } finally {
      setLoadingCharacters(false);
    }
  };

  const refreshEvents = async () => {
    setLoadingEvents(true);
    setEventsLoadError("");

    try {
      const data = await apiGetEvents({
        activos: "false"
      });

      const eventsFromApi = data.events || data.eventos || data.data || [];
      const normalizedEvents = eventsFromApi
        .map(normalizeEventFromApi)
        .filter((event) => isMongoObjectId(event._id || event.id));

      updateCollection("events", normalizedEvents);

      return normalizedEvents;
    } catch (error) {
      setEventsLoadError(
        error.message || "No se pudieron cargar los eventos desde MongoDB."
      );

      return [];
    } finally {
      setLoadingEvents(false);
    }
  };

  const refreshAdminData = async () => {
    await Promise.all([
      refreshProducts(),
      refreshSeries(),
      refreshCharacters(),
      refreshEvents()
    ]);
  };

  useEffect(() => {
    refreshAdminData();
  }, []);

  useEffect(() => {
    try {
      const dataToStore = {
        ...adminData,
        products: adminData.products.filter((product) =>
          isMongoObjectId(product._id || product.id)
        ),
        series: adminData.series.filter((serie) =>
          isMongoObjectId(serie._id || serie.id)
        ),
        events: adminData.events.filter((event) =>
          isMongoObjectId(event._id || event.id)
        ),
        characters: adminData.characters.filter((character) =>
          isMongoObjectId(character._id || character.id)
        )
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      setStorageError("");
    } catch (error) {
      console.error("No se pudo guardar la información local de Smika.", error);
      setStorageError(
        "No se pudo guardar localmente. Puede que el navegador haya llegado al límite de almacenamiento."
      );
    }
  }, [adminData]);

  const createProduct = async (payload) => {
    const apiPayload = buildProductPayloadForApi(payload);
    const data = await apiCreateProduct(apiPayload);
    const createdProduct = normalizeProductFromApi(data.product);

    if (!isMongoObjectId(createdProduct._id || createdProduct.id)) {
      throw new Error("El backend no devolvió un ID válido de MongoDB.");
    }

    updateCollection("products", (currentProducts) => [
      createdProduct,
      ...currentProducts.filter(
        (product) =>
          (product._id || product.id) !==
          (createdProduct._id || createdProduct.id)
      )
    ]);

    return createdProduct;
  };

  const updateProduct = async (productId, payload) => {
    if (!isMongoObjectId(productId)) {
      throw new Error(
        "Este producto no tiene un ID válido de MongoDB. Crea el producto nuevamente desde el panel."
      );
    }

    const apiPayload = buildProductPayloadForApi(payload);
    const data = await apiUpdateProduct(productId, apiPayload);
    const updatedProduct = normalizeProductFromApi(data.product);

    updateCollection("products", (currentProducts) =>
      currentProducts.map((product) =>
        (product._id || product.id) === productId ? updatedProduct : product
      )
    );

    return updatedProduct;
  };

  const toggleProductStatus = async (productId) => {
    if (!isMongoObjectId(productId)) {
      throw new Error(
        "Este producto no tiene un ID válido de MongoDB. No se puede activar o desactivar."
      );
    }

    const product = adminData.products.find(
      (item) => (item._id || item.id) === productId
    );

    if (!product) {
      throw new Error("Producto no encontrado en el panel.");
    }

    if (product.activo) {
      await apiDeleteProduct(productId);

      const disabledProduct = {
        ...product,
        activo: false,
        estado: "Inactivo",
        updatedAt: new Date().toISOString()
      };

      updateCollection("products", (currentProducts) =>
        currentProducts.map((item) =>
          (item._id || item.id) === productId ? disabledProduct : item
        )
      );

      return disabledProduct;
    }

    const enabledPayload = buildProductPayloadForApi({
      ...product,
      activo: true,
      estado: "Activo"
    });

    const data = await apiUpdateProduct(productId, enabledPayload);
    const enabledProduct = normalizeProductFromApi(data.product);

    updateCollection("products", (currentProducts) =>
      currentProducts.map((item) =>
        (item._id || item.id) === productId ? enabledProduct : item
      )
    );

    return enabledProduct;
  };

  const createSeriesFull = async (payload) => {
    const apiPayload = buildSeriesPayloadForApi(payload);
    const data = await apiCreateSeries(apiPayload);
    const createdSeries = normalizeSeriesFromApi(data.serie);

    updateCollection("series", (currentSeries) => [
      createdSeries,
      ...currentSeries.filter(
        (serie) =>
          (serie._id || serie.id) !==
          (createdSeries._id || createdSeries.id)
      )
    ]);

    return createdSeries;
  };

  const updateSeriesFull = async (seriesId, payload) => {
    const apiPayload = buildSeriesPayloadForApi(payload);
    const data = await apiUpdateSeries(seriesId, apiPayload);
    const updatedSeries = normalizeSeriesFromApi(data.serie);

    updateCollection("series", (currentSeries) =>
      currentSeries.map((serie) =>
        (serie._id || serie.id) === seriesId ? updatedSeries : serie
      )
    );

    return updatedSeries;
  };

  const toggleSeriesStatus = async (seriesId) => {
    const serie = adminData.series.find(
      (item) => (item._id || item.id) === seriesId
    );

    if (!serie) {
      throw new Error("Serie no encontrada.");
    }

    if (serie.activo) {
      await apiDeleteSeries(seriesId);

      const disabledSeries = {
        ...serie,
        activo: false,
        activa: false
      };

      updateCollection("series", (currentSeries) =>
        currentSeries.map((item) =>
          (item._id || item.id) === seriesId ? disabledSeries : item
        )
      );

      return disabledSeries;
    }

    const data = await apiUpdateSeries(seriesId, {
      ...buildSeriesPayloadForApi(serie),
      activo: true,
      activa: true
    });

    const enabledSeries = normalizeSeriesFromApi(data.serie);

    updateCollection("series", (currentSeries) =>
      currentSeries.map((item) =>
        (item._id || item.id) === seriesId ? enabledSeries : item
      )
    );

    return enabledSeries;
  };

  const createCharacterQuick = async ({ name, serie = "" }) => {
    const cleanName = name?.trim();
    const cleanSerie = serie?.trim() || "Sin serie definida";

    if (!cleanName) return null;

    const existingCharacter = adminData.characters.find(
      (character) =>
        character.nombre.toLowerCase() === cleanName.toLowerCase() &&
        character.serie.toLowerCase() === cleanSerie.toLowerCase()
    );

    if (existingCharacter) return existingCharacter;

    const data = await apiCreateCharacter(
      buildCharacterPayloadForApi({
        nombre: cleanName,
        serie: cleanSerie,
        serieNombre: cleanSerie,
        descripcion:
          "Personaje agregado rápidamente desde un producto. Falta completar sus detalles.",
        estado: "Faltan detalles",
        needsReview: true,
        activo: true
      })
    );

    const createdCharacter = normalizeCharacterFromApi(data.character);

    updateCollection("characters", (currentCharacters) => [
      createdCharacter,
      ...currentCharacters.filter(
        (character) =>
          (character._id || character.id) !==
          (createdCharacter._id || createdCharacter.id)
      )
    ]);

    return createdCharacter;
  };

  const createCharacterFull = async (payload) => {
    const apiPayload = buildCharacterPayloadForApi(payload);
    const data = await apiCreateCharacter(apiPayload);
    const createdCharacter = normalizeCharacterFromApi(data.character);

    updateCollection("characters", (currentCharacters) => [
      createdCharacter,
      ...currentCharacters.filter(
        (character) =>
          (character._id || character.id) !==
          (createdCharacter._id || createdCharacter.id)
      )
    ]);

    return createdCharacter;
  };

  const updateCharacter = async (characterId, payload) => {
    const apiPayload = buildCharacterPayloadForApi(payload);
    const data = await apiUpdateCharacter(characterId, apiPayload);
    const updatedCharacter = normalizeCharacterFromApi(data.character);

    updateCollection("characters", (currentCharacters) =>
      currentCharacters.map((character) =>
        (character._id || character.id) === characterId
          ? updatedCharacter
          : character
      )
    );

    return updatedCharacter;
  };

  const toggleCharacterStatus = async (characterId) => {
    const character = adminData.characters.find(
      (item) => (item._id || item.id) === characterId
    );

    if (!character) {
      throw new Error("Personaje no encontrado.");
    }

    if (character.activo) {
      await apiDeleteCharacter(characterId);

      const disabledCharacter = {
        ...character,
        activo: false
      };

      updateCollection("characters", (currentCharacters) =>
        currentCharacters.map((item) =>
          (item._id || item.id) === characterId ? disabledCharacter : item
        )
      );

      return disabledCharacter;
    }

    const data = await apiUpdateCharacter(characterId, {
      ...buildCharacterPayloadForApi(character),
      activo: true
    });

    const enabledCharacter = normalizeCharacterFromApi(data.character);

    updateCollection("characters", (currentCharacters) =>
      currentCharacters.map((item) =>
        (item._id || item.id) === characterId ? enabledCharacter : item
      )
    );

    return enabledCharacter;
  };

  const createEventFull = async (payload) => {
    const apiPayload = buildEventPayloadForApi(payload);
    const data = await apiCreateEvent(apiPayload);
    const createdEvent = normalizeEventFromApi(data.event);

    updateCollection("events", (currentEvents) => [
      createdEvent,
      ...currentEvents.filter(
        (event) => (event._id || event.id) !== (createdEvent._id || createdEvent.id)
      )
    ]);

    return createdEvent;
  };

  const updateEventFull = async (eventId, payload) => {
    const apiPayload = buildEventPayloadForApi(payload);
    const data = await apiUpdateEvent(eventId, apiPayload);
    const updatedEvent = normalizeEventFromApi(data.event);

    updateCollection("events", (currentEvents) =>
      currentEvents.map((event) =>
        (event._id || event.id) === eventId ? updatedEvent : event
      )
    );

    return updatedEvent;
  };

  const toggleEventStatus = async (eventId) => {
    const event = adminData.events.find(
      (item) => (item._id || item.id) === eventId
    );

    if (!event) {
      throw new Error("Evento no encontrado.");
    }

    if (event.activo) {
      await apiDeleteEvent(eventId);

      const disabledEvent = {
        ...event,
        activo: false
      };

      updateCollection("events", (currentEvents) =>
        currentEvents.map((item) =>
          (item._id || item.id) === eventId ? disabledEvent : item
        )
      );

      return disabledEvent;
    }

    const data = await apiUpdateEvent(eventId, {
      ...buildEventPayloadForApi(event),
      activo: true
    });

    const enabledEvent = normalizeEventFromApi(data.event);

    updateCollection("events", (currentEvents) =>
      currentEvents.map((item) =>
        (item._id || item.id) === eventId ? enabledEvent : item
      )
    );

    return enabledEvent;
  };

  const value = useMemo(
    () => ({
      storageError,

      productLoadError,
      seriesLoadError,
      charactersLoadError,
      eventsLoadError,

      loadingProducts,
      loadingSeries,
      loadingCharacters,
      loadingEvents,

      products: adminData.products,
      series: adminData.series,
      events: adminData.events,
      characters: adminData.characters,
      users: adminData.users,

      refreshAdminData,
      refreshProducts,
      refreshSeries,
      refreshCharacters,
      refreshEvents,

      createProduct,
      updateProduct,
      toggleProductStatus,

      createSeriesFull,
      updateSeriesFull,
      toggleSeriesStatus,

      createCharacterQuick,
      createCharacterFull,
      updateCharacter,
      toggleCharacterStatus,

      createEventFull,
      updateEventFull,
      toggleEventStatus
    }),
    [
      storageError,

      productLoadError,
      seriesLoadError,
      charactersLoadError,
      eventsLoadError,

      loadingProducts,
      loadingSeries,
      loadingCharacters,
      loadingEvents,

      adminData
    ]
  );

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error("useAdminData debe usarse dentro de AdminDataProvider");
  }

  return context;
}