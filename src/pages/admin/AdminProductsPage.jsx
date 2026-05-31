import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  ShoppingBag
} from "lucide-react";

import ImageDropzone from "../../components/admin/ImageDropzone";
import CreatableSelect from "../../components/admin/CreatableSelect";
import CroppedImagePreview from "../../components/admin/CroppedImagePreview";
import { useAdminData } from "../../context/AdminDataContext";

const initialForm = {
  nombre: "",
  descripcion: "",
  categoriaNombre: "",
  serieNombre: "",
  eventoNombre: "",
  origenNombre: "",
  tipoProducto: "",
  personajesNombre: [],
  material: "",
  precio: "",
  stock: "",
  tamano: "",
  disponibilidad: "stock",
  estado: "Activo",
  tiempoEstimado: "",
  adulto: false,
  esNuevo: true,
  esDestacado: false
};

const productTypes = [
  "Stand de acrílico",
  "Llavero",
  "Photocard",
  "Pin",
  "Sticker",
  "Print",
  "Tomo",
  "Merch",
  "Pack"
];

const disponibilidadOptions = [
  { id: "stock", nombre: "En stock", value: "stock", estado: "Activo" },
  { id: "preventa", nombre: "Preventa", value: "preventa", estado: "Preventa" },
  { id: "por_pedido", nombre: "Por pedido", value: "por_pedido", estado: "Por pedido" },
  { id: "agotado", nombre: "Agotado", value: "agotado", estado: "Agotado" }
];

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

function getProductId(product) {
  return product?._id || product?.id || "";
}

function getProductPrice(product) {
  return Number(
    product?.precioReferencial ?? product?.precio ?? product?.price ?? 0
  );
}

function getRelatedName(value, ...fallbacks) {
  if (value && typeof value === "object") {
    return value.nombre || value.titulo || value.name || "";
  }

  const found = [value, ...fallbacks].find(
    (item) => item !== undefined && item !== null && item !== ""
  );

  return found ? found.toString().trim() : "";
}

function getProductType(product) {
  return getRelatedName(product?.tipoProducto, product?.tipo, product?.type);
}

function getProductCategoryName(product) {
  return getRelatedName(
    product?.categoria,
    product?.categoriaNombre,
    product?.category
  );
}

function getProductSeriesName(product) {
  return getRelatedName(
    product?.serie,
    product?.serieNombre,
    product?.series
  );
}

function getProductEventName(product) {
  return getRelatedName(
    product?.evento,
    product?.eventoNombre,
    product?.event
  );
}

function getProductOriginName(product) {
  return getRelatedName(
    product?.origen,
    product?.origenNombre,
    product?.pais,
    "Variado"
  );
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

function getImageFile(image) {
  if (!image || typeof image !== "object") return null;
  return image.finalFile || image.file || null;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));

    reader.readAsDataURL(file);
  });
}

async function imageToPersistedSource(image) {
  const file = getImageFile(image);

  if (file) {
    const dataUrl = await fileToDataUrl(file);

    return {
      id: image.id,
      url: dataUrl,
      preview: dataUrl,
      finalPreview: dataUrl,
      name: image.name || image.originalName || "imagen-producto.jpg",
      originalName: image.originalName || image.name || "",
      size: Number(image.size || 0),
      finalSize: Number(image.finalSize || image.size || 0),
      width: Number(image.width || 0),
      height: Number(image.height || 0),
      finalWidth: Number(image.finalWidth || image.width || 0),
      finalHeight: Number(image.finalHeight || image.height || 0),
      crop: image.crop || {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      },
      zoom: Number(image.zoom || 1),
      pan: image.pan || {
        x: 0,
        y: 0
      },
      finalQuality: image.finalQuality || image.compressionQuality || 0.92,
      finalType: image.finalType || "image/jpeg",
      finalCompressed: true,
      storage: "local-data-url"
    };
  }

  const source = getImageSource(image);

  if (!source) return null;

  if (typeof image === "object") {
    return {
      ...image,
      url: image.url || source,
      preview: image.preview || source,
      finalPreview: image.finalPreview || source,
      storage:
        image.storage ||
        (source.startsWith("data:") ? "local-data-url" : "external")
    };
  }

  return {
    url: source,
    preview: source,
    finalPreview: source,
    storage: source.startsWith("data:") ? "local-data-url" : "external"
  };
}

