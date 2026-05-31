import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Tags
} from "lucide-react";

import {
  createProductType,
  deleteProductType,
  getProductTypes,
  updateProductType
} from "../../services/productTypeService";

const initialForm = {
  nombre: "",
  descripcion: "",
  orden: 0,
  activo: true
};

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

function getProductTypeName(productType) {
  return productType?.nombre || productType?.name || "Tipo de producto";
}

function normalizeProductType(productType = {}) {
  const id = getId(productType);

  return {
    ...productType,
    id,
    _id: id,
    nombre: productType.nombre || productType.name || "Tipo de producto",
    descripcion: productType.descripcion || "",
    orden: Number(productType.orden || 0),
    activo: productType.activo !== false
  };
}

function pickProductTypes(data) {
  if (Array.isArray(data?.productTypes)) return data.productTypes;
  if (Array.isArray(data?.tiposProducto)) return data.tiposProducto;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

function AdminProductTypesPage() {
  const [productTypes, setProductTypes] = useState([]);
  const [view, setView] = useState("list");
  const [editingProductType, setEditingProductType] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const sortedProductTypes = useMemo(() => {
    return [...productTypes].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;

      const orderA = Number(a.orden || 0);
      const orderB = Number(b.orden || 0);

      if (orderA !== orderB) return orderA - orderB;

      return getProductTypeName(a).localeCompare(getProductTypeName(b));
    });
  }, [productTypes]);

  const activeCount = useMemo(() => {
    return productTypes.filter((item) => item.activo !== false).length;
  }, [productTypes]);

  const inactiveCount = useMemo(() => {
    return productTypes.filter((item) => item.activo === false).length;
  }, [productTypes]);

  const refreshProductTypes = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await getProductTypes({
        activos: "false"
      });

      const list = pickProductTypes(data).map(normalizeProductType);

      setProductTypes(list);
    } catch (error) {
      setMessage(error.message || "No se pudieron cargar los tipos de producto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProductTypes();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingProductType(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingProductType(null);
    setForm(initialForm);
    setView("form");
  };

  const openEditForm = (productType) => {
    setMessage("");
    setEditingProductType(productType);

    setForm({
      nombre: productType.nombre || "",
      descripcion: productType.descripcion || "",
      orden: Number(productType.orden || 0),
      activo: productType.activo !== false
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

  const validateForm = () => {
    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre del tipo de producto.");
      return false;
    }

    const duplicatedProductType = productTypes.find((productType) => {
      const sameName =
        normalizeText(productType.nombre) === normalizeText(form.nombre);

      const differentItem =
        !editingProductType ||
        getId(productType) !== getId(editingProductType);

      return sameName && differentItem;
    });

    if (duplicatedProductType) {
      setMessage("Ya existe un tipo de producto con ese nombre.");
      return false;
    }

    return true;
  };

  const replaceProductType = (productType) => {
    const normalizedProductType = normalizeProductType(productType);
    const productTypeId = getId(normalizedProductType);

    setProductTypes((currentProductTypes) => {
      const exists = currentProductTypes.some(
        (item) => getId(item) === productTypeId
      );

      if (!exists) {
        return [normalizedProductType, ...currentProductTypes];
      }

      return currentProductTypes.map((item) =>
        getId(item) === productTypeId ? normalizedProductType : item
      );
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    setMessage(
      editingProductType
        ? "Guardando cambios del tipo de producto..."
        : "Creando tipo de producto..."
    );

    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        orden: Number(form.orden || 0),
        activo: Boolean(form.activo)
      };

      if (editingProductType) {
        const data = await updateProductType(getId(editingProductType), payload);

        replaceProductType(data.productType || data.tipoProducto || data.data);

        setMessage("Tipo de producto actualizado correctamente.");
      } else {
        const data = await createProductType(payload);

        replaceProductType(data.productType || data.tipoProducto || data.data);

        setMessage("Tipo de producto creado correctamente.");
      }

      resetForm();
      await refreshProductTypes();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el tipo de producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (productType) => {
    const productTypeId = getId(productType);

    if (!productTypeId) {
      setMessage("No se encontró el ID del tipo de producto.");
      return;
    }

    setSaving(true);

    setMessage(
      productType.activo
        ? "Desactivando tipo de producto..."
        : "Activando tipo de producto..."
    );

    try {
      if (productType.activo !== false) {
        const data = await deleteProductType(productTypeId);

        replaceProductType(data.productType || data.tipoProducto || data.data);

        setMessage("Tipo de producto desactivado correctamente.");
      } else {
        const data = await updateProductType(productTypeId, {
          ...productType,
          activo: true
        });

        replaceProductType(data.productType || data.tipoProducto || data.data);

        setMessage("Tipo de producto activado correctamente.");
      }

      await refreshProductTypes();
    } catch (error) {
      setMessage(
        error.message || "No se pudo cambiar el estado del tipo de producto."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Tipos de producto</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">
              Gestión de tipos de producto
            </h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Administra los tipos que se usan al crear productos. Estos valores
              sirven para evitar escribir repetido y para filtrar productos en
              catálogo o eventos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <button
                type="button"
                onClick={refreshProductTypes}
                disabled={loading || saving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
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
                Crear tipo
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

      {view === "form" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] bg-white p-6 smika-shadow border border-[#87CCC8]/20"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[#87CCC8] font-black">
                {editingProductType ? "Editar tipo" : "Nuevo tipo"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingProductType
                  ? "Actualizar tipo de producto"
                  : "Registrar tipo de producto"}
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
              Nombre del tipo de producto

              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Stand de acrílico"
              />
            </label>

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

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Descripción opcional

              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Describe para qué sirve este tipo de producto."
              />
            </label>

            <div className="rounded-3xl bg-[#F8F6F7] p-4 lg:col-span-2">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Tipo de producto activo

                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <p className="mt-2 text-xs text-gray-500 leading-5">
                Si lo desactivas, no se eliminará de la base de datos. Solo
                dejará de aparecer como opción activa.
              </p>
            </div>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
              <p className="text-sm font-black text-[#87CCC8]">Total</p>
              <p className="mt-2 text-3xl font-black">{productTypes.length}</p>
            </div>

            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
              <p className="text-sm font-black text-[#87CCC8]">Activos</p>
              <p className="mt-2 text-3xl font-black">{activeCount}</p>
            </div>

            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
              <p className="text-sm font-black text-[#87CCC8]">Inactivos</p>
              <p className="mt-2 text-3xl font-black">{inactiveCount}</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />

              <p className="mt-4 font-black">Cargando tipos de producto...</p>
            </div>
          ) : sortedProductTypes.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Tags size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay tipos de producto
              </h3>

              <p className="mt-2 text-gray-600">
                Crea tipos como stand, llavero, photocard, pin o sticker.
              </p>
            </div>
          ) : (
            <div className="rounded-[32px] bg-white smika-shadow border border-[#87CCC8]/20 overflow-hidden">
              <div className="hidden md:grid grid-cols-[1.2fr_1.6fr_100px_120px_160px] gap-4 bg-[#F8F6F7] px-5 py-4 text-sm font-black">
                <span>Nombre</span>
                <span>Descripción</span>
                <span>Orden</span>
                <span>Estado</span>
                <span className="text-right">Acciones</span>
              </div>

              <div className="divide-y divide-[#87CCC8]/10">
                {sortedProductTypes.map((productType) => (
                  <article
                    key={getId(productType)}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1.6fr_100px_120px_160px] md:items-center"
                  >
                    <div>
                      <p className="font-black">{productType.nombre}</p>

                      <p className="mt-1 text-xs text-gray-500 md:hidden">
                        Orden: {productType.orden || 0}
                      </p>
                    </div>

                    <p className="text-sm text-gray-600 leading-6">
                      {productType.descripcion || "Sin descripción"}
                    </p>

                    <p className="hidden text-sm font-black md:block">
                      {productType.orden || 0}
                    </p>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          productType.activo
                            ? "bg-[#87CCC8]/20 text-[#2F2F2F]"
                            : "bg-[#F7D9D8] text-[#2F2F2F]"
                        }`}
                      >
                        {productType.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="flex gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => openEditForm(productType)}
                        className="rounded-full bg-[#87CCC8] px-4 py-2 text-sm font-black text-[#2F2F2F] flex items-center gap-2"
                      >
                        <Pencil size={15} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(productType)}
                        disabled={saving}
                        className="h-10 w-10 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                        title={productType.activo ? "Desactivar" : "Activar"}
                      >
                        <Power
                          size={16}
                          className={
                            productType.activo
                              ? "text-gray-500"
                              : "text-red-500"
                          }
                        />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminProductTypesPage;