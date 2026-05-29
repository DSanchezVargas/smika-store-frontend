import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

function EventScheduleLink() {
  return (
    <Link
      to="/programacion-eventos"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#87CCC8] text-white flex items-center justify-center smika-shadow hover:scale-105 transition"
      title="Programación de eventos"
    >
      <CalendarDays size={25} />
    </Link>
  );
}

export default EventScheduleLink;