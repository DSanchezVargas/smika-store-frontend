import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";

import ProductCard from "../../components/product/ProductCard";
import { useAdminData } from "../../context/AdminDataContext";
import { getPublicProducts } from "../../utils/publicProducts";
import { getDynamicPriceRange } from "../../utils/priceRange";

import {
  authorFilters,
  countryFilters,
  genreFilters,
  storyFiltersByCountry
} from "../../data/catalogFilters";

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

function matchesRoute(value = "", route = "") {
  if (!route) return true;

  const valueSlug = createSlug(value);
  const routeSlug = createSlug(route);

  return valueSlug.includes(routeSlug) || routeSlug.includes(valueSlug);
}

function getProductCountryCode(product, seriesByName) {
  const directCountry =
    product.countryCode ||
    product.pais ||
    product.origen ||
    product.country ||
    "";

  if (directCountry) return directCountry;

  const serieKey = normalizeText(product.serie || product.series || "");
  const foundSerie = seriesByName.get(serieKey);

  return foundSerie?.pais || foundSerie?.countryCode || "";
}

function isProductFromCurrentSection(product, title, subcategory) {
  const section = normalizeText(title);
  const tipo = normalizeText(product.tipo || product.type || "");
  const estado = normalizeText(product.estado || product.status || "");
  const evento = product.evento || product.event || "";

  if (section.includes("nuevo")) {
    return true;
  }

  if (section.includes("serie")) {
    return Boolean(product.serie || product.series);
  }

  if (section.includes("evento")) {
    if (!evento) return false;
    if (!subcategory) return true;

    return matchesRoute(evento, subcategory);
  }

  if (section.includes("libro")) {
    return tipo.includes("tomo") || tipo.includes("libro");
  }

  if (section.includes("preventa")) {
    return estado.includes("preventa");
  }

  if (section.includes("personalizado")) {
    return tipo.includes("personalizado");
  }

  return true;
}

