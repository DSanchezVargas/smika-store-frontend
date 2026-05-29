import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  clearCart,
  generateCartWhatsApp,
  getCart,
  removeProductFromCart,
  updateCartQuantity
} from "../../services/cartService";

function getLoginPath(location) {
  const currentPath = `${location.pathname}${location.search || ""}`;

  return `/login?redirect=${encodeURIComponent(currentPath)}`;
}

function getProductImage(product) {
  const firstImage = product?.imagenes?.[0];

  if (!firstImage) return "";

  if (typeof firstImage === "string") return firstImage;

  return firstImage.finalPreview || firstImage.preview || firstImage.url || "";
}

function getProductName(product) {
  return product?.nombre || "Producto Smika";
}

function getProductSerie(product) {
  if (!product?.serie) return product?.serieNombre || "";

  if (typeof product.serie === "string") return product.serie;

  return product.serie.nombre || product.serieNombre || "";
}

function getProductEvento(product) {
  if (!product?.evento) return product?.eventoNombre || "";

  if (typeof product.evento === "string") return product.evento;

  return product.evento.titulo || product.evento.nombre || product.eventoNombre || "";
}

function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const user = auth?.user || auth?.currentUser || null;
  const isAuthenticated = Boolean(auth?.isAuthenticated || user);
  const loadingAuth = Boolean(auth?.loadingAuth);

  const items = cart?.items || [];

  const total = useMemo(() => {
    return Number(cart?.totalReferencial || 0);
  }, [cart]);

  const goToLogin = () => {
    navigate(getLoginPath(location), { replace: true });
  };

  const loadCart = async () => {
    if (loadingAuth) return;

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getCart();
      setCart(data.cart);
    } catch (error) {
      if (error?.status === 401) {
        goToLogin();
        return;
      }

      setError(error.message || "No se pudo cargar la lista de pedido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth, isAuthenticated]);

  const handleQuantityChange = async (productId, quantity) => {
    if (!productId) return;

    try {
      setActionLoading(true);
      setError("");

      const safeQuantity = Math.max(1, Number(quantity || 1));
      const data = await updateCartQuantity(productId, safeQuantity);

      setCart(data.cart);
    } catch (error) {
      if (error?.status === 401) {
        goToLogin();
        return;
      }

      setError(error.message || "No se pudo actualizar la cantidad.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    if (!productId) return;

    try {
      setActionLoading(true);
      setError("");

      const data = await removeProductFromCart(productId);
      setCart(data.cart);
    } catch (error) {
      if (error?.status === 401) {
        goToLogin();
        return;
      }

      setError(error.message || "No se pudo quitar el producto.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCart = async () => {
    try {
      setActionLoading(true);
      setError("");

      const data = await clearCart();
      setCart(data.cart);
    } catch (error) {
      if (error?.status === 401) {
        goToLogin();
        return;
      }

      setError(error.message || "No se pudo vaciar la lista.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      setActionLoading(true);
      setError("");

      const data = await generateCartWhatsApp();

      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      if (error?.status === 401) {
        goToLogin();
        return;
      }

      setError(error.message || "No se pudo generar el mensaje de WhatsApp.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingAuth || loading) {
    return (
      <section className="container-smika py-12">
        <div className="smika-card p-10 text-center">
          <Loader2 className="mx-auto animate-spin text-[#87CCC8]" size={34} />
          <p className="mt-4 font-black">Cargando lista de pedido...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-smika py-12">
      <div className="rounded-[32px] bg-[#F8F6F7] p-8 mb-8">
        <p className="text-[#87CCC8] font-black">Lista de pedido</p>

        <h2 className="text-4xl font-black mt-2">Productos seleccionados</h2>

        <p className="mt-3 text-gray-600">
          Aquí aparecerán los productos que agregues antes de enviar el pedido
          por WhatsApp.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-3xl bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="smika-card p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F7D9D8] text-[#D1B0C7]">
            <ShoppingBag size={34} />
          </div>

          <h3 className="mt-5 text-2xl font-black">Tu lista está vacía</h3>

          <p className="mt-3 text-sm text-gray-500">
            Agrega productos desde el catálogo para preparar tu pedido.
          </p>

          <Link
            to="/nuevos-productos"
            className="mt-6 inline-flex rounded-full bg-[#87CCC8] px-6 py-3 font-black text-white"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => {
              const product = item.producto;
              const productId = product?._id || product?.id || "";
              const quantity = Number(item.cantidad || 1);
              const unitPrice = Number(item.precioReferencialUnitario || 0);
              const subtotal = quantity * unitPrice;
              const image = getProductImage(product);
              const serie = getProductSerie(product);
              const evento = getProductEvento(product);

              return (
                <div
                  key={productId || item._id}
                  className="rounded-[28px] border border-[#87CCC8]/20 bg-white p-4 smika-shadow"
                >
                  <div className="grid gap-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                    <div className="aspect-square overflow-hidden rounded-3xl bg-[#F8F6F7]">
                      {image ? (
                        <img
                          src={image}
                          alt={getProductName(product)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#87CCC8] text-xl font-black text-white">
                          S
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-[#2F2F2F]">
                        {getProductName(product)}
                      </h3>

                      <div className="mt-2 grid gap-1 text-sm text-gray-500">
                        {serie && <p>Serie: {serie}</p>}

                        {product?.tipoProducto && (
                          <p>Tipo: {product.tipoProducto}</p>
                        )}

                        {evento && <p>Evento: {evento}</p>}

                        {product?.disponibilidad && (
                          <p>
                            Disponibilidad:{" "}
                            {product.disponibilidad.replace("_", " ")}
                          </p>
                        )}
                      </div>

                      <p className="mt-3 font-black">S/ {unitPrice} c/u</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <div className="flex items-center gap-2 rounded-full bg-[#F8F6F7] p-2">
                        <button
                          type="button"
                          disabled={actionLoading || !productId}
                          onClick={() =>
                            handleQuantityChange(productId, quantity - 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white disabled:opacity-50"
                        >
                          <Minus size={15} />
                        </button>

                        <span className="min-w-8 text-center font-black">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          disabled={actionLoading || !productId}
                          onClick={() =>
                            handleQuantityChange(productId, quantity + 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white disabled:opacity-50"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <p className="text-lg font-black">S/ {subtotal}</p>

                      <button
                        type="button"
                        disabled={actionLoading || !productId}
                        onClick={() => handleRemove(productId)}
                        className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-500 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-[28px] bg-white p-6 smika-shadow">
            <p className="font-black text-[#87CCC8]">Resumen</p>

            <h3 className="mt-2 text-2xl font-black">Pedido por WhatsApp</h3>

            <div className="mt-5 space-y-3 text-sm text-gray-600">
              <p>
                Productos diferentes: <strong>{items.length}</strong>
              </p>

              <p>
                Total referencial:{" "}
                <strong className="text-[#2F2F2F]">S/ {total}</strong>
              </p>

              <p>
                La disponibilidad final se confirma por WhatsApp, especialmente
                si el evento es temporal o tiene stock limitado.
              </p>
            </div>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSendWhatsApp}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#87CCC8] px-5 py-3 font-black text-white disabled:opacity-60"
            >
              {actionLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <ExternalLink size={18} />
              )}
              Enviar pedido al WhatsApp
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleClearCart}
              className="mt-3 w-full rounded-full bg-[#F7D9D8] px-5 py-3 font-black disabled:opacity-60"
            >
              Vaciar lista
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CartPage;