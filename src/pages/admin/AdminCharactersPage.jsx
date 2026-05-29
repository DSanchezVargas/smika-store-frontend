import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Image,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Sparkles
} from "lucide-react";

import { useAdminData } from "../../context/AdminDataContext";

const initialForm = {
  nombre: "",
  tipo: "Personaje",
  serie: "",
  descripcion: "",
  imagen: "",
  estado: "Completo",
  needsReview: false,
  activo: true
};

function getId(item) {
  return item?._id || item?.id || "";
}

function getStatusText(character) {
  if (character.activo === false) return "Inactivo";
  if (character.needsReview) return "Faltan detalles";
  return character.estado || "Completo";
}

function AdminCharactersPage() {
  const {
    characters,
    series,
    loadingCharacters,
    charactersLoadError,
    refreshCharacters,
    createCharacterFull,
    updateCharacter,
    toggleCharacterStatus
  } = useAdminData();

  const [view, setView] = useState("list");
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedCharacters = useMemo(() => {
    return [...(characters || [])].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      if (a.needsReview !== b.needsReview) return a.needsReview ? -1 : 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [characters]);

  const activeSeries = useMemo(() => {
    return (series || []).filter((serie) => serie.activo !== false);
  }, [series]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingCharacter(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingCharacter(null);
    setForm(initialForm);
    setView("form");
  };

  const openEditForm = (character) => {
    setMessage("");
    setEditingCharacter(character);

    setForm({
      nombre: character.nombre || "",
      tipo: character.tipo || "Personaje",
      serie: character.serieNombre || character.serie || "",
      descripcion: character.descripcion || "",
      imagen: character.imagen || "",
      estado: character.estado || (character.needsReview ? "Faltan detalles" : "Completo"),
      needsReview: Boolean(character.needsReview),
      activo: character.activo !== false
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

  const buildPayload = () => {
    return {
      nombre: form.nombre.trim(),
      tipo: form.tipo.trim() || "Personaje",
      serie: form.serie.trim() || "Sin serie definida",
      serieNombre: form.serie.trim() || "Sin serie definida",
      descripcion: form.descripcion.trim(),
      imagen: form.imagen.trim(),
      estado: form.needsReview ? "Faltan detalles" : form.estado.trim() || "Completo",
      needsReview: Boolean(form.needsReview),
      activo: Boolean(form.activo)
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre del personaje o criatura.");
      return;
    }

    setSaving(true);
    setMessage(
      editingCharacter
        ? "Actualizando personaje..."
        : "Creando personaje..."
    );

    try {
      const payload = buildPayload();

      if (editingCharacter) {
        await updateCharacter(getId(editingCharacter), payload);
        setMessage("Personaje actualizado correctamente.");
      } else {
        await createCharacterFull(payload);
        setMessage("Personaje creado correctamente.");
      }

      resetForm();
      await refreshCharacters?.();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el personaje.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (character) => {
    const characterId = getId(character);

    if (!characterId) {
      setMessage("No se encontró el ID del personaje.");
      return;
    }

    setSaving(true);
    setMessage(
      character.activo
        ? "Desactivando personaje..."
        : "Activando personaje..."
    );

    try {
      await toggleCharacterStatus(characterId);
      await refreshCharacters?.();

      setMessage(
        character.activo
          ? "Personaje desactivado correctamente."
          : "Personaje activado correctamente."
      );
    } catch (error) {
      setMessage(
        error.message || "No se pudo cambiar el estado del personaje."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Personajes / Criaturas</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">
              Gestión de personajes
            </h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Registra personajes o criaturas y relaciónalos con series. Estos
              datos se usarán luego al crear productos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <button
                type="button"
                onClick={refreshCharacters}
                disabled={loadingCharacters || saving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loadingCharacters ? "animate-spin" : ""}
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
                Crear personaje
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

      {charactersLoadError && (
        <div className="rounded-[24px] bg-red-50 px-5 py-4 text-sm font-black text-red-600">
          {charactersLoadError}
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
                {editingCharacter ? "Editar personaje" : "Nuevo personaje"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingCharacter
                  ? "Actualizar datos del personaje"
                  : "Registrar nuevo personaje"}
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
              Guardar
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Nombre del personaje / criatura
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Shuraka"
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
                <option value="Personaje">Personaje</option>
                <option value="Criatura">Criatura</option>
                <option value="Mascota">Mascota</option>
                <option value="Objeto especial">Objeto especial</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Serie relacionada
              <input
                list="series-options"
                name="serie"
                value={form.serie}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Escribe o elige una serie"
              />
              <datalist id="series-options">
                {activeSeries.map((serie) => (
                  <option key={getId(serie)} value={serie.nombre} />
                ))}
              </datalist>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Estado
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                disabled={form.needsReview}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none disabled:bg-gray-100"
              >
                <option value="Completo">Completo</option>
                <option value="Faltan detalles">Faltan detalles</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Imagen
              <input
                name="imagen"
                value={form.imagen}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="URL o ruta generada por el sistema"
              />
            </label>

            <div className="grid gap-3 rounded-3xl bg-[#F8F6F7] p-4">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Faltan detalles
                <input
                  type="checkbox"
                  name="needsReview"
                  checked={form.needsReview}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-sm font-black">
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

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Descripción
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Información opcional del personaje..."
              />
            </label>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          {loadingCharacters ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando personajes...</p>
            </div>
          ) : sortedCharacters.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Sparkles size={42} className="mx-auto text-[#D1B0C7]" />
              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay personajes registrados
              </h3>
              <p className="mt-2 text-gray-600">
                Crea un personaje para usarlo luego en productos.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {sortedCharacters.map((character) => (
                <article
                  key={getId(character)}
                  className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
                >
                  <div className="h-40 bg-[#87CCC8] flex items-center justify-center text-white text-2xl text-center font-black px-5">
                    {character.imagen ? (
                      <img
                        src={character.imagen}
                        alt={character.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      character.nombre
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                        {getStatusText(character)}
                      </span>

                      {character.tipo && (
                        <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                          {character.tipo}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-xl font-black">
                      {character.nombre}
                    </h3>

                    <div className="mt-3 grid gap-2 text-sm text-gray-600">
                      <p>
                        <strong>Serie:</strong>{" "}
                        {character.serieNombre ||
                          character.serie ||
                          "Sin serie definida"}
                      </p>

                      <p>
                        <strong>Tipo:</strong>{" "}
                        {character.tipo || "Personaje"}
                      </p>

                      {character.descripcion && (
                        <p className="line-clamp-3">
                          <strong>Descripción:</strong>{" "}
                          {character.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(character)}
                        className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>

                      <button
                        type="button"
                        className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center"
                        title="Imagen"
                      >
                        <Image size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(character)}
                        disabled={saving}
                        className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                        title={character.activo ? "Desactivar" : "Activar"}
                      >
                        <Power
                          size={17}
                          className={
                            character.activo ? "text-gray-500" : "text-red-500"
                          }
                        />
                      </button>
                    </div>
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

export default AdminCharactersPage;