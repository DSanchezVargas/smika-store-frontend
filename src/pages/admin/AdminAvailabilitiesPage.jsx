import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Tags,
  Trash2
} from "lucide-react";

import {
  createAvailability,
  deleteAvailability,
  getAvailabilities,
  syncAvailabilities,
  updateAvailability
} from "../../services/availabilityService";

const initialForm = {
  nombre: "",
  value: "",
  estado: "Activo",
  descripcion: "",
  orden: 0,
  esDefault: false
};

const stateOptions = [
  "Activo",
  "Preventa",
  "Por pedido",
  "Agotado",
  "Inactivo"
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

function createValue(text = "") {
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

function normalizeAvailability(availability = {}) {
  return {
    ...availability,
    id: getId(availability),
    _id: getId(availability),
    nombre: availability.nombre || availability.name || "Disponibilidad",
    value:
      availability.value ||
      availability.valor ||
      createValue(availability.nombre || availability.name || ""),
    estado: availability.estado || "Activo",
    descripcion: availability.descripcion || "",
    orden: Number(availability.orden || 0),
    esDefault: Boolean(availability.esDefault),
    usageCount: Number(availability.usageCount || availability.usos || 0)
  };
}

function mergeAvailabilities(currentAvailabilities = [], nextAvailabilities = []) {
  const merged = [...currentAvailabilities];

  nextAvailabilities.forEach((availability) => {
    const normalizedAvailability = normalizeAvailability(availability);
    const availabilityId = getId(normalizedAvailability);

    const existingIndex = merged.findIndex((item) => {
      const sameId =
        availabilityId && getId(item) && getId(item) === availabilityId;

      const sameValue =
        normalizeText(item.value) === normalizeText(normalizedAvailability.value);

      const sameName =
        normalizeText(item.nombre) ===
        normalizeText(normalizedAvailability.nombre);

      return sameId || sameValue || sameName;
    });

    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...normalizedAvailability
      };
    } else {
      merged.push(normalizedAvailability);
    }
  });

  return merged;
}

