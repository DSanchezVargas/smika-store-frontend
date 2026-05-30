import { useMemo, useState } from "react";
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

import { useAdminData } from "../../context/AdminDataContext";

const initialForm = {
  nombre: "",
  tipo: "Autor",
  paisOrigen: "",
  descripcion: "",
  activo: true
};

const creatorTypes = ["Autor", "Artista", "Ilustrador", "Creador", "Otro"];

function getId(item) {
  return item?._id || item?.id || "";
}

function getStatusText(creator) {
  return creator.activo !== false ? "Activo" : "Inactivo";
}

function AdminCreatorsPage() {
  const {
    creators,
    loadingCreators,
    creatorsLoadError,
    refreshCreators,
    createCreatorFull,
    updateCreator,
    toggleCreatorStatus
  } = useAdminData();

  const [view, setView] = useState("list");
  const [editingCreator, setEditingCreator] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedCreators = useMemo(() => {
    return [...(creators || [])].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [creators]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingCreator(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingCreator(null);
    setForm(initialForm);
    setView("form");
  };

  const openEditForm = (creator) => {
    setMessage("");
    setEditingCreator(creator);

    setForm({
      nombre: creator.nombre || "",
      tipo: creator.tipo || "Autor",
      paisOrigen: creator.paisOrigen || "",
      descripcion: creator.descripcion || "",
      activo: creator.activo !== false
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
    tipo: form.tipo.trim() || "Autor",
    paisOrigen: form.paisOrigen.trim(),
    descripcion: form.descripcion.trim(),
    activo: Boolean(form.activo)
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre del autor o creador.");
      return;
    }

    setSaving(true);
    setMessage(
      editingCreator
        ? "Guardando cambios del creador..."
        : "Creando creador..."
    );

    try {
      const payload = buildPayload();

      if (editingCreator) {
        await updateCreator(getId(editingCreator), payload);
        setMessage("Creador actualizado correctamente.");
      } else {
        await createCreatorFull(payload);
        setMessage("Creador creado correctamente.");
      }

      resetForm();
      await refreshCreators?.();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el creador.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (creator) => {
    const creatorId = getId(creator);

    if (!creatorId) {
      setMessage("No se encontró el ID del creador.");
      return;
    }

    setSaving(true);
    setMessage(
      creator.activo !== false
        ? "Desactivando creador..."
        : "Activando creador..."
    );

    try {
      await toggleCreatorStatus(creatorId);
      await refreshCreators?.();

      setMessage(
        creator.activo !== false
          ? "Creador desactivado correctamente."
          : "Creador activado correctamente."
      );
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado del creador.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Creadores / Autores</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de creadores</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Administra autores, artistas o creadores relacionados con series,
              eventos y productos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <button
                type="button"
                onClick={refreshCreators}
                disabled={loadingCreators || saving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loadingCreators ? "animate-spin" : ""}
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
                Crear creador
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

      {(message || creatorsLoadError) && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message || creatorsLoadError}
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
                {editingCreator ? "Editar creador" : "Nuevo creador"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingCreator
                  ? "Actualizar datos del creador"
                  : "Registrar creador"}
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
                placeholder="Ejemplo: autora, artista o creador"
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
                {creatorTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              País / origen
              <input
                name="paisOrigen"
                value={form.paisOrigen}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Corea, China, Japón..."
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

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
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
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          {loadingCreators ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando creadores...</p>
            </div>
          ) : sortedCreators.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Tags size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay creadores
              </h3>

              <p className="mt-2 text-gray-600">
                Crea autores o creadores para relacionarlos con las series.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3">
              {sortedCreators.map((creator) => (
                <article
                  key={getId(creator)}
                  className="rounded-[28px] bg-white p-6 border border-[#87CCC8]/20 smika-shadow"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                      {getStatusText(creator)}
                    </span>

                    <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                      {creator.tipo || "Autor"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black">{creator.nombre}</h3>

                  <div className="mt-3 grid gap-2 text-sm text-gray-600">
                    <p>
                      <strong>País/origen:</strong>{" "}
                      {creator.paisOrigen || "No especificado"}
                    </p>

                    <p className="line-clamp-3">
                      {creator.descripcion || "Sin descripción."}
                    </p>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(creator)}
                      className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(creator)}
                      disabled={saving}
                      className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                      title={
                        creator.activo !== false ? "Desactivar" : "Activar"
                      }
                    >
                      <Power
                        size={17}
                        className={
                          creator.activo !== false
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

export default AdminCreatorsPage;