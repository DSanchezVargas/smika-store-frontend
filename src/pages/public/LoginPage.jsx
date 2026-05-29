import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/ui/PasswordInput";

function getSafeRedirect(search) {
  const params = new URLSearchParams(search);
  const redirect = params.get("redirect");

  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/mi-cuenta";
  }

  if (redirect.startsWith("/login") || redirect.startsWith("/registro")) {
    return "/mi-cuenta";
  }

  return redirect;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { loginUser, loginWithGoogle } = useAuth();

  const redirectTo = getSafeRedirect(location.search);
  const registerPath = `/registro?redirect=${encodeURIComponent(redirectTo)}`;

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await loginUser(form);

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError(error.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");

      if (!credentialResponse.credential) {
        setError("No se recibió la credencial de Google.");
        return;
      }

      await loginWithGoogle(credentialResponse.credential);

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError(error.message || "No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-smika py-12 max-w-xl">
      <div className="smika-card smika-shadow p-8">
        <p className="text-[#87CCC8] font-black">Bienvenido</p>

        <h2 className="text-3xl font-black mt-2">Iniciar sesión</h2>

        <p className="mt-2 text-gray-600">
          Ingresa para guardar tu lista de pedido, favoritos, eventos,
          recomendaciones y seguimiento de pedidos.
        </p>

        {redirectTo !== "/mi-cuenta" && (
          <div className="mt-5 rounded-2xl bg-[#F7D9D8] px-4 py-3 text-sm font-bold text-[#2F2F2F]">
            Inicia sesión para continuar con la acción que intentabas realizar.
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 text-red-600 px-4 py-3 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
            placeholder="Correo"
            type="email"
            autoComplete="email"
            required
          />

          <PasswordInput
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Contraseña"
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="smika-button-primary disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-sm text-gray-500">o</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("No se pudo iniciar sesión con Google.")}
          />
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm">
          <Link to={registerPath} className="font-bold text-[#87CCC8]">
            Crear cuenta
          </Link>

          <Link to="/recuperar-contrasena" className="font-bold text-[#D1B0C7]">
            Olvidé mi contraseña
          </Link>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;