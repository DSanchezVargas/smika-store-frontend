import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Heart,
  Loader2,
  RefreshCw
} from "lucide-react";

import AutoCarousel from "../../components/common/AutoCarousel";
import { useAdminData } from "../../context/AdminDataContext";
import { useAuth } from "../../context/AuthContext";

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

function getEventImages(event) {
  const images = Array.isArray(event?.imagenes)
    ? event.imagenes.filter(Boolean)
    : [];

  if (event?.imagen && !images.includes(event.imagen)) {
    images.unshift(event.imagen);
  }

  if (Array.isArray(event?.images)) {
    event.images.forEach((image) => {
      if (image && !images.includes(image)) images.push(image);
    });
  }

  return images;
}

function formatDate(value) {
  if (!value) return "Fecha por confirmar";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getEventStatus(event) {
  const status = event?.estado || event?.status || "proximo";

  const labels = {
    proximo: "Evento próximo",
    activo: "Evento actual",
    actual: "Evento actual",
    finalizado: "Evento finalizado",
    cancelado: "Evento cancelado"
  };

  return labels[status] || "Evento próximo";
}

function isUpcomingEvent(event) {
  const status = event?.estado || event?.status || "proximo";

  return status === "proximo";
}

function EventSchedulePage() {
  const {
    events,
    loadingEvents,
    eventsLoadError,
    refreshEvents
  } = useAdminData();

  const { isAuthenticated, isStaff } = useAuth();

  const activeEvents = useMemo(() => {
    return [...(events || [])]
      .filter((event) => event.activo !== false)
      .sort((a, b) => {
        const dateA = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
        const dateB = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;

        if (dateA !== dateB) return dateA - dateB;

        return getEventTitle(a).localeCompare(getEventTitle(b));
      });
  }, [events]);

  return (
    <section className="container-smika py-12">
      <div className="rounded-[32px] bg-[#F8F6F7] p-8 mb-8">
        <p className="text-[#87CCC8] font-black">Programación Smika Store</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Eventos actuales y próximos</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Revisa los eventos disponibles, sus imágenes y los productos
              vinculados. Las imágenes se desplazan automáticamente cada 6
              segundos y también puedes moverlas con flechas.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshEvents}
            disabled={loadingEvents}
            className="rounded-full bg-white px-5 py-3 font-black flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={loadingEvents ? "animate-spin" : ""}
            />
            Recargar
          </button>
        </div>
      </div>

      {eventsLoadError && (
        <div className="mb-6 rounded-[24px] bg-red-50 px-5 py-4 text-sm font-black text-red-600">
          {eventsLoadError}
        </div>
      )}

      {loadingEvents ? (
        <div className="rounded-[32px] bg-white p-10 text-center smika-shadow">
          <Loader2 size={46} className="mx-auto animate-spin text-[#87CCC8]" />
          <p className="mt-4 font-black">Cargando eventos...</p>
        </div>
      ) : activeEvents.length === 0 ? (
        <div className="rounded-[32px] bg-white p-10 text-center smika-shadow">
          <CalendarDays size={46} className="mx-auto text-[#D1B0C7]" />
          <h3 className="mt-4 text-2xl font-black">
            Todavía no hay eventos publicados
          </h3>
          <p className="mt-2 text-gray-600">
            Cuando la administradora registre eventos, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {activeEvents.map((event) => {
            const title = getEventTitle(event);
            const slug = getEventSlug(event);
            const images = getEventImages(event);

            return (
              <article
                key={getId(event) || slug}
                className="smika-card smika-shadow overflow-hidden"
              >
                <AutoCarousel
                  images={images}
                  alt={title}
                  heightClassName="h-72"
                  className="rounded-none"
                />

                <div className="p-6">
                  <div className="flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full bg-[#F7D9D8] px-3 py-1">
                      {getEventStatus(event)}
                    </span>

                    <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1">
                      {event.pais || event.countryCode || "V"}
                    </span>

                    {event.destacado && (
                      <span className="rounded-full bg-white px-3 py-1">
                        Destacado
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-2xl font-black">{title}</h3>

                  <p className="mt-3 text-sm text-gray-600 leading-6 line-clamp-3">
                    {event.descripcion ||
                      event.description ||
                      "Evento registrado por Smika Store."}
                  </p>

                  <div className="mt-4 grid gap-2 text-sm text-gray-600">
                    <p>
                      <strong>Serie:</strong>{" "}
                      {event.serieNombre || event.series || "Sin serie fija"}
                    </p>

                    <p>
                      <strong>País/origen:</strong>{" "}
                      {event.origenNombre ||
                        event.country ||
                        event.countryCode ||
                        "Variado"}
                    </p>

                    <p>
                      <strong>Inicio:</strong>{" "}
                      {formatDate(event.fechaInicio || event.date)}
                    </p>

                    <p>
                      <strong>Imágenes:</strong> {images.length}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/programacion-eventos/${slug}`}
                      className="smika-button-primary"
                    >
                      Ver evento
                    </Link>

                    {isUpcomingEvent(event) && !isStaff && (
                      <>
                        {isAuthenticated ? (
                          <button
                            type="button"
                            className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center gap-2"
                          >
                            <Heart size={18} />
                            Guardar evento
                          </button>
                        ) : (
                          <Link
                            to={`/login?redirect=/programacion-eventos/${slug}`}
                            className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center gap-2"
                          >
                            <Bell size={18} />
                            Iniciar sesión para guardar
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default EventSchedulePage;