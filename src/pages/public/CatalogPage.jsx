import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, ChevronRight, Image as ImageIcon, SlidersHorizontal } from "lucide-react";

import ProductCard from "../../components/product/ProductCard";
import { useAdminData } from "../../context/AdminDataContext";
import { getPublicProducts } from "../../utils/publicProducts";
import { getDynamicPriceRange } from "../../utils/priceRange";

import {
  authorFilters,
  countryFilters,
  genreFilters
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

function normalizeCountryCode(value = "") {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) return "";

  if (["cn", "china", "chinas"].includes(normalizedValue)) return "CN";
  if (["kr", "corea", "coreanas", "korea"].includes(normalizedValue)) return "KR";

  if (
    ["jp", "japon", "japonas", "japonesas", "japón"].includes(normalizedValue)
  ) {
    return "JP";
  }

  if (["v", "variado", "variada", "varios"].includes(normalizedValue)) return "V";

  return value;
}

function getPersonalizedRouteConfig(route = "") {
  const routeSlug = createSlug(route);

  const routeMap = {
    gacha: {
      label: "Gacha",
      subcategoryName: "Gacha",
      countryCode: ""
    },
    "gacha-japon": {
      label: "Gacha Japón",
      subcategoryName: "Gacha",
      countryCode: "JP"
    },
    "gacha-japonesas": {
      label: "Gacha Japón",
      subcategoryName: "Gacha",
      countryCode: "JP"
    },
    "gacha-china": {
      label: "Gacha China",
      subcategoryName: "Gacha",
      countryCode: "CN"
    },
    "gacha-chinas": {
      label: "Gacha China",
      subcategoryName: "Gacha",
      countryCode: "CN"
    },
    "gacha-corea": {
      label: "Gacha Corea",
      subcategoryName: "Gacha",
      countryCode: "KR"
    },
    "gacha-coreanas": {
      label: "Gacha Corea",
      subcategoryName: "Gacha",
      countryCode: "KR"
    },
    "gacha-variado": {
      label: "Gacha variado",
      subcategoryName: "Gacha",
      countryCode: "V"
    }
  };

  return routeMap[routeSlug] || null;
}

