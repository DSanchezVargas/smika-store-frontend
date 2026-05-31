import { useMemo, useState } from "react";
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
import { useAdminData } from "../../context/AdminDataContext";

const initialForm = {
  titulo: "",
  descripcion: "",
  categoria: "",
  categoriaNombre: "Eventos",
  origen: "",
  origenNombre: "Variado",
  pais: "V",
  tipoEvento: "Otro",
  fechaInicio: "",
  fechaFin: "",
  estado: "proximo",
  destacado: false,
  activo: true,
  series: [],
  seriesNombre: [],
  productos: []
};

const eventStatusOptions = [
  {
    value: "proximo",
    label: "Próximo"
  },
  {
    value: "activo",
    label: "Activo"
  },
  {
    value: "finalizado",
    label: "Finalizado"
  },
  {
    value: "cancelado",
    label: "Cancelado"
  }
];

const eventTypeOptions = [
  "Café evento",
  "Pop up",
  "Feria",
  "Preventa",
  "Lanzamiento",
  "Colaboración",
  "Otro"
];

function getId(item) {
  return item?._id || item?.id || "";
}

function normalizeText(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

function uniqueTextOptions(values = []) {
  const map = new Map();

  values
    .map((value) => value?.toString().trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = normalizeText(value);

      if (!map.has(key)) {
        map.set(key, value);
      }
    });

  return [...map.values()].sort((a, b) => a.localeCompare(b));
}

