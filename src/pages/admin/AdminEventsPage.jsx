import { Plus, Pencil, Image, Boxes } from "lucide-react";

import { adminEvents } from "../../data/adminMockData";

function AdminEventsPage() {
  return (
    <section>
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Eventos</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de eventos</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Crea eventos como Lebom, Café o Fantazit, agrega duración,
              descripción, carrusel de imágenes y productos vinculados.
            </p>
          </div>

          <button className="smika-button-primary flex items-center gap-2">
            <Plus size={18} />
            Crear evento
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {adminEvents.map((event) => (
          <article
            key={event.id}
            className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
          >
            <div className="h-44 bg-[#87CCC8] flex items-center justify-center text-white text-3xl font-black">
              {event.nombre}
            </div>

            <div className="p-6">
              <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                {event.estado}
              </span>

              <h3 className="mt-4 text-2xl font-black">{event.nombre}</h3>

              <div className="mt-3 grid gap-2 text-sm text-gray-600">
                <p><strong>Tipo:</strong> {event.tipo}</p>
                <p><strong>Serie:</strong> {event.serie}</p>
                <p><strong>País:</strong> {event.pais}</p>
                <p><strong>Duración:</strong> {event.duracion}</p>
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
                  <Boxes size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminEventsPage;