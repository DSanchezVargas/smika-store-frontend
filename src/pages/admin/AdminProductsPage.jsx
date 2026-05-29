import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  ShoppingBag
} from "lucide-react";

import FormSection from "../../components/admin/FormSection";
import ImageDropzone from "../../components/admin/ImageDropzone";
import SwitchInput from "../../components/admin/SwitchInput";
import MultiCreatableSelect from "../../components/admin/MultiCreatableSelect";
import CroppedImagePreview from "../../components/admin/CroppedImagePreview";

import { useAdminData } from "../../context/AdminDataContext";
import { prepareProductImagesForSave } from "../../utils/prepareProductImagesForSave";

const DEFAULT_AVAILABILITY_TEXT = "Disponibilidad por confirmar con Smika Store 💖";

const initialForm = {
  nombre: "",
  serie: "",
  tipo: "",
  evento: "",
  personajes: [],
  material: "",
  precio: "",
  stock: "",
  tamano: "",
  estado: "Activo",
  adulto: false
};

const productTypes = [
  "Stand de acrílico",
  "Pin",
  "Photocard",
  "Tomo",
  "Merch",
  "Pack"
];

function getProductId(product) {
  return product?._id || product?.id || "";
}

function getProductPrice(product) {
  return Number(
    product?.precioReferencial || product?.precio || product?.price || 0
  );
}

function getProductType(product) {
  return product?.tipoProducto || product?.tipo || product?.type || "";
}

function getProductSerie(product) {
  if (product?.serie && typeof product.serie === "object") {
    return product.serie.nombre || "";
  }

  return product?.serieNombre || product?.serie || "";
}

function getProductEvento(product) {
  if (product?.evento && typeof product.evento === "object") {
    return product.evento.titulo || product.evento.nombre || "";
  }

  return product?.eventoNombre || product?.evento || "";
}

function normalizePersonajesFromProduct(product) {
  if (Array.isArray(product?.personajesNombre)) {
    return product.personajesNombre.filter(Boolean);
  }

  if (Array.isArray(product?.personajes)) {
    return product.personajes
      .map((personaje) => {
        if (personaje && typeof personaje === "object") {
          return personaje.nombre || personaje.name || "";
        }

        return "";
      })
      .filter(Boolean);
  }

  if (product?.personajeNombre) {
    return product.personajeNombre
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  }

  if (product?.personaje) {
    return product.personaje
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  }

  return [];
}

function parseStockOrAvailability(value) {
  const cleanValue =
    value === undefined || value === null ? "" : value.toString().trim();

  const isNumeric = /^\d+$/.test(cleanValue);

  if (isNumeric) {
    return {
      stock: Number(cleanValue),
      tiempoEstimado: "",
      disponibilidad: Number(cleanValue) > 0 ? "stock" : "por_pedido"
    };
  }

  return {
    stock: 0,
    tiempoEstimado: cleanValue || DEFAULT_AVAILABILITY_TEXT,
    disponibilidad: "por_pedido"
  };
}

function getStockInputFromProduct(product) {
  const stock = Number(product?.stock || 0);
  const availabilityText = product?.tiempoEstimado || "";

  if (availabilityText && stock <= 0) return availabilityText;

  return stock ? String(stock) : "";
}

function getAvailabilitySummary(product) {
  const stock = Number(product?.stock || 0);

  if (stock > 0) {
    return `Cantidad disponible: ${stock}`;
  }

  if (product?.tiempoEstimado) {
    return "Disponibilidad por confirmar";
  }

  return "Sin cantidad fija";
}