function getRouteDisplayLabel(route = "") {
  const personalizedRoute = getPersonalizedRouteConfig(route);

  if (personalizedRoute) return personalizedRoute.label;

  return route
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

function matchesRoute(value = "", route = "") {
  if (!route) return true;

  const valueSlug = createSlug(value);
  const routeSlug = createSlug(route);

  return valueSlug.includes(routeSlug) || routeSlug.includes(valueSlug);
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

function getSeriesCoverImage(serie) {
  const images = getSeriesImages(serie);

  return images[0] || "";
}

function getSeriesSlug(serie) {
  return serie?.slug || createSlug(serie?.nombre || serie?.titulo || serie?.id || serie?._id || "");
}

function getProductSeriesName(product = {}) {
  return (
    product.serieNombre ||
    product.seriesNombre ||
    product.historiaNombre ||
    product.serie ||
    product.series ||
    product.historia ||
    ""
  );
}

function getNameFromValue(value = "") {
  if (value && typeof value === "object") {
    return value.nombre || value.titulo || value.name || "";
  }

  return value || "";
}

function getProductCategoryName(product = {}) {
  return (
    product.categoriaNombre ||
    product.categoryName ||
    getNameFromValue(product.categoria) ||
    getNameFromValue(product.category) ||
    ""
  );
}

function getProductSubcategoryName(product = {}) {
  return (
    product.subcategoriaNombre ||
    product.subcategoryName ||
    getNameFromValue(product.subcategoria) ||
    getNameFromValue(product.subcategory) ||
    ""
  );
}

function getProductCountryCode(product, seriesByName) {
  const directCountry =
    product.countryCode ||
    product.pais ||
    product.origen ||
    product.country ||
    "";

  if (directCountry) return normalizeCountryCode(directCountry);

  const serieKey = normalizeText(getProductSeriesName(product));

  const foundSerie = seriesByName.get(serieKey);

  return normalizeCountryCode(foundSerie?.pais || foundSerie?.countryCode || "");
}

function isProductFromCurrentSection(product, title, subcategory, personalizedRouteConfig) {
  const section = normalizeText(title);
  const tipo = normalizeText(getProductTypeText(product));
  const estado = normalizeText(product.estado || product.status || "");
  const evento = product.evento || product.event || product.eventoNombre || "";

  const categoriaTexto = normalizeText(getProductCategoryName(product));
  const subcategoriaTexto = normalizeText(getProductSubcategoryName(product));
  const categorySearchText = normalizeText(
    `${categoriaTexto} ${subcategoriaTexto} ${tipo}`
  );

  if (section.includes("nuevo")) {
    return true;
  }

  if (section.includes("serie")) {
    return Boolean(getProductSeriesName(product));
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
    if (!subcategory) {
      return categoriaTexto.includes("personalizado") || tipo.includes("personalizado");
    }

    if (personalizedRouteConfig?.subcategoryName) {
      const routeSubcategory = normalizeText(personalizedRouteConfig.subcategoryName);
      const productSubcategory = normalizeText(getProductSubcategoryName(product));

      return (
        productSubcategory.includes(routeSubcategory) ||
        categorySearchText.includes(routeSubcategory)
      );
    }

    return (
      matchesRoute(getProductSubcategoryName(product), subcategory) ||
      categorySearchText.includes(normalizeText(subcategory))
    );
  }

  return true;
}

function getSeriesCountryCode(serie) {
  return normalizeCountryCode(serie.pais || serie.countryCode || "V");
}

function getSeriesAuthor(serie) {
  return (
    serie.autor ||
    serie.author ||
    serie.creador ||
    serie.creadoresNombre?.join(", ") ||
    ""
  );
}

function getProductTypeText(product) {
  const tipos = [];

  if (Array.isArray(product?.tiposProducto)) {
    tipos.push(...product.tiposProducto);
  }

  if (product?.tipoProducto) {
    tipos.push(product.tipoProducto);
  }

  if (product?.tipo) {
    tipos.push(product.tipo);
  }

  if (product?.type) {
    tipos.push(product.type);
  }

  return tipos.join(" ");
}

function isSerieVisiblePublic(serie) {
  return serie?.activo !== false && serie?.activa !== false;
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
  const isPersonalizedPage = title === "Personalizados";
  const personalizedRouteConfig = useMemo(
    () => (isPersonalizedPage ? getPersonalizedRouteConfig(subcategory) : null),
    [isPersonalizedPage, subcategory]
  );
  const routeDisplayLabel = useMemo(
    () => getRouteDisplayLabel(subcategory),
    [subcategory]
  );
  const shouldShowStoryFilters = isSeriesPage || isPersonalizedPage;
  const typeSearchPlaceholder = isPersonalizedPage
    ? "Peluche, llavero, pin, mini stand..."
    : "Stand, llavero, photocard...";

  const activeSeries = useMemo(() => {
    return (series || []).filter(isSerieVisiblePublic);
  }, [series]);

  const seriesByName = useMemo(() => {
    const map = new Map();

    activeSeries.forEach((serie) => {
      map.set(normalizeText(serie.nombre), serie);
    });

    return map;
  }, [activeSeries]);

  const activeSeriesNameSet = useMemo(() => {
    return new Set(activeSeries.map((serie) => normalizeText(serie.nombre)));
  }, [activeSeries]);

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

    if (isPersonalizedPage && personalizedRouteConfig?.countryCode) {
      return personalizedRouteConfig.countryCode;
    }

    const foundCountry = countryFilters.find(
      (country) => country.pathValue === subcategory
    );

    return foundCountry?.code || "";
  }, [isPersonalizedPage, personalizedRouteConfig, subcategory]);

  const currentCountry = countryFromRoute || selectedCountry;

  const availableStories = useMemo(() => {
    return activeSeries
      .filter((serie) => {
        if (!currentCountry) return true;

        return getSeriesCountryCode(serie) === currentCountry;
      })
      .map((serie) => serie.nombre)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [activeSeries, currentCountry]);

  const visibleSeries = useMemo(() => {
    if (!isSeriesPage) return [];

    return activeSeries
      .filter((serie) => {
        if (currentCountry && getSeriesCountryCode(serie) !== currentCountry) {
          return false;
        }

        if (
          selectedStory &&
          normalizeText(serie.nombre) !== normalizeText(selectedStory)
        ) {
          return false;
        }

        if (
          selectedGenre &&
          normalizeText(serie.genero || serie.genre || "") !==
            normalizeText(selectedGenre)
        ) {
          return false;
        }

        if (
          selectedAuthor &&
          !normalizeText(getSeriesAuthor(serie)).includes(
            normalizeText(selectedAuthor)
          )
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const orderA = Number(a.orden || 0);
        const orderB = Number(b.orden || 0);

        if (orderA !== orderB) return orderA - orderB;

        return (a.nombre || "").localeCompare(b.nombre || "");
      });
  }, [
    isSeriesPage,
    activeSeries,
    currentCountry,
    selectedStory,
    selectedGenre,
    selectedAuthor
  ]);

  const sectionProducts = useMemo(() => {
    return publicProducts.filter((product) =>
      isProductFromCurrentSection(product, title, subcategory, personalizedRouteConfig)
    );
  }, [publicProducts, title, subcategory, personalizedRouteConfig]);

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
          product.stock <= 0 ||
          normalizeText(product.estado).includes("agotado");

        if (!isSoldOut) return false;
      }

      if (typeSearch.trim()) {
        const search = normalizeText(typeSearch);

        const searchableText = normalizeText(
          `${getProductTypeText(product)} ${product.nombre} ${product.name}`
        );

        if (!searchableText.includes(search)) return false;
      }

      if (shouldShowStoryFilters) {
        const productSeriesName = getProductSeriesName(product);
        const normalizedProductSeriesName = normalizeText(productSeriesName);

        if (isSeriesPage) {
          if (!normalizedProductSeriesName) return false;

          if (!activeSeriesNameSet.has(normalizedProductSeriesName)) {
            return false;
          }
        }

        if (currentCountry && product.countryCode !== currentCountry) {
          return false;
        }

        if (
          selectedStory &&
          normalizedProductSeriesName !== normalizeText(selectedStory)
        ) {
          return false;
        }
      }

      if (isSeriesPage) {
        if (selectedGenre) {
          const genre = product.genero || product.genre || "";

          if (normalizeText(genre) !== normalizeText(selectedGenre)) {
            return false;
          }
        }

        if (selectedAuthor) {
          const author =
            product.autor || product.author || product.creador || "";

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
    shouldShowStoryFilters,
    isSeriesPage,
    activeSeriesNameSet,
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
              {routeDisplayLabel}
            </span>
          </p>
        )}

        {isSeriesPage && (
          <p className="mt-3 text-gray-600 max-w-3xl leading-7">
            Explora historias y series por origen. En esta vista verás la
            portada principal; al entrar al detalle podrás ver la portada junto
            con el carrusel completo.
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
            </div>

            <label className="grid gap-2 text-sm font-bold">
              Tipo de producto
              <input
                value={typeSearch}
                onChange={(event) => setTypeSearch(event.target.value)}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8]"
                placeholder={typeSearchPlaceholder}
              />
            </label>

            {shouldShowStoryFilters && (
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
                    className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8] disabled:bg-gray-100"
                  >
                    <option value="">Todos</option>

                    {countryFilters.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-bold">
                  Historia / serie
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

                {isSeriesPage && (
                  <>
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
                      Autor/a
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
              </>
            )}
          </div>
        </aside>

        <div className="space-y-8">
          {isSeriesPage && (
            <div>
              <div className="mb-5 flex items-center gap-2">
                <BookOpen size={22} className="text-[#87CCC8]" />
                <h3 className="text-2xl font-black">
                  Historias disponibles
                </h3>
              </div>

              {visibleSeries.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visibleSeries.map((serie) => {
                    const coverImage = getSeriesCoverImage(serie);
                    const images = getSeriesImages(serie);
                    const serieSlug = getSeriesSlug(serie);

                    return (
                      <Link
                        key={serie._id || serie.id || serie.nombre}
                        to={`/series/detalle/${serieSlug}`}
                        className="smika-card smika-shadow group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative h-56 bg-[#F8F6F7]">
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt={serie.nombre}
                              className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">
                              <ImageIcon size={42} />
                            </div>
                          )}

                          <div className="absolute left-3 top-3 flex flex-wrap gap-2 text-xs font-black">
                            <span className="rounded-full bg-[#F7D9D8] px-3 py-1">
                              {serie.pais || "V"}
                            </span>

                            <span className="rounded-full bg-white/90 px-3 py-1">
                              {serie.genero || "Historia"}
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <h4 className="text-xl font-black">
                            {serie.nombre}
                          </h4>

                          <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                            {serie.descripcion ||
                              "Serie registrada por Smika Store."}
                          </p>

                          <div className="mt-4 grid gap-1 text-sm text-gray-600">
                            <p>
                              <strong>Origen:</strong>{" "}
                              {serie.origenNombre || "Variado"}
                            </p>

                            <p>
                              <strong>Autor/a:</strong>{" "}
                              {getSeriesAuthor(serie) || "No especificado"}
                            </p>

                            <p>
                              <strong>Imágenes:</strong> {images.length}
                            </p>
                          </div>

                          <span className="mt-5 inline-flex items-center gap-2 font-black text-[#87CCC8]">
                            Ver detalle
                            <ChevronRight size={18} />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl bg-[#F8F6F7] p-8 text-center">
                  <p className="font-black">
                    No hay series disponibles con estos filtros.
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="mb-5 text-2xl font-black">
              {isSeriesPage
                ? "Productos de las series"
                : isPersonalizedPage && subcategory
                ? `Productos de ${routeDisplayLabel}`
                : "Productos"}
            </h3>

            {visibleProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
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
      </div>
    </section>
  );
}

export default CatalogPage;
