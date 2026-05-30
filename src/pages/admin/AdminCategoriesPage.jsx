import { useMemo, useState } from "react";
import {
  ArrowLeft,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save
} from "lucide-react";

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

  const resetForm = () => {
    setForm(initialForm);
    setEditingCategory(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingCategory(null);
    setForm(initialForm);
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

    setView("form");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const buildPayload = () => ({
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim(),
    tipo: form.tipo,
    categoriaPadre: form.tipo === "subcategoria" ? form.categoriaPadre : "",
    imagen: form.imagen.trim(),
    orden: Number(form.orden || 0),
    activa: Boolean(form.activa)
  });

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
      const payload = buildPayload();

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

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Imagen / referencia visual opcional
              <input
                name="imagen"
                value={form.imagen}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="URL opcional o texto de referencia"
              />
            </label>

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
                Crea categorías para usarlas en productos.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {sortedCategories.map((category) => (
                <article
                  key={getId(category)}
                  className="rounded-[28px] bg-white p-6 border border-[#87CCC8]/20 smika-shadow"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                      {getCategoryStatus(category)}
                    </span>

                    <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                      {category.tipo === "subcategoria"
                        ? "Subcategoría"
                        : "Principal"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black">
                    {category.nombre}
                  </h3>

                  <div className="mt-3 grid gap-2 text-sm text-gray-600">
                    <p>
                      <strong>Orden:</strong> {category.orden || 0}
                    </p>

                    {category.categoriaPadreNombre && (
                      <p>
                        <strong>Padre:</strong> {category.categoriaPadreNombre}
                      </p>
                    )}

                    <p className="line-clamp-3">
                      {category.descripcion || "Sin descripción."}
                    </p>
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