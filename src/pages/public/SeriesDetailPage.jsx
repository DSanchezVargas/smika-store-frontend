import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  X
} from "lucide-react";

import ProductCard from "../../components/product/ProductCard";
import { useAdminData } from "../../context/AdminDataContext";
import { getPublicProducts } from "../../utils/publicProducts";

function createSlug(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeText(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getId(item) {
  return item?._id || item?.id || "";
}

function getImageSource(image) {
  if (!image) return "";

  if (typeof image === "string") return image;

  if (typeof image === "object") {
    return (
      image.finalPreview ||
      image.url ||
      image.preview ||
      image.src ||
      image.imagen ||
      ""
    );
  }

  return "";
}

function getSeriesImages(serie) {
  const images = [];

  const coverImage = getImageSource(serie?.imagen);

  if (coverImage) {
    images.push(coverImage);
  }

  if (Array.isArray(serie?.imagenes)) {
    serie.imagenes.forEach((image) => {
      const imageSource = getImageSource(image);

      if (imageSource && !images.includes(imageSource)) {
        images.push(imageSource);
      }
    });
  }

  return images;
}

function getSeriesAuthor(serie) {
  return (
    serie?.autor ||
    serie?.author ||
    serie?.creador ||
    serie?.creadoresNombre?.join(", ") ||
    ""
  );
}

function getSeriesTitle(serie) {
  return serie?.nombre || serie?.titulo || "Historia Smika";
}

function getSeriesSlug(serie) {
  return serie?.slug || createSlug(getSeriesTitle(serie) || getId(serie));
}

function getProductSeriesName(product) {
  if (product?.serieNombre) return product.serieNombre;

  if (typeof product?.serie === "object" && product.serie !== null) {
    return product.serie.nombre || product.serie.titulo || "";
  }

  if (typeof product?.serie === "string") return product.serie;

  if (product?.series) return product.series;

  return "";
}

function productBelongsToSeries(product, serie) {
  const serieId = getId(serie);
  const serieName = getSeriesTitle(serie);

  const productSerieValue = product?.serie;
  const productSerieId =
    typeof productSerieValue === "object" && productSerieValue !== null
      ? getId(productSerieValue)
      : productSerieValue;

  if (serieId && productSerieId && productSerieId === serieId) {
    return true;
  }

  return normalizeText(getProductSeriesName(product)) === normalizeText(serieName);
}

function ImageLightbox({ images, title, currentIndex, onClose, onMove }) {
  if (currentIndex === null || currentIndex === undefined) return null;

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white text-[#2F2F2F] flex items-center justify-center shadow-lg"
          title="Cerrar"
        >
          <X size={22} />
        </button>

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onMove(-1)}
            className="absolute left-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/95 text-[#2F2F2F] flex items-center justify-center shadow-lg"
            title="Imagen anterior"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        <div className="rounded-[32px] bg-white p-3 shadow-2xl">
          <div className="flex max-h-[82vh] min-h-[280px] items-center justify-center rounded-[24px] bg-[#F8F6F7]">
            <img
              src={currentImage}
              alt={`${title} imagen ${currentIndex + 1}`}
              className="max-h-[78vh] w-full object-contain"
            />
          </div>
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onMove(1)}
            className="absolute right-2 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/95 text-[#2F2F2F] flex items-center justify-center shadow-lg"
            title="Imagen siguiente"
          >
            <ChevronRight size={26} />
          </button>
        )}

        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#2F2F2F]">
            {currentIndex + 1} / {images.length}
          </span>

          <p className="hidden rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white md:block">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

