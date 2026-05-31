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
  createEvent as apiCreateEvent,
  deleteEvent as apiDeleteEvent,
  getEvents as apiGetEvents,
  updateEvent as apiUpdateEvent
} from "../services/eventService";

import {
  createCharacter as apiCreateCharacter,
  deleteCharacter as apiDeleteCharacter,
  getCharacters as apiGetCharacters,
  updateCharacter as apiUpdateCharacter
} from "../services/characterService";

import {
  createCategory as apiCreateCategory,
  deleteCategory as apiDeleteCategory,
  getCategories as apiGetCategories,
  updateCategory as apiUpdateCategory
} from "../services/categoryService";

import {
  createCreator as apiCreateCreator,
  deleteCreator as apiDeleteCreator,
  getCreators as apiGetCreators,
  updateCreator as apiUpdateCreator
} from "../services/creatorService";

import {
  createOrigin as apiCreateOrigin,
  deleteOrigin as apiDeleteOrigin,
  getOrigins as apiGetOrigins,
  updateOrigin as apiUpdateOrigin
} from "../services/originService";

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

function getTextValue(...values) {
  const found = values.find(
    (value) => value !== undefined && value !== null && value !== ""
  );

  if (Array.isArray(found)) return found.join(", ").trim();

  if (found && typeof found === "object") {
    return found.nombre || found.titulo || found.name || "";
  }

  return found ? found.toString().trim() : "";
}

function getRelatedName(value, fallback = "") {
  if (value && typeof value === "object") {
    return value.nombre || value.titulo || value.name || fallback || "";
  }

  if (isMongoObjectId(value)) return fallback || "";

  return value || fallback || "";
}

function getImageSource(image) {
  if (!image) return "";

  if (typeof image === "string") return image;

  if (typeof image === "object") {
    return (
      image.finalPreview ||
      image.url ||
      image.preview ||
      image.src ||
      image.imagen ||
      ""
    );
  }

  return "";
}

function normalizeImageList(images = []) {
  if (!Array.isArray(images)) return [];

  const seenImages = new Set();

  return images
    .map(getImageSource)
    .filter(Boolean)
    .filter((image) => {
      if (seenImages.has(image)) return false;
      seenImages.add(image);
      return true;
    });
}

function normalizeArrayText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => getTextValue(item)).filter(Boolean);
  }

  const text = getTextValue(value);

  if (!text) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEstadoToDisponibilidad(estado = "") {
  const cleanEstado = estado.toString().toLowerCase();

  if (cleanEstado.includes("preventa")) return "preventa";
  if (cleanEstado.includes("pedido")) return "por_pedido";
  if (cleanEstado.includes("agotado")) return "agotado";

  return "stock";
}

function shouldSendImages(payload = {}, includeImages = false) {
  if (includeImages) return true;

  return (
    payload.imagenesTouched === true ||
    payload.imagesTouched === true ||
    payload.replaceImages === true ||
    payload.reemplazarImagenes === true
  );
}

function normalizeCategoryFromApi(category = {}) {
  const mongoId = getId(category);

  return {
    ...category,
    id: mongoId,
    _id: mongoId,
    nombre: category.nombre || category.name || "Categoría",
    slug: category.slug || createSlug(category.nombre || mongoId),
    descripcion: category.descripcion || "",
    tipo: category.tipo || "principal",
    categoriaPadre: category.categoriaPadre || null,
    categoriaPadreNombre:
      category.categoriaPadre?.nombre || category.categoriaPadreNombre || "",
    imagen: category.imagen || "",
    orden: Number(category.orden || 0),
    activa: category.activa !== false,
    activo: category.activa !== false
  };
}

function normalizeCreatorFromApi(creator = {}) {
  const mongoId = getId(creator);

  return {
    ...creator,
    id: mongoId,
    _id: mongoId,
    nombre: creator.nombre || creator.name || "Creador",
    slug: creator.slug || createSlug(creator.nombre || mongoId),
    tipo: creator.tipo || "Autor",
    descripcion: creator.descripcion || "",
    paisOrigen: creator.paisOrigen || "",
    activo: creator.activo !== false
  };
}

