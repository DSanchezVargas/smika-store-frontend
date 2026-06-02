import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  ShoppingBag
} from "lucide-react";

import ImageDropzone from "../../components/admin/ImageDropzone";
import CreatableSelect from "../../components/admin/CreatableSelect";
import MultiCreatableSelect from "../../components/admin/MultiCreatableSelect";
import CroppedImagePreview from "../../components/admin/CroppedImagePreview";
import { useAdminData } from "../../context/AdminDataContext";
import {
  createProductType as apiCreateProductType,
  getProductTypes as apiGetProductTypes
} from "../../services/productTypeService";
import {
  getAvailabilities as apiGetAvailabilities,
  syncAvailabilities as apiSyncAvailabilities
} from "../../services/availabilityService";

const initialForm = {
  nombre: "",
  descripcion: "",
  categoriaNombre: "",
  subcategoriaNombre: "",
  serieNombre: "",
  eventoNombre: "",
  origenNombre: "",
  tipoProducto: "",
  tiposProducto: [],
  personajesNombre: [],
  material: "",
  precio: "",
  stock: "",
  tamano: "",
  disponibilidad: "stock",
  estado: "Activo",
  tiempoEstimado: "",
  sincronizarDisponibilidadEvento: true,
  adulto: false,
  esNuevo: true,
  esDestacado: false
};

const baseProductTypes = [
  "Gachapon",
  "Stand de acrílico",
  "Llavero",
  "Peluche",
  "Mini stand",
  "Photocard",
  "Pin",
  "Sticker",
  "Print",
  "Tomo",
  "Merch",
  "Pack"
];

const baseAvailabilityOptions = [
  {
    id: "stock",
    nombre: "En stock",
    value: "stock",
    estado: "Activo",
    esDefault: true
  },
  {
    id: "preventa",
    nombre: "Preventa",
    value: "preventa",
    estado: "Preventa",
    esDefault: true
  },
  {
    id: "por_pedido",
    nombre: "Por pedido",
    value: "por_pedido",
    estado: "Por pedido",
    esDefault: true
  },
  {
    id: "agotado",
    nombre: "Agotado",
    value: "agotado",
    estado: "Agotado",
    esDefault: true
  }
];

function normalizeText(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getId(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item._id || item.id || "";
}

function getName(item, fallback = "") {
  if (!item) return fallback;
  if (typeof item === "string") return item;
  return item.nombre || item.titulo || item.name || fallback;
}

function getProductId(product) {
  return product?._id || product?.id || "";
}

function getProductPrice(product) {
  return Number(
    product?.precioReferencial ?? product?.precio ?? product?.price ?? 0
  );
}

function getRelatedName(value, ...fallbacks) {
  if (value && typeof value === "object") {
    return value.nombre || value.titulo || value.name || "";
  }

  const found = [value, ...fallbacks].find(
    (item) => item !== undefined && item !== null && item !== ""
  );

  return found ? found.toString().trim() : "";
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

function normalizeTiposFromProduct(product) {
  return uniqueText([
    ...normalizeArrayText(product?.tiposProducto),
    ...normalizeArrayText(product?.tipoProducto),
    ...normalizeArrayText(product?.tipo),
    ...normalizeArrayText(product?.type),
    ...normalizeArrayText(product?.typeProduct)
  ]);
}

function getProductType(product) {
  const tipos = normalizeTiposFromProduct(product);

  return tipos.join(", ");
}

function getProductCategoryName(product) {
  return getRelatedName(
    product?.categoria,
    product?.categoriaNombre,
    product?.category
  );
}

function getProductSubcategoryName(product) {
  if (product?.subcategoriaNombre) return product.subcategoriaNombre;
  if (product?.subcategoryName) return product.subcategoryName;

  if (product?.subcategoria && typeof product.subcategoria === "object") {
    return getName(product.subcategoria);
  }

  if (product?.subcategory && typeof product.subcategory === "object") {
    return getName(product.subcategory);
  }

  return product?.subcategory || product?.subcategoria || "";
}

function getProductSeriesName(product) {
  return getRelatedName(
    product?.serie,
    product?.serieNombre,
    product?.series
  );
}

function getProductEventName(product) {
  return getRelatedName(
    product?.evento,
    product?.eventoNombre,
    product?.event
  );
}

function getProductOriginName(product) {
  return getRelatedName(
    product?.origen,
    product?.origenNombre,
    product?.pais,
    "Variado"
  );
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

function getImageFile(image) {
  if (!image || typeof image !== "object") return null;
  return image.finalFile || image.file || null;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));

    reader.readAsDataURL(file);
  });
}

async function imageToPersistedSource(image) {
  const file = getImageFile(image);

  if (file) {
    const dataUrl = await fileToDataUrl(file);

    return {
      id: image.id,
      url: dataUrl,
      preview: dataUrl,
      finalPreview: dataUrl,
      name: image.name || image.originalName || "imagen-producto.jpg",
      originalName: image.originalName || image.name || "",
      size: Number(image.size || 0),
      finalSize: Number(image.finalSize || image.size || 0),
      width: Number(image.width || 0),
      height: Number(image.height || 0),
      finalWidth: Number(image.finalWidth || image.width || 0),
      finalHeight: Number(image.finalHeight || image.height || 0),
      crop: image.crop || {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      },
      zoom: Number(image.zoom || 1),
      pan: image.pan || {
        x: 0,
        y: 0
      },
      finalQuality: image.finalQuality || image.compressionQuality || 0.92,
      finalType: image.finalType || "image/jpeg",
      finalCompressed: true,
      storage: "local-data-url"
    };
  }

  const source = getImageSource(image);

  if (!source) return null;

  if (typeof image === "object") {
    return {
      ...image,
      url: image.url || source,
      preview: image.preview || source,
      finalPreview: image.finalPreview || source,
      storage:
        image.storage ||
        (source.startsWith("data:") ? "local-data-url" : "external")
    };
  }

  return {
    url: source,
    preview: source,
    finalPreview: source,
    storage: source.startsWith("data:") ? "local-data-url" : "external"
  };
}

