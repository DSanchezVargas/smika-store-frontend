import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Loader2,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Trash2
} from "lucide-react";

import UserRegisteredEventsSection from "../../components/event/UserRegisteredEventsSection";
import CroppedImagePreview from "../../components/admin/CroppedImagePreview";
import { useAdminData } from "../../context/AdminDataContext";
import { useAuth } from "../../context/AuthContext";
import { getPublicProducts } from "../../utils/publicProducts";
import {
  getMyPreferences,
  isProductFavorite,
  isProductInWishlist,
  PREFERENCE_EVENT_NAME,
  readCachedPreferences,
  toggleFavoriteProduct,
  toggleWishlistProduct
} from "../../services/preferenceService";

const ORDER_LIST_KEY = "smika_order_list_v1";

function readLocalArray(key) {
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // No rompemos la página si localStorage está bloqueado.
  }
}

function isMongoObjectId(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

function getId(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item._id || item.id || item.productId || "";
}

function getImageSource(image) {
  if (!image) return "";
  if (typeof image === "string") return image;

  return (
    image.finalPreview ||
    image.url ||
    image.preview ||
    image.src ||
    image.imagen ||
    ""
  );
}

function getProductImage(product) {
  const firstImage = product?.imagenes?.[0];

  return product?.imagen || product?.image || getImageSource(firstImage) || "";
}

function getProductPrice(product) {
  return Number(product?.precioReferencial || product?.precio || product?.price || 0);
}

function normalizeText(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getProductSeries(product) {
  if (typeof product?.serie === "object" && product.serie !== null) {
    return product.serie.nombre || "";
  }

  return product?.serieNombre || product?.serie || product?.series || "";
}

function getProductType(product) {
  if (Array.isArray(product?.tiposProducto) && product.tiposProducto.length > 0) {
    return product.tiposProducto.join(", ");
  }

  return product?.tipoProducto || product?.tipo || product?.type || "Producto";
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] bg-white p-6 text-center smika-shadow border border-[#87CCC8]/15">
      <p className="text-lg font-black text-[#2F2F2F]">{title}</p>
      <p className="mt-2 text-sm text-gray-600 leading-6">{description}</p>
    </div>
  );
}

function MiniProductCard({ product, badge, action, actionLabel, actionLoading }) {
  const productId = getId(product);
  const slug = product?.slug || productId;
  const image = getProductImage(product);

  return (
    <article className="rounded-[28px] bg-white p-4 smika-shadow border border-[#87CCC8]/15">
      <Link to={`/productos/${slug}`} className="block">
        <div className="aspect-square overflow-hidden rounded-3xl bg-[#F8F6F7]">
          {image ? (
            <CroppedImagePreview
              image={image}
              alt={product?.nombre || "Producto"}
              className="h-full w-full"
              rounded="rounded-3xl"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#87CCC8] text-white font-black">
              Smika
            </div>
          )}
        </div>
      </Link>

      <div className="mt-4">
        {badge && (
          <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
            {badge}
          </span>
        )}

        <Link to={`/productos/${slug}`}>
          <h3 className="mt-3 line-clamp-2 text-base font-black hover:text-[#87CCC8]">
            {product?.nombre || "Producto Smika"}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-gray-500">
          {getProductSeries(product) || getProductType(product)}
        </p>

        <p className="mt-2 text-lg font-black">S/ {getProductPrice(product)}</p>

        {action && (
          <button
            type="button"
            onClick={() => action(product)}
            disabled={actionLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#F8F6F7] px-4 py-2 text-xs font-black disabled:opacity-60"
          >
            {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {actionLabel}
          </button>
        )}
      </div>
    </article>
  );
}

function OrderListCard({ item, onRemove }) {
  const slug = item?.slug || item?.id || item?.productId || "";
  const image = getProductImage(item);

  return (
    <article className="rounded-[28px] bg-white p-4 smika-shadow border border-[#87CCC8]/15">
      <Link to={`/productos/${slug}`}>
        <div className="aspect-square overflow-hidden rounded-3xl bg-[#F8F6F7]">
          {image ? (
            <CroppedImagePreview
              image={image}
              alt={item?.nombre || "Producto"}
              className="h-full w-full"
              rounded="rounded-3xl"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#87CCC8] text-white font-black">
              Smika
            </div>
          )}
        </div>
      </Link>

      <h3 className="mt-4 line-clamp-2 text-base font-black">
        {item?.nombre || "Producto Smika"}
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        Cantidad: {item?.cantidad || 1}
      </p>

      <p className="mt-2 text-lg font-black">S/ {Number(item?.precio || 0)}</p>

      <button
        type="button"
        onClick={() => onRemove(item)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#F8F6F7] px-4 py-2 text-xs font-black"
      >
        <Trash2 size={15} />
        Quitar
      </button>
    </article>
  );
}

function UserProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { products } = useAdminData();

  const [preferences, setPreferences] = useState(() => readCachedPreferences());
  const [orderList, setOrderList] = useState(() => readLocalArray(ORDER_LIST_KEY));
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  const user = auth?.user || auth?.currentUser || null;
  const isAuthenticated = Boolean(auth?.isAuthenticated || user);

  const favoriteProducts = preferences?.productosFavoritos || [];
  const wishlistProducts = preferences?.listaDeseos || [];
  const favoriteSeries = preferences?.seriesFavoritas || [];

  const publicProducts = useMemo(() => {
    return getPublicProducts(products || []);
  }, [products]);

  const recommendedProducts = useMemo(() => {
    const savedIds = new Set(
      [...favoriteProducts, ...wishlistProducts]
        .map((product) => getId(product) || product?.slug)
        .filter(Boolean)
    );

    const savedSeries = new Set(
      [...favoriteProducts, ...wishlistProducts, ...favoriteSeries]
        .map((item) => normalizeText(getProductSeries(item) || item?.nombre || item?.serieNombre))
        .filter(Boolean)
    );

    const savedTypes = new Set(
      [...favoriteProducts, ...wishlistProducts]
        .map((item) => normalizeText(getProductType(item)))
        .filter(Boolean)
    );

    return publicProducts
      .filter((product) => {
        const id = getId(product) || product.slug;
        if (savedIds.has(id)) return false;

        const sameSeries = savedSeries.has(normalizeText(getProductSeries(product)));
        const sameType = savedTypes.has(normalizeText(getProductType(product)));

        return sameSeries || sameType || product.esDestacado || product.isFeatured;
      })
      .slice(0, 8);
  }, [publicProducts, favoriteProducts, wishlistProducts, favoriteSeries]);

  const goToLogin = () => {
    navigate(
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`
    );
  };

  const refreshPreferences = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setMessage("");

      const freshPreferences = await getMyPreferences();
      setPreferences(freshPreferences);
    } catch (error) {
      if (error.status === 401 || error.message?.toLowerCase().includes("token")) {
        goToLogin();
        return;
      }

      setMessage(error.message || "No se pudieron cargar tus favoritos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    refreshPreferences();
  }, [isAuthenticated]);

  useEffect(() => {
    const handlePreferencesUpdated = (event) => {
      setPreferences(event.detail || readCachedPreferences());
    };

    window.addEventListener(PREFERENCE_EVENT_NAME, handlePreferencesUpdated);

    return () => {
      window.removeEventListener(PREFERENCE_EVENT_NAME, handlePreferencesUpdated);
    };
  }, []);

  const removeFavorite = async (product) => {
    const productId = getId(product);

    if (!isMongoObjectId(productId)) {
      setMessage("No se pudo identificar el producto favorito.");
      return;
    }

    try {
      setActionLoading(true);
      const data = await toggleFavoriteProduct(productId);
      setPreferences(data.preferences || readCachedPreferences());
      setMessage("Producto quitado de favoritos.");
    } catch (error) {
      setMessage(error.message || "No se pudo quitar el favorito.");
    } finally {
      setActionLoading(false);
    }
  };

  const removeWishlist = async (product) => {
    const productId = getId(product);

    if (!isMongoObjectId(productId)) {
      setMessage("No se pudo identificar el producto de la lista de deseos.");
      return;
    }

    try {
      setActionLoading(true);
      const data = await toggleWishlistProduct(productId);
      setPreferences(data.preferences || readCachedPreferences());
      setMessage("Producto quitado de lista de deseos.");
    } catch (error) {
      setMessage(error.message || "No se pudo quitar de lista de deseos.");
    } finally {
      setActionLoading(false);
    }
  };

  const removeOrderItem = (item) => {
    const nextList = orderList.filter((currentItem) => {
      return !(
        currentItem.id === item.id ||
        currentItem.productId === item.productId ||
        currentItem.slug === item.slug
      );
    });

    setOrderList(nextList);
    saveLocalArray(ORDER_LIST_KEY, nextList);
    setMessage("Producto quitado de tu lista de pedido.");
  };

  return (
    <>
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8">
          <p className="text-[#87CCC8] font-black">Mi cuenta</p>

          <h2 className="text-4xl font-black mt-2">
            Perfil, pedidos y favoritos
          </h2>

          <p className="mt-3 text-gray-600 max-w-3xl leading-7">
            Aquí puedes revisar tus pedidos, productos favoritos, lista de deseos,
            recomendaciones, notificaciones y eventos registrados.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
            {message}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex items-center gap-2 rounded-[24px] bg-white px-5 py-4 text-sm font-black smika-shadow">
            <Loader2 size={18} className="animate-spin text-[#87CCC8]" />
            Cargando tus datos...
          </div>
        )}
      </section>

      <UserRegisteredEventsSection title="Mis eventos registrados" />

      <section className="container-smika py-10 space-y-10">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="smika-card smika-shadow p-6">
            <div className="flex items-center gap-2 text-[#87CCC8]">
              <PackageCheck size={20} />
              <p className="font-black">Pedidos</p>
            </div>

            <h3 className="mt-2 text-2xl font-black">Mis pedidos</h3>
            <p className="mt-2 text-gray-600">
              Productos agregados a tu lista de pedido para coordinar compra.
            </p>

            <p className="mt-4 text-3xl font-black">{orderList.length}</p>
          </div>

          <div className="smika-card smika-shadow p-6">
            <div className="flex items-center gap-2 text-[#D1B0C7]">
              <Heart size={20} />
              <p className="font-black">Favoritos</p>
            </div>

            <h3 className="mt-2 text-2xl font-black">Mis favoritos</h3>
            <p className="mt-2 text-gray-600">
              Productos guardados al presionar el corazón.
            </p>

            <p className="mt-4 text-3xl font-black">{favoriteProducts.length}</p>
          </div>

          <div className="smika-card smika-shadow p-6">
            <div className="flex items-center gap-2 text-[#87CCC8]">
              <Sparkles size={20} />
              <p className="font-black">Para ti</p>
            </div>

            <h3 className="mt-2 text-2xl font-black">Recomendados</h3>
            <p className="mt-2 text-gray-600">
              Productos sugeridos según tus favoritos y lista de deseos.
            </p>

            <p className="mt-4 text-3xl font-black">{recommendedProducts.length}</p>
          </div>
        </div>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[#D1B0C7] font-black">Favoritos</p>
              <h3 className="mt-1 text-3xl font-black">Productos con corazón</h3>
            </div>

            <button
              type="button"
              onClick={refreshPreferences}
              className="rounded-full bg-[#F8F6F7] px-5 py-3 text-sm font-black"
            >
              Actualizar
            </button>
          </div>

          <div className="mt-6">
            {favoriteProducts.length === 0 ? (
              <EmptyState
                title="Aún no tienes favoritos"
                description="Presiona el corazón en un producto para guardarlo aquí."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {favoriteProducts.map((product) => (
                  <MiniProductCard
                    key={getId(product) || product.slug}
                    product={product}
                    badge="Favorito"
                    action={removeFavorite}
                    actionLabel="Quitar favorito"
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <p className="text-[#87CCC8] font-black">Lista de deseos</p>
          <h3 className="mt-1 text-3xl font-black">Productos guardados para después</h3>

          <div className="mt-6">
            {wishlistProducts.length === 0 ? (
              <EmptyState
                title="Tu lista de deseos está vacía"
                description="Desde el detalle de producto puedes agregar productos a esta lista."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {wishlistProducts.map((product) => (
                  <MiniProductCard
                    key={getId(product) || product.slug}
                    product={product}
                    badge="Lista de deseos"
                    action={removeWishlist}
                    actionLabel="Quitar de deseos"
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <p className="text-[#87CCC8] font-black">Pedidos</p>
          <h3 className="mt-1 text-3xl font-black">Mi lista de pedido</h3>

          <div className="mt-6">
            {orderList.length === 0 ? (
              <EmptyState
                title="No tienes productos en tu lista de pedido"
                description="Agrega productos desde el catálogo o desde el detalle del producto."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {orderList.map((item) => (
                  <OrderListCard
                    key={item.id || item.productId || item.slug}
                    item={item}
                    onRemove={removeOrderItem}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <p className="text-[#D1B0C7] font-black">Para ti</p>
          <h3 className="mt-1 text-3xl font-black">Recomendados</h3>

          <div className="mt-6">
            {recommendedProducts.length === 0 ? (
              <EmptyState
                title="Aún no hay recomendaciones"
                description="Guarda productos o series como favoritos para mejorar las sugerencias."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {recommendedProducts.map((product) => (
                  <MiniProductCard
                    key={getId(product) || product.slug}
                    product={product}
                    badge="Recomendado"
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </>
  );
}

export default UserProfilePage;
