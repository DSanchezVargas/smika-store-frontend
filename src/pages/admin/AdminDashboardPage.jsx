import { Link } from "react-router-dom";
import {
  Boxes,
  CalendarDays,
  FolderTree,
  Settings,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";

const dashboardCards = [
  {
    title: "Productos",
    text: "Crear, editar y desactivar productos.",
    path: "/admin/productos",
    icon: Boxes
  },
  {
    title: "Eventos",
    text: "Gestionar eventos, duración, imágenes y productos vinculados.",
    path: "/admin/eventos",
    icon: CalendarDays
  },
  {
    title: "Series / Historias",
    text: "Crear historias, géneros, autores, iconos y portadas.",
    path: "/admin/series",
    icon: Sparkles
  },
  {
    title: "Categorías",
    text: "Administrar categorías y subcategorías.",
    path: "/admin/categorias",
    icon: FolderTree
  },
  {
    title: "Usuarios",
    text: "Ver clientes registrados y datos de cuenta.",
    path: "/admin/usuarios",
    icon: Users
  },
  {
    title: "Subadmins",
    text: "Crear y gestionar subadministradores.",
    path: "/admin/subadmins",
    icon: ShieldCheck
  },
  {
    title: "Configuración",
    text: "Editar datos generales de la tienda.",
    path: "/admin/configuracion",
    icon: Settings
  }
];

function AdminDashboardPage() {
  return (
    <section>
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Dashboard</p>

        <h2 className="mt-2 text-4xl font-black">
          Panel de administración
        </h2>

        <p className="mt-3 text-gray-600 max-w-3xl leading-7">
          Desde aquí admin y subadmin podrán gestionar productos, eventos,
          series, usuarios, subadmins y configuración general de Smika Store.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              to={card.path}
              className="rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow hover:-translate-y-1 transition"
            >
              <div className="h-12 w-12 rounded-full bg-[#87CCC8] text-white flex items-center justify-center">
                <Icon size={22} />
              </div>

              <h3 className="mt-5 text-2xl font-black">
                {card.title}
              </h3>

              <p className="mt-2 text-gray-600 leading-6">
                {card.text}
              </p>

              <span className="mt-5 inline-flex rounded-full bg-[#F7D9D8] px-4 py-2 text-sm font-black">
                Entrar
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default AdminDashboardPage;