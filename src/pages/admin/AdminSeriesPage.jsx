import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UsersRound
} from "lucide-react";

import AutoCarousel from "../../components/common/AutoCarousel";
import ImageDropzone from "../../components/admin/ImageDropzone";
import { useAdminData } from "../../context/AdminDataContext";
import { apiRequest } from "../../services/api";

const initialForm = {
  nombre: "",
  descripcion: "",
  categoriaNombre: "Manhwa",
  origenNombre: "Corea",
  genero: "",
  destacada: false,
  activa: true,
  orden: 0
};

const baseCategories = [
  "Manga",
  "Manhwa",
  "Manhua",
  "Novela",
  "Webtoon",
  "Serie",
  "Historia"
];

const baseCountries = ["China", "Corea", "Japón", "Variado"];

const baseGenres = [
  "BL",
  "Romance",
  "Fantasía",
  "Drama",
  "Acción",
  "Isekai",
  "Webtoon",
  "Comedia",
  "Aventura"
];

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

function getId(item) {
  return item?._id || item?.id || "";
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

function getCountryCodeFromOrigin(originName = "") {
  const cleanOrigin = normalizeText(originName);

  if (cleanOrigin === "china") return "CN";
  if (cleanOrigin === "corea") return "KR";
  if (cleanOrigin === "japon" || cleanOrigin === "japón") return "JP";
  if (cleanOrigin === "variado") return "V";

  return originName.trim();
}

function getSeriesStatus(serie) {
  if (serie.activo === false || serie.activa === false) return "Inactiva";
  if (serie.destacada) return "Destacada";
  return "Activa";
}

function getCoverImageFromSerie(serie) {
  return getImageSource(serie?.imagen);
}

function getAdditionalImagesFromSerie(serie) {
  const coverImage = getCoverImageFromSerie(serie);

  const images = Array.isArray(serie?.imagenes)
    ? serie.imagenes.map(getImageSource).filter(Boolean)
    : [];

  return images.filter((image) => image !== coverImage);
}

function createEditableImageFromSource(src, index = 0) {
  return {
    id: `serie-image-${Date.now()}-${index}-${Math.random()}`,
    name: `imagen-serie-${index + 1}.jpg`,
    originalName: `imagen-serie-${index + 1}.jpg`,
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

function CreatableDropdown({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Escribe o selecciona",
  createLabel,
  helperText = ""
}) {
  const [isOpen, setIsOpen] = useState(false);

  const cleanValue = value?.trim() || "";

  const filteredOptions = useMemo(() => {
    const search = normalizeText(cleanValue);

    if (!search) return options;

    return options.filter((option) => normalizeText(option).includes(search));
  }, [options, cleanValue]);

  const alreadyExists = options.some(
    (option) => normalizeText(option) === normalizeText(cleanValue)
  );

  const shouldShowCreate = cleanValue && !alreadyExists;

  return (
    <label className="relative grid gap-2 text-sm font-black">
      {label}

      <input
        value={value}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120);
        }}
        className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
        placeholder={placeholder}
      />

      {helperText && (
        <span className="text-xs font-semibold text-gray-500">
          {helperText}
        </span>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 top-[72px] z-30 max-h-64 overflow-auto rounded-2xl border border-[#87CCC8]/30 bg-white p-2 shadow-xl">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-[#F7D9D8]"
              >
                {option}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-gray-500">
              No hay coincidencias.
            </p>
          )}

          {shouldShowCreate && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(cleanValue);
                setIsOpen(false);
              }}
              className="mt-2 w-full rounded-xl bg-[#87CCC8]/20 px-3 py-2 text-left text-sm font-black text-[#2F2F2F]"
            >
              {createLabel ? createLabel(cleanValue) : `Agregar “${cleanValue}”`}
            </button>
          )}
        </div>
      )}
    </label>
  );
}

