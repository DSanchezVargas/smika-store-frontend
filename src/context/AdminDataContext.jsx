import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  createProduct as apiCreateProduct,
  deleteProduct as apiDeleteProduct,
  getProducts as apiGetProducts,
  updateProduct as apiUpdateProduct
} from "../services/productService";

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

function getRelatedName(value, fallback = "") {
  if (value && typeof value === "object") {
    return value.nombre || value.titulo || value.name || fallback || "";
  }

  if (isMongoObjectId(value)) {
    return fallback || "";
  }

  return value || fallback || "";
}

function normalizeEstadoToDisponibilidad(estado = "") {
  const cleanEstado = estado.toString().toLowerCase();

  if (cleanEstado.includes("preventa")) return "preventa";
  if (cleanEstado.includes("pedido")) return "por_pedido";
  if (cleanEstado.includes("agotado")) return "agotado";

  return "stock";
}

function normalizeProductFromApi(product = {}) {
  const mongoId = product._id || product.id || "";

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

    precio,
    price: precio,
    precioReferencial: precio,

    stock: Number(product.stock || 0),
    estado: product.estado || "Activo",
    disponibilidad:
      product.disponibilidad ||
      normalizeEstadoToDisponibilidad(product.estado || "Activo"),

    activo: product.activo !== false,
    imagenes: Array.isArray(product.imagenes) ? product.imagenes : []
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

    personajes: Array.isArray(payload.personajes) ? payload.personajes : [],
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
    esNuevo:
      payload.esNuevo !== undefined ? Boolean(payload.esNuevo) : true,
    esDestacado:
      payload.esDestacado !== undefined
        ? Boolean(payload.esDestacado)
        : false,

    activo:
      payload.activo !== undefined
        ? Boolean(payload.activo)
        : estado !== "Inactivo"
  };
}

const defaultAdminData = {
  products: [],

  events: [
    {
      id: 1,
      nombre: "Evento café",
      slug: "evento-cafe",
      estado: "Actual",
      activo: true
    },
    {
      id: 2,
      nombre: "Pop up especial",
      slug: "pop-up-especial",
      estado: "Próximo",
      activo: true
    },
    {
      id: 3,
      nombre: "Lebom",
      slug: "lebom",
      estado: "Próximo",
      activo: true
    }
  ],

  series: [
    {
      id: 1,
      nombre: "La Ventura del Caballero Blanco",
      slug: "la-ventura-del-caballero-blanco",
      pais: "CN",
      categoria: "Manhua",
      activo: true
    },
    {
      id: 2,
      nombre: "Tian Guan Ci Fu",
      slug: "tian-guan-ci-fu",
      pais: "CN",
      categoria: "Novela / Manhua",
      activo: true
    },
    {
      id: 3,
      nombre: "Jinx",
      slug: "jinx",
      pais: "KR",
      categoria: "Manhwa",
      activo: true
    },
    {
      id: 4,
      nombre: "Solo Leveling",
      slug: "solo-leveling",
      pais: "KR",
      categoria: "Manhwa",
      activo: true
    },
    {
      id: 5,
      nombre: "Variado",
      slug: "variado",
      pais: "V",
      categoria: "Variado",
      activo: true
    }
  ],

  characters: [
    {
      id: 1,
      nombre: "Shuraka",
      serie: "La Ventura del Caballero Blanco",
      descripcion: "",
      estado: "Completo",
      needsReview: false,
      activo: true
    },
    {
      id: 2,
      nombre: "Xie Lian",
      serie: "Tian Guan Ci Fu",
      descripcion: "",
      estado: "Completo",
      needsReview: false,
      activo: true
    },
    {
      id: 3,
      nombre: "Hua Cheng",
      serie: "Tian Guan Ci Fu",
      descripcion: "",
      estado: "Completo",
      needsReview: false,
      activo: true
    }
  ],

  users: [
    {
      id: 1,
      nombre: "Smika Support",
      apellido: "Admin",
      alias: "smika-admin",
      correo: "soporte.smika@gmail.com",
      email: "soporte.smika@gmail.com",
      role: "admin",
      activo: true
    },
    {
      id: 2,
      nombre: "Subadmin",
      apellido: "Smika",
      alias: "subadmin-smika",
      correo: "subadmin@smika.local",
      email: "subadmin@smika.local",
      role: "subadmin",
      activo: true
    }
  ]
};