function AdminAvailabilitiesPage() {
  const [availabilities, setAvailabilities] = useState([]);
  const [view, setView] = useState("list");
  const [editingAvailability, setEditingAvailability] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [availabilityToDelete, setAvailabilityToDelete] = useState(null);
  const [reassignTo, setReassignTo] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const sortedAvailabilities = useMemo(() => {
    return [...availabilities].sort((a, b) => {
      const orderA = Number(a.orden || 0);
      const orderB = Number(b.orden || 0);

      if (orderA !== orderB) return orderA - orderB;

      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [availabilities]);

  const totalUsage = useMemo(() => {
    return availabilities.reduce((total, availability) => {
      return total + Number(availability.usageCount || 0);
    }, 0);
  }, [availabilities]);

  const defaultCount = useMemo(() => {
    return availabilities.filter((availability) => availability.esDefault)
      .length;
  }, [availabilities]);

  const customCount = useMemo(() => {
    return availabilities.filter((availability) => !availability.esDefault)
      .length;
  }, [availabilities]);

  const replacementOptions = useMemo(() => {
    if (!availabilityToDelete) return [];

    return sortedAvailabilities.filter((availability) => {
      return getId(availability) !== getId(availabilityToDelete);
    });
  }, [sortedAvailabilities, availabilityToDelete]);

  const refreshAvailabilities = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await getAvailabilities();
      const list = pickAvailabilities(data).map(normalizeAvailability);

      setAvailabilities(list);
    } catch (error) {
      setMessage(error.message || "No se pudieron cargar las disponibilidades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAvailabilities();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingAvailability(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingAvailability(null);
    setForm(initialForm);
    setView("form");
  };

  const openEditForm = (availability) => {
    setMessage("");
    setEditingAvailability(availability);

    setForm({
      nombre: availability.nombre || "",
      value: availability.value || "",
      estado: availability.estado || "Activo",
      descripcion: availability.descripcion || "",
      orden: Number(availability.orden || 0),
      esDefault: Boolean(availability.esDefault)
    });

    setView("form");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => {
      if (name === "nombre" && !editingAvailability) {
        return {
          ...currentForm,
          nombre: value,
          value: currentForm.value ? currentForm.value : createValue(value)
        };
      }

      return {
        ...currentForm,
        [name]: type === "checkbox" ? checked : value
      };
    });
  };

  const validateForm = () => {
    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre de la disponibilidad.");
      return false;
    }

    if (!form.value.trim()) {
      setMessage("Escribe el valor interno de la disponibilidad.");
      return false;
    }

    const duplicatedAvailability = availabilities.find((availability) => {
      const sameName =
        normalizeText(availability.nombre) === normalizeText(form.nombre);

      const sameValue =
        normalizeText(availability.value) === normalizeText(form.value);

      const differentItem =
        !editingAvailability ||
        getId(availability) !== getId(editingAvailability);

      return (sameName || sameValue) && differentItem;
    });

    if (duplicatedAvailability) {
      setMessage(
        `Ya existe una disponibilidad parecida: “${duplicatedAvailability.nombre}”.`
      );
      return false;
    }

    return true;
  };

  const replaceAvailability = (availability) => {
    if (!availability) return;

    const normalizedAvailability = normalizeAvailability(availability);

    setAvailabilities((currentAvailabilities) =>
      mergeAvailabilities(currentAvailabilities, [normalizedAvailability])
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    setMessage(
      editingAvailability
        ? "Guardando cambios de disponibilidad..."
        : "Creando disponibilidad..."
    );

    try {
      const payload = {
        nombre: form.nombre.trim(),
        value: createValue(form.value.trim()),
        estado: form.estado,
        descripcion: form.descripcion.trim(),
        orden: Number(form.orden || 0),
        esDefault: Boolean(form.esDefault)
      };

      if (editingAvailability) {
        const data = await updateAvailability(
          getId(editingAvailability),
          payload
        );

        replaceAvailability(data.availability || data.disponibilidad || data.data);

        setMessage("Disponibilidad actualizada correctamente.");
      } else {
        const data = await createAvailability(payload);

        replaceAvailability(data.availability || data.disponibilidad || data.data);

        setMessage("Disponibilidad creada correctamente.");
      }

      resetForm();
      await refreshAvailabilities();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar la disponibilidad.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncAvailabilities = async () => {
    setSaving(true);
    setMessage("Sincronizando disponibilidades...");

    try {
      const data = await syncAvailabilities();
      const list = pickAvailabilities(data).map(normalizeAvailability);

      setAvailabilities(list);
      setMessage(
        data.message ||
          "Disponibilidades sincronizadas correctamente sin borrar existentes."
      );
    } catch (error) {
      setMessage(error.message || "No se pudieron sincronizar disponibilidades.");
    } finally {
      setSaving(false);
    }
  };

  const openDeletePanel = (availability) => {
    setMessage("");
    setAvailabilityToDelete(availability);
    setReassignTo("");
  };

  const closeDeletePanel = () => {
    setAvailabilityToDelete(null);
    setReassignTo("");
  };

  const handleDeleteAvailability = async () => {
    if (!availabilityToDelete) return;

    if (availabilityToDelete.esDefault) {
      setMessage(
        "Las disponibilidades base no se borran desde aquí. Usa esta sección para borrar duplicados personalizados."
      );
      return;
    }

    if (Number(availabilityToDelete.usageCount || 0) > 0 && !reassignTo) {
      setMessage("Selecciona a qué disponibilidad se reasignarán los productos.");
      return;
    }

    setSaving(true);
    setMessage("Borrando disponibilidad...");

    try {
      const payload = reassignTo
        ? {
            reassignTo
          }
        : {};

      const data = await deleteAvailability(getId(availabilityToDelete), payload);

      setMessage(
        data.message ||
          "Disponibilidad borrada definitivamente y productos reasignados."
      );

      closeDeletePanel();
      await refreshAvailabilities();
    } catch (error) {
      setMessage(error.message || "No se pudo borrar la disponibilidad.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Disponibilidades</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">
              Gestión de disponibilidades
            </h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Administra los valores que aparecen en productos. Aquí sí puedes
              borrar duplicados de verdad, pero si están en uso primero debes
              reasignar sus productos a una disponibilidad oficial.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <>
                <button
                  type="button"
                  onClick={handleSyncAvailabilities}
                  disabled={saving || loading}
                  className="rounded-full bg-[#F7D9D8] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Tags size={18} />
                  )}
                  Sincronizar
                </button>

                <button
                  type="button"
                  onClick={refreshAvailabilities}
                  disabled={loading || saving}
                  className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <RefreshCw
                    size={18}
                    className={loading ? "animate-spin" : ""}
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
                Crear disponibilidad
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

      {availabilityToDelete && (
        <div className="rounded-[32px] bg-white p-6 smika-shadow border border-red-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-red-500 font-black">
                <AlertTriangle size={18} />
                Borrar disponibilidad definitivamente
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {availabilityToDelete.nombre}
              </h3>

              <p className="mt-2 text-sm text-gray-600 leading-6">
                Esta acción borra el registro de disponibilidades. No es
                desactivar. Si está en uso, primero se reasignarán sus productos.
              </p>
            </div>

            <button
              type="button"
              onClick={closeDeletePanel}
              className="rounded-full bg-[#F8F6F7] px-4 py-2 font-black"
            >
              Cancelar
            </button>
          </div>

          <div className="mt-5 rounded-3xl bg-[#F8F6F7] p-5">
            <p className="font-black">
              Productos usando esta disponibilidad:{" "}
              {availabilityToDelete.usageCount || 0}
            </p>

            {availabilityToDelete.esDefault ? (
              <p className="mt-3 text-sm font-black text-red-500">
                Esta es una disponibilidad base. No se recomienda borrarla
                porque el backend la puede volver a crear al sincronizar.
              </p>
            ) : Number(availabilityToDelete.usageCount || 0) > 0 ? (
              <label className="mt-4 grid gap-2 text-sm font-black">
                Reasignar productos a

                <select
                  value={reassignTo}
                  onChange={(event) => setReassignTo(event.target.value)}
                  className="w-full rounded-2xl border border-[#87CCC8]/30 bg-white px-4 py-3 outline-none"
                >
                  <option value="">Selecciona una disponibilidad destino</option>

                  {replacementOptions.map((availability) => (
                    <option key={getId(availability)} value={availability.value}>
                      {availability.nombre} ({availability.value})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="mt-3 text-sm text-gray-600">
                No hay productos usando esta disponibilidad. Puedes borrarla sin
                reasignación.
              </p>
            )}

            <button
              type="button"
              onClick={handleDeleteAvailability}
              disabled={
                saving ||
                availabilityToDelete.esDefault ||
                (Number(availabilityToDelete.usageCount || 0) > 0 &&
                  !reassignTo)
              }
              className="mt-5 rounded-full bg-red-500 px-5 py-3 font-black text-white flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              Borrar definitivamente
            </button>
          </div>
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
                {editingAvailability
                  ? "Editar disponibilidad"
                  : "Nueva disponibilidad"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingAvailability
                  ? "Actualizar disponibilidad"
                  : "Registrar disponibilidad"}
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
              Nombre visible

              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: En stock"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Valor interno

              <input
                name="value"
                value={form.value}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: stock"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Estado que aplicará al producto

              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                {stateOptions.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
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
                placeholder="Describe cuándo usar esta disponibilidad."
              />
            </label>

            <div className="rounded-3xl bg-[#F8F6F7] p-4 lg:col-span-2">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Marcar como disponibilidad base

                <input
                  type="checkbox"
                  name="esDefault"
                  checked={form.esDefault}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <p className="mt-2 text-xs text-gray-500 leading-5">
                Úsalo solo para opciones principales como En stock, Preventa,
                Por pedido o Agotado.
              </p>
            </div>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
              <p className="text-sm font-black text-[#87CCC8]">Total</p>
              <p className="mt-2 text-3xl font-black">
                {availabilities.length}
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
              <p className="text-sm font-black text-[#87CCC8]">Base</p>
              <p className="mt-2 text-3xl font-black">{defaultCount}</p>
            </div>

            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
              <p className="text-sm font-black text-[#87CCC8]">Personalizadas</p>
              <p className="mt-2 text-3xl font-black">{customCount}</p>
            </div>

            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#D1B0C7]/30">
              <p className="text-sm font-black text-[#D1B0C7]">Usos</p>
              <p className="mt-2 text-3xl font-black">{totalUsage}</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />

              <p className="mt-4 font-black">
                Cargando disponibilidades...
              </p>
            </div>
          ) : sortedAvailabilities.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Tags size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay disponibilidades
              </h3>

              <p className="mt-2 text-gray-600">
                Dale a Sincronizar para crear En stock, Preventa, Por pedido y
                Agotado.
              </p>
            </div>
          ) : (
            <div className="rounded-[32px] bg-white smika-shadow border border-[#87CCC8]/20 overflow-hidden">
              <div className="hidden md:grid grid-cols-[1.1fr_1fr_1fr_90px_120px_190px] gap-4 bg-[#F8F6F7] px-5 py-4 text-sm font-black">
                <span>Nombre</span>
                <span>Valor</span>
                <span>Estado</span>
                <span>Usos</span>
                <span>Tipo</span>
                <span className="text-right">Acciones</span>
              </div>

              <div className="divide-y divide-[#87CCC8]/10">
                {sortedAvailabilities.map((availability) => (
                  <article
                    key={getId(availability) || availability.value}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[1.1fr_1fr_1fr_90px_120px_190px] md:items-center"
                  >
                    <div>
                      <p className="font-black">{availability.nombre}</p>

                      {availability.descripcion && (
                        <p className="mt-1 text-xs text-gray-500 md:hidden">
                          {availability.descripcion}
                        </p>
                      )}
                    </div>

                    <p className="text-sm font-black text-gray-600">
                      {availability.value}
                    </p>

                    <p className="text-sm text-gray-600">
                      {availability.estado}
                    </p>

                    <p className="text-sm font-black">
                      {availability.usageCount || 0}
                    </p>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          availability.esDefault
                            ? "bg-[#87CCC8]/20"
                            : "bg-[#F7D9D8]"
                        }`}
                      >
                        {availability.esDefault ? "Base" : "Personalizada"}
                      </span>
                    </div>

                    <div className="flex gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => openEditForm(availability)}
                        className="rounded-full bg-[#87CCC8] px-4 py-2 text-sm font-black text-[#2F2F2F] flex items-center gap-2"
                      >
                        <Pencil size={15} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => openDeletePanel(availability)}
                        disabled={saving}
                        className="h-10 w-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center disabled:opacity-60"
                        title="Borrar definitivamente"
                      >
                        <Trash2 size={16} />
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

export default AdminAvailabilitiesPage;