async function prepareImagesForPayload(images = []) {
  const preparedImages = await Promise.all(images.map(imageToPersistedSource));

  return preparedImages.filter(Boolean);
}

function createEditableImageFromProduct(image, index = 0) {
  const source = getImageSource(image);

  if (!source) return null;

  return {
    id: image?.id || `product-image-${Date.now()}-${index}-${Math.random()}`,
    name: image?.name || `imagen-producto-${index + 1}.jpg`,
    originalName: image?.originalName || image?.name || "",
    preview: image?.preview || source,
    finalPreview: image?.finalPreview || source,
    url: image?.url || source,
    size: Number(image?.size || 0),
    originalSize: Number(image?.originalSize || image?.size || 0),
    compressedSize: Number(image?.compressedSize || image?.size || 0),
    finalSize: Number(image?.finalSize || image?.size || 0),
    width: Number(image?.width || image?.finalWidth || 1200),
    height: Number(image?.height || image?.finalHeight || 900),
    finalWidth: Number(image?.finalWidth || image?.width || 1200),
    finalHeight: Number(image?.finalHeight || image?.height || 900),
    crop: image?.crop || {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    },
    zoom: Number(image?.zoom || 1),
    pan: image?.pan || {
      x: 0,
      y: 0
    },
    finalQuality: image?.finalQuality || 0.92,
    finalType: image?.finalType || "image/jpeg",
    finalCompressed: image?.finalCompressed !== false,
    storage: image?.storage || "external"
  };
}

function getOptionByName(options = [], name = "") {
  return options.find(
    (option) => normalizeText(option.nombre) === normalizeText(name)
  );
}

function buildOption(item) {
  if (typeof item === "string") {
    return {
      id: item,
      nombre: item
    };
  }

  return {
    ...item,
    id: getId(item) || item.nombre,
    nombre: item.nombre || item.titulo || item.name || "Sin nombre"
  };
}

