import { Link } from "react-router-dom";
import { Bell, CalendarDays } from "lucide-react";

import { mockEvents } from "../../data/mockEvents";

function EventSchedulePage() {
  const isLoggedIn = false;

  return (
    <section className="container-smika py-12">
      <div className="rounded-[32px] bg-[#F8F6F7] p-8 mb-8">
        <p className="text-[#87CCC8] font-black">Cronograma</p>

        <h2 className="text-4xl font-black mt-2">
          Programación de eventos
        </h2>

        <p className="mt-3 text-gray-600 max-w-3xl leading-7">
          Aquí se mostrarán los eventos actuales y próximos de Smika Store.
          Los usuarios registrados podrán guardar eventos próximos para recibir
          avisos o consultarlos desde su cuenta.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {mockEvents.map((event) => (
          <article
            key={event.id}
            className="smika-card smika-shadow overflow-hidden"
          >
            <Link to={`/programacion-eventos/${event.slug}`}>
              <img
                src={event.images[0]}
                alt={event.title}
                className="h-56 w-full object-cover transition duration-300 hover:scale-105"
              />
            </Link>

            <div className="p-6">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    event.status === "actual"
                      ? "bg-[#87CCC8] text-white"
                      : "bg-[#F7D9D8] text-[#2F2F2F]"
                  }`}
                >
                  {event.status === "actual" ? "Actual" : "Próximo"}
                </span>

                <CalendarDays size={20} className="text-[#D1B0C7]" />
              </div>

              <Link to={`/programacion-eventos/${event.slug}`}>
                <h3 className="mt-4 text-2xl font-black hover:text-[#87CCC8]">
                  {event.title}
                </h3>
              </Link>

              <p className="mt-2 text-sm font-bold text-gray-500">
                {event.date}
              </p>

              <p className="mt-3 text-gray-600 leading-6">
                {event.description}
              </p>

              <Link
                to={`/programacion-eventos/${event.slug}`}
                className="mt-5 smika-button w-full flex items-center justify-center"
              >
                Ver evento
              </Link>

              {event.status === "proximo" && (
                <>
                  {isLoggedIn ? (
                    <button className="mt-3 smika-button-primary w-full">
                      Guardar evento
                    </button>
                  ) : (
                    <Link
                      to="/registro"
                      className="mt-3 smika-button-primary w-full flex items-center justify-center gap-2"
                    >
                      <Bell size={18} />
                      Registrarme para guardar
                    </Link>
                  )}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default EventSchedulePage;