async function prepareImagesForPayload(images = []) {
  const preparedImages = await Promise.all(images.map(imageToPersistedSource));

  return preparedImages.filter(Boolean);
}

function createEditableImageFromProduct(image, index = 0) {
  const source = getImageSource(image);

  if (!source) return null;

  return {
    id: image?.id || `product-image-${Date.now()}-${index}-${Math.random()}`,
    name: image?.name || `imagen-producto-${index + 1}.jpg`,
    originalName: image?.originalName || image?.name || "",
    preview: image?.preview || source,
    finalPreview: image?.finalPreview || source,
    url: image?.url || source,
    size: Number(image?.size || 0),
    originalSize: Number(image?.originalSize || image?.size || 0),
    compressedSize: Number(image?.compressedSize || image?.size || 0),
    finalSize: Number(image?.finalSize || image?.size || 0),
    width: Number(image?.width || image?.finalWidth || 1200),
    height: Number(image?.height || image?.finalHeight || 900),
    finalWidth: Number(image?.finalWidth || image?.width || 1200),
    finalHeight: Number(image?.finalHeight || image?.height || 900),
    crop: image?.crop || {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    },
    zoom: Number(image?.zoom || 1),
    pan: image?.pan || {
      x: 0,
      y: 0
    },
    finalQuality: image?.finalQuality || 0.92,
    finalType: image?.finalType || "image/jpeg",
    finalCompressed: image?.finalCompressed !== false,
    storage: image?.storage || "external"
  };
}

function getOptionByName(options = [], name = "") {
  return options.find(
    (option) => normalizeText(option.nombre) === normalizeText(name)
  );
}

function buildOption(item) {
  if (typeof item === "string") {
    return {
      id: item,
      nombre: item
    };
  }

  return {
    ...item,
    id: getId(item) || item.nombre,
    nombre: item.nombre || item.titulo || item.name || "Sin nombre"
  };
}

