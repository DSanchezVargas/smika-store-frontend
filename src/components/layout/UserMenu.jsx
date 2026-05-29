import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  UserRound,
  UserPlus
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function getRoleLabel(role) {
  if (role === "admin") return "admin";
  if (role === "subadmin") return "subadmin";
  return "cliente";
}

function UserMenu() {
  const navigate = useNavigate();

  const {
    isAuthenticated,
    isStaff,
    loadingAuth,
    role,
    user,
    logout
  } = useAuth();

  const [open, setOpen] = useState(false);

  const visibleRole = getRoleLabel(role || user?.role);
  const visibleName = user?.alias || user?.nombre || "Mi cuenta";

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        disabled={loadingAuth}
        onClick={() => setOpen(!open)}
        className={`h-10 px-3 rounded-full flex items-center gap-2 transition disabled:opacity-60 ${
          isAuthenticated
            ? "bg-[#87CCC8] text-white"
            : "bg-[#F8F6F7] hover:bg-[#F7D9D8]"
        }`}
        title={isAuthenticated ? `Cuenta: ${visibleName}` : "Acceder"}
      >
        <UserRound size={19} />

        {isAuthenticated && (
          <span className="max-w-[110px] truncate text-sm font-bold">
            {visibleName}
          </span>
        )}

        <ChevronDown size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-72 rounded-3xl bg-white border border-[#87CCC8]/20 smika-shadow p-3 z-50">
          {isAuthenticated ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-black text-sm">
                  {user?.nombre} {user?.apellido}
                </p>

                <p className="text-xs text-gray-500 truncate">
                  {user?.email || user?.correo}
                </p>

                <span className="mt-2 inline-flex rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                  {visibleRole}
                </span>
              </div>

              {isStaff && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#F8F6F7]"
                  >
                    <LayoutDashboard size={18} />
                    Ir al panel admin
                  </Link>

                  <Link
                    to="/admin/configuracion"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#F8F6F7]"
                  >
                    <Settings size={18} />
                    Configuración admin
                  </Link>
                </>
              )}

              <Link
                to="/mi-cuenta"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#F8F6F7]"
              >
                <UserRound size={18} />
                Mi perfil
              </Link>

              <Link
                to="/mi-cuenta/configuracion"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#F8F6F7]"
              >
                <Settings size={18} />
                Configuración
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50"
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#F8F6F7]"
              >
                <LogIn size={18} />
                Iniciar sesión
              </Link>

              <Link
                to="/registro"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-[#F8F6F7]"
              >
                <UserPlus size={18} />
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default UserMenu;