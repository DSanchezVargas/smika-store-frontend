import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronLeft,
  FolderTree,
  Globe2,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  UserRound,
  Users,
  X
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const adminNavigation = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
    priorityGroup: "base"
  },
  {
    label: "Eventos",
    path: "/admin/eventos",
    icon: CalendarDays,
    priorityGroup: "principal"
  },
  {
    label: "Tipos de evento",
    path: "/admin/tipos-evento",
    icon: Tags,
    priorityGroup: "principal"
  },
  {
    label: "Series / Historias",
    path: "/admin/series",
    icon: Sparkles,
    priorityGroup: "principal"
  },
  {
    label: "Productos",
    path: "/admin/productos",
    icon: Boxes,
    priorityGroup: "principal"
  },
  {
    label: "Tipos de producto",
    path: "/admin/tipos-producto",
    icon: Tags,
    priorityGroup: "principal"
  },
  {
    label: "Categorías",
    path: "/admin/categorias",
    icon: FolderTree,
    priorityGroup: "principal"
  },
  {
    label: "Creadores",
    path: "/admin/creadores",
    icon: Tags,
    priorityGroup: "principal"
  },
  {
    label: "Personajes",
    path: "/admin/personajes",
    icon: UserRound,
    priorityGroup: "principal"
  },
  {
    label: "Orígenes",
    path: "/admin/origenes",
    icon: Globe2,
    priorityGroup: "principal"
  },
  {
    label: "Pedidos",
    path: "/admin/pedidos",
    icon: BarChart3,
    priorityGroup: "principal"
  },
  {
    label: "Usuarios",
    path: "/admin/usuarios",
    icon: Users,
    adminOnly: true,
    priorityGroup: "admin"
  },
  {
    label: "Subadmins",
    path: "/admin/subadmins",
    icon: ShieldCheck,
    adminOnly: true,
    priorityGroup: "admin"
  },
  {
    label: "Configuración",
    path: "/admin/configuracion",
    icon: Settings,
    adminOnly: true,
    priorityGroup: "admin"
  }
];

function getVisibleNavigation(auth) {
  const role = auth?.user?.role || "";
  const isAdmin = auth?.isAdmin || role === "admin";

  return adminNavigation.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });
}

function AdminNavigationList({ onNavigate }) {
  const auth = useAuth();
  const visibleNavigation = getVisibleNavigation(auth);

  return (
    <nav className="space-y-1">
      {visibleNavigation.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                isActive
                  ? "bg-[#87CCC8] text-[#2F2F2F]"
                  : "text-gray-700 hover:bg-[#F7D9D8]/60"
              }`
            }
          >
            <Icon size={19} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function AdminLayout() {
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const closeAdminMenu = () => {
    setAdminMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F7] xl:grid xl:grid-cols-[280px_1fr]">
      <aside className="hidden xl:flex flex-col border-r border-[#87CCC8]/20 bg-white">
        <div className="p-6 border-b border-[#87CCC8]/20">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#87CCC8] flex items-center justify-center text-white font-black">
              S
            </div>

            <div>
              <h1 className="text-xl font-black">Smika Admin</h1>
              <p className="text-xs text-gray-500">Panel de administración</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <AdminNavigationList />
        </div>

        <div className="p-4 border-t border-[#87CCC8]/20">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#F7D9D8] px-4 py-3 text-sm font-black"
          >
            <ChevronLeft size={18} />
            Volver a la tienda
          </Link>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="sticky top-0 z-40 xl:hidden bg-white border-b border-[#87CCC8]/20">
          <div className="container-smika py-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setAdminMenuOpen(true)}
              className="h-12 w-12 rounded-full bg-[#87CCC8] text-white flex items-center justify-center"
              title="Abrir menú admin"
            >
              <Menu size={24} />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="font-black text-lg leading-tight">
                Smika Admin
              </h1>

              <p className="text-xs text-gray-500">
                Panel de administración
              </p>
            </div>

            <Link
              to="/"
              className="rounded-full bg-[#F7D9D8] px-4 py-2 text-sm font-black"
            >
              Tienda
            </Link>
          </div>
        </div>

        <div className="p-5 xl:p-8">
          <Outlet />
        </div>
      </main>

      {adminMenuOpen && (
        <div className="fixed inset-0 z-[9999] bg-white xl:hidden overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#87CCC8]/20 z-10">
            <div className="container-smika py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#87CCC8] text-white flex items-center justify-center font-black">
                  S
                </div>

                <div>
                  <h2 className="text-xl font-black">Smika Admin</h2>
                  <p className="text-xs text-gray-500">
                    Menú del panel
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAdminMenu}
                className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center"
                title="Cerrar menú"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="container-smika py-6">
            <div className="rounded-[32px] bg-[#F8F6F7] p-5 mb-5">
              <p className="text-xs font-black text-[#87CCC8]">
                Panel administrador
              </p>

              <h3 className="mt-1 text-2xl font-black">
                ¿A dónde quieres ir?
              </h3>

              <p className="mt-2 text-sm text-gray-600 leading-6">
                Elige un módulo para gestionar la tienda.
              </p>
            </div>

            <div className="rounded-[28px] bg-white border border-[#87CCC8]/20 p-4 smika-shadow">
              <AdminNavigationList onNavigate={closeAdminMenu} />
            </div>

            <div className="mt-5 grid gap-3">
              <Link
                to="/"
                onClick={closeAdminMenu}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#F7D9D8] px-5 py-4 font-black"
              >
                <ChevronLeft size={19} />
                Volver a la tienda
              </Link>

              <button
                type="button"
                onClick={closeAdminMenu}
                className="rounded-2xl bg-[#F8F6F7] px-5 py-4 font-black"
              >
                Cerrar menú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;