function normalizePersonajesFromProduct(product) {
  if (Array.isArray(product?.personajesNombre)) {
    return product.personajesNombre.filter(Boolean);
  }

  if (Array.isArray(product?.personajes)) {
    return product.personajes
      .map((personaje) => {
        if (typeof personaje === "object" && personaje !== null) {
          return personaje.nombre || personaje.name || "";
        }

        return "";
      })
      .filter(Boolean);
  }

  const personajeTexto = product?.personajeNombre || product?.personaje || "";

  return personajeTexto
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function MultiTextInput({
  label,
  values,
  setValues,
  options = [],
  placeholder = "Escribe y agrega",
  helperText = ""
}) {
  const [draft, setDraft] = useState("");

  const availableOptions = useMemo(() => {
    return options.filter(
      (option) =>
        !values.some((value) => normalizeText(value) === normalizeText(option))
    );
  }, [options, values]);

  const addValue = (value) => {
    const cleanValue = value.trim();

    if (!cleanValue) return;

    setValues((currentValues) => {
      const exists = currentValues.some(
        (item) => normalizeText(item) === normalizeText(cleanValue)
      );

      if (exists) return currentValues;

      return [...currentValues, cleanValue];
    });

    setDraft("");
  };

  return (
    <div className="rounded-[28px] bg-[#F8F6F7] p-5">
      <p className="font-black">{label}</p>

      {helperText && (
        <p className="mt-1 text-sm text-gray-600 leading-6">{helperText}</p>
      )}

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full rounded-2xl border border-[#87CCC8]/30 bg-white px-4 py-3 outline-none"
          placeholder={placeholder}
        />

        <button
          type="button"
          onClick={() => addValue(draft)}
          className="rounded-full bg-white px-5 py-3 text-sm font-black"
        >
          Agregar
        </button>
      </div>

      {availableOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {availableOptions.slice(0, 10).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => addValue(option)}
              className="rounded-full bg-white px-3 py-1 text-xs font-black"
            >
              + {option}
            </button>
          ))}
        </div>
      )}

      {values.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full bg-white px-4 py-2 text-sm font-black"
            >
              {value}
              <button
                type="button"
                onClick={() =>
                  setValues((currentValues) =>
                    currentValues.filter(
                      (item) => normalizeText(item) !== normalizeText(value)
                    )
                  )
                }
                className="ml-2 text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminProductsPage() {
  const {
    products,
    events,
    series,
    characters,
    categories,
    origins,
    storageError,
    productLoadError,
    categoriesLoadError,
    originsLoadError,
    loadingProducts,
    createProduct,
    updateProduct,
    toggleProductStatus,
    createCharacterQuick,
    createCategoryFull,
    createOriginFull,
    refreshProducts,
    refreshCategories,
    refreshOrigins
  } = useAdminData();

  const [view, setView] = useState("list");
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [imagesTouched, setImagesTouched] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedProducts = useMemo(() => {
    return [...(products || [])].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [products]);

  const categoryOptions = useMemo(() => {
    return (categories || [])
      .filter((category) => category.activa !== false && category.activo !== false)
      .map(buildOption)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [categories]);

  const seriesOptions = useMemo(() => {
    return (series || [])
      .filter((serie) => serie.activa !== false && serie.activo !== false)
      .map(buildOption)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [series]);

  const eventOptions = useMemo(() => {
    return (events || [])
      .filter((event) => event.activo !== false)
      .map((event) => ({
        ...event,
        id: getId(event) || event.titulo || event.nombre,
        nombre: event.titulo || event.nombre || "Evento"
      }))
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [events]);

  const originOptions = useMemo(() => {
    return (origins || [])
      .filter((origin) => origin.activo !== false)
      .map(buildOption)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [origins]);

  const typeOptions = useMemo(() => {
    return productTypes.map((type) => ({
      id: type,
      nombre: type
    }));
  }, []);

  const characterOptions = useMemo(() => {
    return (characters || [])
      .filter((character) => character.activo !== false)
      .map((character) => character.nombre)
      .filter(Boolean);
  }, [characters]);

  const selectedAvailability = disponibilidadOptions.find(
    (option) => option.value === form.disponibilidad
  );

  const setImagesAndTouch = (updater) => {
    setImagesTouched(true);
    setImages((currentImages) =>
      typeof updater === "function" ? updater(currentImages) : updater
    );
  };

  const resetForm = () => {
    setForm(initialForm);
    setImages([]);
    setImagesTouched(false);
    setEditingProduct(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingProduct(null);
    setForm(initialForm);
    setImages([]);
    setImagesTouched(false);
    setView("form");
  };

  const openEditForm = (product) => {
    setMessage("");
    setEditingProduct(product);

    setForm({
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      categoriaNombre: getProductCategoryName(product),
      serieNombre: getProductSeriesName(product),
      eventoNombre: getProductEventName(product),
      origenNombre: getProductOriginName(product),
      tipoProducto: getProductType(product),
      personajesNombre: normalizePersonajesFromProduct(product),
      material: product.material || "",
      precio: getProductPrice(product),
      stock: product.stock !== undefined ? Number(product.stock || 0) : "",
      tamano: product.tamano || "",
      disponibilidad: product.disponibilidad || "stock",
      estado: product.estado || "Activo",
      tiempoEstimado: product.tiempoEstimado || "",
      adulto: Boolean(product.adulto),
      esNuevo: product.esNuevo !== undefined ? Boolean(product.esNuevo) : true,
      esDestacado: Boolean(product.esDestacado)
    });

    setImages(
      Array.isArray(product.imagenes)
        ? product.imagenes
            .map((image, index) => createEditableImageFromProduct(image, index))
            .filter(Boolean)
        : []
    );

    setImagesTouched(false);
    setView("form");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAvailabilityChange = (value) => {
    const option = disponibilidadOptions.find((item) => item.nombre === value);

    if (!option) return;

    setForm((currentForm) => ({
      ...currentForm,
      disponibilidad: option.value,
      estado: option.estado
    }));
  };

  const handleSimpleCreatableCreate = (name) => ({
    id: `temp-${Date.now()}-${name}`,
    nombre: name
  });

  const ensureCategoryExists = async () => {
    const categoryName = form.categoriaNombre.trim();

    if (!categoryName) {
      throw new Error("Selecciona o crea una categoría real.");
    }

    const existingCategory = getOptionByName(categoryOptions, categoryName);

    if (existingCategory) {
      return {
        id: existingCategory._id || existingCategory.id,
        nombre: existingCategory.nombre
      };
    }

    const createdCategory = await createCategoryFull({
      nombre: categoryName,
      descripcion: "Categoría creada rápidamente desde productos.",
      tipo: "principal",
      orden: 0,
      activa: true
    });

    await refreshCategories?.();

    return {
      id: createdCategory._id || createdCategory.id,
      nombre: createdCategory.nombre
    };
  };

  const ensureOriginExists = async () => {
    const originName = form.origenNombre.trim() || "Variado";
    const existingOrigin = getOptionByName(originOptions, originName);

    if (existingOrigin) {
      return {
        id: existingOrigin._id || existingOrigin.id,
        nombre: existingOrigin.nombre
      };
    }

    if (!createOriginFull) {
      return {
        id: "",
        nombre: originName
      };
    }

    const createdOrigin = await createOriginFull({
      nombre: originName,
      descripcion: "Origen creado rápidamente desde productos.",
      activo: true
    });

    await refreshOrigins?.();

    return {
      id: createdOrigin._id || createdOrigin.id,
      nombre: createdOrigin.nombre
    };
  };

  const buildPayload = async () => {
    const category = await ensureCategoryExists();
    const origin = await ensureOriginExists();

    const selectedSerie = getOptionByName(seriesOptions, form.serieNombre);
    const selectedEvent = getOptionByName(eventOptions, form.eventoNombre);

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),

      categoriaId: category.id,
      categoria: category.id,
      categoriaNombre: category.nombre,

      serieId: selectedSerie ? selectedSerie._id || selectedSerie.id : "",
      serie: selectedSerie ? selectedSerie._id || selectedSerie.id : form.serieNombre.trim(),
      serieNombre: form.serieNombre.trim(),

      eventoId: selectedEvent ? selectedEvent._id || selectedEvent.id : "",
      evento: selectedEvent ? selectedEvent._id || selectedEvent.id : form.eventoNombre.trim(),
      eventoNombre: form.eventoNombre.trim(),

      origen: origin.id || form.origenNombre.trim(),
      origenNombre: origin.nombre,
      pais: origin.nombre,

      tipo: form.tipoProducto.trim(),
      tipoProducto: form.tipoProducto.trim(),

      personajesNombre: form.personajesNombre,
      personajeNombre: form.personajesNombre.join(", "),

      material: form.material.trim(),
      precio: Number(form.precio || 0),
      precioReferencial: Number(form.precio || 0),
      price: Number(form.precio || 0),
      stock: Number(form.stock || 0),
      tamano: form.tamano.trim(),
      disponibilidad: form.disponibilidad,
      estado: form.estado,
      tiempoEstimado: form.tiempoEstimado.trim(),
      adulto: Boolean(form.adulto),
      esNuevo: Boolean(form.esNuevo),
      esDestacado: Boolean(form.esDestacado),
      activo: form.estado !== "Inactivo"
    };

    if (!editingProduct || imagesTouched) {
      payload.imagenes = await prepareImagesForPayload(images);
      payload.imagenesTouched = true;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre del producto.");
      return;
    }

    if (!form.categoriaNombre.trim()) {
      setMessage("Selecciona o crea una categoría.");
      return;
    }

    if (!form.tipoProducto.trim()) {
      setMessage("Escribe o selecciona el tipo de producto.");
      return;
    }

    if (Number(form.precio || 0) < 0) {
      setMessage("El precio no puede ser negativo.");
      return;
    }

    if (Number(form.stock || 0) < 0) {
      setMessage("El stock no puede ser negativo.");
      return;
    }

    if (!editingProduct && images.length === 0) {
      setMessage("Sube al menos una imagen del producto.");
      return;
    }

    setSaving(true);
    setMessage(
      editingProduct
        ? "Guardando cambios del producto..."
        : "Creando producto..."
    );

    try {
      for (const characterName of form.personajesNombre) {
        await createCharacterQuick({
          name: characterName,
          serie: form.serieNombre
        });
      }

      const payload = await buildPayload();

      if (editingProduct) {
        await updateProduct(getProductId(editingProduct), payload);
        setMessage("Producto actualizado correctamente.");
      } else {
        await createProduct(payload);
        setMessage("Producto creado correctamente.");
      }

      resetForm();
      await refreshProducts?.();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const productId = getProductId(product);

    if (!productId) {
      setMessage("No se encontró el ID del producto.");
      return;
    }

    setSaving(true);
    setMessage(
      product.activo ? "Desactivando producto..." : "Activando producto..."
    );

    try {
      await toggleProductStatus(productId);
      await refreshProducts?.();

      setMessage(
        product.activo
          ? "Producto desactivado correctamente."
          : "Producto activado correctamente."
      );
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado del producto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Productos</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de productos</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Crea y edita productos sin romper imágenes existentes. Si solo
              cambias evento, serie, categoría, precio, stock u origen, las
              imágenes se conservan tal como estaban.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <button
                type="button"
                onClick={refreshProducts}
                disabled={loadingProducts || saving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loadingProducts ? "animate-spin" : ""}
                />
                Recargar
              </button>
            )}

            {view === "list" ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="smika-button-primary flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Crear producto
              </button>
            ) : (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full bg-[#F7D9D8] px-5 py-3 font-black flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Volver
              </button>
            )}
          </div>
        </div>
      </div>

      {(message || storageError || productLoadError || categoriesLoadError || originsLoadError) && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message || storageError || productLoadError || categoriesLoadError || originsLoadError}
        </div>
      )}

      {view === "form" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] bg-white p-6 smika-shadow border border-[#87CCC8]/20"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[#87CCC8] font-black">
                {editingProduct ? "Editar producto" : "Nuevo producto"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingProduct
                  ? "Actualizar producto"
                  : "Registrar producto"}
              </h3>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="smika-button-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Nombre
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Stand de acrílico..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Descripción opcional
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="3"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Escribe una descripción visible en el detalle del producto. Si lo dejas vacío, se mostrará el texto por defecto."
              />
            </label>

            <CreatableSelect
              label="Categoría"
              value={form.categoriaNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  categoriaNombre: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={categoryOptions}
              placeholder="Buscar o escribir categoría"
              emptyLabel="Sin categoría"
              emptyCreateLabel="Agregar categoría"
              createLabel={(name) => `Agregar categoría “${name}”`}
              helperText="Si no existe, se creará y se guardará en MongoDB al guardar el producto."
            />

            <CreatableSelect
              label="Serie / Historia"
              value={form.serieNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  serieNombre: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={seriesOptions}
              placeholder="Buscar o escribir serie"
              emptyLabel="Sin serie"
              emptyCreateLabel="Agregar serie como texto"
              createLabel={(name) => `Usar serie “${name}”`}
            />

            <CreatableSelect
              label="Evento"
              value={form.eventoNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  eventoNombre: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={eventOptions}
              placeholder="Buscar o escribir evento"
              emptyLabel="Sin evento"
              emptyCreateLabel="Agregar evento como texto"
              createLabel={(name) => `Usar evento “${name}”`}
            />

            <CreatableSelect
              label="Origen / País"
              value={form.origenNombre}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  origenNombre: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={originOptions}
              placeholder="China, Corea, Japón, Variado..."
              emptyLabel="Sin origen"
              emptyCreateLabel="Agregar origen"
              createLabel={(name) => `Agregar origen “${name}”`}
              helperText="Si no existe, se creará y quedará guardado en MongoDB."
            />

            <CreatableSelect
              label="Tipo de producto"
              value={form.tipoProducto}
              onChange={(value) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  tipoProducto: value
                }))
              }
              onCreate={handleSimpleCreatableCreate}
              options={typeOptions}
              placeholder="Stand, llavero, photocard..."
              emptyLabel="Sin tipo"
              emptyCreateLabel="Agregar tipo"
              createLabel={(name) => `Usar tipo “${name}”`}
            />

            <label className="grid gap-2 text-sm font-black">
              Material
              <input
                name="material"
                value={form.material}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Acrílico, papel, metal..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Precio referencial
              <input
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Stock numérico
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: 10"
              />
            </label>

            <CreatableSelect
              label="Disponibilidad"
              value={selectedAvailability?.nombre || "En stock"}
              onChange={handleAvailabilityChange}
              options={disponibilidadOptions}
              placeholder="Seleccionar disponibilidad"
              emptyLabel="En stock"
              disabled={false}
            />

            <label className="grid gap-2 text-sm font-black">
              Mensaje de disponibilidad / tiempo estimado
              <input
                name="tiempoEstimado"
                value={form.tiempoEstimado}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: Llega en 15 días, disponible por pedido..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Tamaño
              <input
                name="tamano"
                value={form.tamano}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="10 cm, A5, estándar..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Estado interno
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                <option value="Activo">Activo</option>
                <option value="Preventa">Preventa</option>
                <option value="Por pedido">Por pedido</option>
                <option value="Agotado">Agotado</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </label>

            <div className="grid gap-3 rounded-3xl bg-[#F8F6F7] p-4 lg:col-span-2">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Producto nuevo
                <input
                  type="checkbox"
                  name="esNuevo"
                  checked={form.esNuevo}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Destacado
                <input
                  type="checkbox"
                  name="esDestacado"
                  checked={form.esDestacado}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Producto adulto
                <input
                  type="checkbox"
                  name="adulto"
                  checked={form.adulto}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>
            </div>

            <div className="lg:col-span-2">
              <MultiTextInput
                label="Personajes / criaturas"
                values={form.personajesNombre}
                setValues={(updater) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    personajesNombre:
                      typeof updater === "function"
                        ? updater(currentForm.personajesNombre)
                        : updater
                  }))
                }
                options={characterOptions}
                placeholder="Ejemplo: Shuraka"
                helperText="Si escribes un personaje que no existe, se creará como faltan detalles."
              />
            </div>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Imágenes del producto</p>

              <p className="mt-1 text-sm text-gray-600 leading-6">
                Si editas y no tocas esta zona, las imágenes guardadas no se
                envían otra vez ni se modifican. Si agregas una nueva, se
                conservan las anteriores y se agrega la nueva.
              </p>

              <div className="mt-4">
                <ImageDropzone
                  label="Subir imágenes"
                  description="Arrastra o selecciona imágenes del producto."
                  images={images}
                  setImages={setImagesAndTouch}
                  multiple
                />
              </div>
            </div>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Vista previa</p>

              {images.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {images.map((image, index) => (
                    <CroppedImagePreview
                      key={image.id || index}
                      image={image}
                      alt={`Imagen ${index + 1}`}
                      className="aspect-square w-full"
                      rounded="rounded-2xl"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex h-48 items-center justify-center rounded-3xl bg-white text-gray-400">
                  <ImageIcon size={42} />
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          {loadingProducts ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando productos...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <ShoppingBag size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay productos
              </h3>

              <p className="mt-2 text-gray-600">
                Crea un producto para verlo en el catálogo.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {sortedProducts.map((product) => {
                const firstImage = Array.isArray(product.imagenes)
                  ? product.imagenes[0]
                  : null;

                return (
                  <article
                    key={getProductId(product)}
                    className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
                  >
                    <div className="h-44 bg-[#F8F6F7]">
                      {firstImage ? (
                        <CroppedImagePreview
                          image={firstImage}
                          alt={product.nombre}
                          className="h-full w-full"
                          rounded="rounded-none"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          <ImageIcon size={36} />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                          {product.activo ? "Activo" : "Inactivo"}
                        </span>

                        <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                          {product.estado || "Activo"}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {product.nombre}
                      </h3>

                      <div className="mt-3 grid gap-2 text-sm text-gray-600">
                        <p>
                          <strong>Categoría:</strong>{" "}
                          {getProductCategoryName(product) || "Sin categoría"}
                        </p>

                        <p>
                          <strong>Tipo:</strong>{" "}
                          {getProductType(product) || "Sin tipo"}
                        </p>

                        <p>
                          <strong>Serie:</strong>{" "}
                          {getProductSeriesName(product) || "Sin serie"}
                        </p>

                        <p>
                          <strong>Evento:</strong>{" "}
                          {getProductEventName(product) || "Sin evento"}
                        </p>

                        <p>
                          <strong>Origen:</strong>{" "}
                          {getProductOriginName(product) || "Sin origen"}
                        </p>

                        <p>
                          <strong>Precio:</strong> S/ {getProductPrice(product)}
                        </p>

                        <p>
                          <strong>Stock:</strong> {product.stock || 0}
                        </p>

                        {product.tiempoEstimado && (
                          <p>
                            <strong>Disponibilidad:</strong>{" "}
                            {product.tiempoEstimado}
                          </p>
                        )}

                        <p>
                          <strong>Imágenes:</strong>{" "}
                          {Array.isArray(product.imagenes)
                            ? product.imagenes.length
                            : 0}
                        </p>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(product)}
                          disabled={saving}
                          className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                          title={product.activo ? "Desactivar" : "Activar"}
                        >
                          <Power
                            size={17}
                            className={
                              product.activo ? "text-gray-500" : "text-red-500"
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminProductsPage;
