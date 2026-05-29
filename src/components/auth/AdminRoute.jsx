import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function AdminRoute() {
  const { loadingAuth, isAuthenticated, isStaff } = useAuth();

  if (loadingAuth) {
    return (
      <section className="min-h-screen grid place-items-center bg-[#F8F6F7]">
        <div className="rounded-3xl bg-white p-8 smika-shadow text-center">
          <p className="font-black text-[#87CCC8]">Smika Store</p>
          <p className="mt-2 text-gray-600">Verificando acceso...</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  if (!isStaff) {
    return <Navigate to="/mi-cuenta" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;