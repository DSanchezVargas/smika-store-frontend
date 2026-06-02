import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageIcon,
  Loader2,
  PackageCheck,
  ShoppingBag,
  Tag
} from "lucide-react";

import { useAdminData } from "../../context/AdminDataContext";
import { useAuth } from "../../context/AuthContext";
import { addProductToCart } from "../../services/cartService";
import { getPublicProducts } from "../../utils/publicProducts";
import CroppedImagePreview from "../../components/admin/CroppedImagePreview";
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
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function saveLocalArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // No rompemos la página si el navegador bloquea localStorage.
  }
}

function isMongoObjectId(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
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

function getProductId(product) {
  return product?._id || product?.mongoId || product?.productId || product?.id || "";
}

function getStoredProductId(product) {
  return getProductId(product) || product?.slug || product?.nombre || "";
}

function getProductPrice(product) {
  return Number(product?.precio || product?.price || product?.precioReferencial || 0);
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

function buildStoredProduct(product) {
  const productId = getStoredProductId(product);

  return {
    id: productId,
    productId,
    slug: product.slug || productId,
    nombre: product.nombre,
    precio: getProductPrice(product),
    tipo: product.tipo || product.tipoProducto || "Producto",
    serie: product.serieNombre || product.serie || "",
    evento: product.eventoNombre || product.evento || "",
    cantidad: 1,
    imagen: product.image || product.imagen || getImageSource(product.imagenes?.[0]) || "",
    imagenes: product.imagenes || [],
    savedAt: new Date().toISOString()
  };
}

function parseInlineMarkdown(text = "") {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-black text-[#2F2F2F]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("__") && part.endsWith("__")) {
      return (
        <span key={`${part}-${index}`} className="underline decoration-2 underline-offset-4">
          {part.slice(2, -2)}
        </span>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${part}-${index}`} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

function FormattedProductDescription({ description }) {
  const fallbackDescription =
    "Producto registrado en Smika Store. Aquí se muestra la información disponible del producto, incluyendo serie, tipo, disponibilidad, precio referencial e imágenes.";

  const text = description?.trim() || fallbackDescription;
  const lines = text.split(/\r?\n/);

  return (
    <div className="mt-6 space-y-3 text-gray-600 leading-8">
      {lines.map((line, index) => (
        <p key={`${index}-${line}`} className={line.trim() ? "" : "h-4"}>
          {line.trim() ? parseInlineMarkdown(line) : <span>&nbsp;</span>}
        </p>
      ))}
    </div>
  );
}

function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { products } = useAdminData();

  const [message, setMessage] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWishlist, setIsWishlist] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [selectedVariantCode, setSelectedVariantCode] = useState("");

  const user = auth?.user || auth?.currentUser || null;
  const isAuthenticated = Boolean(auth?.isAuthenticated || user);

  const publicProducts = useMemo(() => {
    return getPublicProducts(products);
  }, [products]);

  const product = useMemo(() => {
    return publicProducts.find((item) => item.slug === slug);
  }, [publicProducts, slug]);

  const productId = getProductId(product);
  const productVariants = getProductVariants(product);
  const hasVariants = productVariants.length > 0;
  const selectedVariant =
    productVariants.find((variant) => variant.codigo === selectedVariantCode) ||
    productVariants[0] ||
    null;
  const selectedPrice = getVariantPrice(product, selectedVariant);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const uploadedImages = Array.isArray(product.imagenes)
      ? product.imagenes.filter((image) => Boolean(getImageSource(image)))
      : [];

    if (uploadedImages.length > 0) return uploadedImages;

    const fallbackImage = product.image || product.imagen || "";

    return fallbackImage ? [fallbackImage] : [];
  }, [product]);

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0] || null;
  const hasImages = galleryImages.length > 0;
  const hasMultipleImages = galleryImages.length > 1;

  const goToLogin = () => {
    navigate(
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`
    );
  };

  const applyPreferencesToState = (preferences) => {
    if (!product) {
      setIsFavorite(false);
      setIsWishlist(false);
      return;
    }

    setIsFavorite(
      isProductFavorite(preferences, productId) ||
        isProductFavorite(preferences, product.slug)
    );

    setIsWishlist(
      isProductInWishlist(preferences, productId) ||
        isProductInWishlist(preferences, product.slug)
    );
  };

  const refreshPreferenceState = async ({ silent = false } = {}) => {
    if (!isAuthenticated || !product) {
      setIsFavorite(false);
      setIsWishlist(false);
      return;
    }

    const cachedPreferences = readCachedPreferences();

    if (cachedPreferences) {
      applyPreferencesToState(cachedPreferences);
    }

    try {
      const preferences = await getMyPreferences();
      applyPreferencesToState(preferences);
    } catch (error) {
      if (!silent && (error.status === 401 || error.message?.toLowerCase().includes("token"))) {
        goToLogin();
      }
    }
  };

  useEffect(() => {
    setActiveImageIndex(0);
    setMessage("");
  }, [slug]);
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
    refreshPreferenceState({ silent: true });
  }, [isAuthenticated, productId, product?.slug]);

  useEffect(() => {
    const handlePreferencesUpdated = (event) => {
      const preferences = event.detail || readCachedPreferences();
      applyPreferencesToState(preferences);
    };

    window.addEventListener(PREFERENCE_EVENT_NAME, handlePreferencesUpdated);

    return () => {
      window.removeEventListener(PREFERENCE_EVENT_NAME, handlePreferencesUpdated);
    };
  }, [productId, product?.slug]);

  const goToPreviousImage = () => {
    setActiveImageIndex((currentIndex) => {
      if (!hasMultipleImages) return currentIndex;
      return currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1;
    });
  };

  const goToNextImage = () => {
    setActiveImageIndex((currentIndex) => {
      if (!hasMultipleImages) return currentIndex;
      return currentIndex === galleryImages.length - 1 ? 0 : currentIndex + 1;
    });
  };

  const handleAddToOrderList = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    if (!isMongoObjectId(productId)) {
      setMessage("Este producto aún está siendo preparado. Intenta nuevamente más tarde.");
      return;
    }

    if (hasVariants && !selectedVariant) {
      setMessage("Selecciona una opción antes de agregar el producto.");
      return;
    }

    try {
      setOrderLoading(true);
      setMessage("");

      await addProductToCart(productId, 1, selectedVariant);

      setMessage(
        selectedVariant
          ? `Agregado a tu lista: ${selectedVariant.nombre}.`
          : "Producto agregado a tu lista de pedido."
      );
    } catch (error) {
      if (error.status === 401 || error.message?.toLowerCase().includes("token")) {
        goToLogin();
        return;
      }

      setMessage(error.message || "No se pudo agregar a la lista de pedido.");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleSaveFavorite = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    if (!isMongoObjectId(productId)) {
      setMessage("Este producto aún está siendo preparado. Intenta nuevamente más tarde.");
      return;
    }

    try {
      setFavoriteLoading(true);
      setMessage("");

      const data = await toggleFavoriteProduct(productId);
      applyPreferencesToState(data.preferences || readCachedPreferences());
      const favoriteNow = isProductFavorite(data.preferences, productId);

      setMessage(
        favoriteNow ? "Producto guardado como favorito." : "Producto quitado de favoritos."
      );
    } catch (error) {
      if (error.status === 401 || error.message?.toLowerCase().includes("token")) {
        goToLogin();
        return;
      }

      setMessage(error.message || "No se pudo actualizar favoritos.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    if (!isMongoObjectId(productId)) {
      setMessage("Este producto aún está siendo preparado. Intenta nuevamente más tarde.");
      return;
    }

    try {
      setWishlistLoading(true);
      setMessage("");

      const data = await toggleWishlistProduct(productId);
      applyPreferencesToState(data.preferences || readCachedPreferences());
      const wishlistNow = isProductInWishlist(data.preferences, productId);

      setMessage(
        wishlistNow
          ? "Producto agregado a lista de deseos."
          : "Producto quitado de lista de deseos."
      );
    } catch (error) {
      if (error.status === 401 || error.message?.toLowerCase().includes("token")) {
        goToLogin();
        return;
      }

      setMessage(error.message || "No se pudo actualizar la lista de deseos.");
    } finally {
      setWishlistLoading(false);
    }
  };

  if (!product) {
    return (
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8 text-center">
          <p className="font-black text-[#87CCC8]">Producto no encontrado</p>

          <h2 className="mt-2 text-3xl font-black text-[#2F2F2F]">
            No encontramos este producto
          </h2>

          <p className="mt-3 text-gray-600">
            Puede estar inactivo, eliminado o el enlace no coincide.
          </p>

          <Link
            to="/nuevos-productos"
            className="mt-6 inline-flex smika-button-primary"
          >
            Volver al catálogo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-smika py-12">
      <Link
        to="/nuevos-productos"
        className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#F8F6F7] px-5 py-3 text-sm font-black"
      >
        <ArrowLeft size={18} />
        Volver a productos
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="smika-card smika-shadow p-5">
          <div className="relative overflow-hidden rounded-[28px] bg-[#F8F6F7]">
            {hasImages ? (
              <CroppedImagePreview
                image={activeImage}
                alt={product.nombre}
                className="aspect-square w-full"
                rounded="rounded-[28px]"
              />
            ) : (
              <div className="aspect-square w-full bg-[#87CCC8] text-white flex flex-col items-center justify-center gap-3">
                <ImageIcon size={44} />
                <p className="text-2xl font-black">Smika Store</p>
              </div>
            )}

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 smika-shadow"
                  title="Imagen anterior"
                >
                  <ChevronLeft size={23} />
                </button>

                <button
                  type="button"
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 smika-shadow"
                  title="Siguiente imagen"
                >
                  <ChevronRight size={23} />
                </button>

                <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-xs font-black smika-shadow">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>

          {hasMultipleImages && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {galleryImages.map((image, index) => (
                <button
                  key={`${getImageSource(image)}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-2xl bg-[#F8F6F7] p-1 transition ${
                    index === activeImageIndex
                      ? "ring-4 ring-[#87CCC8]"
                      : "ring-1 ring-[#87CCC8]/10"
                  }`}
                  title={`Ver imagen ${index + 1}`}
                >
                  <CroppedImagePreview
                    image={image}
                    alt={`${product.nombre} ${index + 1}`}
                    className="h-full w-full"
                    rounded="rounded-xl"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[#87CCC8] font-black">Detalle del producto</p>

          <h2 className="mt-2 text-4xl font-black text-[#2F2F2F]">
            {product.nombre}
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {product.serie && (
              <span className="rounded-full bg-[#87CCC8]/15 px-4 py-2 text-xs font-black text-[#2F2F2F]">
                Serie: {product.serie}
              </span>
            )}

            {product.tipo && (
              <span className="rounded-full bg-[#F7D9D8] px-4 py-2 text-xs font-black text-[#2F2F2F]">
                {product.tipo}
              </span>
            )}

            {product.evento && (
              <span className="rounded-full bg-[#D1B0C7]/35 px-4 py-2 text-xs font-black text-[#2F2F2F]">
                Evento: {product.evento}
              </span>
            )}
          </div>

          <FormattedProductDescription description={product.descripcion} />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#F8F6F7] p-5">
              <div className="flex items-center gap-2 text-[#87CCC8]">
                <Tag size={20} />
                <p className="font-black">Precio</p>
              </div>

              <p className="mt-3 text-3xl font-black text-[#2F2F2F]">
                S/ {selectedPrice}
              </p>
            </div>

            <div className="rounded-3xl bg-[#F8F6F7] p-5">
              <div className="flex items-center gap-2 text-[#87CCC8]">
                <PackageCheck size={20} />
                <p className="font-black">Disponibilidad</p>
              </div>

              <p className="mt-3 text-lg font-black text-[#2F2F2F]">
                {product.estado || "Activo"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Stock: {product.stock || 0}
              </p>

              {product.tiempoEstimado && (
                <p className="mt-1 text-xs font-bold text-gray-500">
                  {product.tiempoEstimado}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-gray-600">
            {product.personaje && (
              <p>
                <strong>Personaje:</strong> {product.personaje}
              </p>
            )}

            {product.material && (
              <p>
                <strong>Material:</strong> {product.material}
              </p>
            )}

            {product.tamano && (
              <p>
                <strong>Tamaño:</strong> {product.tamano}
              </p>
            )}

            {product.adulto && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-600">
                Producto marcado como +18.
              </p>
            )}
          </div>

          {hasVariants && (
            <div className="mt-8 rounded-[28px] border border-[#87CCC8]/20 bg-[#F8F6F7] p-5">
              <p className="text-sm font-black text-[#87CCC8]">Elige tu opción 💖</p>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Selecciona el tipo/modelo antes de agregarlo a tu lista.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {productVariants.map((variant) => {
                  const active = selectedVariant?.codigo === variant.codigo;
                  const variantPrice = getVariantPrice(product, variant);

                  return (
                    <button
                      key={variant.codigo}
                      type="button"
                      onClick={() => setSelectedVariantCode(variant.codigo)}
                      className={`rounded-3xl border px-4 py-4 text-left transition ${
                        active
                          ? "border-[#87CCC8] bg-white shadow-lg"
                          : "border-transparent bg-white/70 hover:border-[#87CCC8]/50"
                      }`}
                    >
                      <span className="block text-sm font-black text-[#2F2F2F]">
                        {variant.nombre}
                      </span>
                      <span className="mt-1 block text-xs font-bold text-gray-500">
                        {product.varianteTipo === "precio_diferente"
                          ? `S/ ${variantPrice}`
                          : `Mismo precio: S/ ${variantPrice}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-3xl bg-[#F7D9D8] px-5 py-4 text-sm font-black">
              {message}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddToOrderList}
              disabled={orderLoading}
              className="smika-button-primary flex items-center gap-2 disabled:opacity-60"
            >
              {orderLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShoppingBag size={18} />
              )}
              Agregar a lista de pedido
            </button>

            <button
              type="button"
              onClick={handleSaveFavorite}
              disabled={favoriteLoading}
              className={`smika-button flex items-center gap-2 disabled:opacity-60 ${
                isFavorite ? "bg-[#87CCC8] text-white" : ""
              }`}
            >
              {favoriteLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              )}
              {isFavorite ? "Favorito guardado" : "Guardar favorito"}
            </button>

            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`smika-button flex items-center gap-2 disabled:opacity-60 ${
                isWishlist ? "bg-[#F7D9D8]" : ""
              }`}
            >
              {wishlistLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShoppingBag size={18} />
              )}
              {isWishlist ? "En lista de deseos" : "Lista de deseos"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetailPage;
