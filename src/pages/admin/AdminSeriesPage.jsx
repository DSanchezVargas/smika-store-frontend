import { Plus, Pencil, Image, UsersRound } from "lucide-react";

import { adminSeries } from "../../data/adminMockData";

function AdminSeriesPage() {
  return (
    <section>
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Series / Historias</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de series e historias</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Crea series con nombre, categoría, país, tipo, género, autor,
              icono, portada, personajes opcionales y año de publicación.
            </p>
          </div>

          <button className="smika-button-primary flex items-center gap-2">
            <Plus size={18} />
            Crear serie
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        {adminSeries.map((serie) => (
          <article
            key={serie.id}
            className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
          >
            <div className="h-40 bg-[#D1B0C7] flex items-center justify-center text-white text-2xl text-center font-black px-5">
              {serie.nombre}
            </div>

            <div className="p-6">
              <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                {serie.estado}
              </span>

              <h3 className="mt-4 text-xl font-black">{serie.nombre}</h3>

              <div className="mt-3 grid gap-2 text-sm text-gray-600">
                <p><strong>Categoría:</strong> {serie.categoria}</p>
                <p><strong>País:</strong> {serie.pais}</p>
                <p><strong>Tipo:</strong> {serie.tipo}</p>
                <p><strong>Género:</strong> {serie.genero}</p>
                <p><strong>Año:</strong> {serie.anio}</p>
              </div>

              <div className="mt-5 flex gap-2">
                <button className="smika-button-primary flex-1 flex items-center justify-center gap-2">
                  <Pencil size={16} />
                  Editar
                </button>

                <button className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center">
                  <Image size={17} />
                </button>

                <button className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center">
                  <UsersRound size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminSeriesPage;