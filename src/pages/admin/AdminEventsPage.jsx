import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save
} from "lucide-react";

import AutoCarousel from "../../components/common/AutoCarousel";
import ImageDropzone from "../../components/admin/ImageDropzone";
import CreatableSelect from "../../components/admin/CreatableSelect";
import MultiCreatableSelect from "../../components/admin/MultiCreatableSelect";
import { useAdminData } from "../../context/AdminDataContext";
import {
  createEventType as apiCreateEventType,
  getEventTypes as apiGetEventTypes
} from "../../services/eventTypeService";

const initialForm = {
  titulo: "",
  descripcion: "",
  categoriaNombre: "Eventos",
  origenNombre: "Variado",
  pais: "V",
  tipoEvento: "Otro",
  tiposEvento: ["Otro"],
  fechaInicio: "",
  fechaFin: "",
  estado: "proximo",
  destacado: false,
  activo: true,
  seriesNombre: [],
  productos: []
};

const eventStatusOptions = [
  { value: "proximo", label: "Próximo" },
  { value: "preventa", label: "Preventa" },
  { value: "activo", label: "Activo" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" }
];

const baseEventTypes = [
  "Lebom",
  "Café",
  "Fantazit",
  "Preventa",
  "Evento actual",
  "Evento próximo",
  "Pop up",
  "Campaña",
  "Colaboración",
  "Otro"
];

const baseEventCategories = ["Eventos", "Preventa", "Cronograma", "Campaña"];
const baseOrigins = ["China", "Corea", "Japón", "Variado"];

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

function normalizeText(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function uniqueTexts(values = []) {
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

function getEventTypesFromEvent(event) {
  return uniqueTexts([
    ...normalizeArrayText(event?.tiposEvento),
    ...normalizeArrayText(event?.tipoEvento),
    ...normalizeArrayText(event?.tipo),
    ...normalizeArrayText(event?.eventType),
    ...normalizeArrayText(event?.eventTypes)
  ]);
}

function pickEventTypes(data) {
  if (Array.isArray(data?.eventTypes)) return data.eventTypes;
  if (Array.isArray(data?.tiposEvento)) return data.tiposEvento;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

function normalizeEventTypeFromApi(eventType = {}) {
  const id = getId(eventType);

  return {
    ...eventType,
    id,
    _id: id,
    nombre: eventType.nombre || eventType.name || "",
    descripcion: eventType.descripcion || "",
    orden: Number(eventType.orden || 0),
    activo: eventType.activo !== false
  };
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
    return fileToDataUrl(file);
  }

  return getImageSource(image);
}

async function prepareImagesForPayload(images = []) {
  const preparedImages = await Promise.all(images.map(imageToPersistedSource));
  const seenImages = new Set();

  return preparedImages
    .map((image) => image?.toString().trim())
    .filter(Boolean)
    .filter((image) => {
      if (seenImages.has(image)) return false;

      seenImages.add(image);
      return true;
    });
}

function createEditableImageFromSource(src, index = 0) {
  if (!src) return null;

  return {
    id: `event-image-${Date.now()}-${index}-${Math.random()}`,
    name: `imagen-evento-${index + 1}.jpg`,
    originalName: `imagen-evento-${index + 1}.jpg`,
    preview: src,
    finalPreview: src,
    url: src,
    size: 0,
    originalSize: 0,
    compressedSize: 0,
    finalSize: 0,
    width: 1200,
    height: 900,
    finalWidth: 1200,
    finalHeight: 900,
    crop: {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    },
    zoom: 1,
    pan: {
      x: 0,
      y: 0
    },
    finalQuality: 0.92,
    finalType: "image/jpeg",
    finalCompressed: true,
    storage: "existing"
  };
}

function formatDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function formatDateText(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getStatusLabel(value) {
  return (
    eventStatusOptions.find((option) => option.value === value)?.label ||
    value ||
    "Próximo"
  );
}

function getCountryCodeFromOrigin(originName = "") {
  const cleanOrigin = normalizeText(originName);

  if (cleanOrigin === "china") return "CN";
  if (cleanOrigin === "corea") return "KR";
  if (cleanOrigin === "japon" || cleanOrigin === "japón") return "JP";
  if (cleanOrigin === "variado") return "V";

  return originName.trim() || "V";
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
    id: getId(item) || getName(item),
    nombre: getName(item, "Sin nombre")
  };
}

function buildOptionsFromNames(names = [], realItems = []) {
  const uniqueNames = uniqueTexts(names);

  return uniqueNames
    .map((name) => {
      const realItem = realItems.find(
        (item) => normalizeText(getName(item)) === normalizeText(name)
      );

      if (realItem) return buildOption(realItem);

      return {
        id: name,
        nombre: name
      };
    })
    .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
}

function getOptionByName(options = [], name = "") {
  return options.find(
    (option) => normalizeText(option.nombre) === normalizeText(name)
  );
}

function getEventTitle(event) {
  return event?.titulo || event?.nombre || "Evento Smika";
}

function getEventSeriesNames(event) {
  const fromSeriesNombre = Array.isArray(event?.seriesNombre)
    ? event.seriesNombre
    : [];

  const fromSeriesObjects = Array.isArray(event?.series)
    ? event.series
        .map((serie) => {
          if (typeof serie === "string") return "";
          return getName(serie);
        })
        .filter(Boolean)
    : [];

  const legacySerie = event?.serieNombre || event?.serie || "";

  return uniqueTexts([
    ...fromSeriesNombre,
    ...fromSeriesObjects,
    legacySerie
  ]);
}

function getEventProductIds(event) {
  if (!Array.isArray(event?.productos)) return [];

  return event.productos
    .map((product) => {
      if (typeof product === "string") return product;
      return getId(product);
    })
    .filter(Boolean);
}

function getCoverImageFromEvent(event) {
  return getImageSource(event?.imagen);
}

function getAdditionalImagesFromEvent(event) {
  const coverImage = getCoverImageFromEvent(event);

  const images = Array.isArray(event?.imagenes)
    ? event.imagenes.map(getImageSource).filter(Boolean)
    : [];

  return images.filter((image) => image !== coverImage);
}

function getProductExtraLabel(product) {
  const seriesName = product?.serieNombre || product?.serie || "";
  const typeName =
    product?.tipoProducto ||
    product?.tipo ||
    (Array.isArray(product?.tiposProducto)
      ? product.tiposProducto.join(", ")
      : "");

  const price = product?.precioReferencial ?? product?.precio ?? product?.price;

  const details = [seriesName, typeName, price ? `S/ ${price}` : ""].filter(
    Boolean
  );

  return details.length > 0 ? details.join(" · ") : "";
}

function ProductMultiSelect({
  title,
  description,
  options,
  selectedIds,
  onChange,
  emptyText = "No hay opciones disponibles."
}) {
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const cleanSearch = normalizeText(search);

    if (!cleanSearch) return options;

    return options.filter((item) => {
      const name = item.nombre || item.titulo || "";
      const extra = getProductExtraLabel(item);

      return normalizeText(`${name} ${extra}`).includes(cleanSearch);
    });
  }, [options, search]);

  const toggleOption = (id) => {
    onChange((currentIds) => {
      if (currentIds.includes(id)) {
        return currentIds.filter((currentId) => currentId !== id);
      }

      return [...currentIds, id];
    });
  };

  return (
    <div className="rounded-[28px] bg-[#F8F6F7] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black">{title}</p>

          {description && (
            <p className="mt-1 text-sm text-gray-600 leading-6">
              {description}
            </p>
          )}
        </div>

        <span className="rounded-full bg-white px-4 py-2 text-xs font-black">
          {selectedIds.length} seleccionado{selectedIds.length === 1 ? "" : "s"}
        </span>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-4 w-full rounded-2xl border border-[#87CCC8]/30 bg-white px-4 py-3 text-sm outline-none"
        placeholder="Buscar producto..."
      />

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((item) => {
            const id = getId(item);
            const checked = selectedIds.includes(id);
            const name = item.nombre || item.titulo || "Producto";
            const extra = getProductExtraLabel(item);

            return (
              <label
                key={id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                  checked
                    ? "border-[#87CCC8] bg-white"
                    : "border-transparent bg-white/70 hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOption(id)}
                  className="mt-1 h-4 w-4"
                />

                <span className="min-w-0 flex-1">
                  <span className="block font-black">{name}</span>

                  {extra && (
                    <span className="mt-1 block text-xs text-gray-500">
                      {extra}
                    </span>
                  )}
                </span>
              </label>
            );
          })
        ) : (
          <p className="px-3 py-4 text-sm text-gray-500">{emptyText}</p>
        )}
      </div>

      {selectedIds.length > 0 && (
        <p className="mt-3 text-xs font-black text-[#87CCC8]">
          Productos seleccionados: {selectedIds.length}
        </p>
      )}
    </div>
  );
}

function AdminEventsPage() {
  const {
    events,
    series,
    products,
    categories,
    origins,

    loadingEvents,
    eventsLoadError,
    categoriesLoadError,
    originsLoadError,
    seriesLoadError,

    refreshEvents,
    refreshCategories,
    refreshOrigins,
    refreshSeries,

    createEventFull,
    updateEventFull,
    toggleEventStatus,

    createCategoryFull,
    createOriginFull,
    createSeriesFull
  } = useAdminData();

  const [view, setView] = useState("list");
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [coverImages, setCoverImages] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [imagesTouched, setImagesTouched] = useState(false);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [managedEventTypes, setManagedEventTypes] = useState([]);
  const [loadingEventTypes, setLoadingEventTypes] = useState(false);
  const [eventTypesError, setEventTypesError] = useState("");

  const sortedEvents = useMemo(() => {
    return [...(events || [])].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;

      const dateA = new Date(a.fechaInicio || a.createdAt || 0).getTime();
      const dateB = new Date(b.fechaInicio || b.createdAt || 0).getTime();

      return dateB - dateA;
    });
  }, [events]);

  const activeSeries = useMemo(() => {
    return (series || [])
      .filter((serie) => serie.activo !== false && serie.activa !== false)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [series]);

  const activeProducts = useMemo(() => {
    return (products || [])
      .filter((product) => product.activo !== false)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [products]);

  const categoryOptions = useMemo(() => {
    const namesFromEvents = (events || [])
      .map((event) => event.categoriaNombre)
      .filter(Boolean);

    const realCategories = (categories || []).filter(
      (category) => category.activo !== false && category.activa !== false
    );

    return buildOptionsFromNames(
      [...baseEventCategories, ...namesFromEvents],
      realCategories
    );
  }, [events, categories]);

  const originOptions = useMemo(() => {
    const namesFromEvents = (events || [])
      .map((event) => event.origenNombre || event.pais)
      .filter(Boolean);

    const realOrigins = (origins || []).filter(
      (origin) => origin.activo !== false
    );

    return buildOptionsFromNames(
      [...baseOrigins, ...namesFromEvents],
      realOrigins
    );
  }, [events, origins]);

  const eventTypeOptions = useMemo(() => {
    const activeManagedTypes = managedEventTypes
      .filter((eventType) => eventType.activo !== false)
      .map((eventType) => eventType.nombre)
      .filter(Boolean);

    const typesFromEvents = (events || [])
      .flatMap((event) => getEventTypesFromEvent(event))
      .filter(Boolean);

    const allTypes = uniqueTexts([
      ...baseEventTypes,
      ...activeManagedTypes,
      ...typesFromEvents
    ]);

    return allTypes
      .map((typeName) => {
        const managedType = managedEventTypes.find(
          (eventType) =>
            normalizeText(eventType.nombre) === normalizeText(typeName)
        );

        if (managedType) {
          return {
            ...managedType,
            id: getId(managedType) || managedType.nombre,
            nombre: managedType.nombre
          };
        }

        return {
          id: typeName,
          nombre: typeName
        };
      })
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [events, managedEventTypes]);

  const seriesOptions = useMemo(() => {
    return activeSeries.map(buildOption);
  }, [activeSeries]);

  const coverPreviewImages = useMemo(() => {
    return coverImages.map(getImageSource).filter(Boolean);
  }, [coverImages]);

  const carouselPreviewImages = useMemo(() => {
    return carouselImages.map(getImageSource).filter(Boolean);
  }, [carouselImages]);

  const refreshEventTypes = async () => {
    setLoadingEventTypes(true);
    setEventTypesError("");

    try {
      const data = await apiGetEventTypes({
        activos: "false"
      });

      const list = pickEventTypes(data).map(normalizeEventTypeFromApi);

      setManagedEventTypes((currentTypes) => {
        const mergedTypes = [...currentTypes];

        list.forEach((eventType) => {
          const existingIndex = mergedTypes.findIndex(
            (item) =>
              getId(item) === getId(eventType) ||
              normalizeText(item.nombre) === normalizeText(eventType.nombre)
          );

          if (existingIndex >= 0) {
            mergedTypes[existingIndex] = {
              ...mergedTypes[existingIndex],
              ...eventType
            };
          } else {
            mergedTypes.push(eventType);
          }
        });

        return mergedTypes;
      });
    } catch (error) {
      setEventTypesError(
        error.message || "No se pudieron cargar los tipos de evento."
      );
    } finally {
      setLoadingEventTypes(false);
    }
  };

  useEffect(() => {
    refreshEventTypes();
  }, []);

  const setCoverImagesTouched = (updater) => {
    setImagesTouched(true);

    setCoverImages((currentImages) => {
      const nextImages =
        typeof updater === "function" ? updater(currentImages) : updater;

      return Array.isArray(nextImages) ? nextImages.slice(0, 1) : [];
    });
  };

  const setCarouselImagesTouched = (updater) => {
    setImagesTouched(true);

    setCarouselImages((currentImages) => {
      const nextImages =
        typeof updater === "function" ? updater(currentImages) : updater;

      return Array.isArray(nextImages) ? nextImages : [];
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setCoverImages([]);
    setCarouselImages([]);
    setImagesTouched(false);
    setEditingEvent(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingEvent(null);
    setForm(initialForm);
    setCoverImages([]);
    setCarouselImages([]);
    setImagesTouched(false);
    setView("form");
  };

  const openEditForm = (event) => {
    const coverImage = getCoverImageFromEvent(event);
    const additionalImages = getAdditionalImagesFromEvent(event);
    const eventTypes = getEventTypesFromEvent(event);
    const seriesNames = getEventSeriesNames(event);
    const productIds = getEventProductIds(event);

    setMessage("");
    setEditingEvent(event);

    setForm({
      titulo: event.titulo || event.nombre || "",
      descripcion: event.descripcion || "",
      categoriaNombre: event.categoriaNombre || "Eventos",
      origenNombre: event.origenNombre || event.pais || "Variado",
      pais: event.pais || getCountryCodeFromOrigin(event.origenNombre || "V"),
      tipoEvento: eventTypes.join(", ") || "Otro",
      tiposEvento: eventTypes.length > 0 ? eventTypes : ["Otro"],
      fechaInicio: formatDateInput(event.fechaInicio),
      fechaFin: formatDateInput(event.fechaFin),
      estado: event.estado || "proximo",
      destacado: Boolean(event.destacado),
      activo: event.activo !== false,
      seriesNombre: seriesNames,
      productos: productIds
    });

    setCoverImages(
      coverImage ? [createEditableImageFromSource(coverImage, 0)] : []
    );

    setCarouselImages(
      additionalImages
        .map((image, index) => createEditableImageFromSource(image, index))
        .filter(Boolean)
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

  const handleSimpleCreatableCreate = (name) => ({
    id: `temp-${Date.now()}-${name}`,
    nombre: name
  });

  const handleCreateEventType = async (name) => {
    const cleanName = name?.trim();

    if (!cleanName) return null;

    const existingType = managedEventTypes.find(
      (eventType) => normalizeText(eventType.nombre) === normalizeText(cleanName)
    );

    if (existingType) {
      if (existingType.activo === false) {
        throw new Error(
          `El tipo de evento “${existingType.nombre}” ya existe pero está inactivo. Actívalo desde Tipos de evento.`
        );
      }

      return {
        ...existingType,
        id: getId(existingType) || existingType.nombre,
        nombre: existingType.nombre
      };
    }

    try {
      const data = await apiCreateEventType({
        nombre: cleanName,
        descripcion: "Tipo de evento creado rápidamente desde eventos.",
        orden: 0,
        activo: true
      });

      const createdEventType = normalizeEventTypeFromApi(
        data.eventType || data.tipoEvento || data.data || data
      );

      const option = {
        ...createdEventType,
        id: getId(createdEventType) || cleanName,
        nombre: createdEventType.nombre || cleanName,
        activo: createdEventType.activo !== false
      };

      setManagedEventTypes((currentTypes) => {
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
      throw new Error(
        error.message ||
          `No se pudo guardar “${cleanName}” en Gestión de tipos de evento.`
      );
    }
  };

  const ensureCategoryExists = async () => {
    const categoryName = form.categoriaNombre.trim() || "Eventos";
    const existingCategory = getOptionByName(categoryOptions, categoryName);

    if (existingCategory) {
      return {
        id: getId(existingCategory),
        nombre: existingCategory.nombre
      };
    }

    if (!createCategoryFull) {
      return {
        id: "",
        nombre: categoryName
      };
    }

    const createdCategory = await createCategoryFull({
      nombre: categoryName,
      descripcion: "Categoría creada rápidamente desde eventos.",
      tipo: "evento",
      orden: 0,
      activa: true,
      activo: true
    });

    await refreshCategories?.();

    return {
      id: getId(createdCategory),
      nombre: getName(createdCategory, categoryName)
    };
  };

  const ensureOriginExists = async () => {
    const originName = form.origenNombre.trim() || "Variado";
    const existingOrigin = getOptionByName(originOptions, originName);

    if (existingOrigin) {
      return {
        id: getId(existingOrigin),
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
      descripcion: "Origen creado rápidamente desde eventos.",
      activo: true
    });

    await refreshOrigins?.();

    return {
      id: getId(createdOrigin),
      nombre: getName(createdOrigin, originName)
    };
  };

  const ensureSeriesExist = async () => {
    const selectedSeriesNames = uniqueTexts(form.seriesNombre);

    const resolvedSeries = [];

    for (const seriesName of selectedSeriesNames) {
      const existingSeries = getOptionByName(seriesOptions, seriesName);

      if (existingSeries) {
        resolvedSeries.push({
          id: getId(existingSeries),
          nombre: existingSeries.nombre
        });

        continue;
      }

      if (!createSeriesFull) {
        resolvedSeries.push({
          id: "",
          nombre: seriesName
        });

        continue;
      }

      const createdSeries = await createSeriesFull({
        nombre: seriesName,
        descripcion: "Serie creada rápidamente desde eventos.",
        categoriaPrincipalNombre: "Series",
        categoriaNombre: "Series",
        origenNombre: form.origenNombre.trim() || "Variado",
        pais: getCountryCodeFromOrigin(form.origenNombre.trim() || "Variado"),
        tipo: "Historia",
        genero: "",
        creadoresNombre: [],
        destacada: false,
        activa: true,
        activo: true,
        orden: 0
      });

      resolvedSeries.push({
        id: getId(createdSeries),
        nombre: getName(createdSeries, seriesName)
      });
    }

    if (selectedSeriesNames.length > 0) {
      await refreshSeries?.();
    }

    return resolvedSeries;
  };

  const buildPayload = async () => {
    const category = await ensureCategoryExists();
    const origin = await ensureOriginExists();
    const resolvedSeries = await ensureSeriesExist();

    const eventTypes = uniqueTexts(form.tiposEvento);
    const eventTypesText = eventTypes.join(", ");

    const seriesIds = resolvedSeries
      .map((serie) => serie.id)
      .filter((id) => id && id.length > 0);

    const seriesNames = resolvedSeries
      .map((serie) => serie.nombre)
      .filter(Boolean);

    const payload = {
      titulo: form.titulo.trim(),
      nombre: form.titulo.trim(),
      descripcion: form.descripcion,

      categoria: category.id || "",
      categoriaNombre: category.nombre || "Eventos",

      origen: origin.id || "",
      origenNombre: origin.nombre || "Variado",
      pais: form.pais || getCountryCodeFromOrigin(origin.nombre || "Variado"),

      tipoEvento: eventTypesText || "Otro",
      tiposEvento: eventTypes.length > 0 ? eventTypes : ["Otro"],
      tipo: eventTypesText || "Otro",

      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,

      estado: form.estado,
      destacado: Boolean(form.destacado),
      activo: Boolean(form.activo),

      series: seriesIds,
      seriesNombre: seriesNames,
      serie: seriesIds[0] || "",
      serieNombre: seriesNames[0] || "",

      productos: form.productos
    };

    if (!editingEvent || imagesTouched) {
      const preparedCoverImages = await prepareImagesForPayload(coverImages);
      const preparedCarouselImages = await prepareImagesForPayload(carouselImages);

      payload.imagen = preparedCoverImages[0] || "";
      payload.imagenes = preparedCarouselImages.filter(
        (image) => image !== payload.imagen
      );
      payload.imagenesTouched = true;
      payload.imagesTouched = true;
      payload.replaceImages = true;
    }

    return payload;
  };

  const validateForm = () => {
    if (!form.titulo.trim()) {
      setMessage("Escribe el título del evento.");
      return false;
    }

    if (!form.categoriaNombre.trim()) {
      setMessage("Selecciona o crea una categoría.");
      return false;
    }

    if (!form.origenNombre.trim()) {
      setMessage("Selecciona o crea un país/origen.");
      return false;
    }

    if (!Array.isArray(form.tiposEvento) || form.tiposEvento.length === 0) {
      setMessage("Selecciona o crea al menos un tipo de evento.");
      return false;
    }

    if (!editingEvent && coverImages.length === 0) {
      setMessage("Sube una portada para el evento.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    setMessage(
      editingEvent ? "Guardando cambios del evento..." : "Creando evento..."
    );

    try {
      for (const eventTypeName of form.tiposEvento) {
        await handleCreateEventType(eventTypeName);
      }

      const payload = await buildPayload();

      if (editingEvent) {
        await updateEventFull(getId(editingEvent), payload);
        setMessage("Evento actualizado correctamente.");
      } else {
        await createEventFull(payload);
        setMessage("Evento creado correctamente.");
      }

      resetForm();

      await Promise.all([refreshEvents?.(), refreshEventTypes()]);
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (event) => {
    const eventId = getId(event);

    if (!eventId) {
      setMessage("No se encontró el ID del evento.");
      return;
    }

    setSaving(true);
    setMessage(event.activo ? "Desactivando evento..." : "Activando evento...");

    try {
      await toggleEventStatus(eventId);
      await refreshEvents?.();

      setMessage(
        event.activo
          ? "Evento desactivado correctamente."
          : "Evento activado correctamente."
      );
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado del evento.");
    } finally {
      setSaving(false);
    }
  };

  const messageToShow =
    message ||
    eventsLoadError ||
    categoriesLoadError ||
    originsLoadError ||
    seriesLoadError ||
    eventTypesError;

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Eventos</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de eventos</h2>

            <p className="mt-3 max-w-3xl text-gray-600 leading-7">
              Crea eventos con portada, carrusel, series vinculadas, productos
              relacionados y múltiples tipos de evento sincronizados con MongoDB.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <>
                <button
                  type="button"
                  onClick={refreshEventTypes}
                  disabled={loadingEventTypes || saving}
                  className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw
                    size={18}
                    className={loadingEventTypes ? "animate-spin" : ""}
                  />
                  Tipos
                </button>

                <button
                  type="button"
                  onClick={refreshEvents}
                  disabled={loadingEvents || saving}
                  className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw
                    size={18}
                    className={loadingEvents ? "animate-spin" : ""}
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
                Crear evento
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

      {messageToShow && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {messageToShow}
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
                {editingEvent ? "Editar evento" : "Nuevo evento"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingEvent ? "Actualizar evento" : "Registrar evento"}
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
              Título del evento
              <input
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Evento Lebom"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Estado
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                {eventStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Descripción del evento
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="5"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Escribe la descripción. Los saltos de línea se respetan en la página pública."
              />
            </label>

            <CreatableSelect
              label="Categoría del evento"
              value={form.categoriaNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  categoriaNombre: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={categoryOptions}
              placeholder="Eventos, preventa, campaña..."
              emptyLabel="Sin categoría"
              emptyCreateLabel="Agregar categoría"
              createLabel={(name) => `Agregar “${name}” a categorías`}
              helperText="Si no existe, se creará al guardar el evento."
            />

            <CreatableSelect
              label="País / origen"
              value={form.origenNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  origenNombre: value,
                  pais: getCountryCodeFromOrigin(value)
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={originOptions}
              placeholder="China, Corea, Japón, Variado..."
              emptyLabel="Sin origen"
              emptyCreateLabel="Agregar origen"
              createLabel={(name) => `Agregar “${name}” a países/orígenes`}
              helperText="Si no existe, se creará al guardar el evento."
            />

            <div className="lg:col-span-2">
              <MultiCreatableSelect
                label="Tipos de evento"
                values={form.tiposEvento}
                onChange={(values) => {
                  const cleanValues = uniqueTexts(values);

                  setForm((currentForm) => ({
                    ...currentForm,
                    tiposEvento: cleanValues,
                    tipoEvento: cleanValues.join(", ")
                  }));
                }}
                onCreate={handleCreateEventType}
                options={eventTypeOptions}
                placeholder="Lebom, Café, Fantazit, preventa..."
                emptyLabel="Sin tipos de evento"
                emptyCreateLabel="Agregar tipo de evento"
                createLabel={(name) => `Agregar “${name}” a tipo de evento`}
                helperText="Un evento puede tener uno o más tipos. Si escribes uno nuevo, se guarda también en Gestión de tipos de evento."
              />
            </div>

            <label className="grid gap-2 text-sm font-black">
              Fecha de inicio
              <input
                name="fechaInicio"
                type="date"
                value={form.fechaInicio}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Fecha de cierre
              <input
                name="fechaFin"
                type="date"
                value={form.fechaFin}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <div className="rounded-3xl bg-[#F8F6F7] p-4 lg:col-span-2">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Evento destacado
                <input
                  type="checkbox"
                  name="destacado"
                  checked={form.destacado}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <label className="mt-4 flex items-center justify-between gap-4 text-sm font-black">
                Evento activo
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>
            </div>

            <div className="lg:col-span-2">
              <MultiCreatableSelect
                label="Series / historias vinculadas"
                values={form.seriesNombre}
                onChange={(values) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    seriesNombre: uniqueTexts(values)
                  }))
                }
                onCreate={handleSimpleCreatableCreate}
                options={seriesOptions}
                placeholder="Busca o escribe una serie"
                emptyLabel="Sin series vinculadas"
                emptyCreateLabel="Agregar serie"
                createLabel={(name) => `Agregar “${name}” a series del evento`}
                helperText="Un evento puede tener muchas series. Si escribes una serie que no existe, se creará al guardar el evento."
              />
            </div>

            <div className="lg:col-span-2">
              <ProductMultiSelect
                title="Productos vinculados al evento"
                description="Selecciona productos existentes para mostrarlos dentro del detalle público del evento."
                options={activeProducts}
                selectedIds={form.productos}
                onChange={(updater) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    productos:
                      typeof updater === "function"
                        ? updater(currentForm.productos)
                        : updater
                  }))
                }
                emptyText="Todavía no hay productos registrados."
              />
            </div>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Portada del evento</p>

              <p className="mt-1 text-sm text-gray-600 leading-6">
                Esta será la imagen principal del evento. Si editas otros datos
                y no tocas esta zona, la portada se conserva.
              </p>

              <div className="mt-4">
                <ImageDropzone
                  label="Subir portada"
                  description="Sube una imagen principal para el evento."
                  images={coverImages}
                  setImages={setCoverImagesTouched}
                  multiple={false}
                />
              </div>
            </div>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Carrusel del evento</p>

              <p className="mt-1 text-sm text-gray-600 leading-6">
                Imágenes adicionales del evento. Se mostrarán en la página de
                detalle con flechas.
              </p>

              <div className="mt-4">
                <ImageDropzone
                  label="Subir imágenes del carrusel"
                  description="Sube una o varias imágenes adicionales."
                  images={carouselImages}
                  setImages={setCarouselImagesTouched}
                  multiple
                />
              </div>
            </div>

            <div className="lg:col-span-2 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[28px] bg-[#F8F6F7] p-5">
                <p className="font-black">Vista previa de portada</p>

                <div className="mt-4 h-72 overflow-hidden rounded-[28px] bg-white">
                  {coverPreviewImages.length > 0 ? (
                    <img
                      src={coverPreviewImages[0]}
                      alt={`${form.titulo || "Evento Smika"} portada`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <ImageIcon size={38} />
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] bg-[#F8F6F7] p-5">
                <p className="font-black">Vista previa del carrusel</p>

                <div className="mt-4">
                  <AutoCarousel
                    images={carouselPreviewImages}
                    alt={`${form.titulo || "Evento Smika"} carrusel`}
                    heightClassName="h-72"
                    fit="contain"
                    showEmpty
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          {loadingEvents ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />

              <p className="mt-4 font-black">Cargando eventos...</p>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <CalendarDays size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay eventos registrados
              </h3>

              <p className="mt-2 text-gray-600">
                Crea un evento para mostrarlo en la programación.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {sortedEvents.map((event) => {
                const coverImage = getCoverImageFromEvent(event);
                const additionalImages = getAdditionalImagesFromEvent(event);
                const seriesNames = getEventSeriesNames(event);
                const eventProductsIds = getEventProductIds(event);

                return (
                  <article
                    key={getId(event)}
                    className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
                  >
                    <div className="h-44 bg-[#F8F6F7]">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={getEventTitle(event)}
                          className="h-full w-full object-contain"
                          loading="lazy"
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
                          {getStatusLabel(event.estado)}
                        </span>

                        <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                          {event.activo ? "Activo" : "Inactivo"}
                        </span>

                        {event.destacado && (
                          <span className="rounded-full bg-[#F8F6F7] px-3 py-1 text-xs font-black">
                            Destacado
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {getEventTitle(event)}
                      </h3>

                      <div className="mt-3 grid gap-2 text-sm text-gray-600">
                        <p>
                          <strong>Tipo:</strong>{" "}
                          {getEventTypesFromEvent(event).join(", ") || "Otro"}
                        </p>

                        <p>
                          <strong>Categoría:</strong>{" "}
                          {event.categoriaNombre || "Eventos"}
                        </p>

                        <p>
                          <strong>Origen:</strong>{" "}
                          {event.origenNombre || event.pais || "Variado"}
                        </p>

                        <p>
                          <strong>Inicio:</strong>{" "}
                          {formatDateText(event.fechaInicio)}
                        </p>

                        <p>
                          <strong>Fin:</strong>{" "}
                          {formatDateText(event.fechaFin)}
                        </p>

                        <p>
                          <strong>Series:</strong>{" "}
                          {seriesNames.length > 0
                            ? seriesNames.join(", ")
                            : "Sin series vinculadas"}
                        </p>

                        <p>
                          <strong>Productos vinculados:</strong>{" "}
                          {eventProductsIds.length}
                        </p>

                        <p>
                          <strong>Imágenes carrusel:</strong>{" "}
                          {additionalImages.length}
                        </p>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(event)}
                          className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(event)}
                          disabled={saving}
                          className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                          title={event.activo ? "Desactivar" : "Activar"}
                        >
                          <Power
                            size={17}
                            className={
                              event.activo ? "text-gray-500" : "text-red-500"
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

export default AdminEventsPage;