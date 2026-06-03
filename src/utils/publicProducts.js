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


function getImageSource(image) {
  if (!image) return "";

  if (typeof image === "string") return image;

  return (
    image.url ||
    image.secure_url ||
    image.preview ||
    image.src ||
    image.imagen ||
    image.finalPreview ||
    ""
  );
}

export function normalizePublicProduct(product) {
  const firstImage = product.imagenes?.[0];

  const nombre = product.nombre || product.name || "Producto Smika";
  const tipo = product.tipo || product.type || "Producto";
  const serie = product.serie || product.series || "";
  const evento = product.evento || product.event || "";
  const precio = Number(product.precio || product.price || 0);
  const estado = product.estado || product.status || "Activo";

  const uploadedImage =
    getImageSource(firstImage) ||
    getImageSource(product.image) ||
    getImageSource(product.imagen) ||
    "";

  const image = uploadedImage || getPlaceholderImage(product);

  return {
    ...product,

    id: product.id,
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