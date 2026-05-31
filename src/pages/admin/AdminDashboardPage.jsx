import { Link } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  FolderTree,
  Globe2,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  UserRound,
  Users
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const dashboardCards = [
  {
    title: "Eventos",
    text: "Crear eventos, editar imágenes, fechas y productos vinculados.",
    path: "/admin/eventos",
    icon: CalendarDays,
    priority: 1
  },
  {
    title: "Series / Historias",
    text: "Crear historias, portadas, carruseles, géneros y datos relacionados.",
    path: "/admin/series",
    icon: Sparkles,
    priority: 2
  },
  {
    title: "Productos",
    text: "Crear, editar stock, precio y relaciones sin dañar imágenes existentes.",
    path: "/admin/productos",
    icon: Boxes,
    priority: 3
  },
  {
    title: "Categorías",
    text: "Administrar categorías reales para organizar productos.",
    path: "/admin/categorias",
    icon: FolderTree,
    priority: 4
  },
  {
    title: "Creadores",
    text: "Registrar autores, artistas o creadores relacionados con series.",
    path: "/admin/creadores",
    icon: Tags,
    priority: 5
  },
  {
    title: "Personajes",
    text: "Gestionar personajes o criaturas y asociarlos a series.",
    path: "/admin/personajes",
    icon: UserRound,
    priority: 6
  },
  {
    title: "Orígenes",
    text: "Gestionar China, Corea, Japón, Variado u otros orígenes.",
    path: "/admin/origenes",
    icon: Globe2,
    priority: 7
  },
  {
    title: "Pedidos",
    text: "Revisar pedidos, pago manual, saldo, estado y tracking.",
    path: "/admin/pedidos",
    icon: BarChart3,
    priority: 8
  },
  {
    title: "Usuarios",
    text: "Ver clientes registrados y editar datos de cuenta.",
    path: "/admin/usuarios",
    icon: Users,
    adminOnly: true
  },
  {
    title: "Subadmins",
    text: "Crear y gestionar subadministradores.",
    path: "/admin/subadmins",
    icon: ShieldCheck,
    adminOnly: true
  },
  {
    title: "Configuración",
    text: "Editar datos generales de la tienda.",
    path: "/admin/configuracion",
    icon: Settings,
    adminOnly: true
  }
];

function getVisibleCards(auth) {
  const role = auth?.user?.role || "";
  const isAdmin = auth?.isAdmin || role === "admin";

  return dashboardCards.filter((card) => {
    if (card.adminOnly && !isAdmin) return false;
    return true;
  });
}

function AdminDashboardPage() {
  const auth = useAuth();
  const visibleCards = getVisibleCards(auth);

  return (
    <section>
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Dashboard</p>

        <h2 className="mt-2 text-4xl font-black">
          Panel de administración
        </h2>

        <p className="mt-3 text-gray-600 max-w-3xl leading-7">
          Gestiona primero lo más importante para la tienda: eventos, series,
          productos, categorías, creadores, personajes, orígenes y pedidos.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              to={card.path}
              className="rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow hover:-translate-y-1 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="h-12 w-12 rounded-full bg-[#87CCC8] text-white flex items-center justify-center">
                  <Icon size={22} />
                </div>

                {card.priority && (
                  <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                    Prioridad {card.priority}
                  </span>
                )}
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