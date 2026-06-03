import { ArrowLeft, Construction, Save } from "lucide-react";
import { Link } from "react-router-dom";

function AdminPlaceholderPage({
  eyebrow = "Panel administrativo",
  title = "Sección en preparación",
  description = "Esta sección está lista para ser conectada con nuevas funciones del panel.",
  buttonText = "Guardar cambios"
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-pink-100 bg-white/95 p-6 shadow-sm shadow-pink-100/70 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm font-semibold text-pink-600 transition hover:text-pink-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-pink-400">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-black text-slate-900 md:text-4xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-2xl bg-pink-50 px-4 py-3 text-sm font-bold text-pink-700 ring-1 ring-pink-100 lg:self-center">
          <Construction className="h-5 w-5" />
          En preparación
        </div>
      </div>

      <div className="rounded-[2rem] border border-dashed border-pink-200 bg-pink-50/70 p-8 text-center shadow-sm shadow-pink-100/60">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-pink-500 shadow-sm shadow-pink-100">
          <Save className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-xl font-black text-slate-900">
          Función pendiente de conexión
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Esta pantalla evita errores de navegación mientras se termina de implementar el módulo. No afecta productos, imágenes, eventos, variantes ni creadores.
        </p>

        <button
          type="button"
          disabled
          className="mt-6 inline-flex cursor-not-allowed items-center justify-center rounded-2xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500"
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}

export default AdminPlaceholderPage;
