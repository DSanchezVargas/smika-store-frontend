import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageIcon,
  PackageCheck,
  ShoppingBag,
  Tag
} from "lucide-react";

import { useAdminData } from "../../context/AdminDataContext";
import { useAuth } from "../../context/AuthContext";
import { getPublicProducts } from "../../utils/publicProducts";
import CroppedImagePreview from "../../components/admin/CroppedImagePreview";

const ORDER_LIST_KEY = "smika_order_list_v1";
const FAVORITES_KEY = "smika_favorites_v1";

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
  return product?._id || product?.mongoId || product?.productId || product?.id || product?.slug || "";
}

function buildStoredProduct(product) {
  const productId = getProductId(product);

  return {
    id: productId,
    productId,
    slug: product.slug || productId,
    nombre: product.nombre,
    precio: product.precio || product.price || product.precioReferencial || 0,
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
        <p key={`${line}-${index}`} className={line.trim() ? "" : "h-4"}>
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

  const publicProducts = useMemo(() => {
    return getPublicProducts(products);
  }, [products]);

  const product = useMemo(() => {
    return publicProducts.find((item) => item.slug === slug);
  }, [publicProducts, slug]);

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

  const user = auth?.user || auth?.currentUser || null;
  const isAuthenticated = Boolean(auth?.isAuthenticated || user);

  const goToLogin = () => {
    navigate(
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`
    );
  };

  useEffect(() => {
    setActiveImageIndex(0);
    setMessage("");
  }, [slug]);

  useEffect(() => {
    if (!product) {
      setIsFavorite(false);
      return;
    }

    const productId = getProductId(product);
    const favorites = readLocalArray(FAVORITES_KEY);

    setIsFavorite(
      favorites.some((item) => {
        return (
          item.id === productId ||
          item.productId === productId ||
          item.slug === product.slug
        );
      })
    );
  }, [product]);

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

  const handleAddToOrderList = () => {
    if (!product) return;

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    const storedProduct = buildStoredProduct(product);
    const currentList = readLocalArray(ORDER_LIST_KEY);

    const exists = currentList.some((item) => {
      return (
        item.id === storedProduct.id ||
        item.productId === storedProduct.productId ||
        item.slug === storedProduct.slug
      );
    });

    if (exists) {
      setMessage("Este producto ya está en tu lista de pedido.");
      return;
    }

    saveLocalArray(ORDER_LIST_KEY, [...currentList, storedProduct]);
    setMessage("Producto agregado a tu lista de pedido.");
  };

  const handleSaveFavorite = () => {
    if (!product) return;

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    const storedProduct = buildStoredProduct(product);
    const currentFavorites = readLocalArray(FAVORITES_KEY);

    const exists = currentFavorites.some((item) => {
      return (
        item.id === storedProduct.id ||
        item.productId === storedProduct.productId ||
        item.slug === storedProduct.slug
      );
    });

    if (exists) {
      const nextFavorites = currentFavorites.filter((item) => {
        return !(
          item.id === storedProduct.id ||
          item.productId === storedProduct.productId ||
          item.slug === storedProduct.slug
        );
      });

      saveLocalArray(FAVORITES_KEY, nextFavorites);
      setIsFavorite(false);
      setMessage("Producto quitado de favoritos.");
      return;
    }

    saveLocalArray(FAVORITES_KEY, [...currentFavorites, storedProduct]);
    setIsFavorite(true);
    setMessage("Producto guardado como favorito.");
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
                S/ {product.precio || product.price || 0}
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

          {message && (
            <div className="mt-6 rounded-3xl bg-[#F7D9D8] px-5 py-4 text-sm font-black">
              {message}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddToOrderList}
              className="smika-button-primary flex items-center gap-2"
            >
              <ShoppingBag size={18} />
              Agregar a lista
            </button>

            <button
              type="button"
              onClick={handleSaveFavorite}
              className={`smika-button flex items-center gap-2 ${
                isFavorite ? "bg-[#87CCC8] text-white" : ""
              }`}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
              {isFavorite ? "Favorito guardado" : "Guardar favorito"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetailPage;
