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

function getImageSource(image) {
  if (!image) return "";
  if (typeof image === "string") return image;

  // Para la tienda pública usamos primero la URL real de la imagen.
  // finalPreview puede quedar antiguo cuando se cambian o migran imágenes.
  return (
    image.secure_url ||
    image.url ||
    image.preview ||
    image.src ||
    image.imagen ||
    image.finalPreview ||
    ""
  );
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

function normalizeVariantMode(value = "sin_variantes") {
  const cleanValue = String(value || "sin_variantes").toLowerCase().trim();

  if (["precio_igual", "igual", "mismo_precio", "same_price"].includes(cleanValue)) {
    return "precio_igual";
  }

  if (["precio_diferente", "diferente", "precio_variable", "different_price"].includes(cleanValue)) {
    return "precio_diferente";
  }

  return "sin_variantes";
}

function normalizePublicVariants(product = {}) {
  const variants = Array.isArray(product.variantes)
    ? product.variantes
    : Array.isArray(product.variants)
      ? product.variants
      : [];

  const mode = normalizeVariantMode(product.varianteTipo || product.tipoVariante);
  const basePrice = Number(product.precioReferencial ?? product.precio ?? product.price ?? 0);

  if (mode === "sin_variantes") return [];

  return variants
    .map((variant, index) => {
      const nombre = (variant?.nombre || variant?.name || `Opción ${index + 1}`).toString().trim();
      if (!nombre) return null;

      const rawImagenIndex = Number(
        variant?.imagenIndex ?? variant?.imageIndex ?? variant?.selectedImageIndex ?? 0
      );

      const imagenIndex = Number.isFinite(rawImagenIndex) && rawImagenIndex >= 0
        ? Math.floor(rawImagenIndex)
        : 0;

      return {
        ...variant,
        codigo: variant?.codigo || variant?.code || createVariantCode(nombre, index),
        nombre,
        precio: mode === "precio_diferente"
          ? Number(variant?.precio ?? variant?.price ?? basePrice)
          : basePrice,
        stock: Number(variant?.stock || 0),
        imagenIndex,
        activa: variant?.activa !== false,
        orden: Number(variant?.orden ?? index)
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function getPlaceholderImage(product) {
  const tipo = (product.tipo || product.type || "").toLowerCase();
  const evento = (product.evento || product.event || "").toLowerCase();

  let label = "Smika Store";
  let background = "87CCC8";
  let textColor = "FFFFFF";

  if (tipo.includes("pin")) {
    label = "Pin";
    background = "87CCC8";
    textColor = "FFFFFF";
  }

  if (tipo.includes("stand")) {
    label = "Stand";
    background = "F7D9D8";
    textColor = "2F2F2F";
  }

  if (tipo.includes("photocard")) {
    label = "Photocard";
    background = "D1B0C7";
    textColor = "FFFFFF";
  }

  if (tipo.includes("tomo") || tipo.includes("libro")) {
    label = "Libro";
    background = "D1B0C7";
    textColor = "FFFFFF";
  }

  if (tipo.includes("pack")) {
    label = "Pack";
    background = "D1B0C7";
    textColor = "FFFFFF";
  }

  if (evento.includes("lebom")) {
    label = "Lebom";
    background = "D1B0C7";
    textColor = "FFFFFF";
  }

  if (evento.includes("café") || evento.includes("cafe")) {
    label = "Evento";
    background = "F7D9D8";
    textColor = "2F2F2F";
  }

  return `https://placehold.co/700x700/${background}/${textColor}?text=${encodeURIComponent(
    label
  )}`;
}

export function normalizePublicProduct(product) {
  const firstImage = product.imagenes?.[0];

  const nombre = product.nombre || product.name || "Producto Smika";
  const tipo = product.tipo || product.type || "Producto";
  const serie = product.serie || product.series || "";
  const evento = product.evento || product.event || "";
  const precio = Number(product.precio || product.price || 0);
  const estado = product.estado || product.status || "Activo";

  const uploadedImage = getImageSource(firstImage) || product.image || product.imagen || "";
  const image = uploadedImage || getPlaceholderImage(product);
  const varianteTipo = normalizeVariantMode(product.varianteTipo || product.tipoVariante);

  return {
    ...product,

    id: product.id || product._id || "",
    _id: product._id || product.id || "",
    slug: product.slug || createSlug(nombre),

    name: nombre,
    nombre,
    title: nombre,

    type: tipo,
    tipo,

    series: serie,
    serie,

    event: evento,
    evento,

    price: precio,
    precio,

    varianteTipo,
    variantes: normalizePublicVariants({ ...product, varianteTipo }),

    stock: Number(product.stock || 0),

    status: estado,
    estado,

    category: evento ? "Eventos" : tipo,
    subcategory: serie,

    image,
    imagen: image,
    imagenes: product.imagenes || [],

    active: product.activo !== false,
    activo: product.activo !== false,

    createdAt: product.createdAt || "",
    updatedAt: product.updatedAt || ""
  };
}

export function getPublicProducts(products = []) {
  return products
    .filter((product) => product.activo !== false)
    .map(normalizePublicProduct);
}
