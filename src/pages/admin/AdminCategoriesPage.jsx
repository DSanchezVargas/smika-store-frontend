import { useMemo, useState } from "react";
import {
  ArrowLeft,
  FolderTree,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save
} from "lucide-react";

import ImageDropzone from "../../components/admin/ImageDropzone";
import CroppedImagePreview from "../../components/admin/CroppedImagePreview";
import { useAdminData } from "../../context/AdminDataContext";

const initialForm = {
  nombre: "",
  descripcion: "",
  tipo: "principal",
  categoriaPadre: "",
  imagen: "",
  orden: 0,
  activa: true
};

function getId(item) {
  return item?._id || item?.id || "";
}

function getCategoryStatus(category) {
  return category.activa !== false && category.activo !== false
    ? "Activa"
    : "Inactiva";
}

function getImageSource(image) {
  if (!image) return "";

  if (typeof image === "string") return image;

  return (
    image.finalPreview ||
    image.url ||
    image.preview ||
    image.src ||
    image.imagen ||
    ""
  );
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
    reader.onerror = () => reject(new Error("No se pudo leer la imagen de categoría."));

    reader.readAsDataURL(file);
  });
}

async function imageToCategoryString(image) {
  const file = getImageFile(image);

  if (file) {
    return fileToDataUrl(file);
  }

  return getImageSource(image);
}

function createEditableCategoryImage(image) {
  const source = getImageSource(image);

  if (!source) return null;

  return {
    id: `category-image-${Date.now()}-${Math.random()}`,
    name: "imagen-categoria.jpg",
    preview: source,
    finalPreview: source,
    url: source,
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
    storage: source.startsWith("data:") ? "local-data-url" : "external"
  };
}

