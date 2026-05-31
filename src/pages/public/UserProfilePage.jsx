import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarHeart,
  Heart,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  UserRound
} from "lucide-react";

import UserRegisteredEventsSection from "../../components/event/UserRegisteredEventsSection";
import { useAdminData } from "../../context/AdminDataContext";
import { useAuth } from "../../context/AuthContext";
import { getPublicProducts } from "../../utils/publicProducts";

const FAVORITES_KEY = "smika_favorites_v1";
const ORDER_LIST_KEY = "smika_order_list_v1";
const REGISTERED_EVENTS_KEY = "smika_registered_events_v1";
const EVENT_ALERTS_KEY = "smika_event_alerts_v1";

function readLocalArray(key) {
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getItemId(item = {}) {
  return item.id || item.productId || item._id || item.slug || item.nombre || "";
}

function getItemImage(item = {}) {
  const firstImage = Array.isArray(item.imagenes) ? item.imagenes[0] : null;

  if (typeof firstImage === "string") return firstImage;

  return (
    item.imagen ||
    item.image ||
    firstImage?.finalPreview ||
    firstImage?.url ||
    firstImage?.preview ||
    ""
  );
}

function getItemSlug(item = {}) {
  return item.slug || item.productId || item.id || item._id || "";
}

function getProductId(product = {}) {
  return product._id || product.id || product.productId || product.slug || "";
}

function normalizeText(text = "") {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] bg-[#F8F6F7] p-6 text-center">
      <p className="font-black text-[#2F2F2F]">{title}</p>
      <p className="mt-2 text-sm text-gray-600 leading-6">{description}</p>
    </div>
  );
}

