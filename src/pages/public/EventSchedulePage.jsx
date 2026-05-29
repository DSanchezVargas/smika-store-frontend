import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  SlidersHorizontal
} from "lucide-react";

import ProductCard from "../../components/product/ProductCard";
import { mockEvents } from "../../data/mockEvents";
import { mockProducts } from "../../data/mockProducts";
import { priceRangeConfig } from "../../data/catalogFilters";
import { useAuth } from "../../context/AuthContext";

function EventDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated, isStaff } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const [maxPrice, setMaxPrice] = useState(priceRangeConfig.max);
  const [selectedType, setSelectedType] = useState("");

  const event = mockEvents.find((item) => item.slug === slug);

  const eventProducts = useMemo(() => {
    return mockProducts.filter((product) => product.eventSlug === slug);
  }, [slug]);

  const productTypes = useMemo(() => {
    return [...new Set(eventProducts.map((product) => product.typeProduct))];
  }, [eventProducts]);

  const visibleProducts = eventProducts.filter((product) => {
    const matchesPrice = product.price <= maxPrice;
    const matchesType = selectedType ? product.typeProduct === selectedType : true;

    return matchesPrice && matchesType;
  });

  if (!event) {
    return (
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8">
          <h2 className="text-3xl font-black">Evento no encontrado</h2>

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

  const goPrevious = () => {
    setCurrentImage((current) => {
      if (current === 0) return event.images.length - 1;
      return current - 1;
    });
  };

  const goNext = () => {
    setCurrentImage((current) => {
      if (current === event.images.length - 1) return 0;
      return current + 1;
    });
  };

  return (
    <section className="container-smika py-12">
      <div className="rounded-[32px] bg-[#F8F6F7] p-8 mb-8">
        <p className="text-[#87CCC8] font-black">Evento Smika Store</p>

        <h2 className="text-4xl font-black mt-2">
          {event.title}
        </h2>

        <p className="mt-3 text-gray-600 max-w-3xl leading-7">
          {event.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-white px-4 py-2">
            {event.status === "actual" ? "Evento actual" : "Evento próximo"}
          </span>

          <span className="rounded-full bg-white px-4 py-2">
            Serie fija: {event.series}
          </span>

          <span className="rounded-full bg-white px-4 py-2">
            País/origen: {event.countryCode}
          </span>
        </div>
      </div>

      <div className="smika-card smika-shadow overflow-hidden mb-10">
        <div className="relative">
          <img
            src={event.images[currentImage]}
            alt={event.title}
            className="w-full h-[440px] object-cover"
          />

          <button
            onClick={goPrevious}
            className="absolute left-5 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/95 flex items-center justify-center smika-shadow"
          >
            <ChevronLeft size={26} />
          </button>

          <button
            onClick={goNext}
            className="absolute right-5 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/95 flex items-center justify-center smika-shadow"
          >
            <ChevronRight size={26} />
          </button>
        </div>

        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#D1B0C7] font-black">
              <CalendarDays size={18} />
              {event.date}
            </div>

            <h3 className="mt-2 text-2xl font-black">
              Productos vinculados al evento
            </h3>
          </div>

          {event.status === "proximo" && (
            <>
              {isAuthenticated ? (
                <button className="smika-button-primary flex items-center gap-2">
                  <Heart size={18} />
                  Guardar evento
                </button>
              ) : (
                <Link
                  to={`/login?redirect=/programacion-eventos/${event.slug}`}
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

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="smika-card p-5 h-fit">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-[#87CCC8]" />
            <h3 className="font-black text-lg">Filtros del evento</h3>
          </div>

          <div className="mt-6 grid gap-5">
            <div className="rounded-3xl bg-[#F7D9D8]/50 p-4">
              <p className="text-sm font-black">Serie fija del evento</p>

              <p className="mt-1 text-sm text-gray-600">
                {event.series}
              </p>

              <p className="mt-2 text-xs text-gray-500 leading-5">
                No se muestra filtro de serie porque este evento ya pertenece a
                una historia/serie definida.
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
              La administradora podrá enlazar productos ya registrados a este
              evento. Si el producto no existe, podrá crearlo desde el panel y
              asociarlo directamente al evento.
            </p>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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