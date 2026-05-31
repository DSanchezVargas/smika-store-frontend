import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Tags
} from "lucide-react";

import {
  createEventType,
  deleteEventType,
  getEventTypes,
  updateEventType
} from "../../services/eventTypeService";
import { useAdminData } from "../../context/AdminDataContext";

const initialForm = {
  nombre: "",
  descripcion: "",
  orden: 0,
  activo: true
};

const defaultEventTypes = [
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

function getId(item) {
  return item?._id || item?.id || "";
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

function uniqueText(values = []) {
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
  return uniqueText([
    ...normalizeArrayText(event?.tiposEvento),
    ...normalizeArrayText(event?.tipoEvento),
    ...normalizeArrayText(event?.tipo),
    ...normalizeArrayText(event?.eventType),
    ...normalizeArrayText(event?.eventTypes)
  ]);
}

function getEventTypeName(eventType) {
  return eventType?.nombre || eventType?.name || "Tipo de evento";
}

function normalizeEventType(eventType = {}) {
  const id = getId(eventType);

  return {
    ...eventType,
    id,
    _id: id,
    nombre: eventType.nombre || eventType.name || "Tipo de evento",
    descripcion: eventType.descripcion || "",
    orden: Number(eventType.orden || 0),
    activo: eventType.activo !== false
  };
}

function pickEventTypes(data) {
  if (Array.isArray(data?.eventTypes)) return data.eventTypes;
  if (Array.isArray(data?.tiposEvento)) return data.tiposEvento;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

function existsEventType(eventTypes = [], name = "") {
  return eventTypes.some(
    (eventType) => normalizeText(eventType.nombre) === normalizeText(name)
  );
}

function mergeEventTypes(currentEventTypes = [], nextEventTypes = []) {
  const merged = [...currentEventTypes];

  nextEventTypes.forEach((eventType) => {
    const normalizedEventType = normalizeEventType(eventType);
    const eventTypeId = getId(normalizedEventType);

    const existingIndex = merged.findIndex((item) => {
      const sameId = eventTypeId && getId(item) && getId(item) === eventTypeId;
      const sameName =
        normalizeText(item.nombre) === normalizeText(normalizedEventType.nombre);

      return sameId || sameName;
    });

    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...normalizedEventType
      };
    } else {
      merged.push(normalizedEventType);
    }
  });

  return merged;
}

function AdminEventTypesPage() {
  const { events } = useAdminData();

  const [eventTypes, setEventTypes] = useState([]);
  const [view, setView] = useState("list");
  const [editingEventType, setEditingEventType] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const eventTypesUsedInEvents = useMemo(() => {
    return uniqueText(
      (events || []).flatMap((event) => getEventTypesFromEvent(event))
    ).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const expectedEventTypes = useMemo(() => {
    return uniqueText([...defaultEventTypes, ...eventTypesUsedInEvents]).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [eventTypesUsedInEvents]);

  const missingEventTypes = useMemo(() => {
    return expectedEventTypes.filter(
      (typeName) => !existsEventType(eventTypes, typeName)
    );
  }, [expectedEventTypes, eventTypes]);

  const sortedEventTypes = useMemo(() => {
    return [...eventTypes].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;

      const orderA = Number(a.orden || 0);
      const orderB = Number(b.orden || 0);

      if (orderA !== orderB) return orderA - orderB;

      return getEventTypeName(a).localeCompare(getEventTypeName(b));
    });
  }, [eventTypes]);

  const activeCount = useMemo(() => {
    return eventTypes.filter((item) => item.activo !== false).length;
  }, [eventTypes]);

  const inactiveCount = useMemo(() => {
    return eventTypes.filter((item) => item.activo === false).length;
  }, [eventTypes]);

  const refreshEventTypes = async () => {
    setLoading(true);
    setMessage("");

    try {
      const data = await getEventTypes({
        activos: "false"
      });

      const list = pickEventTypes(data).map(normalizeEventType);

      setEventTypes(list);
    } catch (error) {
      setMessage(error.message || "No se pudieron cargar los tipos de evento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEventTypes();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingEventType(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingEventType(null);
    setForm(initialForm);
    setView("form");
  };

  const openEditForm = (eventType) => {
    setMessage("");
    setEditingEventType(eventType);

    setForm({
      nombre: eventType.nombre || "",
      descripcion: eventType.descripcion || "",
      orden: Number(eventType.orden || 0),
      activo: eventType.activo !== false
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
      setMessage("Escribe el nombre del tipo de evento.");
      return false;
    }

    const duplicatedEventType = eventTypes.find((eventType) => {
      const sameName =
        normalizeText(eventType.nombre) === normalizeText(form.nombre);

      const differentItem =
        !editingEventType || getId(eventType) !== getId(editingEventType);

      return sameName && differentItem;
    });

    if (duplicatedEventType) {
      setMessage("Ya existe un tipo de evento con ese nombre.");
      return false;
    }

    return true;
  };

  const replaceEventType = (eventType) => {
    if (!eventType) return;

    const normalizedEventType = normalizeEventType(eventType);

    setEventTypes((currentEventTypes) =>
      mergeEventTypes(currentEventTypes, [normalizedEventType])
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    setMessage(
      editingEventType
        ? "Guardando cambios del tipo de evento..."
        : "Creando tipo de evento..."
    );

    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        orden: Number(form.orden || 0),
        activo: Boolean(form.activo)
      };

      if (editingEventType) {
        const data = await updateEventType(getId(editingEventType), payload);

        replaceEventType(data.eventType || data.tipoEvento || data.data);

        setMessage("Tipo de evento actualizado correctamente.");
      } else {
        const data = await createEventType(payload);

        replaceEventType(data.eventType || data.tipoEvento || data.data);

        setMessage("Tipo de evento creado correctamente.");
      }

      resetForm();
      await refreshEventTypes();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el tipo de evento.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (eventType) => {
    const eventTypeId = getId(eventType);

    if (!eventTypeId) {
      setMessage("No se encontró el ID del tipo de evento.");
      return;
    }

    setSaving(true);

    setMessage(
      eventType.activo
        ? "Desactivando tipo de evento..."
        : "Activando tipo de evento..."
    );

    try {
      if (eventType.activo !== false) {
        const data = await deleteEventType(eventTypeId);

        replaceEventType(data.eventType || data.tipoEvento || data.data);

        setMessage("Tipo de evento desactivado correctamente.");
      } else {
        const data = await updateEventType(eventTypeId, {
          nombre: eventType.nombre,
          descripcion: eventType.descripcion || "",
          orden: Number(eventType.orden || 0),
          activo: true
        });

        replaceEventType(data.eventType || data.tipoEvento || data.data);

        setMessage("Tipo de evento activado correctamente.");
      }

      await refreshEventTypes();
    } catch (error) {
      setMessage(
        error.message || "No se pudo cambiar el estado del tipo de evento."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSyncMissingEventTypes = async () => {
    if (missingEventTypes.length === 0) {
      setMessage("Todos los tipos de evento ya están sincronizados.");
      return;
    }

    setSaving(true);
    setMessage("Sincronizando tipos usados en eventos...");

    const createdEventTypes = [];
    const failedEventTypes = [];

    try {
      for (const typeName of missingEventTypes) {
        try {
          const data = await createEventType({
            nombre: typeName,
            descripcion:
              "Tipo sincronizado automáticamente desde eventos o tipos sugeridos.",
            orden: eventTypes.length + createdEventTypes.length,
            activo: true
          });

          const createdEventType = normalizeEventType(
            data.eventType || data.tipoEvento || data.data || data
          );

          createdEventTypes.push(createdEventType);
        } catch (error) {
          const errorMessage = error.message || "";

          if (
            errorMessage.toLowerCase().includes("existe") ||
            errorMessage.toLowerCase().includes("duplicate") ||
            errorMessage.toLowerCase().includes("duplicado")
          ) {
            continue;
          }

          failedEventTypes.push(typeName);
        }
      }

      if (createdEventTypes.length > 0) {
        setEventTypes((currentEventTypes) =>
          mergeEventTypes(currentEventTypes, createdEventTypes)
        );
      }

      await refreshEventTypes();

      if (failedEventTypes.length > 0) {
        setMessage(
          `Se sincronizaron ${createdEventTypes.length} tipos. No se pudieron sincronizar: ${failedEventTypes.join(
            ", "
          )}.`
        );
      } else {
        setMessage(
          `Sincronización completada. Se crearon ${createdEventTypes.length} tipos faltantes sin borrar los existentes.`
        );
      }
    } catch (error) {
      setMessage(error.message || "No se pudo sincronizar los tipos faltantes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Tipos de evento</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de tipos de evento</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Administra los tipos que se usan al crear eventos. Esta pantalla
              también puede sincronizar los tipos que ya están escritos en
              eventos antiguos para guardarlos como registros globales.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <>
                <button
                  type="button"
                  onClick={handleSyncMissingEventTypes}
                  disabled={saving || loading || missingEventTypes.length === 0}
                  className="rounded-full bg-[#F7D9D8] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Tags size={18} />
                  )}
                  Sincronizar faltantes
                </button>

                <button
                  type="button"
                  onClick={refreshEventTypes}
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

      {view === "list" && missingEventTypes.length > 0 && (
        <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#D1B0C7]/30">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-black text-[#D1B0C7]">
                Tipos pendientes de sincronizar
              </p>

              <p className="mt-2 text-sm text-gray-600 leading-6">
                Estos tipos aparecen como sugeridos o ya están usados en
                eventos, pero todavía no existen como registros globales en
                Gestión de tipos de evento.
              </p>
            </div>

            <span className="rounded-full bg-[#F7D9D8] px-4 py-2 text-sm font-black">
              {missingEventTypes.length} pendiente
              {missingEventTypes.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {missingEventTypes.map((typeName) => (
              <span
                key={typeName}
                className="rounded-full bg-[#F8F6F7] px-4 py-2 text-sm font-black"
              >
                {typeName}
              </span>
            ))}
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
                {editingEventType ? "Editar tipo" : "Nuevo tipo"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingEventType
                  ? "Actualizar tipo de evento"
                  : "Registrar tipo de evento"}
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
              Nombre del tipo de evento

              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Café evento"
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
                placeholder="Describe para qué sirve este tipo de evento."
              />
            </label>

            <div className="rounded-3xl bg-[#F8F6F7] p-4 lg:col-span-2">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Tipo de evento activo

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
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
              <p className="text-sm font-black text-[#87CCC8]">Total</p>
              <p className="mt-2 text-3xl font-black">{eventTypes.length}</p>
            </div>

            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
              <p className="text-sm font-black text-[#87CCC8]">Activos</p>
              <p className="mt-2 text-3xl font-black">{activeCount}</p>
            </div>

            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
              <p className="text-sm font-black text-[#87CCC8]">Inactivos</p>
              <p className="mt-2 text-3xl font-black">{inactiveCount}</p>
            </div>

            <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#D1B0C7]/30">
              <p className="text-sm font-black text-[#D1B0C7]">Faltantes</p>
              <p className="mt-2 text-3xl font-black">
                {missingEventTypes.length}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />

              <p className="mt-4 font-black">Cargando tipos de evento...</p>
            </div>
          ) : sortedEventTypes.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <CalendarDays size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay tipos de evento
              </h3>

              <p className="mt-2 text-gray-600">
                Crea tipos como Preventa, Café evento, Pop up, Fantazit o Lebom.
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
                {sortedEventTypes.map((eventType) => (
                  <article
                    key={getId(eventType)}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_1.6fr_100px_120px_160px] md:items-center"
                  >
                    <div>
                      <p className="font-black">{eventType.nombre}</p>

                      <p className="mt-1 text-xs text-gray-500 md:hidden">
                        Orden: {eventType.orden || 0}
                      </p>
                    </div>

                    <p className="text-sm text-gray-600 leading-6">
                      {eventType.descripcion || "Sin descripción"}
                    </p>

                    <p className="hidden text-sm font-black md:block">
                      {eventType.orden || 0}
                    </p>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          eventType.activo
                            ? "bg-[#87CCC8]/20 text-[#2F2F2F]"
                            : "bg-[#F7D9D8] text-[#2F2F2F]"
                        }`}
                      >
                        {eventType.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="flex gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => openEditForm(eventType)}
                        className="rounded-full bg-[#87CCC8] px-4 py-2 text-sm font-black text-[#2F2F2F] flex items-center gap-2"
                      >
                        <Pencil size={15} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(eventType)}
                        disabled={saving}
                        className="h-10 w-10 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                        title={eventType.activo ? "Desactivar" : "Activar"}
                      >
                        <Power
                          size={16}
                          className={
                            eventType.activo
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

export default AdminEventTypesPage;