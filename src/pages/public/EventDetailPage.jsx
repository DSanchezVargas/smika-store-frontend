import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bell,
  CalendarDays,
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
  if (Array.isArray(event?.seriesNombre) && event.seriesNombre.length > 0) {
    return event.seriesNombre;
  }

  if (event?.serieNombre) return [event.serieNombre];

  return [];
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
    product.price ||
      product.precio ||
      product.precioReferencial ||
      product.precioReferencialUnitario ||
      0
  );
}

function getProductType(product) {
  return (
    product.tipoProducto ||
    product.typeProduct ||
    product.tipo ||
    product.type ||
    "Producto"
  );
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
    product.eventoNombre ||
    product.event ||
    product.eventName ||
    "";

  const productEventSlug =
    product.eventSlug ||
    createSlug(productEventName || productEventId);

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

function isUpcomingEvent(event) {
  const status = event?.estado || event?.status || "proximo";
  return status === "proximo";
}

function getEventStatusText(event) {
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

function EventDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated, isStaff } = useAuth();
  const { events, products } = useAdminData();

  const [maxPrice, setMaxPrice] = useState(priceRangeConfig.max);
  const [selectedType, setSelectedType] = useState("");

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
    return [...new Set(eventProducts.map(getProductType).filter(Boolean))];
  }, [eventProducts]);

  const visibleProducts = useMemo(() => {
    return eventProducts.filter((product) => {
      const matchesPrice = getProductPrice(product) <= maxPrice;
      const matchesType = selectedType
        ? getProductType(product) === selectedType
        : true;

      return matchesPrice && matchesType;
    });
  }, [eventProducts, maxPrice, selectedType]);

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

  const eventTitle = getEventTitle(event);
  const eventSlug = getEventSlug(event);
  const coverImage = getEventCoverImage(event);
  const carouselImages = getEventCarouselImages(event);

  return (
    <section className="container-smika py-12">
      <div className="rounded-[32px] bg-[#F8F6F7] p-8 mb-8">
        <p className="text-[#87CCC8] font-black">Evento Smika Store</p>

        <h2 className="text-4xl font-black mt-2">{eventTitle}</h2>

        <p className="mt-3 text-gray-600 max-w-3xl leading-7">
          {event.descripcion ||
            event.description ||
            "Evento registrado por Smika Store."}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-white px-4 py-2">
            {getEventStatusText(event)}
          </span>

          <span className="rounded-full bg-white px-4 py-2">
            Tipo: {event.tipoEvento || "Otro"}
          </span>

          <span className="rounded-full bg-white px-4 py-2">
            Series: {getEventSeriesText(event)}
          </span>

          <span className="rounded-full bg-white px-4 py-2">
            País/origen: {event.origenNombre || event.pais || "Variado"}
          </span>
        </div>
      </div>

      <div className="smika-card smika-shadow overflow-hidden mb-10">
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

        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#D1B0C7] font-black">
              <CalendarDays size={18} />
              {formatDate(event.fechaInicio || event.date)}
            </div>

            <h3 className="mt-2 text-2xl font-black">
              Productos vinculados al evento
            </h3>
          </div>

          <div className="flex flex-wrap gap-3">
            {isStaff && (
              <Link
                to="/admin/eventos"
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center gap-2"
              >
                <Settings size={18} />
                Gestionar evento
              </Link>
            )}

            {isUpcomingEvent(event) && !isStaff && (
              <>
                {isAuthenticated ? (
                  <button className="smika-button-primary flex items-center gap-2">
                    <Heart size={18} />
                    Guardar evento
                  </button>
                ) : (
                  <Link
                    to={`/login?redirect=/programacion-eventos/${eventSlug}`}
                    className="smika-button-primary flex items-center gap-2"
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
          </div>
        </aside>

        <div>
          <div className="mb-6 rounded-3xl bg-[#F8F6F7] p-5">
            <h3 className="font-black">Productos del evento</h3>

            <p className="mt-2 text-sm text-gray-600 leading-6">
              Aquí aparecen los productos vinculados desde el panel de
              administración o los productos que tienen este evento asignado.
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