function normalizeOriginFromApi(origin = {}) {
  const mongoId = getId(origin);

  return {
    ...origin,
    id: mongoId,
    _id: mongoId,
    nombre: origin.nombre || origin.name || "Origen",
    slug: origin.slug || createSlug(origin.nombre || mongoId),
    descripcion: origin.descripcion || "",
    activo: origin.activo !== false
  };
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

  const categoriaId =
    typeof product.categoria === "string"
      ? product.categoria
      : getId(product.categoria);

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
    categoriaId,
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

  const coverImage = getImageSource(serie.imagen);
  const carouselImages = normalizeImageList(serie.imagenes).filter(
    (image) => image !== coverImage
  );

  const categoriaNombre =
    getRelatedName(
      serie.categoriaPrincipal,
      serie.categoriaPrincipalNombre ||
        serie.categoriaNombre ||
        serie.categoria ||
        "Series"
    ) || "Series";

  const origenNombre =
    getRelatedName(serie.origen, serie.origenNombre || serie.pais || "Variado") ||
    "Variado";

  const creadoresNombre = Array.isArray(serie.creadoresNombre)
    ? serie.creadoresNombre.filter(Boolean)
    : normalizeArrayText(serie.autor);

  return {
    ...serie,

    id: mongoId,
    _id: mongoId,

    nombre: serie.nombre || serie.name || "Serie Smika",
    slug: serie.slug || createSlug(serie.nombre || mongoId),

    descripcion: serie.descripcion || "",

    imagen: coverImage,
    imagenes: carouselImages,

    categoria: categoriaNombre,
    categoriaNombre,
    categoriaPrincipalNombre: categoriaNombre,

    subcategoriaNombre:
      getRelatedName(serie.subcategoria, serie.subcategoriaNombre || "") || "",

    origen: origenNombre,
    origenNombre,

    pais: serie.pais || "V",
    tipo: serie.tipo || categoriaNombre || "Historia",
    genero: serie.genero || "",

    autor: creadoresNombre.join(", "),
    creadoresNombre,

    destacada: Boolean(serie.destacada),
    activa: serie.activa !== false && serie.activo !== false,
    activo: serie.activa !== false && serie.activo !== false,

    orden: Number(serie.orden || 0)
  };
}

