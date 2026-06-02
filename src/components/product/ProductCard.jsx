import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Loader2, ShoppingBag } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { addProductToCart } from "../../services/cartService";
import {
  getMyPreferences,
  isProductFavorite,
  PREFERENCE_EVENT_NAME,
  readCachedPreferences,
  toggleFavoriteProduct
} from "../../services/preferenceService";

function isMongoObjectId(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

function getProductId(product) {
  return product?._id || product?.mongoId || product?.productId || product?.id || "";
}

function getProductImage(product) {
  const firstImage = product?.imagenes?.[0];

  if (typeof firstImage === "string") return firstImage;

  if (firstImage) {
    return (
      firstImage.finalPreview ||
      firstImage.url ||
      firstImage.preview ||
      product.image ||
      product.imagen ||
      ""
    );
  }

  return product.image || product.imagen || "";
}

function getProductName(product) {
  return product?.nombre || product?.name || "Producto Smika";
}

function getProductPrice(product) {
  return Number(product?.precioReferencial || product?.precio || product?.price || 0);
}


function createVariantCode(text = "", index = 0) {
  const slug = text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  return slug || `opcion-${index + 1}`;
}

function getProductVariants(product) {
  if (!product || product.varianteTipo === "sin_variantes") return [];
  if (!Array.isArray(product.variantes)) return [];

  return product.variantes
    .map((variant, index) => ({
      codigo: variant.codigo || createVariantCode(variant.nombre, index),
      nombre: variant.nombre || variant.name || `Opción ${index + 1}`,
      precio: Number(variant.precio ?? product?.precioReferencial ?? product?.precio ?? product?.price ?? 0),
      stock: Number(variant.stock || 0),
      activa: variant.activa !== false,
      orden: Number(variant.orden ?? index)
    }))
    .filter((variant) => variant.activa && variant.nombre)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function getVariantPrice(product, variant) {
  if (variant && product?.varianteTipo === "precio_diferente") {
    return Number(variant.precio || 0);
  }

  return getProductPrice(product);
}

function getProductType(product) {
  if (Array.isArray(product?.tiposProducto) && product.tiposProducto.length > 0) {
    return product.tiposProducto.join(", ");
  }

  return product?.tipoProducto || product?.tipo || product?.type || "Producto";
}

function getProductSeries(product) {
  if (typeof product?.serie === "object" && product.serie !== null) {
    return product.serie.nombre || "";
  }

  return product?.serieNombre || product?.series || product?.serie || "Smika Store";
}

function getProductEvent(product) {
  if (typeof product?.evento === "object" && product.evento !== null) {
    return product.evento.titulo || product.evento.nombre || "";
  }

  return product?.eventoNombre || product?.event || product?.evento || "";
}

function getProductCategory(product) {
  if (typeof product?.categoria === "object" && product.categoria !== null) {
    return product.categoria.nombre || "";
  }

  return product?.categoriaNombre || product?.category || getProductType(product);
}

function isAvailabilityByConfirmation(product) {
  const stock = Number(product?.stock || 0);
  const text = (product?.tiempoEstimado || "").trim();

  return stock <= 0 && Boolean(text);
}

function getAvailabilityText(product) {
  if (isAvailabilityByConfirmation(product)) {
    return product.tiempoEstimado || "Disponibilidad por confirmar con Smika Store 💖";
  }

  const stock = Number(product?.stock || 0);

  if (stock > 0) return `${stock} disponibles`;

  const statusText = {
    stock: "Disponible",
    preventa: "Preventa",
    por_pedido: "Por pedido",
    agotado: "Agotado"
  };

  return (
    statusText[product?.disponibilidad] ||
    statusText[product?.status] ||
    product?.estado ||
    "Consultar disponibilidad"
  );
}

function ProductCard({ product }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [cartMessage, setCartMessage] = useState("");
  const [cartLoading, setCartLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedVariantCode, setSelectedVariantCode] = useState("");

  const user = auth?.user || auth?.currentUser || null;
  const isAuthenticated = Boolean(auth?.isAuthenticated || user);

  const productId = getProductId(product);
  const productSlug = product?.slug || productId;
  const productImage = getProductImage(product);
  const productName = getProductName(product);
  const productVariants = getProductVariants(product);
  const hasVariants = productVariants.length > 0;
  const selectedVariant =
    productVariants.find((variant) => variant.codigo === selectedVariantCode) ||
    productVariants[0] ||
    null;
  const productPrice = getVariantPrice(product, selectedVariant);
  const productCategory = getProductCategory(product);
  const productSeries = getProductSeries(product);
  const availabilityText = getAvailabilityText(product);

  const goToLogin = () => {
    navigate(
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`
    );
  };

  const showTemporaryMessage = (message) => {
    setCartMessage(message);

    setTimeout(() => {
      setCartMessage("");
    }, 2600);
  };

  const refreshFavoriteState = async ({ silent = false } = {}) => {
    if (!isAuthenticated || !productId) {
      setIsFavorite(false);
      return;
    }

    const cachedPreferences = readCachedPreferences();

    if (cachedPreferences) {
      setIsFavorite(
        isProductFavorite(cachedPreferences, productId) ||
          isProductFavorite(cachedPreferences, productSlug)
      );
    }

    try {
      const preferences = await getMyPreferences();

      setIsFavorite(
        isProductFavorite(preferences, productId) ||
          isProductFavorite(preferences, productSlug)
      );
    } catch (error) {
      if (!silent && (error.status === 401 || error.message?.toLowerCase().includes("token"))) {
        setIsFavorite(false);
      }
    }
  };

  useEffect(() => {
    refreshFavoriteState({ silent: true });
  }, [isAuthenticated, productId, productSlug]);
  useEffect(() => {
    if (productVariants.length === 0) {
      setSelectedVariantCode("");
      return;
    }

    setSelectedVariantCode((currentCode) => {
      const exists = productVariants.some((variant) => variant.codigo === currentCode);
      return exists ? currentCode : productVariants[0].codigo;
    });
  }, [productId, productVariants.map((variant) => variant.codigo).join("|")]);


  useEffect(() => {
    const handlePreferencesUpdated = (event) => {
      const preferences = event.detail || readCachedPreferences();

      setIsFavorite(
        isProductFavorite(preferences, productId) ||
          isProductFavorite(preferences, productSlug)
      );
    };

    window.addEventListener(PREFERENCE_EVENT_NAME, handlePreferencesUpdated);

    return () => {
      window.removeEventListener(PREFERENCE_EVENT_NAME, handlePreferencesUpdated);
    };
  }, [productId, productSlug]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    try {
      setCartLoading(true);
      setCartMessage("");

      if (!isMongoObjectId(productId)) {
        showTemporaryMessage("Este producto aún está siendo preparado. Intenta nuevamente más tarde.");
        return;
      }

      await addProductToCart(productId, 1, selectedVariant);

      showTemporaryMessage("Agregado a lista");
    } catch (error) {
      if (error.status === 401 || error.message?.toLowerCase().includes("token")) {
        goToLogin();
        return;
      }

      showTemporaryMessage(error.message || "No se pudo agregar a la lista.");
    } finally {
      setCartLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    if (!isMongoObjectId(productId)) {
      showTemporaryMessage("Este producto aún está siendo preparado. Intenta nuevamente más tarde.");
      return;
    }

    try {
      setFavoriteLoading(true);
      setCartMessage("");

      const data = await toggleFavoriteProduct(productId);
      const preferences = data.preferences || readCachedPreferences();
      const nextFavoriteState =
        isProductFavorite(preferences, productId) ||
        isProductFavorite(preferences, productSlug);

      setIsFavorite(nextFavoriteState);
      showTemporaryMessage(
        nextFavoriteState
          ? "Producto guardado como favorito."
          : "Favorito quitado."
      );
    } catch (error) {
      if (error.status === 401 || error.message?.toLowerCase().includes("token")) {
        goToLogin();
        return;
      }

      showTemporaryMessage(error.message || "No se pudo actualizar favoritos.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <article className="smika-card smika-shadow overflow-hidden group">
      <Link to={`/productos/${productSlug}`} className="block relative">
        <div className="aspect-square w-full overflow-hidden bg-white">
          {productImage ? (
            <img
              src={productImage}
              alt={productName}
              className="h-full w-full object-contain p-3"
              loading="lazy"
              draggable="false"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#87CCC8] text-5xl font-black text-white">
              {getProductType(product).slice(0, 12)}
            </div>
          )}
        </div>

        <div className="absolute left-4 top-4 flex gap-2">
          {(product?.isNew || product?.esNuevo) && (
            <span className="rounded-full bg-[#87CCC8] px-3 py-1 text-xs font-bold text-white">
              Nuevo
            </span>
          )}

          {(product?.isFeatured || product?.esDestacado) && (
            <span className="rounded-full bg-[#D1B0C7] px-3 py-1 text-xs font-bold text-white">
              Destacado
            </span>
          )}
        </div>
      </Link>

      <div className="p-5">
        <p className="line-clamp-2 text-xs font-bold uppercase tracking-wide text-gray-400">
          {productCategory} · {productSeries}
        </p>

        <Link to={`/productos/${productSlug}`}>
          <h3 className="mt-2 line-clamp-2 text-lg font-black leading-tight hover:text-[#87CCC8]">
            {productName}
          </h3>
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-black">S/ {productPrice}</p>
            <p className="text-xs text-gray-500">{availabilityText}</p>
          </div>

          <button
            type="button"
            onClick={handleFavorite}
            disabled={favoriteLoading}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-60 ${
              isFavorite ? "bg-[#87CCC8] text-white" : "bg-[#F7D9D8]"
            }`}
            title={isFavorite ? "Quitar favorito" : "Guardar favorito"}
          >
            {favoriteLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            )}
          </button>
        </div>

        {hasVariants && (
          <div className="mt-4 rounded-3xl bg-[#F8F6F7] p-3">
            <p className="text-xs font-black text-gray-500">Elige opción</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {productVariants.slice(0, 5).map((variant) => (
                <button
                  key={variant.codigo}
                  type="button"
                  onClick={() => setSelectedVariantCode(variant.codigo)}
                  className={`rounded-full px-3 py-2 text-xs font-black transition ${
                    selectedVariant?.codigo === variant.codigo
                      ? "bg-[#87CCC8] text-white"
                      : "bg-white text-[#2F2F2F]"
                  }`}
                >
                  {variant.nombre}
                  {product.varianteTipo === "precio_diferente"
                    ? ` · S/ ${variant.precio}`
                    : ""}
                </button>
              ))}
            </div>
            {productVariants.length > 5 && (
              <Link
                to={`/productos/${productSlug}`}
                className="mt-2 inline-flex text-xs font-black text-[#87CCC8]"
              >
                Ver más opciones
              </Link>
            )}
          </div>
        )}

        {cartMessage && (
          <p className="mt-3 rounded-2xl bg-[#F7D9D8] px-3 py-2 text-center text-xs font-black text-[#2F2F2F]">
            {cartMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={cartLoading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#87CCC8] px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {cartLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Agregando...
            </>
          ) : (
            <>
              <ShoppingBag size={18} />
              Agregar a lista
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
