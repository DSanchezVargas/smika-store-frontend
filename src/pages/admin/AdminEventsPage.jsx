import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Image,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save
} from "lucide-react";

import { useAdminData } from "../../context/AdminDataContext";

const initialForm = {
  titulo: "",
  descripcion: "",
  imagen: "",
  imagenesTexto: "",
  categoriaNombre: "Eventos",
  serie: "",
  origenNombre: "Variado",
  pais: "V",
  tipoEvento: "Otro",
  fechaInicio: "",
  fechaFin: "",
  estado: "proximo",
  destacado: false,
  activo: true,
  productos: []
};

function getId(item) {
  return item?._id || item?.id || "";
}

function formatDateForInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function formatDateForView(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getEstadoText(estado) {
  const labels = {
    proximo: "Próximo",
    activo: "Activo",
    finalizado: "Finalizado",
    cancelado: "Cancelado"
  };

  return labels[estado] || "Próximo";
}

function getEventStatus(event) {
  if (event.activo === false) return "Inactivo";
  if (event.destacado) return "Destacado";
  return getEstadoText(event.estado);
}

function AdminEventsPage() {
  const {
    events,
    series,
    products,
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
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedEvents = useMemo(() => {
    return [...(events || [])].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;

      const dateA = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
      const dateB = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;

      return dateB - dateA;
    });
  }, [events]);

  const activeSeries = useMemo(() => {
    return (series || []).filter((serie) => serie.activo !== false);
  }, [series]);

  const activeProducts = useMemo(() => {
    return (products || []).filter((product) => product.activo !== false);
  }, [products]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingEvent(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingEvent(null);
    setForm(initialForm);
    setView("form");
  };

  const openEditForm = (eventItem) => {
    setMessage("");
    setEditingEvent(eventItem);

    const productIds = Array.isArray(eventItem.productos)
      ? eventItem.productos
          .map((product) => {
            if (typeof product === "string") return product;
            return getId(product);
          })
          .filter(Boolean)
      : [];

    setForm({
      titulo: eventItem.titulo || eventItem.nombre || "",
      descripcion: eventItem.descripcion || "",
      imagen: eventItem.imagen || "",
      imagenesTexto: Array.isArray(eventItem.imagenes)
        ? eventItem.imagenes.join(", ")
        : "",
      categoriaNombre: eventItem.categoriaNombre || eventItem.categoria || "Eventos",
      serie: eventItem.serieNombre || eventItem.serie || "",
      origenNombre: eventItem.origenNombre || eventItem.origen || "Variado",
      pais: eventItem.pais || "V",
      tipoEvento: eventItem.tipoEvento || eventItem.tipo || "Otro",
      fechaInicio: formatDateForInput(eventItem.fechaInicio),
      fechaFin: formatDateForInput(eventItem.fechaFin),
      estado: eventItem.estado || "proximo",
      destacado: Boolean(eventItem.destacado),
      activo: eventItem.activo !== false,
      productos: productIds
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

  const handleToggleProduct = (productId) => {
    setForm((currentForm) => {
      const selectedProducts = currentForm.productos || [];

      const exists = selectedProducts.includes(productId);

      return {
        ...currentForm,
        productos: exists
          ? selectedProducts.filter((id) => id !== productId)
          : [...selectedProducts, productId]
      };
    });
  };

  const buildPayload = () => {
    const imagenes = form.imagenesTexto
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (form.imagen.trim() && !imagenes.includes(form.imagen.trim())) {
      imagenes.unshift(form.imagen.trim());
    }

    return {
      titulo: form.titulo.trim(),
      nombre: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      imagen: form.imagen.trim(),

      imagenes,

      categoriaNombre: form.categoriaNombre.trim() || "Eventos",

      serie: form.serie.trim(),
      serieNombre: form.serie.trim(),

      origenNombre: form.origenNombre.trim() || "Variado",
      pais: form.pais.trim() || "V",

      tipoEvento: form.tipoEvento.trim() || "Otro",

      fechaInicio: form.fechaInicio || null,
      fechaFin: form.fechaFin || null,

      estado: form.estado || "proximo",
      destacado: Boolean(form.destacado),
      activo: Boolean(form.activo),

      productos: Array.isArray(form.productos) ? form.productos : []
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.titulo.trim()) {
      setMessage("Escribe el título del evento.");
      return;
    }

    setSaving(true);
    setMessage(editingEvent ? "Actualizando evento..." : "Creando evento...");

    try {
      const payload = buildPayload();

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

  const handleToggleStatus = async (eventItem) => {
    const eventId = getId(eventItem);

    if (!eventId) {
      setMessage("No se encontró el ID del evento.");
      return;
    }

    setSaving(true);
    setMessage(eventItem.activo ? "Desactivando evento..." : "Activando evento...");

    try {
      await toggleEventStatus(eventId);
      await refreshEvents?.();

      setMessage(
        eventItem.activo
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
              Crea eventos como Lebom, Café o Fantazit, agrega descripción,
              imágenes y productos vinculados.
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

      {message && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message}
        </div>
      )}

      {eventsLoadError && (
        <div className="rounded-[24px] bg-red-50 px-5 py-4 text-sm font-black text-red-600">
          {eventsLoadError}
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
                {editingEvent
                  ? "Actualizar datos del evento"
                  : "Registrar nuevo evento"}
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
              Título del evento
              <input
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Lebom"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Categoría
              <input
                name="categoriaNombre"
                value={form.categoriaNombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Eventos"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Serie relacionada
              <input
                list="event-series-options"
                name="serie"
                value={form.serie}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Escribe o elige una serie"
              />
              <datalist id="event-series-options">
                {activeSeries.map((serie) => (
                  <option key={getId(serie)} value={serie.nombre} />
                ))}
              </datalist>
            </label>

            <label className="grid gap-2 text-sm font-black">
              País / origen visible
              <input
                name="origenNombre"
                value={form.origenNombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="China, Corea, Japón, Variado..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Código de país
              <select
                name="pais"
                value={form.pais}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                <option value="CN">China / CN</option>
                <option value="KR">Corea / KR</option>
                <option value="JP">Japón / JP</option>
                <option value="V">Variado / V</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Tipo de evento
              <input
                name="tipoEvento"
                value={form.tipoEvento}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Café, preventa, pop up, sorteo..."
              />
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
                <option value="proximo">Próximo</option>
                <option value="activo">Activo</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Imagen principal
              <input
                name="imagen"
                value={form.imagen}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="URL o ruta generada por el sistema"
              />
            </label>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Imágenes adicionales
              <input
                name="imagenesTexto"
                value={form.imagenesTexto}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Pega varias URLs separadas por coma"
              />
            </label>

            <div className="grid gap-3 rounded-3xl bg-[#F8F6F7] p-4">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Destacado
                <input
                  type="checkbox"
                  name="destacado"
                  checked={form.destacado}
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
                placeholder="Describe el evento..."
              />
            </label>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black">Productos vinculados</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Selecciona productos existentes que pertenezcan a este evento.
                  </p>
                </div>

                <Boxes size={22} className="text-[#87CCC8]" />
              </div>

              {activeProducts.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                  Todavía no hay productos activos para vincular.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {activeProducts.map((product) => {
                    const productId = getId(product);
                    const checked = form.productos.includes(productId);

                    return (
                      <label
                        key={productId}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black cursor-pointer ${
                          checked
                            ? "border-[#87CCC8] bg-white"
                            : "border-transparent bg-white/70"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleProduct(productId)}
                          className="h-4 w-4"
                        />

                        <span className="line-clamp-1">
                          {product.nombre}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
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
                Todavía no hay eventos registrados
              </h3>
              <p className="mt-2 text-gray-600">
                Crea un evento para mostrarlo en la programación y vincular productos.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {sortedEvents.map((eventItem) => (
                <article
                  key={getId(eventItem)}
                  className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
                >
                  <div className="h-44 bg-[#87CCC8] flex items-center justify-center text-white text-3xl font-black text-center px-5">
                    {eventItem.imagen ? (
                      <img
                        src={eventItem.imagen}
                        alt={eventItem.titulo || eventItem.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      eventItem.titulo || eventItem.nombre
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                        {getEventStatus(eventItem)}
                      </span>

                      {eventItem.pais && (
                        <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                          {eventItem.pais}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-2xl font-black">
                      {eventItem.titulo || eventItem.nombre}
                    </h3>

                    <div className="mt-3 grid gap-2 text-sm text-gray-600">
                      <p>
                        <strong>Tipo:</strong>{" "}
                        {eventItem.tipoEvento || eventItem.tipo || "Otro"}
                      </p>

                      <p>
                        <strong>Serie:</strong>{" "}
                        {eventItem.serieNombre || "Sin serie"}
                      </p>

                      <p>
                        <strong>País:</strong>{" "}
                        {eventItem.origenNombre || eventItem.pais || "Variado"}
                      </p>

                      <p>
                        <strong>Inicio:</strong>{" "}
                        {formatDateForView(eventItem.fechaInicio)}
                      </p>

                      <p>
                        <strong>Productos:</strong>{" "}
                        {eventItem.productos?.length || 0}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(eventItem)}
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
                        onClick={() => handleToggleStatus(eventItem)}
                        disabled={saving}
                        className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                        title={eventItem.activo ? "Desactivar" : "Activar"}
                      >
                        <Power
                          size={17}
                          className={
                            eventItem.activo ? "text-gray-500" : "text-red-500"
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

export default AdminEventsPage;