function normalizePersonajesFromProduct(product) {
  if (Array.isArray(product?.personajesNombre)) {
    return product.personajesNombre.filter(Boolean);
  }

  if (Array.isArray(product?.personajes)) {
    return product.personajes
      .map((personaje) => {
        if (typeof personaje === "object" && personaje !== null) {
          return personaje.nombre || personaje.name || "";
        }

        return "";
      })
      .filter(Boolean);
  }

  const personajeTexto = product?.personajeNombre || product?.personaje || "";

  return personajeTexto
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function pickProductTypes(data) {
  if (Array.isArray(data?.productTypes)) return data.productTypes;
  if (Array.isArray(data?.tiposProducto)) return data.tiposProducto;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

function normalizeProductTypeFromApi(productType = {}) {
  const id = getId(productType);

  return {
    ...productType,
    id,
    _id: id,
    nombre: productType.nombre || productType.name || "",
    descripcion: productType.descripcion || "",
    orden: Number(productType.orden || 0),
    activo: productType.activo !== false
  };
}

function createAvailabilityValue(text = "") {
  return normalizeText(text)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pickAvailabilities(data) {
  if (Array.isArray(data?.availabilities)) return data.availabilities;
  if (Array.isArray(data?.disponibilidades)) return data.disponibilidades;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

function normalizeAvailabilityFromApi(availability = {}) {
  const nombre = availability.nombre || availability.name || availability.label || "";
  const value =
    availability.value || availability.valor || createAvailabilityValue(nombre);

  return {
    ...availability,
    id: getId(availability) || value || nombre,
    _id: getId(availability),
    nombre: nombre || value || "Disponibilidad",
    value: value || createAvailabilityValue(nombre),
    estado: availability.estado || "Activo",
    descripcion: availability.descripcion || "",
    orden: Number(availability.orden || 0),
    esDefault: Boolean(availability.esDefault),
    usageCount: Number(availability.usageCount || availability.usos || 0)
  };
}

function mergeAvailabilityOptions(options = []) {
  return options.reduce((accumulator, option) => {
    const normalizedOption = normalizeAvailabilityFromApi(option);

    if (!normalizedOption.value) return accumulator;

    const exists = accumulator.some((item) => {
      return (
        normalizeText(item.value) === normalizeText(normalizedOption.value) ||
        normalizeText(item.nombre) === normalizeText(normalizedOption.nombre)
      );
    });

    if (!exists) accumulator.push(normalizedOption);

    return accumulator;
  }, []);
}

function getAvailabilityLabel(value = "", options = []) {
  const found = options.find(
    (option) => normalizeText(option.value) === normalizeText(value)
  );

  return found?.nombre || value || "En stock";
}

function AdminProductsPage() {
  const {
    products,
    events,
    series,
    characters,
    categories,
    origins,
    storageError,
    productLoadError,
    categoriesLoadError,
    originsLoadError,
    loadingProducts,
    createProduct,
    updateProduct,
    toggleProductStatus,
    createCharacterQuick,
    createCategoryFull,
    createOriginFull,
    refreshProducts,
    refreshCategories,
    refreshOrigins,
    createSeriesFull,
    refreshSeries,
    createEventFull,
    refreshEvents
  } = useAdminData();

  const [view, setView] = useState("list");
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [imagesTouched, setImagesTouched] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [managedProductTypes, setManagedProductTypes] = useState([]);
  const [loadingProductTypes, setLoadingProductTypes] = useState(false);
  const [productTypesError, setProductTypesError] = useState("");

  const [managedAvailabilities, setManagedAvailabilities] = useState([]);
  const [loadingAvailabilities, setLoadingAvailabilities] = useState(false);
  const [availabilitiesError, setAvailabilitiesError] = useState("");

  const sortedProducts = useMemo(() => {
    return [...(products || [])].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [products]);

  const categoryOptions = useMemo(() => {
    return (categories || [])
      .filter((category) => category.activa !== false && category.activo !== false)
      .filter((category) => category.tipo !== "subcategoria")
      .map(buildOption)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [categories]);

  const selectedCategoryOption = useMemo(() => {
    return getOptionByName(categoryOptions, form.categoriaNombre);
  }, [categoryOptions, form.categoriaNombre]);

  const subcategoryOptions = useMemo(() => {
    const selectedCategoryId = getId(selectedCategoryOption);
    const selectedCategoryName = selectedCategoryOption?.nombre || form.categoriaNombre;

    return (categories || [])
      .filter((category) => category.activa !== false && category.activo !== false)
      .filter((category) => category.tipo === "subcategoria")
      .filter((category) => {
        if (!selectedCategoryName) return true;

        const parentId = getId(category.categoriaPadre);
        const parentName = getRelatedName(
          category.categoriaPadre,
          category.categoriaPadreNombre
        );

        if (selectedCategoryId && parentId) {
          return parentId === selectedCategoryId;
        }

        if (parentName) {
          return normalizeText(parentName) === normalizeText(selectedCategoryName);
        }

        return true;
      })
      .map(buildOption)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [categories, selectedCategoryOption, form.categoriaNombre]);

  const seriesOptions = useMemo(() => {
    return (series || [])
      .filter((serie) => serie.activa !== false && serie.activo !== false)
      .map(buildOption)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [series]);

  const eventOptions = useMemo(() => {
    return (events || [])
      .filter((event) => event.activo !== false)
      .map((event) => ({
        ...event,
        id: getId(event) || event.titulo || event.nombre,
        nombre: event.titulo || event.nombre || "Evento"
      }))
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [events]);

  const originOptions = useMemo(() => {
    return (origins || [])
      .filter((origin) => origin.activo !== false)
      .map(buildOption)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [origins]);

  const typeOptions = useMemo(() => {
    const activeManagedTypes = managedProductTypes
      .filter((productType) => productType.activo !== false)
      .map((productType) => productType.nombre)
      .filter(Boolean);

    const tiposFromProducts = (products || [])
      .flatMap((product) => normalizeTiposFromProduct(product))
      .filter(Boolean);

    const allTypes = uniqueText([
      ...baseProductTypes,
      ...activeManagedTypes,
      ...tiposFromProducts
    ]);

    return allTypes
      .map((type) => {
        const managedType = managedProductTypes.find(
          (productType) =>
            normalizeText(productType.nombre) === normalizeText(type)
        );

        if (managedType) {
          return {
            ...managedType,
            id: getId(managedType) || managedType.nombre,
            nombre: managedType.nombre
          };
        }

        return {
          id: type,
          nombre: type
        };
      })
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [products, managedProductTypes]);

  const characterOptions = useMemo(() => {
    const selectedSerie = normalizeText(form.serieNombre);

    return (characters || [])
      .filter((character) => character.activo !== false)
      .filter((character) => {
        if (!selectedSerie) return true;

        return (
          normalizeText(character.serie || character.serieNombre || "") ===
          selectedSerie
        );
      })
      .map((character) => ({
        ...character,
        id: getId(character) || character.nombre,
        nombre: character.nombre || character.name || "Personaje",
        serie: character.serie || character.serieNombre || "",
        needsReview: Boolean(character.needsReview)
      }))
      .filter((character) => character.nombre)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [characters, form.serieNombre]);

  const availabilityOptions = useMemo(() => {
    const valuesFromProducts = (products || [])
      .map((product) => product?.disponibilidad)
      .filter(Boolean)
      .map((value) => ({
        id: value,
        nombre: getAvailabilityLabel(value, managedAvailabilities),
        value,
        estado: "Activo",
        fromProduct: true
      }));

    const currentValue = form.disponibilidad
      ? [
          {
            id: form.disponibilidad,
            nombre: getAvailabilityLabel(form.disponibilidad, managedAvailabilities),
            value: form.disponibilidad,
            estado: form.estado || "Activo",
            fromProduct: true
          }
        ]
      : [];

    return mergeAvailabilityOptions([
      ...baseAvailabilityOptions,
      ...managedAvailabilities,
      ...valuesFromProducts,
      ...currentValue
    ]).sort((a, b) => {
      const orderA = Number(a.orden || 0);
      const orderB = Number(b.orden || 0);

      if (orderA !== orderB) return orderA - orderB;

      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [products, managedAvailabilities, form.disponibilidad, form.estado]);

  const selectedAvailability = availabilityOptions.find(
    (option) => normalizeText(option.value) === normalizeText(form.disponibilidad)
  );

  const hasLinkedEvent = Boolean(form.eventoNombre?.trim());
  const automaticAvailabilityEnabled =
    Boolean(form.sincronizarDisponibilidadEvento) && hasLinkedEvent;

  const refreshProductTypes = async () => {
    setLoadingProductTypes(true);
    setProductTypesError("");

    try {
      const data = await apiGetProductTypes({
        activos: "false"
      });

      const list = pickProductTypes(data).map(normalizeProductTypeFromApi);

      setManagedProductTypes((currentTypes) => {
        const mergedTypes = [...currentTypes];

        list.forEach((productType) => {
          const existingIndex = mergedTypes.findIndex(
            (item) =>
              getId(item) === getId(productType) ||
              normalizeText(item.nombre) === normalizeText(productType.nombre)
          );

          if (existingIndex >= 0) {
            mergedTypes[existingIndex] = {
              ...mergedTypes[existingIndex],
              ...productType
            };
          } else {
            mergedTypes.push(productType);
          }
        });

        return mergedTypes;
      });
    } catch (error) {
      setProductTypesError(
        error.message || "No se pudieron cargar los tipos de producto."
      );
    } finally {
      setLoadingProductTypes(false);
    }
  };

  const refreshAvailabilities = async () => {
    setLoadingAvailabilities(true);
    setAvailabilitiesError("");

    try {
      const data = await apiGetAvailabilities();
      const list = pickAvailabilities(data).map(normalizeAvailabilityFromApi);

      setManagedAvailabilities(list);
    } catch (error) {
      setAvailabilitiesError(
        error.message || "No se pudieron cargar las disponibilidades."
      );
    } finally {
      setLoadingAvailabilities(false);
    }
  };

  const handleSyncAvailabilities = async () => {
    setLoadingAvailabilities(true);
    setAvailabilitiesError("");
    setMessage("Sincronizando disponibilidades usadas en productos...");

    try {
      const data = await apiSyncAvailabilities();
      const list = pickAvailabilities(data).map(normalizeAvailabilityFromApi);

      setManagedAvailabilities(list);
      setMessage(
        data.message || "Disponibilidades sincronizadas correctamente."
      );
    } catch (error) {
      setAvailabilitiesError(
        error.message || "No se pudieron sincronizar las disponibilidades."
      );
    } finally {
      setLoadingAvailabilities(false);
    }
  };

  useEffect(() => {
    refreshProductTypes();
    refreshAvailabilities();
  }, []);

  const setImagesAndTouch = (updater) => {
    setImagesTouched(true);
    setImages((currentImages) =>
      typeof updater === "function" ? updater(currentImages) : updater
    );
  };

  const resetForm = () => {
    setForm(initialForm);
    setImages([]);
    setImagesTouched(false);
    setEditingProduct(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingProduct(null);
    setForm(initialForm);
    setImages([]);
    setImagesTouched(false);
    setView("form");
  };

  const openEditForm = (product) => {
    setMessage("");
    setEditingProduct(product);

    setForm({
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      categoriaNombre: getProductCategoryName(product),
      subcategoriaNombre: getProductSubcategoryName(product),
      serieNombre: getProductSeriesName(product),
      eventoNombre: getProductEventName(product),
      origenNombre: getProductOriginName(product),
      tipoProducto: getProductType(product),
      tiposProducto: normalizeTiposFromProduct(product),
      personajesNombre: normalizePersonajesFromProduct(product),
      material: product.material || "",
      precio: getProductPrice(product),
      stock: product.stock !== undefined ? Number(product.stock || 0) : "",
      tamano: product.tamano || "",
      disponibilidad: product.disponibilidad || "stock",
      estado: product.estado || "Activo",
      tiempoEstimado: product.tiempoEstimado || "",
      sincronizarDisponibilidadEvento:
        product.sincronizarDisponibilidadEvento !== false,
      adulto: Boolean(product.adulto),
      esNuevo: product.esNuevo !== undefined ? Boolean(product.esNuevo) : true,
      esDestacado: Boolean(product.esDestacado)
    });

    setImages(
      Array.isArray(product.imagenes)
        ? product.imagenes
            .map((image, index) => createEditableImageFromProduct(image, index))
            .filter(Boolean)
        : []
    );

    setImagesTouched(false);
    setView("form");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAvailabilityChange = (value) => {
    const option = availabilityOptions.find(
      (item) => normalizeText(item.value) === normalizeText(value)
    );

    if (!option) return;

    setForm((currentForm) => ({
      ...currentForm,
      disponibilidad: option.value,
      estado: option.estado || currentForm.estado || "Activo"
    }));
  };

  const handleSimpleCreatableCreate = (name) => ({
    id: `temp-${Date.now()}-${name}`,
    nombre: name
  });

  const handleCreateProductType = async (name) => {
    const cleanName = name?.trim();

    if (!cleanName) {
      return null;
    }

    const existingType = typeOptions.find(
      (option) => normalizeText(option.nombre) === normalizeText(cleanName)
    );

    if (existingType) {
      return existingType;
    }

    const existingManagedType = managedProductTypes.find(
      (productType) =>
        normalizeText(productType.nombre) === normalizeText(cleanName)
    );

    if (existingManagedType) {
      if (existingManagedType.activo === false) {
        throw new Error(
          `El tipo de producto “${existingManagedType.nombre}” ya existe, pero está desactivado. Actívalo en Tipos de producto antes de usarlo.`
        );
      }

      return existingManagedType;
    }

    try {
      const data = await apiCreateProductType({
        nombre: cleanName,
        descripcion: "Tipo de producto creado rápidamente desde productos.",
        orden: 0,
        activo: true
      });

      const createdProductType = normalizeProductTypeFromApi(
        data.productType || data.tipoProducto || data.data || data
      );

      const option = {
        ...createdProductType,
        id: getId(createdProductType) || cleanName,
        nombre: createdProductType.nombre || cleanName,
        activo: createdProductType.activo !== false
      };

      setManagedProductTypes((currentTypes) => {
        const exists = currentTypes.some(
          (item) =>
            getId(item) === getId(option) ||
            normalizeText(item.nombre) === normalizeText(option.nombre)
        );

        if (exists) {
          return currentTypes.map((item) =>
            getId(item) === getId(option) ||
            normalizeText(item.nombre) === normalizeText(option.nombre)
              ? {
                  ...item,
                  ...option,
                  activo: option.activo !== false
                }
              : item
          );
        }

        return [option, ...currentTypes];
      });

      return option;
    } catch (error) {
      let existingProductType = null;

      try {
        const data = await apiGetProductTypes({
          activos: "false"
        });

        const list = pickProductTypes(data).map(normalizeProductTypeFromApi);

        existingProductType = list.find(
          (productType) =>
            normalizeText(productType.nombre) === normalizeText(cleanName)
        );

        if (list.length > 0) {
          setManagedProductTypes((currentTypes) => {
            const mergedTypes = [...currentTypes];

            list.forEach((productType) => {
              const existingIndex = mergedTypes.findIndex(
                (item) =>
                  getId(item) === getId(productType) ||
                  normalizeText(item.nombre) ===
                    normalizeText(productType.nombre)
              );

              if (existingIndex >= 0) {
                mergedTypes[existingIndex] = {
                  ...mergedTypes[existingIndex],
                  ...productType
                };
              } else {
                mergedTypes.push(productType);
              }
            });

            return mergedTypes;
          });
        }
      } catch {
        // Se mantiene el error original de creación.
      }

      if (existingProductType) {
        if (existingProductType.activo === false) {
          throw new Error(
            `El tipo de producto “${existingProductType.nombre}” ya existe, pero está desactivado. Actívalo en Tipos de producto antes de usarlo.`
          );
        }

        return existingProductType;
      }

      throw new Error(
        error.message ||
          `No se pudo guardar “${cleanName}” en Gestión de tipos de producto. El producto no se guardó para evitar que el tipo quede solo local.`
      );
    }
  };

  const ensureCategoryExists = async () => {
    const categoryName = form.categoriaNombre.trim();

    if (!categoryName) {
      throw new Error("Selecciona o crea una categoría real.");
    }

    const existingCategory = getOptionByName(categoryOptions, categoryName);

    if (existingCategory) {
      return {
        id: existingCategory._id || existingCategory.id,
        nombre: existingCategory.nombre
      };
    }

    const createdCategory = await createCategoryFull({
      nombre: categoryName,
      descripcion: "Categoría creada rápidamente desde productos.",
      tipo: "principal",
      orden: 0,
      activa: true
    });

    await refreshCategories?.();

    return {
      id: createdCategory._id || createdCategory.id,
      nombre: createdCategory.nombre
    };
  };

  const ensureSubcategoryExists = async (category) => {
    const subcategoryName = form.subcategoriaNombre.trim();

    if (!subcategoryName) {
      return {
        id: "",
        nombre: ""
      };
    }

    const existingSubcategory = (categories || [])
      .filter((item) => item.activa !== false && item.activo !== false)
      .filter((item) => item.tipo === "subcategoria")
      .find((item) => {
        if (normalizeText(item.nombre) !== normalizeText(subcategoryName)) {
          return false;
        }

        const parentId = getId(item.categoriaPadre);
        const parentName = getRelatedName(
          item.categoriaPadre,
          item.categoriaPadreNombre
        );

        if (category?.id && parentId) {
          return parentId === category.id;
        }

        if (category?.nombre && parentName) {
          return normalizeText(parentName) === normalizeText(category.nombre);
        }

        return true;
      });

    if (existingSubcategory) {
      return {
        id: existingSubcategory._id || existingSubcategory.id,
        nombre: existingSubcategory.nombre
      };
    }

    if (!createCategoryFull) {
      return {
        id: "",
        nombre: subcategoryName
      };
    }

    const createdSubcategory = await createCategoryFull({
      nombre: subcategoryName,
      descripcion: `Subcategoría creada rápidamente desde productos para ${category?.nombre || "la categoría seleccionada"}.`,
      tipo: "subcategoria",
      categoriaPadre: category?.id || "",
      orden: 0,
      activa: true
    });

    await refreshCategories?.();

    return {
      id: createdSubcategory._id || createdSubcategory.id,
      nombre: createdSubcategory.nombre
    };
  };

  const ensureOriginExists = async () => {
    const originName = form.origenNombre.trim() || "Variado";
    const existingOrigin = getOptionByName(originOptions, originName);

    if (existingOrigin) {
      return {
        id: existingOrigin._id || existingOrigin.id,
        nombre: existingOrigin.nombre
      };
    }

    if (!createOriginFull) {
      return {
        id: "",
        nombre: originName
      };
    }

    const createdOrigin = await createOriginFull({
      nombre: originName,
      descripcion: "Origen creado rápidamente desde productos.",
      activo: true
    });

    await refreshOrigins?.();

    return {
      id: createdOrigin._id || createdOrigin.id,
      nombre: createdOrigin.nombre
    };
  };

  const ensureSeriesExists = async (origin) => {
    const seriesName = form.serieNombre.trim();

    if (!seriesName) {
      return {
        id: "",
        nombre: ""
      };
    }

    const existingSeries = getOptionByName(seriesOptions, seriesName);

    if (existingSeries) {
      return {
        id: existingSeries._id || existingSeries.id,
        nombre: existingSeries.nombre
      };
    }

    if (!createSeriesFull) {
      return {
        id: "",
        nombre: seriesName
      };
    }

    const createdSeries = await createSeriesFull({
      nombre: seriesName,
      descripcion: "Serie creada rápidamente desde productos.",
      categoriaPrincipalNombre: form.categoriaNombre.trim() || "Series",
      categoriaNombre: form.categoriaNombre.trim() || "Series",
      origen: origin?.id || "",
      origenNombre: origin?.nombre || form.origenNombre.trim() || "Variado",
      pais: origin?.nombre || form.origenNombre.trim() || "V",
      tipo: form.categoriaNombre.trim() || "Historia",
      genero: "",
      creadoresNombre: [],
      destacada: false,
      activa: true,
      activo: true,
      orden: 0
    });

    await refreshSeries?.();

    return {
      id: createdSeries._id || createdSeries.id,
      nombre: createdSeries.nombre
    };
  };

  const ensureEventExists = async ({ origin, serie }) => {
    const eventName = form.eventoNombre.trim();

    if (!eventName) {
      return {
        id: "",
        nombre: ""
      };
    }

    const existingEvent = getOptionByName(eventOptions, eventName);

    if (existingEvent) {
      return {
        id: existingEvent._id || existingEvent.id,
        nombre: existingEvent.nombre
      };
    }

    if (!createEventFull) {
      return {
        id: "",
        nombre: eventName
      };
    }

    const createdEvent = await createEventFull({
      titulo: eventName,
      nombre: eventName,
      descripcion: "Evento creado rápidamente desde productos.",
      categoriaNombre: "Eventos",
      origen: origin?.id || "",
      origenNombre: origin?.nombre || form.origenNombre.trim() || "Variado",
      pais: origin?.nombre || form.origenNombre.trim() || "V",
      tipoEvento: "Otro",
      fechaInicio: null,
      fechaFin: null,
      estado: "proximo",
      destacado: false,
      activo: true,
      series: serie?.id ? [serie.id] : [],
      seriesNombre: serie?.nombre ? [serie.nombre] : [],
      productos: []
    });

    await refreshEvents?.();

    return {
      id: createdEvent._id || createdEvent.id,
      nombre: createdEvent.titulo || createdEvent.nombre || eventName
    };
  };

  const buildPayload = async () => {
    const category = await ensureCategoryExists();
    const subcategory = await ensureSubcategoryExists(category);
    const origin = await ensureOriginExists();
    const serie = await ensureSeriesExists(origin);
    const event = await ensureEventExists({ origin, serie });

    const tiposProducto = uniqueText(
      Array.isArray(form.tiposProducto) ? form.tiposProducto : []
    );

    const tiposProductoTexto = tiposProducto.join(", ");

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),

      categoriaId: category.id,
      categoria: category.id,
      categoriaNombre: category.nombre,

      subcategoriaId: subcategory.id,
      subcategoria: subcategory.id || subcategory.nombre,
      subcategoriaNombre: subcategory.nombre || form.subcategoriaNombre.trim(),

      serieId: serie.id,
      serie: serie.id || serie.nombre,
      serieNombre: serie.nombre || form.serieNombre.trim(),

      eventoId: event.id,
      evento: event.id || event.nombre,
      eventoNombre: event.nombre || form.eventoNombre.trim(),

      origen: origin.id || form.origenNombre.trim(),
      origenNombre: origin.nombre,
      pais: origin.nombre,

      tipo: tiposProductoTexto,
      tipoProducto: tiposProductoTexto,
      tiposProducto,

      personajesNombre: form.personajesNombre,
      personajeNombre: form.personajesNombre.join(", "),

      material: form.material.trim(),
      precio: Number(form.precio || 0),
      precioReferencial: Number(form.precio || 0),
      price: Number(form.precio || 0),
      stock: Number(form.stock || 0),
      tamano: form.tamano.trim(),
      disponibilidad: form.disponibilidad,
      estado: form.estado,
      tiempoEstimado: form.tiempoEstimado.trim(),
      sincronizarDisponibilidadEvento: Boolean(
        form.sincronizarDisponibilidadEvento
      ),
      adulto: Boolean(form.adulto),
      esNuevo: Boolean(form.esNuevo),
      esDestacado: Boolean(form.esDestacado),
      activo: form.estado !== "Inactivo"
    };

    if (!editingProduct || imagesTouched) {
      payload.imagenes = await prepareImagesForPayload(images);
      payload.imagenesTouched = true;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre del producto.");
      return;
    }

    if (!form.categoriaNombre.trim()) {
      setMessage("Selecciona o crea una categoría.");
      return;
    }

    if (!Array.isArray(form.tiposProducto) || form.tiposProducto.length === 0) {
      setMessage("Selecciona o crea al menos un tipo de producto.");
      return;
    }

    if (Number(form.precio || 0) < 0) {
      setMessage("El precio no puede ser negativo.");
      return;
    }

    if (Number(form.stock || 0) < 0) {
      setMessage("El stock no puede ser negativo.");
      return;
    }

    if (!editingProduct && images.length === 0) {
      setMessage("Sube al menos una imagen del producto.");
      return;
    }

    setSaving(true);
    setMessage(
      editingProduct
        ? "Guardando cambios del producto..."
        : "Creando producto..."
    );

    try {
      for (const productTypeName of form.tiposProducto) {
        await handleCreateProductType(productTypeName);
      }

      for (const characterName of form.personajesNombre) {
        await createCharacterQuick({
          name: characterName,
          serie: form.serieNombre
        });
      }

      const payload = await buildPayload();

      if (editingProduct) {
        await updateProduct(getProductId(editingProduct), payload);
        setMessage("Producto actualizado correctamente.");
      } else {
        await createProduct(payload);
        setMessage("Producto creado correctamente.");
      }

      resetForm();
      await Promise.all([
        refreshProducts?.(),
        refreshProductTypes(),
        refreshAvailabilities()
      ]);
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const productId = getProductId(product);

    if (!productId) {
      setMessage("No se encontró el ID del producto.");
      return;
    }

    setSaving(true);
    setMessage(
      product.activo ? "Desactivando producto..." : "Activando producto..."
    );

    try {
      await toggleProductStatus(productId);
      await refreshProducts?.();

      setMessage(
        product.activo
          ? "Producto desactivado correctamente."
          : "Producto activado correctamente."
      );
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado del producto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Productos</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de productos</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Crea y edita productos sin romper imágenes existentes. Los tipos
              de producto se cargan desde la sección global y la disponibilidad
              ahora viene desde Gestión de disponibilidades.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <>
                <button
                  type="button"
                  onClick={refreshProductTypes}
                  disabled={loadingProductTypes || saving}
                  className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw
                    size={18}
                    className={loadingProductTypes ? "animate-spin" : ""}
                  />
                  Tipos
                </button>

                <button
                  type="button"
                  onClick={handleSyncAvailabilities}
                  disabled={loadingAvailabilities || saving}
                  className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw
                    size={18}
                    className={loadingAvailabilities ? "animate-spin" : ""}
                  />
                  Disponibilidad
                </button>

                <button
                  type="button"
                  onClick={refreshProducts}
                  disabled={loadingProducts || saving}
                  className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw
                    size={18}
                    className={loadingProducts ? "animate-spin" : ""}
                  />
                  Recargar
                </button>
              </>
            )}

            {view === "list" ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="smika-button-primary flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Crear producto
              </button>
            ) : (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full bg-[#F7D9D8] px-5 py-3 font-black flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Volver
              </button>
            )}
          </div>
        </div>
      </div>

      {(message ||
        storageError ||
        productLoadError ||
        categoriesLoadError ||
        originsLoadError ||
        productTypesError ||
        availabilitiesError) && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message ||
            storageError ||
            productLoadError ||
            categoriesLoadError ||
            originsLoadError ||
            productTypesError ||
            availabilitiesError}
        </div>
      )}

      {view === "form" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] bg-white p-6 smika-shadow border border-[#87CCC8]/20"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[#87CCC8] font-black">
                {editingProduct ? "Editar producto" : "Nuevo producto"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingProduct
                  ? "Actualizar producto"
                  : "Registrar producto"}
              </h3>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="smika-button-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Nombre
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Stand de acrílico..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Descripción opcional
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Escribe una descripción visible en el detalle del producto."
              />
            </label>

            <CreatableSelect
              label="Categoría"
              value={form.categoriaNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  categoriaNombre: value,
                  subcategoriaNombre: ""
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={categoryOptions}
              placeholder="Buscar o escribir categoría"
              emptyLabel="Sin categoría"
              emptyCreateLabel="Agregar categoría"
              createLabel={(name) => `Agregar “${name}” a categorías`}
              helperText="Si no existe, se creará y se guardará en MongoDB al guardar el producto."
            />

            <CreatableSelect
              label="Subcategoría"
              value={form.subcategoriaNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  subcategoriaNombre: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={subcategoryOptions}
              placeholder="Gacha, packs personalizados..."
              emptyLabel="Sin subcategoría"
              emptyCreateLabel="Agregar subcategoría"
              createLabel={(name) =>
                `Agregar “${name}” como subcategoría de “${form.categoriaNombre.trim()}”`
              }
              disabled={!form.categoriaNombre.trim()}
              disabledText="Selecciona primero una categoría principal."
              helperText="Ejemplo recomendado: Categoría Personalizados > Subcategoría Gacha. Si no existe, se creará al guardar el producto."
            />

            <CreatableSelect
              label="Serie / Historia"
              value={form.serieNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  serieNombre: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={seriesOptions}
              placeholder="Buscar o escribir serie"
              emptyLabel="Sin serie"
              emptyCreateLabel="Agregar serie"
              createLabel={(name) => `Agregar “${name}” a series`}
              helperText="Si no existe, se creará y quedará guardada en MongoDB al guardar el producto."
            />

            <CreatableSelect
              label="Evento"
              value={form.eventoNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  eventoNombre: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={eventOptions}
              placeholder="Buscar o escribir evento"
              emptyLabel="Sin evento"
              emptyCreateLabel="Agregar evento"
              createLabel={(name) => `Agregar “${name}” a eventos`}
              helperText="Si no existe, se creará y quedará guardado en MongoDB al guardar el producto."
            />

            <CreatableSelect
              label="Origen / País"
              value={form.origenNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  origenNombre: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={originOptions}
              placeholder="China, Corea, Japón, Variado..."
              emptyLabel="Sin origen"
              emptyCreateLabel="Agregar origen"
              createLabel={(name) => `Agregar “${name}” a países/orígenes`}
              helperText="Si no existe, se creará y quedará guardado en MongoDB."
            />

            <MultiCreatableSelect
              label="Tipos de producto"
              values={form.tiposProducto}
              onChange={(values) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  tiposProducto: uniqueText(values),
                  tipoProducto: uniqueText(values).join(", ")
                }))
              }
              onCreate={handleCreateProductType}
              options={typeOptions}
              placeholder="Stand, llavero, photocard..."
              emptyLabel="Sin tipos de producto"
              emptyCreateLabel="Agregar tipo de producto"
              createLabel={(name) => `Agregar “${name}” a tipo de producto`}
              helperText="Un producto puede tener uno o más tipos de producto. No se borran los tipos existentes: se mezclan los tipos globales con los usados anteriormente."
            />

            <label className="grid gap-2 text-sm font-black">
              Material
              <input
                name="material"
                value={form.material}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Acrílico, papel, metal..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Precio referencial
              <input
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Stock numérico
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: 10"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Disponibilidad
              <select
                value={selectedAvailability?.value || form.disponibilidad || "stock"}
                onChange={(event) => handleAvailabilityChange(event.target.value)}
                disabled={automaticAvailabilityEnabled}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
              >
                {availabilityOptions.map((option) => (
                  <option key={`${option.value}-${option.id}`} value={option.value}>
                    {option.nombre}
                    {option.fromProduct ? " · usado en productos" : ""}
                  </option>
                ))}
              </select>
              <span className="text-xs font-medium text-gray-500 leading-5">
                Las opciones vienen de Gestión de disponibilidades. Para crear o borrar duplicados, entra a /admin/disponibilidades.
              </span>
              {automaticAvailabilityEnabled && (
                <span className="text-xs font-black text-[#D1B0C7] leading-5">
                  La disponibilidad está sincronizada con el evento: antes de la
                  fecha de inicio será Preventa y desde esa fecha será Por pedido
                  según hora Perú. Para editarla manualmente, desactiva la
                  sincronización.
                </span>
              )}
            </label>

            <label className="grid gap-2 text-sm font-black">
              Mensaje de disponibilidad / tiempo estimado
              <input
                name="tiempoEstimado"
                value={form.tiempoEstimado}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Llega en 15 días, disponible por pedido..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Tamaño
              <input
                name="tamano"
                value={form.tamano}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="10 cm, A5, estándar..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Estado interno
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                disabled={automaticAvailabilityEnabled}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="Activo">Activo</option>
                <option value="Preventa">Preventa</option>
                <option value="Por pedido">Por pedido</option>
                <option value="Agotado">Agotado</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              {automaticAvailabilityEnabled && (
                <span className="text-xs font-black text-[#D1B0C7] leading-5">
                  El estado interno también se ajustará automáticamente con la
                  fecha de inicio del evento.
                </span>
              )}
            </label>

            <div className="grid gap-3 rounded-3xl bg-[#F8F6F7] p-4 lg:col-span-2">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Sincronizar disponibilidad con fecha del evento
                <input
                  type="checkbox"
                  name="sincronizarDisponibilidadEvento"
                  checked={form.sincronizarDisponibilidadEvento}
                  onChange={handleChange}
                  disabled={!hasLinkedEvent}
                  className="h-5 w-5"
                />
              </label>

              <p className="text-xs text-gray-500 leading-5">
                Si el producto tiene evento vinculado y esta opción está activa,
                antes de la fecha de inicio del evento será Preventa y desde esa
                fecha será Por pedido según hora Perú. Si quieres controlar
                manualmente disponibilidad y estado interno, desactiva esta
                opción.
              </p>

              {!hasLinkedEvent && (
                <p className="text-xs font-black text-[#D1B0C7] leading-5">
                  Selecciona o crea un evento para activar esta sincronización.
                </p>
              )}

              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Producto nuevo
                <input
                  type="checkbox"
                  name="esNuevo"
                  checked={form.esNuevo}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Destacado
                <input
                  type="checkbox"
                  name="esDestacado"
                  checked={form.esDestacado}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Producto adulto
                <input
                  type="checkbox"
                  name="adulto"
                  checked={form.adulto}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>
            </div>

            <div className="lg:col-span-2">
              <MultiCreatableSelect
                label="Personajes / criaturas"
                values={form.personajesNombre}
                onChange={(values) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    personajesNombre: values
                  }))
                }
                onCreate={(name) =>
                  createCharacterQuick({
                    name,
                    serie: form.serieNombre.trim()
                  })
                }
                options={characterOptions}
                placeholder="Ejemplo: Shuraka"
                emptyLabel="Sin personajes"
                emptyCreateLabel="Agregar personaje"
                disabled={!form.serieNombre.trim()}
                disabledText="Selecciona primero una serie para agregar personajes."
                createLabel={(name) =>
                  `Agregar “${name}” a personajes de “${form.serieNombre.trim()}”`
                }
                helperText="Primero selecciona la serie. Si escribes un personaje que no existe, se creará asociado a esa serie y marcado como faltan detalles."
              />
            </div>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Imágenes del producto</p>

              <p className="mt-1 text-sm text-gray-600 leading-6">
                Si editas y no tocas esta zona, las imágenes guardadas no se
                envían otra vez ni se modifican. Si agregas una nueva, se
                conservan las anteriores y se agrega la nueva.
              </p>

              <div className="mt-4">
                <ImageDropzone
                  label="Subir imágenes"
                  description="Arrastra o selecciona imágenes del producto."
                  images={images}
                  setImages={setImagesAndTouch}
                  multiple
                />
              </div>
            </div>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Vista previa</p>

              {images.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {images.map((image, index) => (
                    <CroppedImagePreview
                      key={image.id || index}
                      image={image}
                      alt={`Imagen ${index + 1}`}
                      className="aspect-square w-full"
                      rounded="rounded-2xl"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex h-48 items-center justify-center rounded-3xl bg-white text-gray-400">
                  <ImageIcon size={42} />
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          {loadingProducts ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando productos...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <ShoppingBag size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay productos
              </h3>

              <p className="mt-2 text-gray-600">
                Crea un producto para verlo en el catálogo.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {sortedProducts.map((product) => {
                const firstImage = Array.isArray(product.imagenes)
                  ? product.imagenes[0]
                  : null;

                return (
                  <article
                    key={getProductId(product)}
                    className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
                  >
                    <div className="h-44 bg-[#F8F6F7]">
                      {firstImage ? (
                        <CroppedImagePreview
                          image={firstImage}
                          alt={product.nombre}
                          className="h-full w-full"
                          rounded="rounded-none"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          <ImageIcon size={36} />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                          {product.activo ? "Activo" : "Inactivo"}
                        </span>

                        <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                          {product.estado || "Activo"}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {product.nombre}
                      </h3>

                      <div className="mt-3 grid gap-2 text-sm text-gray-600">
                        <p>
                          <strong>Categoría:</strong>{" "}
                          {getProductCategoryName(product) || "Sin categoría"}
                        </p>

                        <p>
                          <strong>Subcategoría:</strong>{" "}
                          {getProductSubcategoryName(product) || "Sin subcategoría"}
                        </p>

                        <p>
                          <strong>Tipo de producto:</strong>{" "}
                          {getProductType(product) || "Sin tipo"}
                        </p>

                        <p>
                          <strong>Serie:</strong>{" "}
                          {getProductSeriesName(product) || "Sin serie"}
                        </p>

                        <p>
                          <strong>Evento:</strong>{" "}
                          {getProductEventName(product) || "Sin evento"}
                        </p>

                        <p>
                          <strong>Origen:</strong>{" "}
                          {getProductOriginName(product) || "Sin origen"}
                        </p>

                        <p>
                          <strong>Precio:</strong> S/ {getProductPrice(product)}
                        </p>

                        <p>
                          <strong>Stock:</strong> {product.stock || 0}
                        </p>

                        <p>
                          <strong>Disponibilidad:</strong>{" "}
                          {getAvailabilityLabel(product.disponibilidad, availabilityOptions)}
                        </p>

                        <p>
                          <strong>Sync evento:</strong>{" "}
                          {product.sincronizarDisponibilidadEvento === false
                            ? "Manual"
                            : "Automática"}
                        </p>

                        {product.tiempoEstimado && (
                          <p>
                            <strong>Mensaje:</strong> {product.tiempoEstimado}
                          </p>
                        )}

                        <p>
                          <strong>Imágenes:</strong>{" "}
                          {Array.isArray(product.imagenes)
                            ? product.imagenes.length
                            : 0}
                        </p>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(product)}
                          disabled={saving}
                          className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                          title={product.activo ? "Desactivar" : "Activar"}
                        >
                          <Power
                            size={17}
                            className={
                              product.activo ? "text-gray-500" : "text-red-500"
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminProductsPage;