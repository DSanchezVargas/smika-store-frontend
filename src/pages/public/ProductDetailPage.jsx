import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  ImageIcon,
  Loader2,
  PackageCheck,
  ShoppingBag,
  Tag
} from "lucide-react";

import CroppedImagePreview from "../../components/admin/CroppedImagePreview";
import { useAuth } from "../../context/AuthContext";
import { addProductToCart } from "../../services/cartService";
import { getProducts } from "../../services/productService";

function isMongoObjectId(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

function getProductId(product) {
  return product?._id || product?.id || "";
}

function getProductPrice(product) {
  return Number(
    product?.precioReferencial || product?.precio || product?.price || 0
  );
}

function getRelatedName(value, fallback = "") {
  if (value && typeof value === "object") {
    return value.nombre || value.titulo || value.name || fallback || "";
  }

  return value || fallback || "";
}

function getProductSerie(product) {
  return getRelatedName(
    product?.serie,
    product?.serieNombre || product?.series || ""
  );
}

function getProductEvento(product) {
  return getRelatedName(
    product?.evento,
    product?.eventoNombre || product?.event || ""
  );
}

function getProductType(product) {
  return product?.tipoProducto || product?.tipo || product?.type || "Producto";
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

  return stock <= 0 && Boolean(text);
}

function getAvailabilityText(product) {
  if (isAvailabilityByConfirmation(product)) {
    return (
      product.tiempoEstimado ||
      "Disponibilidad por confirmar con Smika Store 💖"
    );
  }

  const stock = Number(product?.stock || 0);

  if (stock > 0) return `Cantidad disponible: ${stock}`;

  const labels = {
    stock: "Disponible",
    preventa: "Preventa",
    por_pedido: "Por pedido",
    agotado: "Agotado"
  };

  return (
    labels[product?.disponibilidad] ||
    product?.estado ||
    "Consultar disponibilidad"
  );
}

function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cartLoading, setCartLoading] = useState(false);

  const user = auth?.user || auth?.currentUser || null;
  const isAuthenticated = Boolean(auth?.isAuthenticated || user);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);

        const data = await getProducts();
        const products = data.products || data.productos || data.data || [];

        const foundProduct = products.find((item) => {
          const itemId = getProductId(item);
          return item.slug === slug || itemId === slug;
        });

        if (active) {
          setProduct(foundProduct || null);
        }
      } catch (error) {
        if (active) {
          setMessage(error.message || "No se pudo cargar el producto.");
          setProduct(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [slug]);

  const productImage = useMemo(() => getProductImage(product), [product]);
  const productPrice = getProductPrice(product);
  const productSerie = getProductSerie(product);
  const productEvento = getProductEvento(product);
  const productType = getProductType(product);
  const availabilityText = getAvailabilityText(product);

  const goToLogin = () => {
    navigate(
      `/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`
    );
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    const productId = getProductId(product);

    if (!isMongoObjectId(productId)) {
      setMessage(
        "Este producto aún está siendo preparado. Intenta nuevamente más tarde."
      );
      return;
    }

    try {
      setCartLoading(true);
      await addProductToCart(productId, 1);
      setMessage("Producto agregado a tu lista de pedido.");
    } catch (error) {
      if (
        error.status === 401 ||
        error.message?.toLowerCase().includes("token")
      ) {
        goToLogin();
        return;
      }

      setMessage(error.message || "No se pudo agregar el producto a la lista.");
    } finally {
      setCartLoading(false);
    }
  };

  const handleSaveFavorite = () => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }

    setMessage("Favoritos se conectará con preferencias del usuario.");
  };

  if (loading) {
    return (
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8 text-center">
          <Loader2 className="mx-auto animate-spin text-[#87CCC8]" size={42} />
          <p className="mt-4 font-black">Cargando producto...</p>
        </div>
      </section>
    );
  }

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
            {product?.imagenes?.[0] ? (
              <CroppedImagePreview
                image={product.imagenes[0]}
                alt={product.nombre}
                className="aspect-square w-full"
                rounded="rounded-[28px]"
              />
            ) : productImage ? (
              <img
                src={productImage}
                alt={product.nombre}
                className="aspect-square w-full object-contain p-3"
              />
            ) : (
              <div className="aspect-square w-full bg-[#87CCC8] text-white flex flex-col items-center justify-center gap-3">
                <ImageIcon size={44} />
                <p className="text-2xl font-black">Smika Store</p>
              </div>
            )}
          </div>

          {product.imagenes?.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.imagenes.slice(0, 4).map((image, index) => (
                <div
                  key={image.id || image.url || index}
                  className="aspect-square overflow-hidden rounded-2xl bg-[#F8F6F7]"
                >
                  <CroppedImagePreview
                    image={image}
                    alt={`${product.nombre} ${index + 1}`}
                    className="h-full w-full"
                    rounded="rounded-2xl"
                  />
                </div>
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
            {productSerie && (
              <span className="rounded-full bg-[#87CCC8]/15 px-4 py-2 text-xs font-black text-[#2F2F2F]">
                Serie: {productSerie}
              </span>
            )}

            {productType && (
              <span className="rounded-full bg-[#F7D9D8] px-4 py-2 text-xs font-black text-[#2F2F2F]">
                {productType}
              </span>
            )}

            {productEvento && (
              <span className="rounded-full bg-[#D1B0C7]/35 px-4 py-2 text-xs font-black text-[#2F2F2F]">
                Evento: {productEvento}
              </span>
            )}
          </div>

          <p className="mt-6 text-gray-600 leading-8">
            {product.descripcion ||
              "Producto registrado en Smika Store. Aquí se muestra la información disponible del producto, incluyendo serie, tipo, disponibilidad, precio referencial e imágenes."}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] bg-[#F8F6F7] p-5">
              <p className="flex items-center gap-2 text-sm font-black text-[#87CCC8]">
                <Tag size={18} />
                Precio
              </p>

              <p className="mt-3 text-2xl font-black">S/ {productPrice}</p>
            </div>

            <div className="rounded-[24px] bg-[#F8F6F7] p-5">
              <p className="flex items-center gap-2 text-sm font-black text-[#87CCC8]">
                <PackageCheck size={18} />
                Disponibilidad
              </p>

              <p className="mt-3 text-lg font-black">{availabilityText}</p>
            </div>
          </div>

          {product.material && (
            <p className="mt-6 text-sm font-bold text-[#2F2F2F]">
              Material: <span className="font-normal">{product.material}</span>
            </p>
          )}

          {message && (
            <div className="mt-6 rounded-[22px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
              {message}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="smika-button-primary inline-flex items-center gap-2 disabled:opacity-60"
            >
              {cartLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShoppingBag size={18} />
              )}
              Agregar a lista
            </button>

            <button
              type="button"
              onClick={handleSaveFavorite}
              className="rounded-full bg-[#F7D9D8] px-5 py-3 text-sm font-black inline-flex items-center gap-2"
            >
              <Heart size={18} />
              Guardar favorito
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetailPage;