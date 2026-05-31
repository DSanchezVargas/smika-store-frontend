import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Image as ImageIcon,
  Sparkles
} from "lucide-react";

import AutoCarousel from "../../components/common/AutoCarousel";
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

function SeriesDetailPage() {
  const { slug } = useParams();
  const { products, series } = useAdminData();

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
  const coverImage = galleryImages[0] || "";

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
              <AutoCarousel
                images={galleryImages}
                alt={title}
                heightClassName="h-[420px]"
                fit="contain"
                className="bg-white"
                showEmpty
              />
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

            {coverImage && (
              <a
                href={coverImage}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 font-black text-[#87CCC8]"
              >
                Ver portada en grande
                <ChevronRight size={18} />
              </a>
            )}
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
    </section>
  );
}

export default SeriesDetailPage;