function ProductMiniCard({ item, actionLabel = "Ver producto" }) {
  const slug = getItemSlug(item);
  const image = getItemImage(item);

  return (
    <article className="rounded-[24px] border border-[#87CCC8]/20 bg-white p-4 smika-shadow">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#F8F6F7]">
          {image ? (
            <img
              src={image}
              alt={item.nombre || "Producto"}
              className="h-full w-full object-contain p-2"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#87CCC8]/20 text-xs font-black">
              Smika
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 font-black text-[#2F2F2F]">
            {item.nombre || item.name || "Producto guardado"}
          </h4>

          <p className="mt-1 text-xs text-gray-500 line-clamp-1">
            {item.serie || item.tipo || item.evento || "Smika Store"}
          </p>

          <p className="mt-2 text-sm font-black">
            S/ {Number(item.precio || item.price || 0)}
          </p>

          {slug && (
            <Link
              to={`/productos/${slug}`}
              className="mt-3 inline-flex rounded-full bg-[#F7D9D8] px-4 py-2 text-xs font-black"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function UserProfilePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { products } = useAdminData();

  const [favorites, setFavorites] = useState([]);
  const [orderList, setOrderList] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [eventAlerts, setEventAlerts] = useState([]);

  const user = auth?.user || auth?.currentUser || null;
  const isAuthenticated = Boolean(auth?.isAuthenticated || user);

  const loadLocalData = () => {
    setFavorites(readLocalArray(FAVORITES_KEY));
    setOrderList(readLocalArray(ORDER_LIST_KEY));
    setRegisteredEvents(readLocalArray(REGISTERED_EVENTS_KEY));
    setEventAlerts(readLocalArray(EVENT_ALERTS_KEY));
  };

  useEffect(() => {
    if (!isAuthenticated && !auth?.loadingAuth) {
      navigate("/login?redirect=/mi-cuenta");
      return;
    }

    loadLocalData();

    const handleUpdate = () => loadLocalData();

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("smika:user-data-updated", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("smika:user-data-updated", handleUpdate);
    };
  }, [isAuthenticated, auth?.loadingAuth, navigate]);

  const recommendedProducts = useMemo(() => {
    const publicProducts = getPublicProducts(products || []);

    const favoriteIds = new Set(
      favorites.map((item) => normalizeText(getItemId(item))).filter(Boolean)
    );

    const favoriteSeries = new Set(
      favorites.map((item) => normalizeText(item.serie)).filter(Boolean)
    );

    const favoriteTypes = new Set(
      favorites.map((item) => normalizeText(item.tipo)).filter(Boolean)
    );

    const matches = publicProducts.filter((product) => {
      const productId = normalizeText(getProductId(product));
      const productSerie = normalizeText(product.serieNombre || product.serie || product.series);
      const productType = normalizeText(product.tipoProducto || product.tipo || product.type);

      if (favoriteIds.has(productId)) return false;

      return favoriteSeries.has(productSerie) || favoriteTypes.has(productType);
    });

    const fallback = publicProducts.filter((product) => {
      const productId = normalizeText(getProductId(product));
      return !favoriteIds.has(productId);
    });

    return (matches.length > 0 ? matches : fallback).slice(0, 6);
  }, [products, favorites]);

  if (auth?.loadingAuth) {
    return (
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8 text-center font-black">
          Cargando tu cuenta...
        </div>
      </section>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8">
          <p className="text-[#87CCC8] font-black">Mi cuenta</p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black">
                Perfil, pedidos y favoritos
              </h2>

              <p className="mt-3 text-gray-600 max-w-3xl leading-7">
                Hola {user?.alias || user?.nombre || "Smika fan"}. Aquí puedes ver tus pedidos,
                lista de deseos, eventos guardados, avisos y recomendaciones.
              </p>
            </div>

            <Link
              to="/mi-cuenta/configuracion"
              className="rounded-full bg-[#F7D9D8] px-5 py-3 text-sm font-black"
            >
              Editar perfil
            </Link>
          </div>
        </div>
      </section>

      <section className="container-smika pb-6">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="smika-card smika-shadow p-5">
            <ShoppingBag size={22} className="text-[#87CCC8]" />
            <p className="mt-2 text-2xl font-black">{orderList.length}</p>
            <p className="text-xs font-black text-gray-500">Pedidos / lista</p>
          </div>

          <div className="smika-card smika-shadow p-5">
            <Heart size={22} className="text-[#D1B0C7]" />
            <p className="mt-2 text-2xl font-black">{favorites.length}</p>
            <p className="text-xs font-black text-gray-500">Favoritos</p>
          </div>

          <div className="smika-card smika-shadow p-5">
            <Sparkles size={22} className="text-[#87CCC8]" />
            <p className="mt-2 text-2xl font-black">{recommendedProducts.length}</p>
            <p className="text-xs font-black text-gray-500">Recomendados</p>
          </div>

          <div className="smika-card smika-shadow p-5">
            <CalendarHeart size={22} className="text-[#D1B0C7]" />
            <p className="mt-2 text-2xl font-black">{registeredEvents.length}</p>
            <p className="text-xs font-black text-gray-500">Eventos</p>
          </div>

          <div className="smika-card smika-shadow p-5">
            <Bell size={22} className="text-[#87CCC8]" />
            <p className="mt-2 text-2xl font-black">{eventAlerts.length}</p>
            <p className="text-xs font-black text-gray-500">Avisos</p>
          </div>
        </div>
      </section>

      <section className="container-smika py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="smika-card smika-shadow p-6">
            <p className="text-[#87CCC8] font-black">Pedidos</p>
            <h3 className="mt-2 text-2xl font-black">Mis pedidos / lista</h3>
            <p className="mt-2 text-sm text-gray-600 leading-6">
              Aquí se muestran los productos que agregaste a tu lista de pedido.
            </p>

            <div className="mt-5 grid gap-4">
              {orderList.length > 0 ? (
                orderList.slice(0, 4).map((item) => (
                  <ProductMiniCard key={getItemId(item)} item={item} />
                ))
              ) : (
                <EmptyState
                  title="Aún no tienes productos en lista"
                  description="Agrega productos desde el catálogo para preparar tu pedido."
                />
              )}
            </div>

            <Link
              to="/lista-pedido"
              className="mt-5 inline-flex rounded-full bg-[#87CCC8] px-5 py-3 text-sm font-black text-white"
            >
              Ver lista de pedido
            </Link>
          </div>

          <div className="smika-card smika-shadow p-6">
            <p className="text-[#D1B0C7] font-black">Favoritos</p>
            <h3 className="mt-2 text-2xl font-black">Lista de deseos</h3>
            <p className="mt-2 text-sm text-gray-600 leading-6">
              Productos guardados por cliente, admin o subadmin cuando navegan la tienda.
            </p>

            <div className="mt-5 grid gap-4">
              {favorites.length > 0 ? (
                favorites.slice(0, 6).map((item) => (
                  <ProductMiniCard
                    key={`${getItemId(item)}-${item.savedAt || "fav"}`}
                    item={item}
                  />
                ))
              ) : (
                <EmptyState
                  title="Todavía no guardaste favoritos"
                  description="Presiona el corazón en un producto para verlo aquí."
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-smika py-8">
        <div className="smika-card smika-shadow p-6">
          <p className="text-[#87CCC8] font-black">Para ti</p>
          <h3 className="mt-2 text-2xl font-black">Recomendados</h3>
          <p className="mt-2 text-sm text-gray-600 leading-6">
            Sugerencias basadas en tus favoritos. Si aún no tienes favoritos, verás productos recientes.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedProducts.length > 0 ? (
              recommendedProducts.map((product) => (
                <ProductMiniCard
                  key={getProductId(product)}
                  item={{
                    ...product,
                    id: getProductId(product),
                    slug: product.slug || getProductId(product),
                    precio: product.precioReferencial || product.precio || product.price || 0,
                    tipo: product.tipoProducto || product.tipo || "Producto",
                    serie: product.serieNombre || product.serie || "",
                    imagenes: product.imagenes || []
                  }}
                />
              ))
            ) : (
              <div className="md:col-span-2 lg:col-span-3">
                <EmptyState
                  title="No hay recomendaciones todavía"
                  description="Cuando existan productos activos o favoritos, se mostrarán aquí."
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <UserRegisteredEventsSection title="Mis eventos registrados" />

      <section className="container-smika py-8">
        <div className="smika-card smika-shadow p-6">
          <div className="flex items-center gap-3">
            <UserRound className="text-[#87CCC8]" size={24} />
            <div>
              <p className="text-[#87CCC8] font-black">Soporte</p>
              <h3 className="text-2xl font-black">Incidencias de clientes</h3>
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-600 leading-6">
            Si encuentras una falla, algo que no carga o quieres enviar un comentario sobre la página, usa el botón flotante de ayuda.
          </p>
        </div>
      </section>
    </>
  );
}

export default UserProfilePage;