function CatalogPage({ title = "Catálogo" }) {
  const { subcategory } = useParams();
  const { products, series } = useAdminData();

  const [maxPrice, setMaxPrice] = useState(0);
  const [availability, setAvailability] = useState("Todos");
  const [typeSearch, setTypeSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedStory, setSelectedStory] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");

  const isSeriesPage = title === "Series";

  const seriesByName = useMemo(() => {
    const map = new Map();

    series.forEach((serie) => {
      map.set(normalizeText(serie.nombre), serie);
    });

    return map;
  }, [series]);

  const publicProducts = useMemo(() => {
    return getPublicProducts(products)
      .map((product) => ({
        ...product,
        countryCode: getProductCountryCode(product, seriesByName)
      }))
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        if (dateA !== dateB) return dateB - dateA;

        return Number(b.id || 0) - Number(a.id || 0);
      });
  }, [products, seriesByName]);

  const countryFromRoute = useMemo(() => {
    if (!subcategory) return "";

    const foundCountry = countryFilters.find(
      (country) => country.pathValue === subcategory
    );

    return foundCountry?.code || "";
  }, [subcategory]);

  const currentCountry = countryFromRoute || selectedCountry;

  const availableStories = useMemo(() => {
    const storiesFromAdmin = series
      .filter((serie) => {
        if (!serie.activo) return false;
        if (!currentCountry) return true;

        return serie.pais === currentCountry;
      })
      .map((serie) => serie.nombre);

    const storiesFromStaticFilters = currentCountry
      ? storyFiltersByCountry[currentCountry] || []
      : Object.values(storyFiltersByCountry).flat();

    return [...new Set([...storiesFromAdmin, ...storiesFromStaticFilters])];
  }, [series, currentCountry]);

  const sectionProducts = useMemo(() => {
    return publicProducts.filter((product) =>
      isProductFromCurrentSection(product, title, subcategory)
    );
  }, [publicProducts, title, subcategory]);

  const priceRange = useMemo(() => {
    return getDynamicPriceRange(sectionProducts);
  }, [sectionProducts]);

  useEffect(() => {
    setMaxPrice(priceRange.max);
  }, [priceRange.max, title, subcategory]);

  const visibleProducts = useMemo(() => {
    const priceLimit = maxPrice || priceRange.max;

    return sectionProducts.filter((product) => {
      const productPrice = Number(product.price || product.precio || 0);

      if (productPrice > priceLimit) return false;

      if (availability === "En stock") {
        if (product.stock <= 0) return false;
        if (normalizeText(product.estado).includes("agotado")) return false;
      }

      if (availability === "Preventa") {
        if (!normalizeText(product.estado).includes("preventa")) return false;
      }

      if (availability === "Por pedido") {
        if (!normalizeText(product.estado).includes("pedido")) return false;
      }

      if (availability === "Agotado") {
        const isSoldOut =
          product.stock <= 0 || normalizeText(product.estado).includes("agotado");

        if (!isSoldOut) return false;
      }

      if (typeSearch.trim()) {
        const search = normalizeText(typeSearch);

        const searchableText = normalizeText(
          `${product.tipo} ${product.type} ${product.nombre} ${product.name}`
        );

        if (!searchableText.includes(search)) return false;
      }

      if (isSeriesPage) {
        if (currentCountry && product.countryCode !== currentCountry) {
          return false;
        }

        if (
          selectedStory &&
          normalizeText(product.serie || product.series) !==
            normalizeText(selectedStory)
        ) {
          return false;
        }

        if (selectedGenre) {
          const genre = product.genero || product.genre || "";

          if (normalizeText(genre) !== normalizeText(selectedGenre)) {
            return false;
          }
        }

        if (selectedAuthor) {
          const author = product.autor || product.author || product.creador || "";

          if (normalizeText(author) !== normalizeText(selectedAuthor)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    sectionProducts,
    maxPrice,
    priceRange.max,
    availability,
    typeSearch,
    isSeriesPage,
    currentCountry,
    selectedStory,
    selectedGenre,
    selectedAuthor
  ]);

  return (
    <section className="container-smika py-12">
      <div className="rounded-[32px] bg-[#F8F6F7] p-8 mb-8">
        <p className="text-[#87CCC8] font-black">Smika Store</p>

        <h2 className="text-4xl font-black mt-2">{title}</h2>

        {subcategory && (
          <p className="mt-3 text-gray-600">
            Estás viendo:{" "}
            <span className="font-bold capitalize">
              {subcategory.replace("-", " ")}
            </span>
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="smika-card p-5 h-fit">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-[#87CCC8]" />
            <h3 className="font-black text-lg">Filtros</h3>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-bold">
              Disponibilidad
              <select
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8]"
              >
                <option value="Todos">Todos</option>
                <option value="En stock">En stock</option>
                <option value="Preventa">Preventa</option>
                <option value="Por pedido">Por pedido</option>
                <option value="Agotado">Agotado</option>
              </select>
            </label>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Precio</span>
                <span className="text-sm font-black text-[#87CCC8]">
                  S/ {priceRange.min} - S/ {maxPrice || priceRange.max}
                </span>
              </div>

              <div className="rounded-3xl border border-[#87CCC8]/25 bg-white p-4">
                <input
                  type="range"
                  min={priceRange.min}
                  max={priceRange.max}
                  value={maxPrice || priceRange.max}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="w-full accent-[#87CCC8]"
                />

                <div className="mt-2 flex justify-between text-xs font-bold text-gray-500">
                  <span>S/ {priceRange.min}</span>
                  <span>S/ {priceRange.max}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-5">
                Este rango se sincroniza automáticamente con los productos
                activos creados por admin.
              </p>
            </div>

            <label className="grid gap-2 text-sm font-bold">
              Tipo de producto
              <input
                value={typeSearch}
                onChange={(event) => setTypeSearch(event.target.value)}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none focus:border-[#87CCC8]"
                placeholder="Ej. stand, tomo, pin..."
              />
            </label>

            {isSeriesPage && (
              <>
                <label className="grid gap-2 text-sm font-bold">
                  País / origen
                  <select
                    value={currentCountry}
                    onChange={(event) => {
                      setSelectedCountry(event.target.value);
                      setSelectedStory("");
                    }}
                    disabled={Boolean(countryFromRoute)}
                    className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8] disabled:bg-[#F8F6F7]"
                  >
                    <option value="">Todos</option>

                    {countryFilters.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label} ({country.code})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold">
                  Serie / historia
                  <select
                    value={selectedStory}
                    onChange={(event) => setSelectedStory(event.target.value)}
                    className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8]"
                  >
                    <option value="">Todas</option>

                    {availableStories.map((story) => (
                      <option key={story} value={story}>
                        {story}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold">
                  Género
                  <select
                    value={selectedGenre}
                    onChange={(event) => setSelectedGenre(event.target.value)}
                    className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8]"
                  >
                    <option value="">Todos</option>

                    {genreFilters.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold">
                  Autor / creador
                  <select
                    value={selectedAuthor}
                    onChange={(event) => setSelectedAuthor(event.target.value)}
                    className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8]"
                  >
                    <option value="">Todos</option>

                    {authorFilters.map((author) => (
                      <option key={author} value={author}>
                        {author}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>
        </aside>

        <div>
          {isSeriesPage && (
            <div className="mb-6 rounded-3xl bg-[#F7D9D8]/50 p-5">
              <h3 className="font-black">Series / historias</h3>

              <p className="mt-2 text-sm text-gray-600 leading-6">
                En esta sección, las historias podrán filtrarse por país,
                género y autor. Los personajes se manejarán como relación
                interna desde el panel administrador, no como filtro visible
                por ahora.
              </p>
            </div>
          )}

          {visibleProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-[#F8F6F7] p-10 text-center">
              <p className="font-black text-[#2F2F2F]">
                No hay productos disponibles con estos filtros.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Revisa los filtros o crea productos activos desde el panel admin.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CatalogPage;