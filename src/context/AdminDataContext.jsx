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

function normalizeText(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isMongoObjectId(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

function getId(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item._id || item.id || "";
}

function getName(item, fallback = "") {
  if (!item) return fallback || "";
  if (typeof item === "string") return item;
  return item.nombre || item.titulo || item.name || fallback || "";
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
      image.url ||
      image.secure_url ||
      image.preview ||
      image.src ||
      image.imagen ||
      image.finalPreview ||
      ""
    );
  }

  return "";
}

function normalizeArrayText(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeArrayText(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return [getName(value)].filter(Boolean);
  }

  if (!value) return [];

  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueText(values = []) {
  return values.reduce((accumulator, value) => {
    const cleanValue = value?.toString().trim();

    if (!cleanValue) return accumulator;

    const exists = accumulator.some(
      (item) => normalizeText(item) === normalizeText(cleanValue)
    );

    if (!exists) accumulator.push(cleanValue);

    return accumulator;
  }, []);
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

function shouldSendImages(payload = {}, includeImages = false) {
  if (includeImages) return true;

  return (
    payload.imagenesTouched === true ||
    payload.imagesTouched === true ||
    payload.replaceImages === true ||
    payload.reemplazarImagenes === true
  );
}

function normalizeEstadoToDisponibilidad(estado = "") {
  const cleanEstado = estado.toString().toLowerCase();

  if (cleanEstado.includes("preventa")) return "preventa";
  if (cleanEstado.includes("pedido")) return "por_pedido";
  if (cleanEstado.includes("agotado")) return "agotado";

  return "stock";
}

function pickList(data, keys = []) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

function pickOne(data, keys = []) {
  for (const key of keys) {
    if (data?.[key]) return data[key];
  }

  if (data?.data && !Array.isArray(data.data)) return data.data;

  return data || {};
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
    activo: category.activo !== false && category.activa !== false
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
    paisOrigen: creator.paisOrigen || creator.origenNombre || "",
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

function normalizeCharacterFromApi(character = {}) {
  const mongoId = getId(character);

  const serieNombre = getRelatedName(
    character.serie,
    character.serieNombre || character.seriesNombre || character.series || ""
  );

  const serieId =
    typeof character.serie === "string" && isMongoObjectId(character.serie)
      ? character.serie
      : getId(character.serie);

  return {
    ...character,
    id: mongoId,
    _id: mongoId,
    nombre: character.nombre || character.name || "Personaje",
    slug: character.slug || createSlug(character.nombre || mongoId),
    descripcion: character.descripcion || "",
    serie: serieNombre,
    serieId,
    serieNombre,
    estado: character.estado || "",
    needsReview:
      character.needsReview === true ||
      normalizeText(character.estado).includes("faltan detalles"),
    activo: character.activo !== false
  };
}

function createVariantCode(text = "", index = 0) {
  const slug = text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return slug || `opcion-${index + 1}`;
}

function normalizeVariantMode(value = "sin_variantes") {
  const cleanValue = normalizeText(value || "sin_variantes");

  if (["precio_igual", "igual", "mismo_precio", "same_price"].includes(cleanValue)) {
    return "precio_igual";
  }

  if (["precio_diferente", "diferente", "precio_variable", "different_price"].includes(cleanValue)) {
    return "precio_diferente";
  }

  return "sin_variantes";
}

function getSafeImagenIndex(value, fallbackIndex = 0) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return Math.max(0, Number(fallbackIndex || 0));
  }

  return Math.floor(numberValue);
}

function normalizeProductVariants(value = [], basePrice = 0, mode = "sin_variantes") {
  if (!Array.isArray(value)) return [];

  const seenCodes = new Set();
  const normalizedMode = normalizeVariantMode(mode);

  return value
    .map((variant, index) => {
      const nombre = getName(variant, variant?.nombre || variant?.name || "").trim();

      if (!nombre) return null;

      const rawCode = variant?.codigo || variant?.code || variant?.id || createVariantCode(nombre, index);
      let codigo = rawCode.toString().trim() || createVariantCode(nombre, index);

      while (seenCodes.has(codigo)) {
        codigo = `${codigo}-${index + 1}`;
      }

      seenCodes.add(codigo);

      const priceValue =
        normalizedMode === "precio_diferente"
          ? Number(variant?.precio ?? variant?.price ?? variant?.precioReferencial ?? 0)
          : Number(basePrice || 0);

      const imagenIndex = getSafeImagenIndex(
        variant?.imagenIndex ?? variant?.imageIndex ?? variant?.selectedImageIndex,
        index
      );

      return {
        codigo,
        nombre,
        precio: priceValue,
        stock: Number(variant?.stock || 0),
        imagenIndex,
        activa: variant?.activa !== undefined ? Boolean(variant.activa) : true,
        orden: Number(variant?.orden ?? index)
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function normalizeProductFromApi(product = {}) {
  const mongoId = getId(product);

  const serieNombre = getRelatedName(
    product.serie,
    product.serieNombre || product.seriesNombre || product.series || ""
  );

  const eventoNombre = getRelatedName(
    product.evento,
    product.eventoNombre || product.event || product.eventName || ""
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

  const tiposProducto = uniqueText([
    ...normalizeArrayText(product.tiposProducto),
    ...normalizeArrayText(product.tipoProducto),
    ...normalizeArrayText(product.tipo),
    ...normalizeArrayText(product.type),
    ...normalizeArrayText(product.typeProduct)
  ]);

  const personajesNombre = uniqueText([
    ...normalizeArrayText(product.personajesNombre),
    ...normalizeArrayText(product.personajeNombre),
    ...normalizeArrayText(product.personaje),
    ...normalizeArrayText(product.personajes)
  ]);

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
    pais: product.pais || origenNombre,

    tipo: tiposProducto.join(", ") || "Producto",
    tipoProducto: tiposProducto.join(", ") || "Producto",
    tiposProducto,

    personaje: personajesNombre[0] || "",
    personajeNombre: personajesNombre.join(", "),
    personajesNombre,

    precio,
    price: precio,
    precioReferencial: precio,

    varianteTipo: normalizeVariantMode(product.varianteTipo || product.tipoVariante),
    variantes: normalizeProductVariants(
      product.variantes || product.variants || [],
      precio,
      product.varianteTipo || product.tipoVariante
    ),

    stock: Number(product.stock || 0),
    tiempoEstimado: product.tiempoEstimado || "",

    estado: product.estado || "Activo",
    disponibilidad:
      product.disponibilidad ||
      normalizeEstadoToDisponibilidad(product.estado || "Activo"),

    adulto: Boolean(product.adulto),
    esNuevo:
      product.esNuevo !== undefined ? Boolean(product.esNuevo) : Boolean(product.nuevo),
    esDestacado:
      product.esDestacado !== undefined
        ? Boolean(product.esDestacado)
        : Boolean(product.destacado),

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

  const creadoresNombre = uniqueText([
    ...normalizeArrayText(serie.creadoresNombre),
    ...normalizeArrayText(serie.autor),
    ...normalizeArrayText(serie.creadores)
  ]);

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

    pais: serie.pais || origenNombre || "V",
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

  const seriesNombre = uniqueText([
    ...normalizeArrayText(event.seriesNombre),
    ...normalizeArrayText(event.serieNombre),
    ...normalizeArrayText(event.series),
    ...normalizeArrayText(event.serie)
  ]);

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

  const finalSeriesIds = uniqueText([
    legacySerieId,
    ...seriesIds
  ]).filter(isMongoObjectId);

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

    serie: seriesNombre[0] || "",
    serieNombre: seriesNombre[0] || "",
    series: finalSeriesIds,
    seriesNombre,

    origen: origenNombre,
    origenNombre,

    pais: event.pais || origenNombre || "V",
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

function buildCategoryPayloadForApi(payload = {}) {
  return {
    nombre: payload.nombre || payload.name || "",
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
    nombre: payload.nombre || payload.name || "",
    tipo: payload.tipo || "Autor",
    descripcion: payload.descripcion || "",
    paisOrigen: payload.paisOrigen || payload.origenNombre || "",
    activo: payload.activo !== undefined ? Boolean(payload.activo) : true
  };
}

function buildOriginPayloadForApi(payload = {}) {
  return {
    nombre: payload.nombre || payload.name || "",
    descripcion: payload.descripcion || "",
    activo: payload.activo !== undefined ? Boolean(payload.activo) : true
  };
}

function buildCharacterPayloadForApi(payload = {}) {
  const serieValue = payload.serie || payload.serieId || "";
  const serieNombre = payload.serieNombre || payload.serie || "";

  return {
    nombre: payload.nombre || payload.name || "",
    descripcion: payload.descripcion || "",
    serie: isMongoObjectId(serieValue) ? serieValue : "",
    serieNombre: isMongoObjectId(serieValue) ? serieNombre : serieNombre,
    estado: payload.estado || "",
    needsReview: Boolean(payload.needsReview),
    activo: payload.activo !== undefined ? Boolean(payload.activo) : true
  };
}

function buildProductPayloadForApi(payload = {}, options = {}) {
  const categoryValue = payload.categoria || payload.categoriaId || "";
  const serieValue = payload.serie || payload.serieId || "";
  const eventValue = payload.evento || payload.eventoId || "";
  const originValue = payload.origen || payload.origenId || "";

  const tiposProducto = uniqueText([
    ...normalizeArrayText(payload.tiposProducto),
    ...normalizeArrayText(payload.tipoProducto),
    ...normalizeArrayText(payload.tipo),
    ...normalizeArrayText(payload.type)
  ]);

  const tiposProductoTexto = tiposProducto.join(", ");

  const personajesNombre = uniqueText([
    ...normalizeArrayText(payload.personajesNombre),
    ...normalizeArrayText(payload.personajeNombre),
    ...normalizeArrayText(payload.personaje)
  ]);

  const apiPayload = {
    nombre: payload.nombre || payload.name || "",
    descripcion: payload.descripcion || "",

    categoria: isMongoObjectId(categoryValue) ? categoryValue : "",
    categoriaId: isMongoObjectId(categoryValue) ? categoryValue : "",
    categoriaNombre: payload.categoriaNombre || getRelatedName(categoryValue),

    serie: isMongoObjectId(serieValue) ? serieValue : "",
    serieId: isMongoObjectId(serieValue) ? serieValue : "",
    serieNombre: payload.serieNombre || getRelatedName(serieValue),

    evento: isMongoObjectId(eventValue) ? eventValue : "",
    eventoId: isMongoObjectId(eventValue) ? eventValue : "",
    eventoNombre: payload.eventoNombre || getRelatedName(eventValue),

    origen: isMongoObjectId(originValue) ? originValue : "",
    origenNombre:
      payload.origenNombre ||
      payload.pais ||
      (isMongoObjectId(originValue) ? "" : getRelatedName(originValue)),
    pais:
      payload.pais ||
      payload.origenNombre ||
      (isMongoObjectId(originValue) ? "" : getRelatedName(originValue)),

    tipo: tiposProductoTexto || "Producto",
    tipoProducto: tiposProductoTexto || "Producto",
    tiposProducto,

    personajeNombre: personajesNombre.join(", "),
    personajesNombre,

    material: payload.material || "",
    tamano: payload.tamano || payload.tamaño || "",

    precio: Number(payload.precio ?? payload.price ?? payload.precioReferencial ?? 0),
    precioReferencial: Number(
      payload.precioReferencial ?? payload.precio ?? payload.price ?? 0
    ),
    price: Number(payload.price ?? payload.precio ?? payload.precioReferencial ?? 0),

    varianteTipo: normalizeVariantMode(payload.varianteTipo || payload.tipoVariante),
    variantes: normalizeProductVariants(
      payload.variantes || payload.variants || [],
      Number(payload.precioReferencial ?? payload.precio ?? payload.price ?? 0),
      payload.varianteTipo || payload.tipoVariante
    ),

    stock: Number(payload.stock || 0),

    disponibilidad: payload.disponibilidad || "stock",
    estado: payload.estado || "Activo",
    tiempoEstimado: payload.tiempoEstimado || "",

    adulto: Boolean(payload.adulto),
    esNuevo:
      payload.esNuevo !== undefined ? Boolean(payload.esNuevo) : Boolean(payload.nuevo),
    esDestacado:
      payload.esDestacado !== undefined
        ? Boolean(payload.esDestacado)
        : Boolean(payload.destacado),

    activo: payload.activo !== undefined ? Boolean(payload.activo) : true
  };

  if (shouldSendImages(payload, options.includeImages === true)) {
    apiPayload.imagenes = normalizeImageList(payload.imagenes);
    apiPayload.imagenesTouched = true;
  }

  return apiPayload;
}

function buildSeriesPayloadForApi(payload = {}, options = {}) {
  const categoryValue =
    payload.categoriaPrincipal ||
    payload.categoria ||
    payload.categoriaNombre ||
    payload.categoriaPrincipalNombre ||
    "";

  const originValue = payload.origen || payload.origenNombre || payload.pais || "";

  const creadoresNombre = uniqueText([
    ...normalizeArrayText(payload.creadoresNombre),
    ...normalizeArrayText(payload.autor),
    ...normalizeArrayText(payload.creadores)
  ]);

  const apiPayload = {
    nombre: payload.nombre || payload.name || "",
    descripcion: payload.descripcion || "",

    categoriaPrincipal: isMongoObjectId(categoryValue) ? categoryValue : "",
    categoriaPrincipalNombre: isMongoObjectId(categoryValue)
      ? payload.categoriaPrincipalNombre || payload.categoriaNombre || ""
      : categoryValue || "Series",
    categoriaNombre: isMongoObjectId(categoryValue)
      ? payload.categoriaNombre || payload.categoriaPrincipalNombre || ""
      : categoryValue || "Series",

    subcategoria: isMongoObjectId(payload.subcategoria) ? payload.subcategoria : "",
    subcategoriaNombre: payload.subcategoriaNombre || "",

    origen: isMongoObjectId(originValue) ? originValue : "",
    origenNombre: isMongoObjectId(originValue)
      ? payload.origenNombre || ""
      : originValue || "Variado",

    pais: payload.pais || payload.origenNombre || "V",

    tipo: payload.tipo || payload.categoriaNombre || "Historia",
    genero: payload.genero || "",

    creadores: Array.isArray(payload.creadores)
      ? payload.creadores.filter(isMongoObjectId)
      : [],
    creadoresNombre,
    autor: creadoresNombre.join(", "),

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

  const selectedSeriesNames = uniqueText([
    ...normalizeArrayText(payload.seriesNombre),
    ...normalizeArrayText(payload.serieNombre),
    ...normalizeArrayText(payload.serie)
  ]);

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
    tipo: payload.tipo || payload.tipoEvento || "Otro",

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

function replaceItemById(collection = [], item) {
  const itemId = getId(item);

  if (!itemId) return [item, ...collection];

  const withoutItem = collection.filter((currentItem) => getId(currentItem) !== itemId);

  return [item, ...withoutItem];
}

export function AdminDataProvider({ children }) {
  const [adminData, setAdminData] = useState(defaultAdminData);
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

      return {
        ...currentData,
        [collectionName]:
          typeof updater === "function" ? updater(currentCollection) : updater
      };
    });
  };

  const refreshProducts = async () => {
    setLoadingProducts(true);
    setProductLoadError("");

    try {
      const data = await apiGetProducts();
      const list = pickList(data, ["products", "productos", "items"]).map(
        normalizeProductFromApi
      );

      updateCollection("products", list);

      return list;
    } catch (error) {
      setProductLoadError(error.message || "No se pudieron cargar los productos.");
      return [];
    } finally {
      setLoadingProducts(false);
    }
  };

  const refreshSeries = async () => {
    setLoadingSeries(true);
    setSeriesLoadError("");

    try {
      const data = await apiGetSeries();
      const list = pickList(data, ["series", "items"]).map(normalizeSeriesFromApi);

      updateCollection("series", list);

      return list;
    } catch (error) {
      setSeriesLoadError(error.message || "No se pudieron cargar las series.");
      return [];
    } finally {
      setLoadingSeries(false);
    }
  };

  const refreshEvents = async () => {
    setLoadingEvents(true);
    setEventsLoadError("");

    try {
      const data = await apiGetEvents();
      const list = pickList(data, ["events", "eventos", "items"]).map(
        normalizeEventFromApi
      );

      updateCollection("events", list);

      return list;
    } catch (error) {
      setEventsLoadError(error.message || "No se pudieron cargar los eventos.");
      return [];
    } finally {
      setLoadingEvents(false);
    }
  };

  const refreshCharacters = async () => {
    setLoadingCharacters(true);
    setCharactersLoadError("");

    try {
      const data = await apiGetCharacters();
      const list = pickList(data, ["characters", "personajes", "items"]).map(
        normalizeCharacterFromApi
      );

      updateCollection("characters", list);

      return list;
    } catch (error) {
      setCharactersLoadError(
        error.message || "No se pudieron cargar los personajes."
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
      const data = await apiGetCategories();
      const list = pickList(data, ["categories", "categorias", "items"]).map(
        normalizeCategoryFromApi
      );

      updateCollection("categories", list);

      return list;
    } catch (error) {
      setCategoriesLoadError(
        error.message || "No se pudieron cargar las categorías."
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
      const data = await apiGetCreators();
      const list = pickList(data, ["creators", "creadores", "items"]).map(
        normalizeCreatorFromApi
      );

      updateCollection("creators", list);

      return list;
    } catch (error) {
      setCreatorsLoadError(
        error.message || "No se pudieron cargar los autores/creadores."
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
      const data = await apiGetOrigins();
      const list = pickList(data, ["origins", "origenes", "items"]).map(
        normalizeOriginFromApi
      );

      updateCollection("origins", list);

      return list;
    } catch (error) {
      setOriginsLoadError(
        error.message || "No se pudieron cargar los países/orígenes."
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
      console.error("No se pudo limpiar el almacenamiento local antiguo.", error);
      setStorageError(
        "No se pudo limpiar el almacenamiento local antiguo. Si el aviso continúa, limpia el almacenamiento del sitio desde el navegador."
      );
    }
  }, []);

  const createProduct = async (payload) => {
    const apiPayload = buildProductPayloadForApi(payload, {
      includeImages: true
    });

    const data = await apiCreateProduct(apiPayload);
    const createdProduct = normalizeProductFromApi(
      pickOne(data, ["product", "producto"])
    );

    updateCollection("products", (currentProducts) =>
      replaceItemById(currentProducts, createdProduct)
    );

    return createdProduct;
  };

  const updateProduct = async (productId, payload) => {
    const apiPayload = buildProductPayloadForApi(payload, {
      includeImages: false
    });

    const data = await apiUpdateProduct(productId, apiPayload);
    const updatedProduct = normalizeProductFromApi(
      pickOne(data, ["product", "producto"])
    );

    updateCollection("products", (currentProducts) =>
      currentProducts.map((product) =>
        getId(product) === productId ? updatedProduct : product
      )
    );

    return updatedProduct;
  };

  const toggleProductStatus = async (productId) => {
    const product = adminData.products.find((item) => getId(item) === productId);

    if (!product) throw new Error("Producto no encontrado.");

    if (product.activo !== false) {
      await apiDeleteProduct(productId);

      const disabledProduct = {
        ...product,
        activo: false,
        estado: product.estado === "Activo" ? "Inactivo" : product.estado
      };

      updateCollection("products", (currentProducts) =>
        currentProducts.map((item) =>
          getId(item) === productId ? disabledProduct : item
        )
      );

      return disabledProduct;
    }

    const data = await apiUpdateProduct(productId, {
      ...buildProductPayloadForApi(product),
      activo: true,
      estado: product.estado === "Inactivo" ? "Activo" : product.estado || "Activo"
    });

    const enabledProduct = normalizeProductFromApi(
      pickOne(data, ["product", "producto"])
    );

    updateCollection("products", (currentProducts) =>
      currentProducts.map((item) =>
        getId(item) === productId ? enabledProduct : item
      )
    );

    return enabledProduct;
  };

  const createSeriesFull = async (payload) => {
    const apiPayload = buildSeriesPayloadForApi(payload, {
      includeImages: true
    });

    const data = await apiCreateSeries(apiPayload);
    const createdSeries = normalizeSeriesFromApi(pickOne(data, ["serie", "series"]));

    updateCollection("series", (currentSeries) =>
      replaceItemById(currentSeries, createdSeries)
    );

    return createdSeries;
  };

  const updateSeriesFull = async (seriesId, payload) => {
    const apiPayload = buildSeriesPayloadForApi(payload, {
      includeImages: false
    });

    const data = await apiUpdateSeries(seriesId, apiPayload);
    const updatedSeries = normalizeSeriesFromApi(pickOne(data, ["serie", "series"]));

    updateCollection("series", (currentSeries) =>
      currentSeries.map((serie) =>
        getId(serie) === seriesId ? updatedSeries : serie
      )
    );

    return updatedSeries;
  };

  const toggleSeriesStatus = async (seriesId) => {
    const serie = adminData.series.find((item) => getId(item) === seriesId);

    if (!serie) throw new Error("Serie no encontrada.");

    if (serie.activo !== false && serie.activa !== false) {
      await apiDeleteSeries(seriesId);

      const disabledSeries = {
        ...serie,
        activo: false,
        activa: false
      };

      updateCollection("series", (currentSeries) =>
        currentSeries.map((item) =>
          getId(item) === seriesId ? disabledSeries : item
        )
      );

      return disabledSeries;
    }

    const data = await apiUpdateSeries(seriesId, {
      ...buildSeriesPayloadForApi(serie),
      activo: true,
      activa: true
    });

    const enabledSeries = normalizeSeriesFromApi(pickOne(data, ["serie", "series"]));

    updateCollection("series", (currentSeries) =>
      currentSeries.map((item) =>
        getId(item) === seriesId ? enabledSeries : item
      )
    );

    return enabledSeries;
  };

  const createEventFull = async (payload) => {
    const apiPayload = buildEventPayloadForApi(payload, {
      includeImages: true
    });

    const data = await apiCreateEvent(apiPayload);
    const createdEvent = normalizeEventFromApi(pickOne(data, ["event", "evento"]));

    updateCollection("events", (currentEvents) =>
      replaceItemById(currentEvents, createdEvent)
    );

    return createdEvent;
  };

  const updateEventFull = async (eventId, payload) => {
    const apiPayload = buildEventPayloadForApi(payload, {
      includeImages: false
    });

    const data = await apiUpdateEvent(eventId, apiPayload);
    const updatedEvent = normalizeEventFromApi(pickOne(data, ["event", "evento"]));

    updateCollection("events", (currentEvents) =>
      currentEvents.map((event) =>
        getId(event) === eventId ? updatedEvent : event
      )
    );

    return updatedEvent;
  };

  const toggleEventStatus = async (eventId) => {
    const event = adminData.events.find((item) => getId(item) === eventId);

    if (!event) throw new Error("Evento no encontrado.");

    if (event.activo !== false) {
      await apiDeleteEvent(eventId);

      const disabledEvent = {
        ...event,
        activo: false
      };

      updateCollection("events", (currentEvents) =>
        currentEvents.map((item) =>
          getId(item) === eventId ? disabledEvent : item
        )
      );

      return disabledEvent;
    }

    const data = await apiUpdateEvent(eventId, {
      ...buildEventPayloadForApi(event),
      activo: true
    });

    const enabledEvent = normalizeEventFromApi(pickOne(data, ["event", "evento"]));

    updateCollection("events", (currentEvents) =>
      currentEvents.map((item) =>
        getId(item) === eventId ? enabledEvent : item
      )
    );

    return enabledEvent;
  };

  const createCategoryFull = async (payload) => {
    const apiPayload = buildCategoryPayloadForApi(payload);
    const data = await apiCreateCategory(apiPayload);
    const createdCategory = normalizeCategoryFromApi(
      pickOne(data, ["category", "categoria"])
    );

    updateCollection("categories", (currentCategories) =>
      replaceItemById(currentCategories, createdCategory)
    );

    return createdCategory;
  };

  const updateCategory = async (categoryId, payload) => {
    const apiPayload = buildCategoryPayloadForApi(payload);
    const data = await apiUpdateCategory(categoryId, apiPayload);
    const updatedCategory = normalizeCategoryFromApi(
      pickOne(data, ["category", "categoria"])
    );

    updateCollection("categories", (currentCategories) =>
      currentCategories.map((category) =>
        getId(category) === categoryId ? updatedCategory : category
      )
    );

    return updatedCategory;
  };

  const toggleCategoryStatus = async (categoryId) => {
    const category = adminData.categories.find((item) => getId(item) === categoryId);

    if (!category) throw new Error("Categoría no encontrada.");

    if (category.activa !== false && category.activo !== false) {
      await apiDeleteCategory(categoryId);

      const disabledCategory = {
        ...category,
        activa: false,
        activo: false
      };

      updateCollection("categories", (currentCategories) =>
        currentCategories.map((item) =>
          getId(item) === categoryId ? disabledCategory : item
        )
      );

      return disabledCategory;
    }

    const data = await apiUpdateCategory(categoryId, {
      ...buildCategoryPayloadForApi(category),
      activa: true,
      activo: true
    });

    const enabledCategory = normalizeCategoryFromApi(
      pickOne(data, ["category", "categoria"])
    );

    updateCollection("categories", (currentCategories) =>
      currentCategories.map((item) =>
        getId(item) === categoryId ? enabledCategory : item
      )
    );

    return enabledCategory;
  };

  const createCreatorFull = async (payload) => {
    const apiPayload = buildCreatorPayloadForApi(payload);
    const data = await apiCreateCreator(apiPayload);
    const createdCreator = normalizeCreatorFromApi(
      pickOne(data, ["creator", "creador"])
    );

    updateCollection("creators", (currentCreators) =>
      replaceItemById(currentCreators, createdCreator)
    );

    return createdCreator;
  };

  const updateCreator = async (creatorId, payload) => {
    const apiPayload = buildCreatorPayloadForApi(payload);
    const data = await apiUpdateCreator(creatorId, apiPayload);
    const updatedCreator = normalizeCreatorFromApi(
      pickOne(data, ["creator", "creador"])
    );

    updateCollection("creators", (currentCreators) =>
      currentCreators.map((creator) =>
        getId(creator) === creatorId ? updatedCreator : creator
      )
    );

    return updatedCreator;
  };

  const toggleCreatorStatus = async (creatorId) => {
    const creator = adminData.creators.find((item) => getId(item) === creatorId);

    if (!creator) throw new Error("Creador no encontrado.");

    if (creator.activo !== false) {
      await apiDeleteCreator(creatorId);

      const disabledCreator = {
        ...creator,
        activo: false
      };

      updateCollection("creators", (currentCreators) =>
        currentCreators.map((item) =>
          getId(item) === creatorId ? disabledCreator : item
        )
      );

      return disabledCreator;
    }

    const data = await apiUpdateCreator(creatorId, {
      ...buildCreatorPayloadForApi(creator),
      activo: true
    });

    const enabledCreator = normalizeCreatorFromApi(
      pickOne(data, ["creator", "creador"])
    );

    updateCollection("creators", (currentCreators) =>
      currentCreators.map((item) =>
        getId(item) === creatorId ? enabledCreator : item
      )
    );

    return enabledCreator;
  };

  const createOriginFull = async (payload) => {
    const apiPayload = buildOriginPayloadForApi(payload);
    const data = await apiCreateOrigin(apiPayload);
    const createdOrigin = normalizeOriginFromApi(pickOne(data, ["origin", "origen"]));

    updateCollection("origins", (currentOrigins) =>
      replaceItemById(currentOrigins, createdOrigin)
    );

    return createdOrigin;
  };

  const updateOrigin = async (originId, payload) => {
    const apiPayload = buildOriginPayloadForApi(payload);
    const data = await apiUpdateOrigin(originId, apiPayload);
    const updatedOrigin = normalizeOriginFromApi(pickOne(data, ["origin", "origen"]));

    updateCollection("origins", (currentOrigins) =>
      currentOrigins.map((origin) =>
        getId(origin) === originId ? updatedOrigin : origin
      )
    );

    return updatedOrigin;
  };

  const toggleOriginStatus = async (originId) => {
    const origin = adminData.origins.find((item) => getId(item) === originId);

    if (!origin) throw new Error("Origen no encontrado.");

    if (origin.activo !== false) {
      await apiDeleteOrigin(originId);

      const disabledOrigin = {
        ...origin,
        activo: false
      };

      updateCollection("origins", (currentOrigins) =>
        currentOrigins.map((item) =>
          getId(item) === originId ? disabledOrigin : item
        )
      );

      return disabledOrigin;
    }

    const data = await apiUpdateOrigin(originId, {
      ...buildOriginPayloadForApi(origin),
      activo: true
    });

    const enabledOrigin = normalizeOriginFromApi(pickOne(data, ["origin", "origen"]));

    updateCollection("origins", (currentOrigins) =>
      currentOrigins.map((item) =>
        getId(item) === originId ? enabledOrigin : item
      )
    );

    return enabledOrigin;
  };

  const createCharacterFull = async (payload) => {
    const apiPayload = buildCharacterPayloadForApi(payload);
    const data = await apiCreateCharacter(apiPayload);
    const createdCharacter = normalizeCharacterFromApi(
      pickOne(data, ["character", "personaje"])
    );

    updateCollection("characters", (currentCharacters) =>
      replaceItemById(currentCharacters, createdCharacter)
    );

    return createdCharacter;
  };

  const createCharacterQuick = async ({ name, serie = "", serieId = "" }) => {
    const cleanName = name?.trim();
    const cleanSerie = serie?.trim() || "Sin serie definida";
    const cleanSerieId = isMongoObjectId(serieId) ? serieId : "";

    if (!cleanName) return null;

    const existingCharacter = adminData.characters.find((character) => {
      const sameName = normalizeText(character.nombre) === normalizeText(cleanName);
      const sameSerie =
        normalizeText(character.serieNombre || character.serie) ===
        normalizeText(cleanSerie);

      return sameName && sameSerie;
    });

    if (existingCharacter) return existingCharacter;

    const data = await apiCreateCharacter({
      nombre: cleanName,
      serie: cleanSerieId,
      serieNombre: cleanSerie,
      descripcion:
        "Personaje agregado rápidamente desde un producto. Falta completar sus detalles.",
      estado: "Faltan detalles",
      needsReview: true,
      activo: true
    });

    const createdCharacter = normalizeCharacterFromApi(
      pickOne(data, ["character", "personaje"])
    );

    updateCollection("characters", (currentCharacters) =>
      replaceItemById(currentCharacters, createdCharacter)
    );

    return createdCharacter;
  };

  const updateCharacter = async (characterId, payload) => {
    const apiPayload = buildCharacterPayloadForApi(payload);
    const data = await apiUpdateCharacter(characterId, apiPayload);
    const updatedCharacter = normalizeCharacterFromApi(
      pickOne(data, ["character", "personaje"])
    );

    updateCollection("characters", (currentCharacters) =>
      currentCharacters.map((character) =>
        getId(character) === characterId ? updatedCharacter : character
      )
    );

    return updatedCharacter;
  };

  const toggleCharacterStatus = async (characterId) => {
    const character = adminData.characters.find(
      (item) => getId(item) === characterId
    );

    if (!character) throw new Error("Personaje no encontrado.");

    if (character.activo !== false) {
      await apiDeleteCharacter(characterId);

      const disabledCharacter = {
        ...character,
        activo: false
      };

      updateCollection("characters", (currentCharacters) =>
        currentCharacters.map((item) =>
          getId(item) === characterId ? disabledCharacter : item
        )
      );

      return disabledCharacter;
    }

    const data = await apiUpdateCharacter(characterId, {
      ...buildCharacterPayloadForApi(character),
      activo: true
    });

    const enabledCharacter = normalizeCharacterFromApi(
      pickOne(data, ["character", "personaje"])
    );

    updateCollection("characters", (currentCharacters) =>
      currentCharacters.map((item) =>
        getId(item) === characterId ? enabledCharacter : item
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
    throw new Error("useAdminData debe usarse dentro de AdminDataProvider");
  }

  return context;
}