function AdminProductsPage() {
  const {
    products,
    events,
    series,
    characters,
    storageError,
    productLoadError,
    loadingProducts,
    createProduct,
    updateProduct,
    toggleProductStatus,
    createCharacterQuick,
    refreshProducts
  } = useAdminData();

  const [view, setView] = useState("list");
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const activeSeries = useMemo(
    () => (series || []).filter((item) => item.activo !== false),
    [series]
  );

  const activeEvents = useMemo(
    () => (events || []).filter((item) => item.activo !== false),
    [events]
  );

  const activeCharacters = useMemo(
    () => (characters || []).filter((item) => item.activo !== false),
    [characters]
  );

  const resetForm = () => {
    setForm(initialForm);
    setImages([]);
    setEditingProduct(null);
  };

  const openCreateForm = () => {
    resetForm();
    setMessage("");
    setView("form");
  };

  const openEditForm = (product) => {
    setEditingProduct(product);

    setForm({
      nombre: product.nombre || "",
      serie: getProductSerie(product),
      tipo: getProductType(product),
      evento: getProductEvento(product),
      personajes: normalizePersonajesFromProduct(product),
      material: product.material || "",
      precio: getProductPrice(product),
      stock: getStockInputFromProduct(product),
      tamano: product.tamano || "",
      estado: product.estado || "Activo",
      adulto: Boolean(product.adulto)
    });

    setImages(product.imagenes || []);
    setMessage("");
    setView("form");
  };

  const goBackToList = () => {
    resetForm();
    setView("list");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre del producto.");
      return;
    }

    if (!form.serie.trim()) {
      setMessage("Selecciona una serie.");
      return;
    }

    if (!form.tipo.trim()) {
      setMessage("Selecciona el tipo de producto.");
      return;
    }

    if (!form.precio || Number(form.precio) <= 0) {
      setMessage("Ingresa un precio válido.");
      return;
    }

    setIsSaving(true);
    setMessage("Guardando producto...");

    try {
      const preparedImages = await prepareProductImagesForSave(images);
      const stockData = parseStockOrAvailability(form.stock);

      const personajesNombre = Array.isArray(form.personajes)
        ? form.personajes.filter(Boolean)
        : [];

      const payload = {
        nombre: form.nombre.trim(),
        descripcion:
          editingProduct?.descripcion ||
          "Producto registrado desde el panel administrador de Smika Store.",

        serie: form.serie,
        serieNombre: form.serie,

        tipo: form.tipo,
        tipoProducto: form.tipo,

        evento: form.evento,
        eventoNombre: form.evento,

        personajes: [],
        personajesNombre,
        personaje: personajesNombre[0] || "",
        personajeNombre: personajesNombre.join(", "),

        material: form.material,
        tamano: form.tamano,

        precio: Number(form.precio),
        price: Number(form.precio),
        precioReferencial: Number(form.precio),

        stock: stockData.stock,
        tiempoEstimado: stockData.tiempoEstimado,
        estado: form.estado,
        disponibilidad:
          form.estado === "Preventa"
            ? "preventa"
            : form.estado === "Agotado"
            ? "agotado"
            : stockData.disponibilidad,

        adulto: Boolean(form.adulto),
        imagenes: preparedImages,
        activo: form.estado !== "Inactivo",

        categoriaNombre: "Productos",
        origenNombre: "Variado",
        marca: "Smika Store",
        esNuevo: editingProduct?.esNuevo ?? true,
        esDestacado: editingProduct?.esDestacado ?? false
      };

      if (editingProduct) {
        await updateProduct(getProductId(editingProduct), payload);
        setMessage("Producto actualizado correctamente.");
      } else {
        await createProduct(payload);
        setMessage("Producto creado correctamente.");
      }

      resetForm();
      setView("list");
      await refreshProducts?.();
    } catch (error) {
      setMessage(
        error.message ||
          "No se pudo guardar el producto. Revisa tu sesión de administrador o la conexión con el servidor."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProductStatus = async (product) => {
    try {
      setIsSaving(true);
      setMessage(
        product.activo
          ? "Desactivando producto..."
          : "Activando producto..."
      );

      await toggleProductStatus(getProductId(product));
      await refreshProducts?.();

      setMessage(
        product.activo
          ? "Producto desactivado correctamente."
          : "Producto activado correctamente."
      );
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado del producto.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 smika-shadow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-black text-[#87CCC8]">Productos</p>

            <h1 className="mt-2 text-3xl font-black text-[#2F2F2F]">
              Gestión de productos
            </h1>

            <p className="mt-3 text-sm text-gray-600">
              Desde aquí puedes crear, editar, activar o desactivar productos
              del catálogo de Smika Store.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <button
                type="button"
                onClick={refreshProducts}
                disabled={loadingProducts || isSaving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loadingProducts ? "animate-spin" : ""}
                />
                Recargar productos
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
                onClick={goBackToList}
                className="rounded-full bg-[#F7D9D8] px-5 py-3 font-black flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Volver a productos
              </button>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message}
        </div>
      )}

      {storageError && (
        <div className="rounded-[24px] bg-red-50 px-5 py-4 text-sm font-black text-red-600">
          {storageError}
        </div>
      )}

      {productLoadError && (
        <div className="rounded-[24px] bg-red-50 px-5 py-4 text-sm font-black text-red-600">
          {productLoadError}
        </div>
      )}

      {view === "list" && (
        <div className="rounded-[28px] bg-white p-5 smika-shadow">
          <h2 className="text-2xl font-black text-[#2F2F2F]">
            Productos registrados
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Esta lista muestra los productos disponibles para administrar dentro
            del catálogo.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="bg-[#F8F6F7] text-[#2F2F2F]">
                  <th className="px-4 py-4 font-black">Producto</th>
                  <th className="px-4 py-4 font-black">Serie</th>
                  <th className="px-4 py-4 font-black">Tipo</th>
                  <th className="px-4 py-4 font-black">Evento</th>
                  <th className="px-4 py-4 font-black">Precio</th>
                  <th className="px-4 py-4 font-black text-center">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {(products || []).map((product) => {
                  const productId = getProductId(product);

                  return (
                    <tr
                      key={productId || product.slug}
                      className="border-b border-[#F8F6F7] last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#87CCC8] text-white flex items-center justify-center">
                            {product.imagenes?.[0] ? (
                              <CroppedImagePreview
                                image={product.imagenes[0]}
                                alt={product.nombre}
                                className="h-full w-full"
                                rounded="rounded-2xl"
                              />
                            ) : (
                              <ShoppingBag size={18} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-black text-[#2F2F2F]">
                              {product.nombre}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {getAvailabilitySummary(product)} ·{" "}
                              {product.estado || "Activo"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">{getProductSerie(product)}</td>
                      <td className="px-4 py-4">{getProductType(product)}</td>
                      <td className="px-4 py-4">
                        {getProductEvento(product) || "Sin evento"}
                      </td>

                      <td className="px-4 py-4 font-black">
                        S/ {getProductPrice(product)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(product)}
                            className="h-10 w-10 rounded-full bg-[#F7D9D8] flex items-center justify-center"
                            title="Editar producto"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleProductStatus(product)}
                            disabled={isSaving}
                            className="h-10 w-10 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                            title={
                              product.activo
                                ? "Desactivar producto"
                                : "Activar producto"
                            }
                          >
                            <Power
                              size={16}
                              className={
                                product.activo
                                  ? "text-gray-500"
                                  : "text-red-500"
                              }
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {(!products || products.length === 0) && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      Todavía no hay productos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "form" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection
            title={editingProduct ? "Editar producto" : "Crear producto"}
            description="Completa los datos principales del producto. Al guardar se actualizará el catálogo de la tienda."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-sm font-black">
                  Nombre del producto
                </label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                  placeholder="Ejemplo: Pin Tei Adulto"
                />
              </div>

              <div>
                <label className="text-sm font-black">Serie</label>
                <select
                  name="serie"
                  value={form.serie}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                >
                  <option value="">Seleccionar serie</option>
                  {activeSeries.map((item) => (
                    <option
                      key={item.id || item.slug || item.nombre}
                      value={item.nombre}
                    >
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-black">
                  Tipo de producto
                </label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                >
                  <option value="">Seleccionar tipo</option>
                  {productTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-black">Evento opcional</label>
                <select
                  name="evento"
                  value={form.evento}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                >
                  <option value="">Sin evento</option>
                  {activeEvents.map((eventItem) => (
                    <option
                      key={eventItem.id || eventItem.slug || eventItem.nombre}
                      value={eventItem.nombre}
                    >
                      {eventItem.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-black">Material</label>
                <input
                  name="material"
                  value={form.material}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                  placeholder="Acrílico, metal, papel..."
                />
              </div>

              <div>
                <label className="text-sm font-black">Tamaño opcional</label>
                <input
                  name="tamano"
                  value={form.tamano}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                  placeholder="Ejemplo: 7 cm"
                />
              </div>

              <div>
                <label className="text-sm font-black">Precio referencial</label>
                <input
                  name="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                  placeholder="15"
                />
              </div>

              <div>
                <label className="text-sm font-black">
                  Cantidad o disponibilidad
                </label>
                <input
                  name="stock"
                  type="text"
                  value={form.stock}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                  placeholder="15 o Disponibilidad por confirmar con Smika Store 💖"
                />
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Escribe un número si hay unidades exactas. Si no hay cantidad
                  fija, escribe un mensaje como “Disponibilidad por confirmar
                  con Smika Store 💖”.
                </p>
              </div>

              <div>
                <label className="text-sm font-black">Estado</label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                >
                  <option value="Activo">Activo</option>
                  <option value="Preventa">Preventa</option>
                  <option value="Agotado">Agotado</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Personajes"
            description="Puedes elegir uno o varios personajes relacionados con el producto."
          >
            <MultiCreatableSelect
              label="Personajes opcionales"
              values={form.personajes}
              onChange={(values) =>
                setForm({
                  ...form,
                  personajes: values
                })
              }
              options={activeCharacters}
              onCreate={(name) =>
                createCharacterQuick({
                  name,
                  serie: form.serie || ""
                })
              }
              onSecondaryCreate={(name) =>
                createCharacterQuick({
                  name,
                  serie: ""
                })
              }
              placeholder="Escribe un personaje, por ejemplo: Tamon"
              emptyLabel="Sin personajes"
              emptyCreateLabel="Agregar personaje"
              createLabel={(name) =>
                form.serie
                  ? `Agregar personaje “${name}” a “${form.serie}”`
                  : `Agregar personaje “${name}”`
              }
              secondaryCreateLabel={(name) =>
                form.serie
                  ? `Agregar personaje “${name}” sin asociar a serie`
                  : `Agregar personaje “${name}” sin serie definida`
              }
              helperText={
                form.serie
                  ? `Puedes seleccionar varios personajes y asociar nuevos a “${form.serie}”.`
                  : "Puedes elegir o crear varios personajes aunque todavía no hayas seleccionado una serie."
              }
            />
          </FormSection>

          <FormSection
            title="Configuración"
            description="Marca si el producto requiere aviso de contenido adulto."
          >
            <SwitchInput
              label="Producto +18"
              description="Activa esta opción si el producto requiere advertencia para el cliente."
              checked={form.adulto}
              onChange={(checked) =>
                setForm({
                  ...form,
                  adulto: checked
                })
              }
            />
          </FormSection>

          <FormSection
            title="Imágenes del producto"
            description="La primera imagen se mostrará como miniatura en el listado."
          >
            <ImageDropzone
              label="Subir imágenes del producto"
              description="Arrastra imágenes o selecciónalas. El sistema comprimirá y preparará el recorte final."
              images={images}
              setImages={setImages}
              multiple
            />
          </FormSection>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={goBackToList}
              className="rounded-full bg-[#F8F6F7] px-6 py-3 font-black"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="smika-button-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save size={18} />
              {isSaving
                ? "Guardando..."
                : editingProduct
                ? "Guardar cambios"
                : "Crear producto"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default AdminProductsPage;