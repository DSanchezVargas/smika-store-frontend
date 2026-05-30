import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Globe2,
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
  activo: true
};

function getId(item) {
  return item?._id || item?.id || "";
}

function getStatusText(origin) {
  return origin.activo !== false ? "Activo" : "Inactivo";
}

function AdminOriginsPage() {
  const {
    origins,
    loadingOrigins,
    originsLoadError,
    refreshOrigins,
    createOriginFull,
    updateOrigin,
    toggleOriginStatus
  } = useAdminData();

  const [view, setView] = useState("list");
  const [editingOrigin, setEditingOrigin] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedOrigins = useMemo(() => {
    return [...(origins || [])].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [origins]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingOrigin(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingOrigin(null);
    setForm(initialForm);
    setView("form");
  };

  const openEditForm = (origin) => {
    setMessage("");
    setEditingOrigin(origin);

    setForm({
      nombre: origin.nombre || "",
      descripcion: origin.descripcion || "",
      activo: origin.activo !== false
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
    activo: Boolean(form.activo)
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setMessage("Escribe el país u origen.");
      return;
    }

    setSaving(true);
    setMessage(
      editingOrigin
        ? "Guardando cambios del origen..."
        : "Creando origen..."
    );

    try {
      const payload = buildPayload();

      if (editingOrigin) {
        await updateOrigin(getId(editingOrigin), payload);
        setMessage("Origen actualizado correctamente.");
      } else {
        await createOriginFull(payload);
        setMessage("Origen creado correctamente.");
      }

      resetForm();
      await refreshOrigins?.();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el origen.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (origin) => {
    const originId = getId(origin);

    if (!originId) {
      setMessage("No se encontró el ID del origen.");
      return;
    }

    setSaving(true);
    setMessage(
      origin.activo !== false
        ? "Desactivando origen..."
        : "Activando origen..."
    );

    try {
      await toggleOriginStatus(originId);
      await refreshOrigins?.();

      setMessage(
        origin.activo !== false
          ? "Origen desactivado correctamente."
          : "Origen activado correctamente."
      );
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado del origen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Países / Orígenes</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de orígenes</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Administra orígenes como China, Corea, Japón y Variado para
              usarlos en series, eventos y productos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <button
                type="button"
                onClick={refreshOrigins}
                disabled={loadingOrigins || saving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loadingOrigins ? "animate-spin" : ""}
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
                Crear origen
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

      {(message || originsLoadError) && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message || originsLoadError}
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
                {editingOrigin ? "Editar origen" : "Nuevo origen"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingOrigin
                  ? "Actualizar país/origen"
                  : "Registrar país/origen"}
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

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-black">
              País / origen
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: China, Corea, Japón, Variado..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Descripción
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Descripción opcional..."
              />
            </label>

            <label className="flex items-center justify-between rounded-3xl bg-[#F8F6F7] p-4 text-sm font-black">
              Activo
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={handleChange}
                className="h-5 w-5"
              />
            </label>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          {loadingOrigins ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando orígenes...</p>
            </div>
          ) : sortedOrigins.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Globe2 size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay orígenes
              </h3>

              <p className="mt-2 text-gray-600">
                Crea países u orígenes para usarlos en la tienda.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {sortedOrigins.map((origin) => (
                <article
                  key={getId(origin)}
                  className="rounded-[28px] bg-white p-6 border border-[#87CCC8]/20 smika-shadow"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                      {getStatusText(origin)}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black">{origin.nombre}</h3>

                  <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                    {origin.descripcion || "Sin descripción."}
                  </p>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(origin)}
                      className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(origin)}
                      disabled={saving}
                      className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                      title={origin.activo !== false ? "Desactivar" : "Activar"}
                    >
                      <Power
                        size={17}
                        className={
                          origin.activo !== false
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

export default AdminOriginsPage;