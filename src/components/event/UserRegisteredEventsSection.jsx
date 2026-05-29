import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight } from "lucide-react";

import { mockEvents } from "../../data/mockEvents";
import { mockCurrentUser } from "../../data/mockUser";

function UserRegisteredEventsSection({ title = "Mis eventos registrados" }) {
  const registeredEvents = mockEvents.filter((event) =>
    mockCurrentUser.registeredEventSlugs.includes(event.slug)
  );

  if (!mockCurrentUser.isLoggedIn) {
    return null;
  }

  if (registeredEvents.length === 0) {
    return (
      <section className="container-smika py-10">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8">
          <p className="text-[#87CCC8] font-black">Eventos</p>
          <h2 className="text-3xl font-black mt-2">{title}</h2>
          <p className="mt-3 text-gray-600">
            Aún no tienes eventos guardados. Explora la programación y guarda
            los eventos próximos que te interesen.
          </p>

          <Link
            to="/programacion-eventos"
            className="mt-6 smika-button-primary inline-flex items-center gap-2"
          >
            Ver programación
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-smika py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[#87CCC8] font-black">Eventos</p>
          <h2 className="text-3xl font-black">{title}</h2>
          <p className="mt-2 text-gray-600">
            Eventos que guardaste para seguir su programación o recibir avisos.
          </p>
        </div>

        <Link
          to="/programacion-eventos"
          className="hidden sm:flex items-center gap-2 font-bold"
        >
          Ver programación
          <ChevronRight size={18} />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {registeredEvents.map((event, index) => (
          <Link
            key={event.id}
            to={`/programacion-eventos/${event.slug}`}
            className="smika-card smika-shadow overflow-hidden grid md:grid-cols-[220px_1fr] hover:-translate-y-1 transition"
          >
            <div
              className={`min-h-[210px] flex items-center justify-center text-3xl font-black text-center px-5 ${
                index % 3 === 0
                  ? "bg-[#F7D9D8] text-[#2F2F2F]"
                  : index % 3 === 1
                  ? "bg-[#87CCC8] text-white"
                  : "bg-[#D1B0C7] text-white"
              }`}
            >
              {event.title}
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-[#D1B0C7] font-black text-sm">
                <CalendarDays size={18} />
                {event.status === "actual" ? "Evento actual" : "Evento próximo"}
              </div>

              <h3 className="mt-3 text-2xl font-black">
                {event.title}
              </h3>

              <p className="mt-2 text-sm font-bold text-gray-500">
                {event.date}
              </p>

              <p className="mt-3 text-gray-600 leading-6">
                {event.description}
              </p>

              <span className="mt-5 inline-flex items-center gap-2 font-black text-[#87CCC8]">
                Ver detalle del evento
                <ChevronRight size={18} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default UserRegisteredEventsSection;