function EventMultiSelect({
  title,
  description,
  options,
  selectedIds,
  onChange,
  getLabel,
  emptyText = "No hay opciones disponibles."
}) {
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const cleanSearch = normalizeText(search);

    if (!cleanSearch) return options;

    return options.filter((item) => normalizeText(getLabel(item)).includes(cleanSearch));
  }, [options, search, getLabel]);

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
      <p className="font-black">{title}</p>

      {description && (
        <p className="mt-1 text-sm text-gray-600 leading-6">
          {description}
        </p>
      )}

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-4 w-full rounded-2xl border border-[#87CCC8]/30 bg-white px-4 py-3 outline-none"
        placeholder="Buscar..."
      />

      <div className="mt-4 max-h-72 overflow-auto rounded-2xl bg-white p-3">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((item) => {
            const id = getId(item);
            const checked = selectedIds.includes(id);

            return (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold hover:bg-[#F7D9D8]/50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOption(id)}
                  className="h-4 w-4"
                />

                <span>{getLabel(item)}</span>
              </label>
            );
          })
        ) : (
          <p className="px-3 py-4 text-sm text-gray-500">
            {emptyText}
          </p>
        )}
      </div>

      {selectedIds.length > 0 && (
        <p className="mt-3 text-xs font-black text-[#87CCC8]">
          Seleccionados: {selectedIds.length}
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
    refreshEvents,
    createEventFull,
    updateEventFull,
    toggleEventStatus
  } = useAdminData();

  const [view, setView] = useState("list");
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [coverImages, setCoverImages] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [imagesTouched, setImagesTouched] = useState(false);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

  const activeCategories = useMemo(() => {
    return (categories || [])
      .filter((category) => category.activa !== false && category.activo !== false)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [categories]);

  const activeOrigins = useMemo(() => {
    return (origins || [])
      .filter((origin) => origin.activo !== false)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [origins]);

  const categoryOptions = useMemo(() => {
    return uniqueTextOptions([
      "Eventos",
      "Café evento",
      "Pop up",
      "Feria",
      ...activeCategories.map((category) => category.nombre)
    ]);
  }, [activeCategories]);

  const originOptions = useMemo(() => {
    return uniqueTextOptions([
      "China",
      "Corea",
      "Japón",
      "Variado",
      ...activeOrigins.map((origin) => origin.nombre)
    ]);
  }, [activeOrigins]);

  const resetForm = () => {
    setView("list");
    setEditingEvent(null);
    setForm(initialForm);
    setCoverImages([]);
    setCarouselImages([]);
    setImagesTouched(false);
    setMessage("");
  };

  const openCreateForm = () => {
    setView("form");
    setEditingEvent(null);
    setForm(initialForm);
    setCoverImages([]);
    setCarouselImages([]);
    setImagesTouched(false);
    setMessage("");
  };

  const openEditForm = (event) => {
    const eventSeriesIds = Array.isArray(event.series)
      ? event.series
          .map((serie) => {
            if (typeof serie === "string") return serie;
            return getId(serie);
          })
          .filter(Boolean)
      : [];

    const eventProductsIds = Array.isArray(event.productos)
      ? event.productos
          .map((product) => {
            if (typeof product === "string") return product;
            return getId(product);
          })
          .filter(Boolean)
      : [];

    const matchedSeriesIdsFromNames = Array.isArray(event.seriesNombre)
      ? activeSeries
          .filter((serie) =>
            event.seriesNombre.some(
              (name) => normalizeText(name) === normalizeText(serie.nombre)
            )
          )
          .map(getId)
      : [];

    const finalSeriesIds = [
      ...new Set([...eventSeriesIds, ...matchedSeriesIdsFromNames].filter(Boolean))
    ];

    const coverImage = getImageSource(event.imagen);
    const carouselSources = Array.isArray(event.imagenes)
      ? event.imagenes.map(getImageSource).filter(Boolean)
      : [];

    setEditingEvent(event);

    setForm({
      titulo: event.titulo || event.nombre || "",
      descripcion: event.descripcion || "",
      categoria:
        typeof event.categoria === "string" && event.categoria !== event.categoriaNombre
          ? event.categoria
          : "",
      categoriaNombre: event.categoriaNombre || "Eventos",
      origen:
        typeof event.origen === "string" && event.origen !== event.origenNombre
          ? event.origen
          : "",
      origenNombre: event.origenNombre || "Variado",
      pais: event.pais || getCountryCodeFromOrigin(event.origenNombre || "Variado"),
      tipoEvento: event.tipoEvento || event.tipo || "Otro",
      fechaInicio: formatDateInput(event.fechaInicio),
      fechaFin: formatDateInput(event.fechaFin),
      estado: event.estado || "proximo",
      destacado: Boolean(event.destacado),
      activo: event.activo !== false,
      series: finalSeriesIds,
      seriesNombre: Array.isArray(event.seriesNombre)
        ? event.seriesNombre.filter(Boolean)
        : [],
      productos: eventProductsIds
    });

    setCoverImages(
      coverImage ? [createEditableImageFromSource(coverImage, 0)].filter(Boolean) : []
    );

    setCarouselImages(
      carouselSources
        .filter((image) => image !== coverImage)
        .map((image, index) => createEditableImageFromSource(image, index))
        .filter(Boolean)
    );

    setImagesTouched(false);
    setMessage("");
    setView("form");
  };

  const setCoverImagesTouched = (updater) => {
    setImagesTouched(true);
    setCoverImages((currentImages) =>
      typeof updater === "function" ? updater(currentImages) : updater
    );
  };

  const setCarouselImagesTouched = (updater) => {
    setImagesTouched(true);
    setCarouselImages((currentImages) =>
      typeof updater === "function" ? updater(currentImages) : updater
    );
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleCategoryChange = (event) => {
    const value = event.target.value;

    const selectedCategory = activeCategories.find(
      (category) => getId(category) === value
    );

    if (selectedCategory) {
      setForm((currentForm) => ({
        ...currentForm,
        categoria: getId(selectedCategory),
        categoriaNombre: selectedCategory.nombre
      }));

      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      categoria: "",
      categoriaNombre: value
    }));
  };

  const handleOriginChange = (event) => {
    const value = event.target.value;

    const selectedOrigin = activeOrigins.find((origin) => getId(origin) === value);

    if (selectedOrigin) {
      setForm((currentForm) => ({
        ...currentForm,
        origen: getId(selectedOrigin),
        origenNombre: selectedOrigin.nombre,
        pais: getCountryCodeFromOrigin(selectedOrigin.nombre)
      }));

      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      origen: "",
      origenNombre: value,
      pais: getCountryCodeFromOrigin(value)
    }));
  };

  const buildPayload = async () => {
    const selectedSeries = form.series
      .map((seriesId) => activeSeries.find((serie) => getId(serie) === seriesId))
      .filter(Boolean);

    const selectedSeriesNames = [
      ...new Set([
        ...selectedSeries.map((serie) => serie.nombre).filter(Boolean),
        ...form.seriesNombre.filter(Boolean)
      ])
    ];

    const payload = {
      titulo: form.titulo.trim(),
      nombre: form.titulo.trim(),
      descripcion: form.descripcion.trim(),

      categoria: form.categoria,
      categoriaNombre: form.categoriaNombre || "Eventos",

      origen: form.origen,
      origenNombre: form.origenNombre || "Variado",
      pais: form.pais || getCountryCodeFromOrigin(form.origenNombre || "Variado"),

      tipoEvento: form.tipoEvento || "Otro",

      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,

      estado: form.estado || "proximo",
      destacado: Boolean(form.destacado),
      activo: Boolean(form.activo),

      series: form.series,
      seriesNombre: selectedSeriesNames,

      productos: form.productos
    };

    if (!editingEvent || imagesTouched) {
      const preparedCoverImages = await prepareImagesForPayload(coverImages);
      const preparedCarouselImages = await prepareImagesForPayload(carouselImages);

      payload.imagen = preparedCoverImages[0] || "";
      payload.imagenes = preparedCarouselImages;
      payload.imagenesTouched = true;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.titulo.trim()) {
      setMessage("Escribe el título del evento.");
      return;
    }

    if (!form.descripcion.trim()) {
      setMessage("Escribe una descripción para el evento.");
      return;
    }

    if (!form.categoriaNombre.trim()) {
      setMessage("Selecciona o escribe una categoría del evento.");
      return;
    }

    setSaving(true);
    setMessage(
      editingEvent
        ? "Guardando cambios del evento..."
        : "Creando evento..."
    );

    try {
      const payload = await buildPayload();

      if (editingEvent) {
        await updateEventFull(getId(editingEvent), payload);
        setMessage("Evento actualizado correctamente.");
      } else {
        await createEventFull(payload);
        setMessage("Evento creado correctamente.");
      }

      resetForm();
      await refreshEvents?.();
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

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Eventos</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de eventos</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Crea y edita eventos reales de Smika Store. Aquí se configuran
              portada, carrusel, fechas, estado, series vinculadas y productos
              asociados al evento.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
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

      {(message || eventsLoadError) && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message || eventsLoadError}
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
                placeholder="Ejemplo: CAFE LEBOM - BLOSSOMS OF THE WHITE NIGHT"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Tipo de evento
              <input
                name="tipoEvento"
                list="event-type-options"
                value={form.tipoEvento}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Café evento, feria, pop up..."
              />

              <datalist id="event-type-options">
                {eventTypeOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Categoría
              <select
                value={form.categoria || form.categoriaNombre}
                onChange={handleCategoryChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}

                {activeCategories.map((category) => (
                  <option key={getId(category)} value={getId(category)}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Origen / País
              <select
                value={form.origen || form.origenNombre}
                onChange={handleOriginChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                {originOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}

                {activeOrigins.map((origin) => (
                  <option key={getId(origin)} value={getId(origin)}>
                    {origin.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Fecha inicio
              <input
                type="date"
                name="fechaInicio"
                value={form.fechaInicio}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Fecha fin
              <input
                type="date"
                name="fechaFin"
                value={form.fechaFin}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
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

            <div className="grid gap-3 rounded-3xl bg-[#F8F6F7] p-4">
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

              <label className="flex items-center justify-between gap-4 text-sm font-black">
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

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Descripción del evento
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Describe el evento, condiciones, productos vinculados o detalle para la página pública."
              />
            </label>

            <div className="lg:col-span-2">
              <EventMultiSelect
                title="Series / Historias vinculadas"
                description="Selecciona las series o historias relacionadas a este evento."
                options={activeSeries}
                selectedIds={form.series}
                onChange={(updater) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    series:
                      typeof updater === "function"
                        ? updater(currentForm.series)
                        : updater
                  }))
                }
                getLabel={(serie) => serie.nombre || "Serie sin nombre"}
                emptyText="Todavía no hay series registradas."
              />
            </div>

            <div className="lg:col-span-2">
              <EventMultiSelect
                title="Productos vinculados al evento"
                description="Selecciona productos existentes para mostrarlos dentro del detalle del evento."
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
                getLabel={(product) =>
                  `${product.nombre || "Producto"}${
                    product.serie ? ` · ${product.serie}` : ""
                  }`
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
                Todavía no hay eventos
              </h3>

              <p className="mt-2 text-gray-600">
                Crea un evento para mostrarlo en la programación.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {sortedEvents.map((event) => {
                const eventId = getId(event);
                const eventImages = [
                  getImageSource(event.imagen),
                  ...(Array.isArray(event.imagenes)
                    ? event.imagenes.map(getImageSource)
                    : [])
                ].filter(Boolean);

                return (
                  <article
                    key={eventId}
                    className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
                  >
                    <div className="bg-[#F8F6F7]">
                      {eventImages.length > 0 ? (
                        <AutoCarousel
                          images={eventImages}
                          alt={event.titulo || event.nombre}
                          heightClassName="h-48"
                          fit="contain"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center text-gray-400">
                          <ImageIcon size={38} />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                          {event.activo ? "Activo" : "Inactivo"}
                        </span>

                        <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                          {getStatusLabel(event.estado)}
                        </span>

                        {event.destacado && (
                          <span className="rounded-full bg-[#D1B0C7]/30 px-3 py-1 text-xs font-black">
                            Destacado
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {event.titulo || event.nombre}
                      </h3>

                      <div className="mt-3 grid gap-2 text-sm text-gray-600">
                        <p>
                          <strong>Categoría:</strong>{" "}
                          {event.categoriaNombre || "Eventos"}
                        </p>

                        <p>
                          <strong>Origen:</strong>{" "}
                          {event.origenNombre || "Variado"}
                        </p>

                        <p>
                          <strong>Tipo:</strong>{" "}
                          {event.tipoEvento || "Otro"}
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
                          {Array.isArray(event.seriesNombre) &&
                          event.seriesNombre.length > 0
                            ? event.seriesNombre.join(", ")
                            : event.serieNombre || "Sin series"}
                        </p>

                        <p>
                          <strong>Productos vinculados:</strong>{" "}
                          {Array.isArray(event.productos)
                            ? event.productos.length
                            : 0}
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