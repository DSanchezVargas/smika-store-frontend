import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  ImageIcon,
  PackageCheck,
  ShoppingBag,
  Tag
} from "lucide-react";

import { useAdminData } from "../../context/AdminDataContext";
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
  localStorage.setItem(key, JSON.stringify(value));
}

function ProductDetailPage() {
  const { slug } = useParams();
  const { products } = useAdminData();

  const [message, setMessage] = useState("");

  const publicProducts = useMemo(() => {
    return getPublicProducts(products);
  }, [products]);

  const product = useMemo(() => {
    return publicProducts.find((item) => item.slug === slug);
  }, [publicProducts, slug]);

  const productImage = product?.imagenes?.[0];
  const hasUploadedImage = Boolean(productImage);

  const handleAddToOrderList = () => {
    if (!product) return;

    const currentList = readLocalArray(ORDER_LIST_KEY);

    const exists = currentList.some((item) => item.id === product.id);

    if (exists) {
      setMessage("Este producto ya está en tu lista de pedido.");
      return;
    }

    const nextList = [
      ...currentList,
      {
        id: product.id,
        slug: product.slug,
        nombre: product.nombre,
        precio: product.precio,
        tipo: product.tipo,
        serie: product.serie,
        evento: product.evento,
        cantidad: 1,
        imagen: product.image || product.imagen || "",
        imagenes: product.imagenes || []
      }
    ];

    saveLocalArray(ORDER_LIST_KEY, nextList);
    setMessage("Producto agregado a tu lista de pedido.");
  };

  const handleSaveFavorite = () => {
    if (!product) return;

    const currentFavorites = readLocalArray(FAVORITES_KEY);

    const exists = currentFavorites.some((item) => item.id === product.id);

    if (exists) {
      setMessage("Este producto ya está guardado como favorito.");
      return;
    }

    const nextFavorites = [
      ...currentFavorites,
      {
        id: product.id,
        slug: product.slug,
        nombre: product.nombre,
        precio: product.precio,
        tipo: product.tipo,
        serie: product.serie,
        evento: product.evento,
        imagen: product.image || product.imagen || "",
        imagenes: product.imagenes || []
      }
    ];

    saveLocalArray(FAVORITES_KEY, nextFavorites);
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
            {hasUploadedImage ? (
              <CroppedImagePreview
                image={productImage}
                alt={product.nombre}
                className="aspect-square w-full"
                rounded="rounded-[28px]"
              />
            ) : product.image ? (
              <img
                src={product.image}
                alt={product.nombre}
                className="aspect-square w-full object-cover"
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
                  key={image.id || index}
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

          <p className="mt-6 text-gray-600 leading-8">
            {product.descripcion ||
              "Producto registrado en Smika Store. Aquí se muestra la información disponible del producto, incluyendo serie, tipo, disponibilidad, precio referencial e imágenes."}
          </p>

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
              className="smika-button flex items-center gap-2"
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