function AuthorSelector({
  authorDraft,
  setAuthorDraft,
  selectedAuthors,
  setSelectedAuthors,
  authorOptions
}) {
  const availableAuthors = useMemo(() => {
    return authorOptions.filter(
      (option) =>
        !selectedAuthors.some(
          (author) => normalizeText(author) === normalizeText(option)
        )
    );
  }, [authorOptions, selectedAuthors]);

  const handleAddAuthor = (authorName) => {
    const cleanAuthor = authorName?.trim();

    if (!cleanAuthor) return;

    setSelectedAuthors((currentAuthors) => {
      const exists = currentAuthors.some(
        (author) => normalizeText(author) === normalizeText(cleanAuthor)
      );

      if (exists) return currentAuthors;

      return [...currentAuthors, cleanAuthor];
    });

    setAuthorDraft("");
  };

  return (
    <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
      <p className="font-black">Autores / Creadores</p>

      <p className="mt-1 text-sm text-gray-600 leading-6">
        Una serie puede tener más de un autor/creador. Si escribes uno nuevo,
        aparecerá como “Agregar ___ a Autores / Creadores” y quedará enlazado a
        esta serie.
      </p>

      <div className="mt-4">
        <CreatableDropdown
          label="Agregar autor/creador"
          value={authorDraft}
          onChange={setAuthorDraft}
          options={availableAuthors}
          placeholder="Busca o escribe un autor/creador"
          createLabel={(name) => `Agregar “${name}” a Autores / Creadores`}
          helperText="Escribe o selecciona y luego presiona Agregar."
        />

        <button
          type="button"
          onClick={() => handleAddAuthor(authorDraft)}
          className="mt-3 rounded-full bg-white px-5 py-3 text-sm font-black"
        >
          Agregar autor/creador
        </button>
      </div>

      {selectedAuthors.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedAuthors.map((author) => (
            <span
              key={author}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black"
            >
              {author}

              <button
                type="button"
                onClick={() =>
                  setSelectedAuthors((currentAuthors) =>
                    currentAuthors.filter(
                      (item) => normalizeText(item) !== normalizeText(author)
                    )
                  )
                }
                className="text-red-500"
                title="Quitar autor"
              >
                <Trash2 size={15} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          Todavía no agregaste autores/creadores.
        </p>
      )}
    </div>
  );
}

function AdminSeriesPage() {
  const {
    series,
    loadingSeries,
    seriesLoadError,
    refreshSeries,
    createSeriesFull,
    updateSeriesFull
  } = useAdminData();

  const [view, setView] = useState("list");
  const [editingSeries, setEditingSeries] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [coverImages, setCoverImages] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [imagesTouched, setImagesTouched] = useState(false);

  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [authorDraft, setAuthorDraft] = useState("");

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingSeriesId, setDeletingSeriesId] = useState("");

  const sortedSeries = useMemo(() => {
    return [...(series || [])].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [series]);

  const categoryOptions = useMemo(() => {
    const dynamicCategories = (series || []).flatMap((serie) => [
      serie.categoriaNombre,
      serie.categoriaPrincipalNombre,
      serie.categoria
    ]);

    return uniqueTextOptions([...baseCategories, ...dynamicCategories]);
  }, [series]);

  const countryOptions = useMemo(() => {
    const dynamicCountries = (series || []).flatMap((serie) => [
      serie.origenNombre,
      serie.pais
    ]);

    return uniqueTextOptions([...baseCountries, ...dynamicCountries]);
  }, [series]);

  const genreOptions = useMemo(() => {
    const dynamicGenres = (series || []).map((serie) => serie.genero);

    return uniqueTextOptions([...baseGenres, ...dynamicGenres]);
  }, [series]);

  const authorOptions = useMemo(() => {
    const dynamicAuthors = (series || []).flatMap((serie) => {
      const creators = Array.isArray(serie.creadoresNombre)
        ? serie.creadoresNombre
        : [];

      const authorText = serie.autor
        ? serie.autor
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      return [...creators, ...authorText];
    });

    return uniqueTextOptions(dynamicAuthors);
  }, [series]);

  const coverPreviewImages = useMemo(() => {
    return coverImages.map(getImageSource).filter(Boolean);
  }, [coverImages]);

  const carouselPreviewImages = useMemo(() => {
    return carouselImages.map(getImageSource).filter(Boolean);
  }, [carouselImages]);

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

  const resetForm = () => {
    setForm(initialForm);
    setEditingSeries(null);
    setCoverImages([]);
    setCarouselImages([]);
    setImagesTouched(false);
    setSelectedAuthors([]);
    setAuthorDraft("");
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingSeries(null);
    setForm(initialForm);
    setCoverImages([]);
    setCarouselImages([]);
    setImagesTouched(false);
    setSelectedAuthors([]);
    setAuthorDraft("");
    setView("form");
  };

  const openEditForm = (serie) => {
    setMessage("");
    setEditingSeries(serie);

    const coverImage = getCoverImageFromSerie(serie);
    const additionalImages = getAdditionalImagesFromSerie(serie);

    const authors = Array.isArray(serie.creadoresNombre)
      ? serie.creadoresNombre
      : serie.autor
      ? serie.autor
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    setForm({
      nombre: serie.nombre || "",
      descripcion: serie.descripcion || "",
      categoriaNombre:
        serie.categoriaPrincipalNombre ||
        serie.categoriaNombre ||
        serie.categoria ||
        "Manhwa",
      origenNombre: serie.origenNombre || "Corea",
      genero: serie.genero || "",
      destacada: Boolean(serie.destacada),
      activa: serie.activo !== false && serie.activa !== false,
      orden: Number(serie.orden || 0)
    });

    setCoverImages(
      coverImage ? [createEditableImageFromSource(coverImage, 0)] : []
    );

    setCarouselImages(
      additionalImages.map((image, index) =>
        createEditableImageFromSource(image, index + 1)
      )
    );

    setImagesTouched(false);
    setSelectedAuthors([...new Set(authors)]);
    setAuthorDraft("");
    setView("form");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const buildPayload = async () => {
    const categoryName = form.categoriaNombre.trim() || "Manhwa";
    const originName = form.origenNombre.trim() || "Corea";

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),

      categoriaPrincipalNombre: categoryName,
      categoriaNombre: categoryName,

      origenNombre: originName,
      pais: getCountryCodeFromOrigin(originName),

      tipo: categoryName,
      genero: form.genero.trim(),

      autor: selectedAuthors.join(", "),
      creadoresNombre: selectedAuthors,

      destacada: Boolean(form.destacada),
      activa: Boolean(form.activa),
      activo: Boolean(form.activa),

      orden: Number(form.orden || 0)
    };

    if (!editingSeries || imagesTouched) {
      const preparedCoverImages = await prepareImagesForPayload(coverImages);
      const preparedCarouselImages = await prepareImagesForPayload(
        carouselImages
      );

      payload.imagen = preparedCoverImages[0] || "";
      payload.imagenes = preparedCarouselImages;
      payload.imagenesTouched = true;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre de la serie o historia.");
      return;
    }

    if (!form.categoriaNombre.trim()) {
      setMessage("Selecciona o crea una categoría.");
      return;
    }

    if (!form.origenNombre.trim()) {
      setMessage("Selecciona o crea un país/origen.");
      return;
    }

    if (!form.genero.trim()) {
      setMessage("Selecciona o crea un género.");
      return;
    }

    if (!editingSeries && coverImages.length === 0) {
      setMessage("Sube una imagen principal para la portada.");
      return;
    }

    setSaving(true);
    setMessage(
      editingSeries
        ? "Guardando cambios de la serie..."
        : "Creando serie..."
    );

    try {
      const payload = await buildPayload();

      if (editingSeries) {
        await updateSeriesFull(getId(editingSeries), payload);
        setMessage("Serie actualizada correctamente.");
      } else {
        await createSeriesFull(payload);
        setMessage("Serie creada correctamente.");
      }

      resetForm();
      await refreshSeries?.();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar la serie.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSeries = async (serie) => {
    const seriesId = getId(serie);

    if (!seriesId) {
      setMessage("No se encontró el ID de la serie.");
      return;
    }

    const confirmed = window.confirm(
      `¿Borrar definitivamente “${serie.nombre}”? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setDeletingSeriesId(seriesId);
    setMessage("Borrando serie definitivamente...");

    try {
      await apiRequest(`/series/${seriesId}`, {
        method: "DELETE"
      });

      await refreshSeries?.();
      setMessage("Serie borrada definitivamente.");
    } catch (error) {
      setMessage(error.message || "No se pudo borrar la serie.");
    } finally {
      setDeletingSeriesId("");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Series / Historias</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">
              Gestión de series e historias
            </h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Crea series con categoría, país/origen, género, varios autores y
              carga real de imágenes. La portada no se mezcla con el carrusel.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {view === "list" && (
              <button
                type="button"
                onClick={refreshSeries}
                disabled={loadingSeries || saving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loadingSeries ? "animate-spin" : ""}
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
                Crear serie
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

      {message && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message}
        </div>
      )}

      {seriesLoadError && (
        <div className="rounded-[24px] bg-red-50 px-5 py-4 text-sm font-black text-red-600">
          {seriesLoadError}
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
                {editingSeries ? "Editar serie" : "Nueva serie"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingSeries
                  ? "Actualizar datos de la serie"
                  : "Registrar nueva serie"}
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
              Nombre de la serie / historia
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: La Ventura del Caballero Blanco"
              />
            </label>

            <CreatableDropdown
              label="Categoría"
              value={form.categoriaNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  categoriaNombre: value
                }))
              }
              options={categoryOptions}
              placeholder="Busca o escribe una categoría"
              createLabel={(name) => `Agregar “${name}” a Categoría`}
              helperText="Ejemplo: Manga, Manhwa, Manhua, Novela o Webtoon."
            />

            <CreatableDropdown
              label="País / origen"
              value={form.origenNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  origenNombre: value
                }))
              }
              options={countryOptions}
              placeholder="Busca o escribe un país/origen"
              createLabel={(name) => `Agregar “${name}” a País`}
              helperText="Si no es China, Corea, Japón o Variado, escribe otro país/origen y agrégalo."
            />

            <CreatableDropdown
              label="Género"
              value={form.genero}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  genero: value
                }))
              }
              options={genreOptions}
              placeholder="Busca o escribe un género"
              createLabel={(name) => `Agregar “${name}” a Género`}
              helperText="Ejemplo: BL, romance, fantasía, drama o isekai."
            />

            <label className="grid gap-2 text-sm font-black">
              Orden
              <input
                name="orden"
                type="number"
                value={form.orden}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="0"
              />
            </label>

            <div className="grid gap-3 rounded-3xl bg-[#F8F6F7] p-4">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Destacada
                <input
                  type="checkbox"
                  name="destacada"
                  checked={form.destacada}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Activa
                <input
                  type="checkbox"
                  name="activa"
                  checked={form.activa}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>
            </div>

            <AuthorSelector
              authorDraft={authorDraft}
              setAuthorDraft={setAuthorDraft}
              selectedAuthors={selectedAuthors}
              setSelectedAuthors={setSelectedAuthors}
              authorOptions={authorOptions}
            />

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Descripción
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Describe brevemente la serie o historia..."
              />
            </label>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Portada principal</p>

              <p className="mt-1 text-sm text-gray-600 leading-6">
                Esta imagen se usará como portada principal. No se mezclará con
                el carrusel.
              </p>

              <div className="mt-4">
                <ImageDropzone
                  label="Subir portada"
                  description="Arrastra o selecciona una imagen. Se comprimirá y podrás ajustar el recorte."
                  images={coverImages}
                  setImages={setCoverImagesTouched}
                  multiple={false}
                />
              </div>
            </div>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Imágenes adicionales del carrusel</p>

              <p className="mt-1 text-sm text-gray-600 leading-6">
                Estas imágenes son solo para el carrusel. Si no subes imágenes
                adicionales, no aparecerá carrusel.
              </p>

              <div className="mt-4">
                <ImageDropzone
                  label="Subir imágenes adicionales"
                  description="Puedes subir varias imágenes. Cada una se comprimirá y podrá recortarse."
                  images={carouselImages}
                  setImages={setCarouselImagesTouched}
                  multiple
                />
              </div>
            </div>

            <div className="lg:col-span-2 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[28px] bg-[#F8F6F7] p-5">
                <p className="font-black">Vista previa de portada</p>

                <p className="mt-1 text-sm text-gray-600">
                  Esta vista muestra únicamente la portada.
                </p>

                <div className="mt-4 h-72 overflow-hidden rounded-[28px] bg-white">
                  {coverPreviewImages.length > 0 ? (
                    <img
                      src={coverPreviewImages[0]}
                      alt={`${form.nombre || "Serie Smika"} portada`}
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

                <p className="mt-1 text-sm text-gray-600">
                  Aquí solo van las imágenes adicionales. Si no hay adicionales,
                  no se mostrará carrusel.
                </p>

                <div className="mt-4">
                  <AutoCarousel
                    images={carouselPreviewImages}
                    alt={`${form.nombre || "Serie Smika"} carrusel`}
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
          {loadingSeries ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />

              <p className="mt-4 font-black">Cargando series...</p>
            </div>
          ) : sortedSeries.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <UsersRound size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay series registradas
              </h3>

              <p className="mt-2 text-gray-600">
                Crea una serie para usarla luego en productos.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {sortedSeries.map((serie) => {
                const coverImage = getCoverImageFromSerie(serie);
                const additionalImages = getAdditionalImagesFromSerie(serie);

                return (
                  <article
                    key={getId(serie)}
                    className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
                  >
                    <div className="h-44 bg-[#F8F6F7]">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={serie.nombre}
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
                          {getSeriesStatus(serie)}
                        </span>

                        {serie.origenNombre && (
                          <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                            {serie.origenNombre}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {serie.nombre}
                      </h3>

                      <div className="mt-3 grid gap-2 text-sm text-gray-600">
                        <p>
                          <strong>Categoría:</strong>{" "}
                          {serie.categoriaNombre ||
                            serie.categoriaPrincipalNombre ||
                            "Sin categoría"}
                        </p>

                        <p>
                          <strong>País/origen:</strong>{" "}
                          {serie.origenNombre || "Sin país/origen"}
                        </p>

                        {serie.genero && (
                          <p>
                            <strong>Género:</strong> {serie.genero}
                          </p>
                        )}

                        <p>
                          <strong>Autores:</strong>{" "}
                          {Array.isArray(serie.creadoresNombre) &&
                          serie.creadoresNombre.length > 0
                            ? serie.creadoresNombre.join(", ")
                            : serie.autor || "No especificado"}
                        </p>

                        <p>
                          <strong>Portada:</strong> {coverImage ? "Sí" : "No"}
                        </p>

                        <p>
                          <strong>Imágenes carrusel:</strong>{" "}
                          {additionalImages.length}
                        </p>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(serie)}
                          className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSeries(serie)}
                          disabled={saving || deletingSeriesId === getId(serie)}
                          className="h-11 w-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center disabled:opacity-60"
                          title="Borrar definitivamente"
                        >
                          {deletingSeriesId === getId(serie) ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <Trash2 size={17} />
                          )}
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

export default AdminSeriesPage;