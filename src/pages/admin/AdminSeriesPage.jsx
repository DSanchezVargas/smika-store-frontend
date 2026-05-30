import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  UsersRound
} from "lucide-react";

import { useAdminData } from "../../context/AdminDataContext";
import AutoCarousel from "../../components/common/AutoCarousel";

const initialForm = {
  nombre: "",
  descripcion: "",
  imagen: "",
  imagenesTexto: "",
  categoriaNombre: "Series",
  origenNombre: "Variado",
  pais: "V",
  tipo: "Historia",
  genero: "",
  autor: "",
  destacada: false,
  activa: true,
  orden: 0
};

function getId(item) {
  return item?._id || item?.id || "";
}

function getSeriesStatus(serie) {
  if (serie.activo === false || serie.activa === false) return "Inactiva";
  if (serie.destacada) return "Destacada";
  return "Activa";
}

function getImagesFromForm(form) {
  const imagesFromText = form.imagenesTexto
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allImages = [form.imagen.trim(), ...imagesFromText].filter(Boolean);

  return [...new Set(allImages)];
}

function AdminSeriesPage() {
  const {
    series,
    loadingSeries,
    seriesLoadError,
    refreshSeries,
    createSeriesFull,
    updateSeriesFull,
    toggleSeriesStatus
  } = useAdminData();

  const [view, setView] = useState("list");
  const [editingSeries, setEditingSeries] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedSeries = useMemo(() => {
    return [...(series || [])].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [series]);

  const previewImages = useMemo(() => {
    return getImagesFromForm(form);
  }, [form.imagen, form.imagenesTexto]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingSeries(null);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingSeries(null);
    setForm(initialForm);
    setView("form");
  };

  const openEditForm = (serie) => {
    setMessage("");
    setEditingSeries(serie);

    const imagenes = Array.isArray(serie.imagenes)
      ? serie.imagenes.filter(Boolean)
      : [];

    const mainImage = serie.imagen || imagenes[0] || "";

    const extraImages = imagenes.filter((image) => image !== mainImage);

    setForm({
      nombre: serie.nombre || "",
      descripcion: serie.descripcion || "",
      imagen: mainImage,
      imagenesTexto: extraImages.join(", "),
      categoriaNombre:
        serie.categoriaPrincipalNombre ||
        serie.categoriaNombre ||
        serie.categoria ||
        "Series",
      origenNombre: serie.origenNombre || serie.origen || "Variado",
      pais: serie.pais || "V",
      tipo: serie.tipo || "Historia",
      genero: serie.genero || "",
      autor: serie.autor || serie.creadoresNombre?.join(", ") || "",
      destacada: Boolean(serie.destacada),
      activa: serie.activo !== false && serie.activa !== false,
      orden: Number(serie.orden || 0)
    });

    setView("form");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const buildPayload = () => {
    const cleanAutor = form.autor
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const imagenes = getImagesFromForm(form);

    return {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),

      imagen: form.imagen.trim() || imagenes[0] || "",
      imagenes,

      categoriaPrincipalNombre: form.categoriaNombre.trim() || "Series",
      categoriaNombre: form.categoriaNombre.trim() || "Series",

      origenNombre: form.origenNombre.trim() || "Variado",
      pais: form.pais.trim() || "V",

      tipo: form.tipo.trim() || "Historia",
      genero: form.genero.trim(),

      autor: form.autor.trim(),
      creadoresNombre: cleanAutor,

      destacada: Boolean(form.destacada),
      activa: Boolean(form.activa),
      activo: Boolean(form.activa),

      orden: Number(form.orden || 0)
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim()) {
      setMessage("Escribe el nombre de la serie o historia.");
      return;
    }

    setSaving(true);
    setMessage(editingSeries ? "Actualizando serie..." : "Creando serie...");

    try {
      const payload = buildPayload();

      if (editingSeries) {
        await updateSeriesFull(getId(editingSeries), payload);
        setMessage("Serie actualizada correctamente.");
      } else {
        await createSeriesFull(payload);
        setMessage("Serie creada correctamente.");
      }

      resetForm();
      await refreshSeries?.();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar la serie.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (serie) => {
    const seriesId = getId(serie);

    if (!seriesId) {
      setMessage("No se encontró el ID de la serie.");
      return;
    }

    setSaving(true);
    setMessage(serie.activo ? "Desactivando serie..." : "Activando serie...");

    try {
      await toggleSeriesStatus(seriesId);
      await refreshSeries?.();

      setMessage(
        serie.activo
          ? "Serie desactivada correctamente."
          : "Serie activada correctamente."
      );
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado de la serie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Series / Historias</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">
              Gestión de series e historias
            </h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Crea, edita, activa o desactiva historias y series. Ahora puedes
              agregar varias imágenes para que se muestren en carrusel.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <button
                type="button"
                onClick={refreshSeries}
                disabled={loadingSeries || saving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loadingSeries ? "animate-spin" : ""}
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
                Crear serie
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

      {message && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message}
        </div>
      )}

      {seriesLoadError && (
        <div className="rounded-[24px] bg-red-50 px-5 py-4 text-sm font-black text-red-600">
          {seriesLoadError}
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
                {editingSeries ? "Editar serie" : "Nueva serie"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {editingSeries
                  ? "Actualizar datos de la serie"
                  : "Registrar nueva serie"}
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
              Guardar
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Nombre de la serie / historia
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Ejemplo: La Ventura del Caballero Blanco"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Categoría
              <input
                name="categoriaNombre"
                value={form.categoriaNombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Series, Manhwa, Manhua, Novela..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              País / origen visible
              <input
                name="origenNombre"
                value={form.origenNombre}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="China, Corea, Japón, Variado..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Código de país
              <select
                name="pais"
                value={form.pais}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                <option value="CN">China / CN</option>
                <option value="KR">Corea / KR</option>
                <option value="JP">Japón / JP</option>
                <option value="V">Variado / V</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Tipo
              <input
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Historia, Manhwa, Manhua, Novela..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Género
              <input
                name="genero"
                value={form.genero}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="BL, romance, fantasía..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Autor/a o creador/a
              <input
                name="autor"
                value={form.autor}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Puedes separar varios por coma"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Imagen principal
              <input
                name="imagen"
                value={form.imagen}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="URL o ruta de la imagen principal"
              />
            </label>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Imágenes adicionales
              <input
                name="imagenesTexto"
                value={form.imagenesTexto}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Pega varias URLs separadas por coma"
              />
              <span className="text-xs font-semibold text-gray-500">
                Ejemplo: imagen1.jpg, imagen2.jpg, imagen3.jpg
              </span>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Orden
              <input
                name="orden"
                type="number"
                value={form.orden}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="0"
              />
            </label>

            <div className="grid gap-3 rounded-3xl bg-[#F8F6F7] p-4">
              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Destacada
                <input
                  type="checkbox"
                  name="destacada"
                  checked={form.destacada}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between gap-4 text-sm font-black">
                Activa
                <input
                  type="checkbox"
                  name="activa"
                  checked={form.activa}
                  onChange={handleChange}
                  className="h-5 w-5"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Descripción
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Describe brevemente la serie o historia..."
              />
            </label>

            <div className="lg:col-span-2 rounded-[28px] bg-[#F8F6F7] p-5">
              <p className="font-black">Vista previa del carrusel</p>
              <p className="mt-1 text-sm text-gray-600">
                Las imágenes se moverán automáticamente cada 6 segundos y
                también podrán moverse con flechas.
              </p>

              <div className="mt-4">
                <AutoCarousel
                  images={previewImages}
                  alt={form.nombre || "Serie Smika"}
                  heightClassName="h-72"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          {loadingSeries ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando series...</p>
            </div>
          ) : sortedSeries.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <UsersRound size={42} className="mx-auto text-[#D1B0C7]" />
              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay series registradas
              </h3>
              <p className="mt-2 text-gray-600">
                Crea una serie para usarla luego en productos.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-3">
              {sortedSeries.map((serie) => {
                const serieImages =
                  Array.isArray(serie.imagenes) && serie.imagenes.length > 0
                    ? serie.imagenes
                    : serie.imagen
                    ? [serie.imagen]
                    : [];

                return (
                  <article
                    key={getId(serie)}
                    className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
                  >
                    <AutoCarousel
                      images={serieImages}
                      alt={serie.nombre}
                      heightClassName="h-44"
                      className="rounded-none"
                    />

                    <div className="p-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                          {getSeriesStatus(serie)}
                        </span>

                        {serie.pais && (
                          <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                            {serie.pais}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {serie.nombre}
                      </h3>

                      <div className="mt-3 grid gap-2 text-sm text-gray-600">
                        <p>
                          <strong>Categoría:</strong>{" "}
                          {serie.categoriaNombre || "Series"}
                        </p>

                        <p>
                          <strong>Origen:</strong>{" "}
                          {serie.origenNombre || "Variado"}
                        </p>

                        <p>
                          <strong>Tipo:</strong> {serie.tipo || "Historia"}
                        </p>

                        {serie.genero && (
                          <p>
                            <strong>Género:</strong> {serie.genero}
                          </p>
                        )}

                        {serie.autor && (
                          <p>
                            <strong>Autor/a:</strong> {serie.autor}
                          </p>
                        )}

                        <p>
                          <strong>Imágenes:</strong> {serieImages.length}
                        </p>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(serie)}
                          className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(serie)}
                          disabled={saving}
                          className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                          title={serie.activo ? "Desactivar" : "Activar"}
                        >
                          <Power
                            size={17}
                            className={
                              serie.activo ? "text-gray-500" : "text-red-500"
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

export default AdminSeriesPage;