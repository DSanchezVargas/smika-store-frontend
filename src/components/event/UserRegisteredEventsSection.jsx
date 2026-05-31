import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, ChevronRight, Heart } from "lucide-react";

import { useAdminData } from "../../context/AdminDataContext";
import { useAuth } from "../../context/AuthContext";

const EVENT_PREFERENCES_KEY = "smika_event_preferences_v1";

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

function getId(item) {
  return item?._id || item?.id || "";
}

function getEventTitle(event) {
  return event?.titulo || event?.nombre || event?.title || "Evento Smika";
}

function getEventSlug(event) {
  return event?.slug || createSlug(getEventTitle(event) || getId(event));
}

function getEventStatus(event) {
  return event?.estado || event?.status || "proximo";
}

function getEventStatusText(event) {
  const status = getEventStatus(event);

  const labels = {
    proximo: "Evento próximo",
    preventa: "Evento en preventa",
    activo: "Evento actual",
    actual: "Evento actual",
    finalizado: "Evento finalizado",
    cancelado: "Evento cancelado"
  };

  return labels[status] || "Evento próximo";
}

function formatDate(value) {
  if (!value) return "Programación pendiente";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Programación pendiente";

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function safeReadEventPreferences() {
  try {
    const rawValue = localStorage.getItem(EVENT_PREFERENCES_KEY);

    if (!rawValue) return {};

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") return {};

    return parsedValue;
  } catch {
    return {};
  }
}

function getUserPreferenceKey(user) {
  return user?.id || user?._id || user?.email || user?.correo || "cliente";
}

function getEventPreferenceId(event) {
  return getId(event) || getEventSlug(event);
}

function UserRegisteredEventsSection({ title = "Tus eventos registrados" }) {
  const { events } = useAdminData();
  const { isAuthenticated, isClient, isStaff, currentUser } = useAuth();

  const [preferences] = useState(() => safeReadEventPreferences());

  const registeredEvents = useMemo(() => {
    if (!isAuthenticated || !isClient || isStaff) return [];

    const userKey = getUserPreferenceKey(currentUser);
    const userPreferences = preferences?.[userKey] || {};

    return (events || []).filter((event) => {
      if (event.activo === false) return false;

      const eventId = getEventPreferenceId(event);
      const eventSlug = getEventSlug(event);

      const preference =
        userPreferences[eventId] ||
        userPreferences[eventSlug] ||
        userPreferences[getId(event)];

      return Boolean(preference?.saved || preference?.notifyBeforeEnd);
    });
  }, [events, preferences, isAuthenticated, isClient, isStaff, currentUser]);

  if (!isAuthenticated || !isClient || isStaff) {
    return null;
  }

  if (registeredEvents.length === 0) {
    return null;
  }

  return (
    <section className="container-smika py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[#87CCC8] font-black">Eventos</p>

          <h2 className="text-3xl font-black">{title}</h2>

          <p className="mt-2 text-gray-600">
            Eventos reales que guardaste para seguir su programación o recibir
            avisos.
          </p>
        </div>

        <Link
          to="/programacion-eventos"
          className="hidden sm:flex items-center gap-2 font-bold"
        >
          Ver programación
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {registeredEvents.map((event, index) => {
          const eventTitle = getEventTitle(event);
          const eventSlug = getEventSlug(event);
          const userKey = getUserPreferenceKey(currentUser);
          const eventPreferenceId = getEventPreferenceId(event);

          const preference =
            preferences?.[userKey]?.[eventPreferenceId] ||
            preferences?.[userKey]?.[eventSlug] ||
            {};

          return (
            <Link
              key={getId(event) || eventSlug}
              to={`/programacion-eventos/${eventSlug}`}
              className="smika-card smika-shadow overflow-hidden grid md:grid-cols-[220px_1fr] hover:-translate-y-1 transition"
            >
              <div
                className={`min-h-[210px] flex items-center justify-center text-3xl font-black text-center px-5 ${
                  index % 3 === 0
                    ? "bg-[#F7D9D8] text-[#2F2F2F]"
                    : index % 3 === 1
                    ? "bg-[#87CCC8] text-white"
                    : "bg-[#D1B0C7] text-white"
                }`}
              >
                {eventTitle}
              </div>

              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black">
                  <span className="flex items-center gap-2 text-[#D1B0C7]">
                    <CalendarDays size={18} />
                    {getEventStatusText(event)}
                  </span>

                  {preference.saved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F7D9D8] px-3 py-1 text-xs text-[#2F2F2F]">
                      <Heart size={14} />
                      Guardado
                    </span>
                  )}

                  {preference.notifyBeforeEnd && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs text-[#2F2F2F]">
                      <Bell size={14} />
                      Aviso activo
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-2xl font-black">{eventTitle}</h3>

                <p className="mt-2 text-sm font-bold text-gray-500">
                  {formatDate(event.fechaInicio || event.date)}
                </p>

                <p className="mt-3 line-clamp-3 text-gray-600 leading-6">
                  {event.descripcion ||
                    event.description ||
                    "Evento registrado desde el panel de administración."}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 font-black text-[#87CCC8]">
                  Ver detalle del evento
                  <ChevronRight size={18} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default UserRegisteredEventsSection;