import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  MessageCircle,
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
import CroppedImagePreview from "../../components/admin/CroppedImagePreview";

function getProductId(product) {
  return product?._id || product?.id || "";
}

function getProductPrice(product, item) {
  return Number(
    item?.precioReferencialUnitario ||
      product?.precioReferencial ||
      product?.precio ||
      product?.price ||
      0
  );
}


function getItemVariantCode(item) {
  return item?.varianteCodigo || item?.variantCode || "";
}

function getItemVariantName(item) {
  return item?.varianteNombre || item?.variantName || "";
}

function getCartItemKey(item) {
  const productId = getProductId(item?.producto) || item?.producto || "producto";
  const variantCode = getItemVariantCode(item);

  return variantCode ? `${productId}-${variantCode}` : productId;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function getRelatedName(value, fallback = "") {
  if (value && typeof value === "object") {
    return value.nombre || value.titulo || value.name || fallback || "";
  }

  return value || fallback || "";
}

function getProductSerie(product) {
  return getRelatedName(product?.serie, product?.serieNombre || "");
}

function getProductEvento(product) {
  return getRelatedName(product?.evento, product?.eventoNombre || "");
}

function getProductImage(product) {
  const firstImage = product?.imagenes?.[0];

  if (typeof firstImage === "string") return firstImage;

  if (firstImage) {
    return firstImage.finalPreview || firstImage.url || firstImage.preview || "";
  }

  return product?.image || product?.imagen || "";
}

function isAvailabilityByConfirmation(product) {
  const stock = Number(product?.stock || 0);
  const text = (product?.tiempoEstimado || "").trim();
  const disponibilidad = (product?.disponibilidad || "").toString();

  return stock <= 0 && (Boolean(text) || disponibilidad === "por_pedido");
}

function getAvailabilityText(product) {
  if (isAvailabilityByConfirmation(product)) {
    return (
      product.tiempoEstimado ||
      "Disponibilidad por confirmar con Smika Store 💖"
    );
  }

  const stock = Number(product?.stock || 0);

  if (stock > 0) return `${stock} disponibles`;

  return "Consultar disponibilidad";
}

function getCartItemSubtotal(product, item) {
  const price = getProductPrice(product, item);

  if (isAvailabilityByConfirmation(product)) {
    return price;
  }

  return Number(item?.cantidad || 1) * price;
}

function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  const user = auth?.user || auth?.currentUser || null;
  const isAuthenticated = Boolean(auth?.isAuthenticated || user);

  const items = cart?.items || [];

  const totalReferencial = useMemo(() => {
    return items.reduce((total, item) => {
      const product = item.producto;
      return total + getCartItemSubtotal(product, item);
    }, 0);
  }, [items]);

  const goToLogin = () => {
    navigate(
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`
    );
  };

  const loadCart = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getCart();
      setCart(data.cart);
      setMessage("");
    } catch (error) {
      if (
        error.status === 401 ||
        error.message?.toLowerCase().includes("token")
      ) {
        goToLogin();
        return;
      }

      setMessage(error.message || "No se pudo cargar la lista de pedido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleUpdateQuantity = async (productId, nextQuantity, item = null) => {
    if (nextQuantity < 1) return;

    try {
      setActionLoading(true);
      const data = await updateCartQuantity(productId, nextQuantity, item);
      setCart(data.cart);
    } catch (error) {
      setMessage(error.message || "No se pudo actualizar la cantidad.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveItem = async (productId, item = null) => {
    try {
      setActionLoading(true);
      const data = await removeProductFromCart(productId, item);
      setCart(data.cart);
    } catch (error) {
      setMessage(error.message || "No se pudo quitar el producto.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCart = async () => {
    try {
      setActionLoading(true);
      const data = await clearCart();
      setCart(data.cart);
      setMessage("Lista vaciada correctamente.");
    } catch (error) {
      setMessage(error.message || "No se pudo vaciar la lista.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      setActionLoading(true);
      const data = await generateCartWhatsApp();

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }

      setMessage("Mensaje preparado para WhatsApp.");
    } catch (error) {
      setMessage(error.message || "No se pudo generar el mensaje de WhatsApp.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8 text-center">
          <p className="text-[#87CCC8] font-black">Lista de pedido</p>
          <h2 className="mt-2 text-4xl font-black">Inicia sesión</h2>
          <p className="mt-3 text-gray-600">
            Para guardar productos en tu lista de pedido necesitas iniciar
            sesión.
          </p>
          <button onClick={goToLogin} className="mt-6 smika-button-primary">
            Ir a login
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="container-smika py-12">
      <div className="rounded-[32px] bg-[#F8F6F7] p-8">
        <p className="text-[#87CCC8] font-black">Lista de pedido</p>
        <h2 className="mt-2 text-4xl font-black">Productos seleccionados</h2>
        <p className="mt-3 text-gray-600">
          Revisa los productos que quieres consultar o pedir antes de enviar el
          mensaje a Smika Store por WhatsApp.
        </p>
      </div>

      {message && (
        <div className="mt-6 rounded-3xl bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message}
        </div>
      )}

      {loading ? (
        <div className="mt-8 smika-card p-8 text-center">
          <Loader2 size={44} className="mx-auto animate-spin text-[#87CCC8]" />
          <p className="mt-4 font-black">Cargando lista...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 smika-card p-8 text-center">
          <ShoppingBag size={44} className="mx-auto text-[#D1B0C7]" />
          <h3 className="mt-4 text-2xl font-black">Tu lista está vacía</h3>
          <p className="mt-2 text-gray-600">
            Agrega productos del catálogo para preparar tu consulta.
          </p>

          <Link
            to="/nuevos-productos"
            className="mt-6 inline-flex smika-button-primary"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => {
              const product = item.producto;
              const productId = getProductId(product);
              const quantity = Number(item.cantidad || 1);
              const variantName = getItemVariantName(item);
              const price = getProductPrice(product, item);
              const subtotal = getCartItemSubtotal(product, item);
              const image = getProductImage(product);
              const requiresConfirmation =
                isAvailabilityByConfirmation(product);

              return (
                <article key={getCartItemKey(item)} className="smika-card p-5 smika-shadow">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl bg-[#F8F6F7]">
                      {product?.imagenes?.[0] ? (
                        <CroppedImagePreview
                          image={product.imagenes[0]}
                          alt={product.nombre}
                          className="h-full w-full"
                          rounded="rounded-3xl"
                        />
                      ) : image ? (
                        <img
                          src={image}
                          alt={product?.nombre || "Producto"}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#87CCC8] text-white">
                          <ShoppingBag size={28} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-black text-[#2F2F2F]">
                        {product?.nombre || "Producto Smika"}
                      </h3>

                      {variantName && (
                        <p className="mt-2 inline-flex rounded-full bg-[#87CCC8] px-3 py-1 text-xs font-black text-white">
                          Opción: {variantName}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                        {getProductSerie(product) && (
                          <span className="rounded-full bg-[#87CCC8]/15 px-3 py-1">
                            {getProductSerie(product)}
                          </span>
                        )}

                        {product?.tipoProducto && (
                          <span className="rounded-full bg-[#F7D9D8] px-3 py-1">
                            {product.tipoProducto}
                          </span>
                        )}

                        {getProductEvento(product) && (
                          <span className="rounded-full bg-[#D1B0C7]/30 px-3 py-1">
                            {getProductEvento(product)}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm font-bold text-gray-600">
                        {getAvailabilityText(product)}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-black">
                            Precio referencial: S/ {formatMoney(price)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {requiresConfirmation
                              ? `Subtotal referencial: S/ ${formatMoney(price)}`
                              : `Subtotal: S/ ${formatMoney(subtotal)}`}
                          </p>
                        </div>

                        {requiresConfirmation ? (
                          <div className="rounded-full bg-[#F7D9D8] px-4 py-2 text-sm font-black">
                            Cantidad: Consultar disponibilidad
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={actionLoading || quantity <= 1}
                              onClick={() =>
                                handleUpdateQuantity(productId, quantity - 1, item)
                              }
                              className="h-9 w-9 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-50"
                            >
                              <Minus size={16} />
                            </button>

                            <span className="min-w-8 text-center font-black">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                handleUpdateQuantity(productId, quantity + 1, item)
                              }
                              className="h-9 w-9 rounded-full bg-[#87CCC8] text-white flex items-center justify-center disabled:opacity-50"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleRemoveItem(productId, item)}
                          className="h-10 w-10 rounded-full bg-[#F7D9D8] flex items-center justify-center disabled:opacity-50"
                          title="Quitar producto"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-[32px] bg-white p-6 smika-shadow">
            <p className="text-[#87CCC8] font-black">Resumen</p>
            <h3 className="mt-2 text-2xl font-black">Pedido referencial</h3>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span>Productos seleccionados</span>
                <strong>{items.length}</strong>
              </div>

              <div className="flex justify-between gap-4">
                <span>Total referencial</span>
                <strong>S/ {formatMoney(totalReferencial)}</strong>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-gray-500">
              Los productos con disponibilidad por confirmar se enviarán a
              WhatsApp para que Smika Store valide disponibilidad y coordinación.
            </p>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSendWhatsApp}
              className="mt-6 w-full smika-button-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {actionLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <MessageCircle size={18} />
              )}
              Enviar pedido al WhatsApp
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleClearCart}
              className="mt-3 w-full rounded-full bg-[#F8F6F7] px-5 py-3 text-sm font-black disabled:opacity-60"
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