function normalizeEventFromApi(event = {}) {
  const mongoId = getId(event);

  const title = event.titulo || event.nombre || event.name || "Evento Smika";

  const coverImage = getImageSource(event.imagen);
  const carouselImages = normalizeImageList(event.imagenes).filter(
    (image) => image !== coverImage
  );

  const seriesNombre = Array.isArray(event.seriesNombre)
    ? event.seriesNombre.filter(Boolean)
    : [
        getRelatedName(event.serie, event.serieNombre || ""),
        event.serieNombre
      ].filter(Boolean);

  const uniqueSeriesNombre = [...new Set(seriesNombre)];

  const seriesIds = Array.isArray(event.series)
    ? event.series
        .map((serie) => {
          if (typeof serie === "string") return serie;
          return getId(serie);
        })
        .filter(isMongoObjectId)
    : [];

  const legacySerieId =
    typeof event.serie === "string" && isMongoObjectId(event.serie)
      ? event.serie
      : getId(event.serie);

  const finalSeriesIds = [
    ...new Set([legacySerieId, ...seriesIds].filter(isMongoObjectId))
  ];

  const categoriaNombre =
    getRelatedName(event.categoria, event.categoriaNombre || "Eventos") ||
    "Eventos";

  const origenNombre =
    getRelatedName(event.origen, event.origenNombre || event.pais || "Variado") ||
    "Variado";

  return {
    ...event,

    id: mongoId,
    _id: mongoId,

    nombre: title,
    titulo: title,
    slug: event.slug || createSlug(title || mongoId),

    descripcion: event.descripcion || "",

    imagen: coverImage,
    imagenes: carouselImages,

    categoria: categoriaNombre,
    categoriaNombre,

    serie: uniqueSeriesNombre[0] || "",
    serieNombre: uniqueSeriesNombre[0] || "",

    series: finalSeriesIds,
    seriesNombre: uniqueSeriesNombre,

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

function buildCategoryPayloadForApi(payload = {}) {
  return {
    nombre: payload.nombre || "",
    descripcion: payload.descripcion || "",
    tipo: payload.tipo || "principal",
    categoriaPadre: isMongoObjectId(payload.categoriaPadre)
      ? payload.categoriaPadre
      : "",
    imagen: payload.imagen || "",
    orden:
      payload.orden !== undefined && payload.orden !== ""
        ? Number(payload.orden)
        : 0,
    activa:
      payload.activa !== undefined
        ? Boolean(payload.activa)
        : payload.activo !== undefined
        ? Boolean(payload.activo)
        : true
  };
}

function buildCreatorPayloadForApi(payload = {}) {
  return {
    nombre: payload.nombre || "",
    tipo: payload.tipo || "Autor",
    descripcion: payload.descripcion || "",
    paisOrigen: payload.paisOrigen || "",
    activo:
      payload.activo !== undefined
        ? Boolean(payload.activo)
        : true
  };
}

function buildOriginPayloadForApi(payload = {}) {
  return {
    nombre: payload.nombre || "",
    descripcion: payload.descripcion || "",
    activo:
      payload.activo !== undefined
        ? Boolean(payload.activo)
        : true
  };
}

function buildProductPayloadForApi(payload = {}, options = {}) {
  const precio = Number(
    payload.precioReferencial ?? payload.precio ?? payload.price ?? 0
  );

  const estado = payload.estado || "Activo";
  const disponibilidad =
    payload.disponibilidad || normalizeEstadoToDisponibilidad(estado);

  const serieValue = payload.serieId || payload.serie || payload.serieNombre || "";
  const eventoValue =
    payload.eventoId || payload.evento || payload.eventoNombre || "";

  const categoriaValue =
    payload.categoriaId || payload.categoria || payload.categoriaNombre || "";

  const origenValue = payload.origen || payload.origenNombre || "Variado";

  const apiPayload = {
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

    categoria: isMongoObjectId(categoriaValue) ? categoriaValue : "",
    categoriaNombre: payload.categoriaNombre || "",

    subcategoria: isMongoObjectId(payload.subcategoria)
      ? payload.subcategoria
      : "",
    subcategoriaNombre: payload.subcategoriaNombre || "",

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
    tipoProducto: payload.tipoProducto || payload.tipo || payload.type || "Producto",

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

  if (shouldSendImages(payload, options.includeImages === true)) {
    apiPayload.imagenes = Array.isArray(payload.imagenes)
      ? payload.imagenes
      : [];
    apiPayload.imagenesTouched = true;
  }

  return apiPayload;
}

function buildSeriesPayloadForApi(payload = {}, options = {}) {
  const categoryName =
    payload.categoriaPrincipalNombre ||
    payload.categoriaNombre ||
    payload.categoria ||
    "Series";

  const originName =
    payload.origenNombre || payload.paisNombre || payload.origen || "Variado";

  const apiPayload = {
    nombre: payload.nombre || payload.name || "",
    descripcion: payload.descripcion || "",

    categoriaPrincipal: isMongoObjectId(payload.categoriaPrincipal)
      ? payload.categoriaPrincipal
      : "",

    categoriaPrincipalNombre: categoryName,
    categoriaNombre: categoryName,

    subcategoria: isMongoObjectId(payload.subcategoria)
      ? payload.subcategoria
      : "",

    subcategoriaNombre: payload.subcategoriaNombre || "",

    origen: isMongoObjectId(payload.origen) ? payload.origen : "",
    origenNombre: originName,

    pais: payload.pais || originName || "V",

    tipo: payload.tipo || categoryName || "Historia",
    genero: payload.genero || "",

    creadores: Array.isArray(payload.creadores)
      ? payload.creadores.filter(isMongoObjectId)
      : [],

    creadoresNombre: Array.isArray(payload.creadoresNombre)
      ? payload.creadoresNombre
      : normalizeArrayText(payload.autor),

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

  if (shouldSendImages(payload, options.includeImages === true)) {
    apiPayload.imagen = getImageSource(payload.imagen);
    apiPayload.imagenes = normalizeImageList(payload.imagenes).filter(
      (image) => image !== apiPayload.imagen
    );
    apiPayload.imagenesTouched = true;
  }

  return apiPayload;
}

function buildEventPayloadForApi(payload = {}, options = {}) {
  const title = payload.titulo || payload.nombre || payload.name || "";

  const selectedSeriesIds = Array.isArray(payload.series)
    ? payload.series.filter(isMongoObjectId)
    : [];

  const selectedSeriesNames = Array.isArray(payload.seriesNombre)
    ? payload.seriesNombre.filter(Boolean)
    : normalizeArrayText(payload.serieNombre || payload.serie);

  const categoryValue = payload.categoria || payload.categoriaNombre || "";
  const originValue = payload.origen || payload.origenNombre || payload.pais || "";

  const apiPayload = {
    titulo: title,
    nombre: title,
    descripcion: payload.descripcion || "",

    categoria: isMongoObjectId(categoryValue) ? categoryValue : "",
    categoriaNombre: isMongoObjectId(categoryValue)
      ? payload.categoriaNombre || ""
      : categoryValue || "Eventos",

    serie: selectedSeriesIds[0] || "",
    serieNombre: selectedSeriesNames[0] || "",

    series: selectedSeriesIds,
    seriesNombre: selectedSeriesNames,

    origen: isMongoObjectId(originValue) ? originValue : "",
    origenNombre: isMongoObjectId(originValue)
      ? payload.origenNombre || ""
      : originValue || "Variado",

    pais: payload.pais || payload.origenNombre || "V",

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

  if (shouldSendImages(payload, options.includeImages === true)) {
    apiPayload.imagen = getImageSource(payload.imagen);
    apiPayload.imagenes = normalizeImageList(payload.imagenes).filter(
      (image) => image !== apiPayload.imagen
    );
    apiPayload.imagenesTouched = true;
  }

  return apiPayload;
}

const defaultAdminData = {
  products: [],
  events: [],
  series: [],
  characters: [],
  categories: [],
  creators: [],
  origins: [],
  users: []
};

function getInitialAdminData() {
  return defaultAdminData;
}

export function AdminDataProvider({ children }) {
  const [adminData, setAdminData] = useState(getInitialAdminData);
  const [storageError, setStorageError] = useState("");

  const [productLoadError, setProductLoadError] = useState("");
  const [seriesLoadError, setSeriesLoadError] = useState("");
  const [eventsLoadError, setEventsLoadError] = useState("");
  const [charactersLoadError, setCharactersLoadError] = useState("");
  const [categoriesLoadError, setCategoriesLoadError] = useState("");
  const [creatorsLoadError, setCreatorsLoadError] = useState("");
  const [originsLoadError, setOriginsLoadError] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [loadingOrigins, setLoadingOrigins] = useState(false);

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
      const normalizedProducts = productsFromApi.map(normalizeProductFromApi);

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
      const normalizedSeries = seriesFromApi.map(normalizeSeriesFromApi);

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

  const refreshEvents = async () => {
    setLoadingEvents(true);
    setEventsLoadError("");

    try {
      const data = await apiGetEvents({
        activos: "false"
      });

      const eventsFromApi = data.events || data.eventos || data.data || [];
      const normalizedEvents = eventsFromApi.map(normalizeEventFromApi);

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

  const refreshCharacters = async () => {
    setLoadingCharacters(true);
    setCharactersLoadError("");

    try {
      const data = await apiGetCharacters({
        activos: "false"
      });

      const charactersFromApi = data.characters || data.data || [];
      const normalizedCharacters = charactersFromApi.map(normalizeCharacterFromApi);

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

  const refreshCategories = async () => {
    setLoadingCategories(true);
    setCategoriesLoadError("");

    try {
      const data = await apiGetCategories({
        activos: "false"
      });

      const categoriesFromApi =
        data.categories || data.categorias || data.data || [];
      const normalizedCategories = categoriesFromApi.map(normalizeCategoryFromApi);

      updateCollection("categories", normalizedCategories);

      return normalizedCategories;
    } catch (error) {
      setCategoriesLoadError(
        error.message || "No se pudieron cargar las categorías desde MongoDB."
      );

      return [];
    } finally {
      setLoadingCategories(false);
    }
  };

  const refreshCreators = async () => {
    setLoadingCreators(true);
    setCreatorsLoadError("");

    try {
      const data = await apiGetCreators({
        activos: "false"
      });

      const creatorsFromApi = data.creators || data.creadores || data.data || [];
      const normalizedCreators = creatorsFromApi.map(normalizeCreatorFromApi);

      updateCollection("creators", normalizedCreators);

      return normalizedCreators;
    } catch (error) {
      setCreatorsLoadError(
        error.message || "No se pudieron cargar los creadores desde MongoDB."
      );

      return [];
    } finally {
      setLoadingCreators(false);
    }
  };

  const refreshOrigins = async () => {
    setLoadingOrigins(true);
    setOriginsLoadError("");

    try {
      const data = await apiGetOrigins({
        activos: "false"
      });

      const originsFromApi = data.origins || data.origenes || data.data || [];
      const normalizedOrigins = originsFromApi.map(normalizeOriginFromApi);

      updateCollection("origins", normalizedOrigins);

      return normalizedOrigins;
    } catch (error) {
      setOriginsLoadError(
        error.message || "No se pudieron cargar los países/orígenes desde MongoDB."
      );

      return [];
    } finally {
      setLoadingOrigins(false);
    }
  };

  const refreshAdminData = async () => {
    await Promise.all([
      refreshProducts(),
      refreshSeries(),
      refreshEvents(),
      refreshCharacters(),
      refreshCategories(),
      refreshCreators(),
      refreshOrigins()
    ]);
  };

  useEffect(() => {
    refreshAdminData();
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStorageError("");
    } catch (error) {
      console.error("No se pudo limpiar la información local de Smika.", error);
      setStorageError("");
    }
  }, []);

  const createProduct = async (payload) => {
    const apiPayload = buildProductPayloadForApi(payload, {
      includeImages: true
    });

    const data = await apiCreateProduct(apiPayload);
    const createdProduct = normalizeProductFromApi(data.product);

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
    const apiPayload = buildProductPayloadForApi(payload, {
      includeImages: false
    });

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
    const product = adminData.products.find(
      (item) => (item._id || item.id) === productId
    );

    if (!product) throw new Error("Producto no encontrado.");

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

    const data = await apiUpdateProduct(
      productId,
      buildProductPayloadForApi({
        ...product,
        activo: true,
        estado: "Activo"
      })
    );

    const enabledProduct = normalizeProductFromApi(data.product);

    updateCollection("products", (currentProducts) =>
      currentProducts.map((item) =>
        (item._id || item.id) === productId ? enabledProduct : item
      )
    );

    return enabledProduct;
  };

  const createSeriesFull = async (payload) => {
    const apiPayload = buildSeriesPayloadForApi(payload, {
      includeImages: true
    });

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
    const apiPayload = buildSeriesPayloadForApi(payload, {
      includeImages: false
    });

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

    if (!serie) throw new Error("Serie no encontrada.");

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

    const data = await apiUpdateSeries(
      seriesId,
      buildSeriesPayloadForApi({
        ...serie,
        activo: true,
        activa: true
      })
    );

    const enabledSeries = normalizeSeriesFromApi(data.serie);

    updateCollection("series", (currentSeries) =>
      currentSeries.map((item) =>
        (item._id || item.id) === seriesId ? enabledSeries : item
      )
    );

    return enabledSeries;
  };

  const createEventFull = async (payload) => {
    const apiPayload = buildEventPayloadForApi(payload, {
      includeImages: true
    });

    const data = await apiCreateEvent(apiPayload);
    const createdEvent = normalizeEventFromApi(data.event);

    updateCollection("events", (currentEvents) => [
      createdEvent,
      ...currentEvents.filter(
        (event) =>
          (event._id || event.id) !==
          (createdEvent._id || createdEvent.id)
      )
    ]);

    return createdEvent;
  };

  const updateEventFull = async (eventId, payload) => {
    const apiPayload = buildEventPayloadForApi(payload, {
      includeImages: false
    });

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

    if (!event) throw new Error("Evento no encontrado.");

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

    const data = await apiUpdateEvent(
      eventId,
      buildEventPayloadForApi({
        ...event,
        activo: true
      })
    );

    const enabledEvent = normalizeEventFromApi(data.event);

    updateCollection("events", (currentEvents) =>
      currentEvents.map((item) =>
        (item._id || item.id) === eventId ? enabledEvent : item
      )
    );

    return enabledEvent;
  };

  const createCategoryFull = async (payload) => {
    const apiPayload = buildCategoryPayloadForApi(payload);
    const data = await apiCreateCategory(apiPayload);
    const createdCategory = normalizeCategoryFromApi(data.category);

    updateCollection("categories", (currentCategories) => [
      createdCategory,
      ...currentCategories.filter(
        (category) =>
          (category._id || category.id) !==
          (createdCategory._id || createdCategory.id)
      )
    ]);

    return createdCategory;
  };

  const updateCategory = async (categoryId, payload) => {
    const apiPayload = buildCategoryPayloadForApi(payload);
    const data = await apiUpdateCategory(categoryId, apiPayload);
    const updatedCategory = normalizeCategoryFromApi(data.category);

    updateCollection("categories", (currentCategories) =>
      currentCategories.map((category) =>
        (category._id || category.id) === categoryId
          ? updatedCategory
          : category
      )
    );

    return updatedCategory;
  };

  const toggleCategoryStatus = async (categoryId) => {
    const category = adminData.categories.find(
      (item) => (item._id || item.id) === categoryId
    );

    if (!category) throw new Error("Categoría no encontrada.");

    if (category.activa !== false) {
      await apiDeleteCategory(categoryId);

      const disabledCategory = {
        ...category,
        activa: false,
        activo: false
      };

      updateCollection("categories", (currentCategories) =>
        currentCategories.map((item) =>
          (item._id || item.id) === categoryId ? disabledCategory : item
        )
      );

      return disabledCategory;
    }

    const data = await apiUpdateCategory(categoryId, {
      ...buildCategoryPayloadForApi(category),
      activa: true
    });

    const enabledCategory = normalizeCategoryFromApi(data.category);

    updateCollection("categories", (currentCategories) =>
      currentCategories.map((item) =>
        (item._id || item.id) === categoryId ? enabledCategory : item
      )
    );

    return enabledCategory;
  };

  const createCreatorFull = async (payload) => {
    const apiPayload = buildCreatorPayloadForApi(payload);
    const data = await apiCreateCreator(apiPayload);
    const createdCreator = normalizeCreatorFromApi(data.creator);

    updateCollection("creators", (currentCreators) => [
      createdCreator,
      ...currentCreators.filter(
        (creator) =>
          (creator._id || creator.id) !==
          (createdCreator._id || createdCreator.id)
      )
    ]);

    return createdCreator;
  };

  const updateCreator = async (creatorId, payload) => {
    const apiPayload = buildCreatorPayloadForApi(payload);
    const data = await apiUpdateCreator(creatorId, apiPayload);
    const updatedCreator = normalizeCreatorFromApi(data.creator);

    updateCollection("creators", (currentCreators) =>
      currentCreators.map((creator) =>
        (creator._id || creator.id) === creatorId ? updatedCreator : creator
      )
    );

    return updatedCreator;
  };

  const toggleCreatorStatus = async (creatorId) => {
    const creator = adminData.creators.find(
      (item) => (item._id || item.id) === creatorId
    );

    if (!creator) throw new Error("Creador no encontrado.");

    if (creator.activo !== false) {
      await apiDeleteCreator(creatorId);

      const disabledCreator = {
        ...creator,
        activo: false
      };

      updateCollection("creators", (currentCreators) =>
        currentCreators.map((item) =>
          (item._id || item.id) === creatorId ? disabledCreator : item
        )
      );

      return disabledCreator;
    }

    const data = await apiUpdateCreator(creatorId, {
      ...buildCreatorPayloadForApi(creator),
      activo: true
    });

    const enabledCreator = normalizeCreatorFromApi(data.creator);

    updateCollection("creators", (currentCreators) =>
      currentCreators.map((item) =>
        (item._id || item.id) === creatorId ? enabledCreator : item
      )
    );

    return enabledCreator;
  };

  const createOriginFull = async (payload) => {
    const apiPayload = buildOriginPayloadForApi(payload);
    const data = await apiCreateOrigin(apiPayload);
    const createdOrigin = normalizeOriginFromApi(data.origin);

    updateCollection("origins", (currentOrigins) => [
      createdOrigin,
      ...currentOrigins.filter(
        (origin) =>
          (origin._id || origin.id) !==
          (createdOrigin._id || createdOrigin.id)
      )
    ]);

    return createdOrigin;
  };

  const updateOrigin = async (originId, payload) => {
    const apiPayload = buildOriginPayloadForApi(payload);
    const data = await apiUpdateOrigin(originId, apiPayload);
    const updatedOrigin = normalizeOriginFromApi(data.origin);

    updateCollection("origins", (currentOrigins) =>
      currentOrigins.map((origin) =>
        (origin._id || origin.id) === originId ? updatedOrigin : origin
      )
    );

    return updatedOrigin;
  };

  const toggleOriginStatus = async (originId) => {
    const origin = adminData.origins.find(
      (item) => (item._id || item.id) === originId
    );

    if (!origin) throw new Error("Origen no encontrado.");

    if (origin.activo !== false) {
      await apiDeleteOrigin(originId);

      const disabledOrigin = {
        ...origin,
        activo: false
      };

      updateCollection("origins", (currentOrigins) =>
        currentOrigins.map((item) =>
          (item._id || item.id) === originId ? disabledOrigin : item
        )
      );

      return disabledOrigin;
    }

    const data = await apiUpdateOrigin(originId, {
      ...buildOriginPayloadForApi(origin),
      activo: true
    });

    const enabledOrigin = normalizeOriginFromApi(data.origin);

    updateCollection("origins", (currentOrigins) =>
      currentOrigins.map((item) =>
        (item._id || item.id) === originId ? enabledOrigin : item
      )
    );

    return enabledOrigin;
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

    const data = await apiCreateCharacter({
      nombre: cleanName,
      serieNombre: cleanSerie,
      descripcion:
        "Personaje agregado rápidamente desde un producto. Falta completar sus detalles.",
      estado: "Faltan detalles",
      needsReview: true,
      activo: true
    });

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
    const data = await apiCreateCharacter(payload);
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
    const data = await apiUpdateCharacter(characterId, payload);
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

    if (!character) throw new Error("Personaje no encontrado.");

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
      ...character,
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

  const value = useMemo(
    () => ({
      storageError,

      productLoadError,
      seriesLoadError,
      eventsLoadError,
      charactersLoadError,
      categoriesLoadError,
      creatorsLoadError,
      originsLoadError,

      loadingProducts,
      loadingSeries,
      loadingEvents,
      loadingCharacters,
      loadingCategories,
      loadingCreators,
      loadingOrigins,

      products: adminData.products,
      events: adminData.events,
      series: adminData.series,
      characters: adminData.characters,
      categories: adminData.categories,
      creators: adminData.creators,
      origins: adminData.origins,
      users: adminData.users,

      refreshAdminData,
      refreshProducts,
      refreshSeries,
      refreshEvents,
      refreshCharacters,
      refreshCategories,
      refreshCreators,
      refreshOrigins,

      createProduct,
      updateProduct,
      toggleProductStatus,

      createSeriesFull,
      updateSeriesFull,
      toggleSeriesStatus,

      createEventFull,
      updateEventFull,
      toggleEventStatus,

      createCategoryFull,
      updateCategory,
      toggleCategoryStatus,

      createCreatorFull,
      updateCreator,
      toggleCreatorStatus,

      createOriginFull,
      updateOrigin,
      toggleOriginStatus,

      createCharacterQuick,
      createCharacterFull,
      updateCharacter,
      toggleCharacterStatus,

      setProducts: (updater) => updateCollection("products", updater),
      setEvents: (updater) => updateCollection("events", updater),
      setSeries: (updater) => updateCollection("series", updater),
      setCharacters: (updater) => updateCollection("characters", updater),
      setCategories: (updater) => updateCollection("categories", updater),
      setCreators: (updater) => updateCollection("creators", updater),
      setOrigins: (updater) => updateCollection("origins", updater),
      setUsers: (updater) => updateCollection("users", updater)
    }),
    [
      storageError,

      productLoadError,
      seriesLoadError,
      eventsLoadError,
      charactersLoadError,
      categoriesLoadError,
      creatorsLoadError,
      originsLoadError,

      loadingProducts,
      loadingSeries,
      loadingEvents,
      loadingCharacters,
      loadingCategories,
      loadingCreators,
      loadingOrigins,

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
    throw new Error("useAdminData debe usarse dentro de AdminDataProvider.");
  }

  return context;
}