function SeriesDetailPage() {
  const { slug } = useParams();
  const { products, series } = useAdminData();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const currentSeries = useMemo(() => {
    return (series || []).find((serie) => {
      const serieSlug = getSeriesSlug(serie);

      return (
        serieSlug === slug ||
        getId(serie) === slug ||
        normalizeText(getSeriesTitle(serie)) === normalizeText(slug)
      );
    });
  }, [series, slug]);

  const galleryImages = useMemo(() => {
    return getSeriesImages(currentSeries);
  }, [currentSeries]);

  const relatedProducts = useMemo(() => {
    if (!currentSeries) return [];

    return getPublicProducts(products)
      .filter((product) => productBelongsToSeries(product, currentSeries))
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });
  }, [products, currentSeries]);

  const moveSelectedImage = (direction) => {
    if (galleryImages.length <= 1) return;

    setSelectedImageIndex((currentIndex) => {
      return (
        (currentIndex + direction + galleryImages.length) %
        galleryImages.length
      );
    });
  };

  const moveLightboxImage = (direction) => {
    if (galleryImages.length <= 1) return;

    setLightboxIndex((currentIndex) => {
      return (
        (currentIndex + direction + galleryImages.length) %
        galleryImages.length
      );
    });
  };

  if (!currentSeries) {
    return (
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8 text-center">
          <BookOpen size={48} className="mx-auto text-[#D1B0C7]" />

          <h1 className="mt-4 text-3xl font-black">
            Historia no encontrada
          </h1>

          <p className="mt-3 text-gray-600">
            Puede que la historia esté inactiva o que el enlace no sea correcto.
          </p>

          <Link
            to="/series"
            className="mt-6 smika-button-primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver a series
          </Link>
        </div>
      </section>
    );
  }

  const title = getSeriesTitle(currentSeries);
  const selectedImage = galleryImages[selectedImageIndex] || galleryImages[0] || "";

  return (
    <section className="container-smika py-12">
      <Link
        to="/series"
        className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#F8F6F7] px-5 py-3 text-sm font-black"
      >
        <ArrowLeft size={18} />
        Volver a series
      </Link>

      <div className="overflow-hidden rounded-[36px] bg-white shadow-xl border border-[#87CCC8]/20">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[#F8F6F7] p-6 lg:p-8">
            {galleryImages.length > 0 ? (
              <div className="space-y-4">
                <div className="relative flex h-[420px] items-center justify-center overflow-hidden rounded-[28px] bg-white">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(selectedImageIndex)}
                    className="h-full w-full cursor-zoom-in"
                    title="Ver imagen en grande"
                  >
                    <img
                      src={selectedImage}
                      alt={title}
                      className="h-full w-full object-contain"
                    />
                  </button>

                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => moveSelectedImage(-1)}
                        className="absolute left-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/95 text-[#2F2F2F] flex items-center justify-center shadow-lg"
                        title="Imagen anterior"
                      >
                        <ChevronLeft size={23} />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveSelectedImage(1)}
                        className="absolute right-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/95 text-[#2F2F2F] flex items-center justify-center shadow-lg"
                        title="Imagen siguiente"
                      >
                        <ChevronRight size={23} />
                      </button>
                    </>
                  )}
                </div>

                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {galleryImages.slice(0, 8).map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setLightboxIndex(index);
                        }}
                        className={`h-24 overflow-hidden rounded-2xl bg-white ring-2 transition ${
                          selectedImageIndex === index
                            ? "ring-[#87CCC8]"
                            : "ring-transparent"
                        }`}
                        title={`Ver imagen ${index + 1}`}
                      >
                        <img
                          src={image}
                          alt={`${title} miniatura ${index + 1}`}
                          className="h-full w-full object-contain transition hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-[420px] items-center justify-center rounded-[28px] bg-white text-gray-400">
                <ImageIcon size={48} />
              </div>
            )}
          </div>

          <div className="p-6 lg:p-8">
            <p className="flex items-center gap-2 text-[#87CCC8] font-black">
              <Sparkles size={18} />
              Historia / Serie
            </p>

            <h1 className="mt-3 text-4xl font-black leading-tight">
              {title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
              <span className="rounded-full bg-[#F7D9D8] px-3 py-1">
                {currentSeries.pais || "V"}
              </span>

              <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1">
                {currentSeries.genero || "Historia"}
              </span>

              {currentSeries.origenNombre && (
                <span className="rounded-full bg-[#F8F6F7] px-3 py-1">
                  Origen: {currentSeries.origenNombre}
                </span>
              )}
            </div>

            <div className="mt-6 whitespace-pre-line text-gray-700 leading-8">
              {currentSeries.descripcion ||
                "Historia registrada por Smika Store."}
            </div>

            <div className="mt-6 grid gap-3 rounded-[28px] bg-[#F8F6F7] p-5 text-sm text-gray-700">
              <p>
                <strong>Autor/a:</strong>{" "}
                {getSeriesAuthor(currentSeries) || "No especificado"}
              </p>

              <p>
                <strong>País / origen:</strong>{" "}
                {currentSeries.origenNombre || currentSeries.pais || "Variado"}
              </p>

              <p>
                <strong>Imágenes en galería:</strong> {galleryImages.length}
              </p>

              <p>
                <strong>Productos relacionados:</strong> {relatedProducts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-[32px] bg-[#F8F6F7] p-6">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-[#87CCC8]" />

          <h2 className="text-2xl font-black">
            Productos de esta historia
          </h2>
        </div>

        <p className="mt-2 text-gray-600">
          Aquí aparecerán los productos que tengan esta serie/historia asignada.
        </p>
      </div>

      <div className="mt-6">
        {relatedProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
            <p className="font-black">
              Todavía no hay productos vinculados a esta historia.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Cuando el admin asigne productos a esta serie, aparecerán aquí.
            </p>
          </div>
        )}
      </div>

      <ImageLightbox
        images={galleryImages}
        title={title}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onMove={moveLightboxImage}
      />
    </section>
  );
}

export default SeriesDetailPage;