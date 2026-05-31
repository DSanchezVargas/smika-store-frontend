import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  Image as ImageIcon,
  Settings,
  SlidersHorizontal
} from "lucide-react";

import AutoCarousel from "../../components/common/AutoCarousel";
import ProductCard from "../../components/product/ProductCard";
import { useAdminData } from "../../context/AdminDataContext";
import { useAuth } from "../../context/AuthContext";
import { priceRangeConfig } from "../../data/catalogFilters";

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

function normalizeText(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getId(item) {
  return item?._id || item?.id || "";
}

function getImageSource(image) {
  if (!image) return "";

  if (typeof image === "string") return image;

  if (typeof image === "object") {
    return (
      image.finalPreview ||
      image.url ||
      image.preview ||
      image.src ||
      image.imagen ||
      ""
    );
  }

  return "";
}

function getEventTitle(event) {
  return event?.titulo || event?.nombre || event?.title || "Evento Smika";
}

function getEventSlug(event) {
  return event?.slug || createSlug(getEventTitle(event) || getId(event));
}

function getEventCoverImage(event) {
  return getImageSource(event?.imagen);
}

function getEventCarouselImages(event) {
  const coverImage = getEventCoverImage(event);

  const images = Array.isArray(event?.imagenes)
    ? event.imagenes.map(getImageSource).filter(Boolean)
    : [];

  return images.filter((image) => image !== coverImage);
}

function getEventSeries(event) {
  const seriesFromArray = Array.isArray(event?.seriesNombre)
    ? event.seriesNombre.filter(Boolean)
    : [];

  const seriesFromObjects = Array.isArray(event?.series)
    ? event.series
        .map((serie) => {
          if (typeof serie === "string") return "";
          return serie?.nombre || serie?.titulo || serie?.name || "";
        })
        .filter(Boolean)
    : [];

  const legacySerie = event?.serieNombre ? [event.serieNombre] : [];

  const uniqueSeries = [
    ...new Set([...seriesFromArray, ...seriesFromObjects, ...legacySerie])
  ];

  return uniqueSeries.filter(Boolean);
}

function getEventSeriesText(event) {
  const series = getEventSeries(event);

  return series.length > 0 ? series.join(", ") : "Sin serie fija";
}

function getProductId(product) {
  if (typeof product === "string") return product;
  return product?._id || product?.id || "";
}

function getProductPrice(product) {
  return Number(
    product?.price ||
      product?.precio ||
      product?.precioReferencial ||
      product?.precioReferencialUnitario ||
      0
  );
}

function normalizeArrayText(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeArrayText(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return [
      value.nombre ||
        value.titulo ||
        value.name ||
        value.tipoProducto ||
        value.tipo ||
        ""
    ].filter(Boolean);
  }

  if (!value) return [];

  return value
    .toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getProductTypes(product) {
  const types = [
    ...normalizeArrayText(product?.tiposProducto),
    ...normalizeArrayText(product?.tipoProducto),
    ...normalizeArrayText(product?.typeProduct),
    ...normalizeArrayText(product?.tipo),
    ...normalizeArrayText(product?.type)
  ];

  const uniqueTypes = [...new Set(types)];

  return uniqueTypes.length > 0 ? uniqueTypes : ["Producto"];
}

function getProductTypeText(product) {
  return getProductTypes(product).join(", ");
}

function getProductCharacters(product) {
  const characters = [
    ...normalizeArrayText(product?.personajesNombre),
    ...normalizeArrayText(product?.personajeNombre),
    ...normalizeArrayText(product?.personaje),
    ...normalizeArrayText(product?.personajes)
  ];

  return [...new Set(characters)].filter(Boolean);
}

function productBelongsToEvent(product, event) {
  const eventId = getId(event);
  const eventSlug = getEventSlug(event);
  const eventTitle = getEventTitle(event);

  const productEventId =
    typeof product.evento === "object"
      ? getId(product.evento)
      : product.evento || "";

  const productEventName =
    product.eventoNombre || product.event || product.eventName || "";

  const productEventSlug =
    product.eventSlug || createSlug(productEventName || productEventId);

  if (eventId && productEventId === eventId) return true;
  if (eventSlug && productEventSlug === eventSlug) return true;

  return normalizeText(productEventName) === normalizeText(eventTitle);
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
  return event?.estado || event?.status || "proximo";
}

function isUpcomingEvent(event) {
  const status = getEventStatus(event);

  return status === "proximo";
}

function isActiveEvent(event) {
  const status = getEventStatus(event);

  return status === "activo" || status === "actual";
}

function canSaveOrNotifyEvent(event) {
  return isUpcomingEvent(event) || isActiveEvent(event);
}

function getEventStatusText(event) {
  const status = getEventStatus(event);

  const labels = {
    proximo: "Evento próximo",
    activo: "Evento actual",
    actual: "Evento actual",
    preventa: "Evento en preventa",
    finalizado: "Evento finalizado",
    cancelado: "Evento cancelado"
  };

  return labels[status] || "Evento próximo";
}

function getEventEndDate(event) {
  const value = event?.fechaFin || event?.endDate || event?.fechaCierre;

  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getDaysUntilEventEnds(event) {
  const endDate = getEventEndDate(event);

  if (!endDate) return null;

  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

function isEventEndingSoon(event) {
  const days = getDaysUntilEventEnds(event);

  if (days === null) return false;

  return days >= 0 && days <= 3;
}

function getEventEndingMessage(event) {
  const days = getDaysUntilEventEnds(event);

  if (days === null) {
    return "Este evento tiene fecha de cierre por confirmar.";
  }

  if (days <= 0) {
    return "Este evento termina hoy. Revisa los productos disponibles antes de que cierre.";
  }

  if (days === 1) {
    return "Este evento termina mañana. Revisa los productos disponibles antes de que cierre.";
  }

  return `Este evento termina en ${days} días. Revisa los productos disponibles antes de que cierre.`;
}

function safeReadEventPreferences() {
  try {
    const value = localStorage.getItem(EVENT_PREFERENCES_KEY);

    if (!value) return {};

    const parsed = JSON.parse(value);

    if (!parsed || typeof parsed !== "object") return {};

    return parsed;
  } catch {
    return {};
  }
}

function safeWriteEventPreferences(preferences) {
  try {
    localStorage.setItem(EVENT_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Se ignora para no romper la página pública si el navegador bloquea storage.
  }
}

function getUserPreferenceKey(user) {
  return user?.id || user?._id || user?.email || user?.correo || "cliente";
}

function getEventPreferenceId(event) {
  return getId(event) || getEventSlug(event);
}

function EventDetailPage() {
  const { slug } = useParams();

  const { isAuthenticated, isStaff, isClient, currentUser } = useAuth();
  const { events, products } = useAdminData();

  const [maxPrice, setMaxPrice] = useState(priceRangeConfig.max);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [eventPreferences, setEventPreferences] = useState(() =>
    safeReadEventPreferences()
  );

  const event = useMemo(() => {
    return (events || []).find((item) => {
      const itemSlug = getEventSlug(item);
      const itemId = getId(item);

      return itemSlug === slug || itemId === slug;
    });
  }, [events, slug]);

  const eventProducts = useMemo(() => {
    if (!event) return [];

    const linkedProductIds = Array.isArray(event.productos)
      ? event.productos.map(getProductId).filter(Boolean)
      : [];

    return (products || []).filter((product) => {
      const productId = getProductId(product);

      if (linkedProductIds.includes(productId)) return true;

      return productBelongsToEvent(product, event);
    });
  }, [products, event]);

  const productTypes = useMemo(() => {
    const types = eventProducts.flatMap(getProductTypes).filter(Boolean);

    return [...new Set(types)].sort((a, b) => a.localeCompare(b));
  }, [eventProducts]);

  const productCharacters = useMemo(() => {
    const characters = eventProducts.flatMap(getProductCharacters).filter(Boolean);

    return [...new Set(characters)].sort((a, b) => a.localeCompare(b));
  }, [eventProducts]);

  const visibleProducts = useMemo(() => {
    return eventProducts.filter((product) => {
      const matchesPrice = getProductPrice(product) <= maxPrice;

      const matchesType = selectedType
        ? getProductTypes(product).some(
            (type) => normalizeText(type) === normalizeText(selectedType)
          )
        : true;

      const matchesCharacter = selectedCharacter
        ? getProductCharacters(product).some(
            (character) =>
              normalizeText(character) === normalizeText(selectedCharacter)
          )
        : true;

      return matchesPrice && matchesType && matchesCharacter;
    });
  }, [eventProducts, maxPrice, selectedType, selectedCharacter]);

  const eventTitle = event ? getEventTitle(event) : "";
  const eventSlug = event ? getEventSlug(event) : "";
  const eventPreferenceId = event ? getEventPreferenceId(event) : "";
  const userPreferenceKey = getUserPreferenceKey(currentUser);

  const currentEventPreference =
    eventPreferences?.[userPreferenceKey]?.[eventPreferenceId] || {};

  const eventIsSaved = Boolean(currentEventPreference.saved);
  const eventReminderEnabled = Boolean(currentEventPreference.notifyBeforeEnd);

  const canUseClientActions =
    Boolean(isAuthenticated && isClient && !isStaff && event) &&
    canSaveOrNotifyEvent(event);

  const updateCurrentEventPreference = (nextPreference) => {
    if (!event) return;

    const currentPreferences = safeReadEventPreferences();

    const nextPreferences = {
      ...currentPreferences,
      [userPreferenceKey]: {
        ...(currentPreferences[userPreferenceKey] || {}),
        [eventPreferenceId]: {
          ...(currentPreferences[userPreferenceKey]?.[eventPreferenceId] || {}),
          ...nextPreference,
          eventId: eventPreferenceId,
          title: eventTitle,
          slug: eventSlug,
          fechaFin: event.fechaFin || "",
          updatedAt: new Date().toISOString()
        }
      }
    };

    safeWriteEventPreferences(nextPreferences);
    setEventPreferences(nextPreferences);
  };

  const handleSaveEvent = () => {
    updateCurrentEventPreference({
      saved: true
    });

    setFeedbackMessage("Evento guardado en tu lista.");
    setActionsOpen(false);
  };

  const handleRemoveSavedEvent = () => {
    updateCurrentEventPreference({
      saved: false,
      notifyBeforeEnd: false
    });

    setFeedbackMessage("Evento quitado de tus guardados.");
    setActionsOpen(false);
  };

  const handleEnableReminder = async () => {
    updateCurrentEventPreference({
      saved: true,
      notifyBeforeEnd: true
    });

    setFeedbackMessage(
      "Aviso activado. Te mostraremos una alerta cuando el evento esté por terminar."
    );

    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // Se mantiene el aviso interno aunque el permiso del navegador falle.
      }
    }

    setActionsOpen(false);
  };

  const handleDisableReminder = () => {
    updateCurrentEventPreference({
      notifyBeforeEnd: false
    });

    setFeedbackMessage("Aviso del evento desactivado.");
    setActionsOpen(false);
  };

  useEffect(() => {
    if (!event || !eventReminderEnabled || !isEventEndingSoon(event)) return;

    const message = getEventEndingMessage(event);

    setFeedbackMessage(message);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Smika Store 💖", {
        body: message
      });
    }
  }, [event, eventReminderEnabled]);

  if (!event) {
    return (
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8">
          <h2 className="text-3xl font-black">Evento no encontrado</h2>

          <p className="mt-3 text-gray-600">
            Es posible que el evento esté inactivo o que todavía no se haya
            cargado desde el panel.
          </p>

          <Link
            to="/programacion-eventos"
            className="smika-button-primary inline-block mt-5"
          >
            Volver a programación
          </Link>
        </div>
      </section>
    );
  }

  const coverImage = getEventCoverImage(event);
  const carouselImages = getEventCarouselImages(event);

  return (
    <section className="container-smika py-12">
      <div className="rounded-[32px] bg-[#F8F6F7] p-8 mb-8">
        <p className="text-[#87CCC8] font-black">Evento Smika Store</p>

        <h2 className="text-4xl font-black mt-2">{eventTitle}</h2>
      </div>

      <div className="smika-card smika-shadow overflow-hidden mb-8">
        <div className="h-[440px] bg-[#F8F6F7]">
          {coverImage ? (
            <img
              src={coverImage}
              alt={`${eventTitle} portada`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <ImageIcon size={52} />
            </div>
          )}
        </div>

        {carouselImages.length > 0 && (
          <div className="border-t border-[#87CCC8]/20 p-5">
            <p className="mb-3 font-black">Galería del evento</p>

            <AutoCarousel
              images={carouselImages}
              alt={`${eventTitle} carrusel`}
              heightClassName="h-72"
              fit="contain"
            />
          </div>
        )}
      </div>

      <div className="rounded-[32px] bg-[#F8F6F7] p-8 mb-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-2 text-[#D1B0C7] font-black">
              <CalendarDays size={18} />
              {formatDate(event.fechaInicio || event.date)}
            </div>

            <p className="mt-4 text-gray-700 max-w-4xl leading-7">
              {event.descripcion ||
                event.description ||
                "Evento registrado por Smika Store."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-full bg-white px-4 py-2">
                {getEventStatusText(event)}
              </span>

              <span className="rounded-full bg-white px-4 py-2">
                Tipo: {event.tipoEvento || event.tipo || "Otro"}
              </span>

              <span className="rounded-full bg-white px-4 py-2">
                Series: {getEventSeriesText(event)}
              </span>

              <span className="rounded-full bg-white px-4 py-2">
                País/origen: {event.origenNombre || event.pais || "Variado"}
              </span>

              {event.fechaFin && (
                <span className="rounded-full bg-white px-4 py-2">
                  Cierre: {formatDate(event.fechaFin)}
                </span>
              )}
            </div>

            {isEventEndingSoon(event) && (
              <div className="mt-5 rounded-3xl bg-white px-5 py-4 text-sm font-black text-[#2F2F2F]">
                {getEventEndingMessage(event)}
              </div>
            )}

            {feedbackMessage && (
              <div className="mt-5 rounded-3xl bg-[#F7D9D8] px-5 py-4 text-sm font-black">
                {feedbackMessage}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 min-w-[230px]">
            {isStaff && (
              <Link
                to="/admin/eventos"
                className="rounded-full bg-white px-5 py-3 font-black flex items-center justify-center gap-2"
              >
                <Settings size={18} />
                Gestionar evento
              </Link>
            )}

            {!isStaff && canSaveOrNotifyEvent(event) && (
              <>
                {isAuthenticated && isClient ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActionsOpen((current) => !current)}
                      className="smika-button-primary w-full flex items-center justify-center gap-2"
                    >
                      {eventReminderEnabled ? (
                        <Bell size={18} />
                      ) : (
                        <Heart size={18} />
                      )}

                      {eventReminderEnabled
                        ? "Aviso activado"
                        : eventIsSaved
                        ? "Evento guardado"
                        : "Guardar / avisarme"}

                      <ChevronDown
                        size={17}
                        className={`transition ${
                          actionsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {actionsOpen && (
                      <div className="absolute right-0 top-[58px] z-40 w-full rounded-3xl border border-[#87CCC8]/20 bg-white p-3 smika-shadow">
                        <button
                          type="button"
                          onClick={handleSaveEvent}
                          className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-black hover:bg-[#F8F6F7]"
                        >
                          <Heart size={17} />
                          Guardar evento

                          {eventIsSaved && (
                            <Check size={17} className="ml-auto text-[#87CCC8]" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleEnableReminder}
                          className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-black hover:bg-[#F8F6F7]"
                        >
                          <Bell size={17} />
                          Avisarme antes de terminar

                          {eventReminderEnabled && (
                            <Check size={17} className="ml-auto text-[#87CCC8]" />
                          )}
                        </button>

                        {eventReminderEnabled && (
                          <button
                            type="button"
                            onClick={handleDisableReminder}
                            className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-black hover:bg-[#F8F6F7]"
                          >
                            Quitar aviso
                          </button>
                        )}

                        {eventIsSaved && (
                          <button
                            type="button"
                            onClick={handleRemoveSavedEvent}
                            className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-black text-red-500 hover:bg-[#F8F6F7]"
                          >
                            Quitar guardado
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={`/login?redirect=/programacion-eventos/${eventSlug}`}
                    className="smika-button-primary flex items-center justify-center gap-2"
                  >
                    <Bell size={18} />
                    Iniciar sesión para guardar
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-[32px] bg-white p-6 smika-shadow border border-[#87CCC8]/20">
        <h3 className="text-2xl font-black">Productos vinculados al evento</h3>

        <p className="mt-2 text-sm text-gray-600 leading-6">
          Aquí aparecen los productos vinculados desde el panel de administración
          o los productos que tienen este evento asignado.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="smika-card p-5 h-fit">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-[#87CCC8]" />

            <h3 className="font-black text-lg">Filtros del evento</h3>
          </div>

          <div className="mt-6 grid gap-5">
            <div className="rounded-3xl bg-[#F7D9D8]/50 p-4">
              <p className="text-sm font-black">Series relacionadas</p>

              <p className="mt-1 text-sm text-gray-600">
                {getEventSeriesText(event)}
              </p>

              <p className="mt-2 text-xs text-gray-500 leading-5">
                No se muestra filtro de serie porque este evento ya tiene sus
                series relacionadas definidas.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Precio</span>

                <span className="text-sm font-black text-[#87CCC8]">
                  S/ {priceRangeConfig.min} - S/ {maxPrice}
                </span>
              </div>

              <div className="rounded-3xl border border-[#87CCC8]/25 bg-white p-4">
                <input
                  type="range"
                  min={priceRangeConfig.min}
                  max={priceRangeConfig.max}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="w-full accent-[#87CCC8]"
                />

                <div className="mt-2 flex justify-between text-xs font-bold text-gray-500">
                  <span>S/ {priceRangeConfig.min}</span>
                  <span>S/ {priceRangeConfig.max}</span>
                </div>
              </div>
            </div>

            <label className="grid gap-2 text-sm font-bold">
              Tipo de producto

              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8]"
              >
                <option value="">Todos</option>

                {productTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Personaje

              <select
                value={selectedCharacter}
                onChange={(event) => setSelectedCharacter(event.target.value)}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8]"
              >
                <option value="">Todos</option>

                {productCharacters.map((character) => (
                  <option key={character} value={character}>
                    {character}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setMaxPrice(priceRangeConfig.max);
                setSelectedType("");
                setSelectedCharacter("");
              }}
              className="rounded-full bg-[#F7D9D8] px-5 py-3 text-sm font-black"
            >
              Limpiar filtros
            </button>
          </div>
        </aside>

        <div>
          <div className="mb-6 rounded-3xl bg-[#F8F6F7] p-5">
            <h3 className="font-black">Productos del evento</h3>

            <p className="mt-2 text-sm text-gray-600 leading-6">
              Mostrando {visibleProducts.length} de {eventProducts.length}{" "}
              productos vinculados.
            </p>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={getProductId(product)} product={product} />
              ))}
            </div>
          ) : (
            <div className="smika-card p-8 text-center text-gray-500">
              No hay productos que coincidan con los filtros seleccionados.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default EventDetailPage;