function AdminCategoriesPage() {
  const {
    categories,
    categoriesLoadError,
    loadingCategories,
    refreshCategories,
    createCategoryFull,
    updateCategory,
    toggleCategoryStatus
  } = useAdminData();

  const [view, setView] = useState("list");
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [categoryImages, setCategoryImages] = useState([]);
  const [categoryImageTouched, setCategoryImageTouched] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedCategories = useMemo(() => {
    return [...(categories || [])].sort((a, b) => {
      if (a.activa !== b.activa) return a.activa ? -1 : 1;

      const orderA = Number(a.orden || 0);
      const orderB = Number(b.orden || 0);

      if (orderA !== orderB) return orderA - orderB;

      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [categories]);

  const parentCategoryOptions = useMemo(() => {
    return (categories || []).filter(
      (category) =>
        category.tipo === "principal" &&
        category.activa !== false &&
        getId(category) !== getId(editingCategory)
    );
  }, [categories, editingCategory]);

  const setCategoryImagesAndTouch = (updater) => {
    setCategoryImageTouched(true);
    setCategoryImages((currentImages) => {
      const nextImages =
        typeof updater === "function" ? updater(currentImages) : updater;

      return Array.isArray(nextImages) ? nextImages.slice(0, 1) : [];
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setCategoryImages([]);
    setCategoryImageTouched(false);
    setEditingCategory(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingCategory(null);
    setForm(initialForm);
    setCategoryImages([]);
    setCategoryImageTouched(false);
    setView("form");
  };

  const openEditForm = (category) => {
    setMessage("");
    setEditingCategory(category);

    setForm({
      nombre: category.nombre || "",
      descripcion: category.descripcion || "",
      tipo: category.tipo || "principal",
      categoriaPadre:
        typeof category.categoriaPadre === "string"
          ? category.categoriaPadre
          : getId(category.categoriaPadre),
      imagen: category.imagen || "",
      orden: Number(category.orden || 0),
      activa: category.activa !== false
    });

    const existingImage = createEditableCategoryImage(category.imagen || "");
    setCategoryImages(existingImage ? [existingImage] : []);
    setCategoryImageTouched(false);
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
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      categoriaPadre: form.tipo === "subcategoria" ? form.categoriaPadre : "",
      imagen: form.imagen,
      orden: Number(form.orden || 0),
      activa: Boolean(form.activa)
    };

    if (!editingCategory || categoryImageTouched) {
      payload.imagen = categoryImages[0]
        ? await imageToCategoryString(categoryImages[0])
        : "";
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre de la categoría.");
      return;
    }

    if (form.tipo === "subcategoria" && !form.categoriaPadre) {
      setMessage("Selecciona una categoría padre para la subcategoría.");
      return;
    }

    setSaving(true);
    setMessage(
      editingCategory
        ? "Guardando cambios de la categoría..."
        : "Creando categoría..."
    );

    try {
      const payload = await buildPayload();

      if (editingCategory) {
        await updateCategory(getId(editingCategory), payload);
        setMessage("Categoría actualizada correctamente.");
      } else {
        await createCategoryFull(payload);
        setMessage("Categoría creada correctamente.");
      }

      resetForm();
      await refreshCategories?.();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar la categoría.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (category) => {
    const categoryId = getId(category);

    if (!categoryId) {
      setMessage("No se encontró el ID de la categoría.");
      return;
    }

    setSaving(true);
    setMessage(
      category.activa !== false
        ? "Desactivando categoría..."
        : "Activando categoría..."
    );

    try {
      await toggleCategoryStatus(categoryId);
      await refreshCategories?.();

      setMessage(
        category.activa !== false
          ? "Categoría desactivada correctamente."
          : "Categoría activada correctamente."
      );
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Categorías</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de categorías</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Administra categorías reales desde MongoDB. Los productos pueden
              usar estas categorías por ID y nombre.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <button
                type="button"
                onClick={refreshCategories}
                disabled={loadingCategories || saving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loadingCategories ? "animate-spin" : ""}
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
                Crear categoría
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

      {categoriesLoadError && (
        <div className="rounded-[24px] bg-red-50 px-5 py-4 text-sm font-black text-red-600">
          {categoriesLoadError}
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
                {editingCategory ? "Editar categoría" : "Nueva categoría"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingCategory
                  ? "Actualizar categoría"
                  : "Registrar categoría"}
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
                placeholder="Ejemplo: Stand de acrílico"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Tipo
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                <option value="principal">Principal</option>
                <option value="subcategoria">Subcategoría</option>
              </select>
            </label>

            {form.tipo === "subcategoria" && (
              <label className="grid gap-2 text-sm font-black">
                Categoría padre
                <select
                  name="categoriaPadre"
                  value={form.categoriaPadre}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                >
                  <option value="">Seleccionar categoría padre</option>

                  {parentCategoryOptions.map((category) => (
                    <option key={getId(category)} value={getId(category)}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="grid gap-2 text-sm font-black">
              Orden
              <input
                name="orden"
                type="number"
                value={form.orden}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Descripción
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Descripción opcional..."
              />
            </label>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Imagen de categoría</p>

              <p className="mt-1 text-sm text-gray-600 leading-6">
                Sube una imagen propia para representar la categoría. Si editas
                nombre, orden o descripción y no tocas esta zona, la imagen
                anterior se conserva igual.
              </p>

              <div className="mt-4">
                <ImageDropzone
                  label="Subir imagen de categoría"
                  description="El sistema comprime la imagen cuando conviene para no aumentar su peso."
                  images={categoryImages}
                  setImages={setCategoryImagesAndTouch}
                  multiple={false}
                />
              </div>

              {categoryImages[0] && (
                <div className="mt-4 max-w-[220px]">
                  <CroppedImagePreview
                    image={categoryImages[0]}
                    alt="Vista previa de categoría"
                    className="aspect-square w-full"
                    rounded="rounded-2xl"
                  />
                </div>
              )}
            </div>

            <label className="flex items-center justify-between rounded-3xl bg-[#F8F6F7] p-4 text-sm font-black lg:col-span-2">
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
        </form>
      )}

      {view === "list" && (
        <>
          {loadingCategories ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando categorías...</p>
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <FolderTree size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay categorías
              </h3>

              <p className="mt-2 text-gray-600">
                Crea una categoría para organizar productos.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {sortedCategories.map((category) => (
                <article
                  key={getId(category)}
                  className="rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#F8F6F7] flex items-center justify-center text-[#87CCC8]">
                        {category.imagen ? (
                          <img
                            src={category.imagen}
                            alt={category.nombre}
                            className="h-full w-full object-contain p-1"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon size={24} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#87CCC8]">
                          {category.tipo === "subcategoria"
                            ? "Subcategoría"
                            : "Categoría principal"}
                        </p>

                        <h3 className="mt-1 text-xl font-black truncate">
                          {category.nombre}
                        </h3>
                      </div>
                    </div>

                    <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black shrink-0">
                      {getCategoryStatus(category)}
                    </span>
                  </div>

                  {category.descripcion && (
                    <p className="mt-4 text-sm text-gray-600 leading-6">
                      {category.descripcion}
                    </p>
                  )}

                  <div className="mt-4 grid gap-2 text-sm text-gray-600">
                    <p>
                      <strong>Orden:</strong> {category.orden || 0}
                    </p>

                    {category.categoriaPadreNombre && (
                      <p>
                        <strong>Padre:</strong> {category.categoriaPadreNombre}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(category)}
                      className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(category)}
                      disabled={saving}
                      className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                      title={
                        category.activa !== false ? "Desactivar" : "Activar"
                      }
                    >
                      <Power
                        size={17}
                        className={
                          category.activa !== false
                            ? "text-gray-500"
                            : "text-red-500"
                        }
                      />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminCategoriesPage;
