import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  UserRound,
  UserPlus,
  X
} from "lucide-react";

import { mainNavigation } from "../../data/navigationData";
import { useAuth } from "../../context/AuthContext";
import UserMenu from "./UserMenu";

function Navbar() {
  const { isAuthenticated, isStaff, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const protectedPath = isAuthenticated
    ? "/mi-cuenta"
    : "/login?redirect=/mi-cuenta";

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#87CCC8]/20">
        <div className="container-smika">
          <div className="flex items-center justify-between py-4 gap-4">
            <Link
              to="/"
              className="flex items-center gap-3 shrink-0 min-w-fit"
            >
              <div className="relative h-13 w-13 shrink-0 rounded-full bg-[#87CCC8] flex items-center justify-center text-white font-black smika-shadow">
                <span className="text-lg">S</span>

                <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#F7D9D8] flex items-center justify-center">
                  <Sparkles size={11} className="text-[#2F2F2F]" />
                </span>
              </div>

              <div className="leading-tight shrink-0">
                <h1 className="text-xl font-black tracking-tight whitespace-nowrap">
                  Smika Store
                </h1>

                <p className="text-xs text-gray-500 whitespace-nowrap">
                  Detalles bonitos para fans
                </p>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-1">
              {mainNavigation.map((item) => (
                <div key={item.label} className="relative group">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `px-2.5 py-2 rounded-full text-sm font-semibold flex items-center gap-1 transition whitespace-nowrap ${
                        isActive
                          ? "bg-[#87CCC8] text-white"
                          : "text-gray-700 hover:bg-[#F7D9D8]/60"
                      }`
                    }
                  >
                    {item.label}
                    {item.children && <ChevronDown size={14} />}
                  </NavLink>

                  {item.children && (
                    <div className="absolute left-0 top-full hidden group-hover:block pt-3">
                      <div className="w-48 rounded-2xl bg-white smika-shadow border border-[#87CCC8]/20 p-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            to={child.path}
                            className="block px-4 py-2 rounded-xl text-sm hover:bg-[#F7D9D8]/70"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/nuevos-productos"
                className="hidden xl:flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F6F7] hover:bg-[#F7D9D8]"
                title="Buscar"
              >
                <Search size={19} />
              </Link>

              <div className="hidden xl:block">
                <UserMenu />
              </div>

              <Link
                to={protectedPath}
                className="hidden xl:flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F6F7] hover:bg-[#F7D9D8]"
                title={
                  isAuthenticated
                    ? "Favoritos"
                    : "Inicia sesión para ver favoritos"
                }
              >
                <Heart size={19} />
              </Link>

              <Link
                to={protectedPath}
                className="hidden xl:flex h-10 w-10 items-center justify-center rounded-full bg-[#F8F6F7] hover:bg-[#F7D9D8]"
                title={
                  isAuthenticated
                    ? "Notificaciones"
                    : "Inicia sesión para ver notificaciones"
                }
              >
                <Bell size={19} />
              </Link>

              <Link
                to="/lista-pedido"
                className="h-10 px-4 rounded-full bg-[#F7D9D8] flex items-center gap-2 font-bold text-sm hover:shadow-md transition whitespace-nowrap"
              >
                <ShoppingBag size={18} />
                <span>Lista</span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="xl:hidden h-12 w-12 rounded-full bg-[#87CCC8] text-white flex items-center justify-center shrink-0"
                title="Abrir menú"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] bg-white xl:hidden overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-[#87CCC8]/20 z-10">
            <div className="container-smika py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-14 w-14 shrink-0 rounded-full bg-[#87CCC8] text-white flex items-center justify-center font-black smika-shadow">
                  <span className="text-lg">S</span>

                  <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#F7D9D8] flex items-center justify-center">
                    <Sparkles size={11} className="text-[#2F2F2F]" />
                  </span>
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-black whitespace-nowrap">
                    Smika Store
                  </h2>

                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    Menú de navegación
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center shrink-0"
                title="Cerrar menú"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="container-smika py-6">
            <div className="rounded-[32px] bg-[#F8F6F7] p-5">
              {isAuthenticated ? (
                <>
                  <p className="text-xs font-black text-[#87CCC8]">
                    Sesión activa
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    {user?.nombre} {user?.apellido}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {user?.email}
                  </p>

                  <span className="mt-3 inline-flex rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                    {isStaff ? user?.role : "cliente"}
                  </span>
                </>
              ) : (
                <>
                  <p className="text-xs font-black text-[#87CCC8]">
                    Bienvenido
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    Explora Smika Store
                  </h3>

                  <p className="mt-2 text-sm text-gray-600 leading-6">
                    Inicia sesión o crea una cuenta para guardar eventos,
                    favoritos y pedidos.
                  </p>
                </>
              )}
            </div>

            <nav className="mt-6 grid gap-4">
              {mainNavigation.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[28px] bg-white border border-[#87CCC8]/20 smika-shadow overflow-hidden"
                >
                  <Link
                    to={item.path}
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-5 py-4 text-lg font-black hover:bg-[#F7D9D8]/50"
                  >
                    {item.label}
                    {item.children && <ChevronDown size={18} />}
                  </Link>

                  {item.children && (
                    <div className="grid gap-2 px-4 pb-4">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          to={child.path}
                          onClick={closeMobileMenu}
                          className="rounded-2xl bg-[#F8F6F7] px-4 py-3 text-sm font-bold text-gray-700 hover:bg-[#F7D9D8]/60"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-6 grid gap-3">
              <Link
                to="/nuevos-productos"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-2xl bg-[#F8F6F7] px-5 py-4 font-black"
              >
                <Search size={20} />
                Buscar / Nuevos productos
              </Link>

              <Link
                to="/lista-pedido"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-2xl bg-[#F7D9D8] px-5 py-4 font-black"
              >
                <ShoppingBag size={20} />
                Mi lista de pedido
              </Link>

              {isAuthenticated ? (
                <>
                  {isStaff ? (
                    <>
                      <Link
                        to="/admin"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-2xl bg-[#87CCC8] text-white px-5 py-4 font-black"
                      >
                        <LayoutDashboard size={20} />
                        Ir al panel admin
                      </Link>

                      <Link
                        to="/admin/configuracion"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-2xl bg-[#F8F6F7] px-5 py-4 font-black"
                      >
                        <Settings size={20} />
                        Configuración admin
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/mi-cuenta"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-2xl bg-[#87CCC8] text-white px-5 py-4 font-black"
                      >
                        <UserRound size={20} />
                        Mi perfil
                      </Link>

                      <Link
                        to="/mi-cuenta/configuracion"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-2xl bg-[#F8F6F7] px-5 py-4 font-black"
                      >
                        <Settings size={20} />
                        Configuración
                      </Link>

                      <Link
                        to="/mi-cuenta"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-2xl bg-[#F8F6F7] px-5 py-4 font-black"
                      >
                        <Heart size={20} />
                        Favoritos
                      </Link>

                      <Link
                        to="/mi-cuenta"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-2xl bg-[#F8F6F7] px-5 py-4 font-black"
                      >
                        <Bell size={20} />
                        Notificaciones
                      </Link>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-2xl bg-red-50 text-red-500 px-5 py-4 font-black"
                  >
                    <LogOut size={20} />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-2xl bg-[#87CCC8] text-white px-5 py-4 font-black"
                  >
                    <LogIn size={20} />
                    Iniciar sesión
                  </Link>

                  <Link
                    to="/registro"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-2xl bg-[#F8F6F7] px-5 py-4 font-black"
                  >
                    <UserPlus size={20} />
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;