function getInitialAdminData() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (!storedData) return defaultAdminData;

    const parsedData = JSON.parse(storedData);

    return {
      ...defaultAdminData,
      ...parsedData,

      // Importante:
      // No recupero productos locales antiguos.
      // Los productos ahora deben venir desde MongoDB.
      products: [],

      events: parsedData.events || defaultAdminData.events,
      series: parsedData.series || defaultAdminData.series,
      characters: parsedData.characters || defaultAdminData.characters,
      users: parsedData.users || defaultAdminData.users
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
  const [loadingProducts, setLoadingProducts] = useState(false);

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
        error.message ||
          "No se pudieron cargar los productos desde MongoDB."
      );

      return [];
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  useEffect(() => {
    try {
      const dataToStore = {
        ...adminData,

        // No guardo productos locales como fuente principal.
        // La fuente real del catálogo es MongoDB.
        products: adminData.products.filter((product) =>
          isMongoObjectId(product._id || product.id)
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
          (product._id || product.id) !== (createdProduct._id || createdProduct.id)
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
      estado: "Activo",
      disponibilidad: "stock"
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

  const createCharacterQuick = ({ name, serie = "" }) => {
    const cleanName = name.trim();
    const cleanSerie = serie?.trim() || "Sin serie definida";

    if (!cleanName) return null;

    const existingCharacter = adminData.characters.find(
      (character) =>
        character.nombre.toLowerCase() === cleanName.toLowerCase() &&
        character.serie.toLowerCase() === cleanSerie.toLowerCase()
    );

    if (existingCharacter) return existingCharacter;

    const newCharacter = {
      id: Date.now(),
      nombre: cleanName,
      serie: cleanSerie,
      descripcion:
        "Personaje agregado rápidamente desde un producto. Falta completar sus detalles.",
      estado: "Faltan detalles",
      needsReview: true,
      activo: true,
      createdAt: new Date().toISOString()
    };

    updateCollection("characters", (currentCharacters) => [
      newCharacter,
      ...currentCharacters
    ]);

    return newCharacter;
  };

  const createCharacterFull = (payload) => {
    const newCharacter = {
      id: Date.now(),
      nombre: payload.nombre,
      serie: payload.serie || "Sin serie definida",
      descripcion: payload.descripcion || "",
      estado: payload.estado || "Completo",
      needsReview: payload.needsReview ?? false,
      activo: payload.activo ?? true,
      createdAt: new Date().toISOString()
    };

    updateCollection("characters", (currentCharacters) => [
      newCharacter,
      ...currentCharacters
    ]);

    return newCharacter;
  };

  const updateCharacter = (characterId, payload) => {
    updateCollection("characters", (currentCharacters) =>
      currentCharacters.map((character) =>
        character.id === characterId
          ? {
              ...character,
              ...payload,
              updatedAt: new Date().toISOString()
            }
          : character
      )
    );
  };

  const toggleCharacterStatus = (characterId) => {
    updateCollection("characters", (currentCharacters) =>
      currentCharacters.map((character) =>
        character.id === characterId
          ? {
              ...character,
              activo: !character.activo
            }
          : character
      )
    );
  };

  const value = useMemo(
    () => ({
      storageError,
      productLoadError,
      loadingProducts,

      products: adminData.products,
      events: adminData.events,
      series: adminData.series,
      characters: adminData.characters,
      users: adminData.users,

      refreshProducts,

      createProduct,
      updateProduct,
      toggleProductStatus,

      createCharacterQuick,
      createCharacterFull,
      updateCharacter,
      toggleCharacterStatus,

      setProducts: (updater) => updateCollection("products", updater),
      setEvents: (updater) => updateCollection("events", updater),
      setSeries: (updater) => updateCollection("series", updater),
      setCharacters: (updater) => updateCollection("characters", updater),
      setUsers: (updater) => updateCollection("users", updater)
    }),
    [adminData, storageError, productLoadError, loadingProducts]
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