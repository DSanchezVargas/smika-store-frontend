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

function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { registerUser, loginWithGoogle } = useAuth();

  const redirectTo = getSafeRedirect(location.search);
  const loginPath = `/login?redirect=${encodeURIComponent(redirectTo)}`;

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    alias: "",
    telefono: "",
    genero: "prefiero_no_decir",
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

      await registerUser({
        ...form,
        pais: "PE",
        codigoPais: "+51",
        telefono: form.telefono.trim()
      });

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError(error.message || "No se pudo crear la cuenta.");
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
      setError(error.message || "No se pudo continuar con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-smika py-12 max-w-2xl">
      <div className="smika-card smika-shadow p-8">
        <h2 className="text-3xl font-black">Crear cuenta</h2>

        <p className="mt-2 text-gray-600">
          Regístrate para guardar productos, favoritos, eventos próximos,
          seguimiento de pedidos y recomendaciones personalizadas.
        </p>

        {redirectTo !== "/mi-cuenta" && (
          <div className="mt-5 rounded-2xl bg-[#F7D9D8] px-4 py-3 text-sm font-bold text-[#2F2F2F]">
            Crea tu cuenta para continuar con la acción que intentabas realizar.
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 text-red-600 px-4 py-3 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
            placeholder="Nombre"
            autoComplete="given-name"
            required
          />

          <input
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
            placeholder="Apellido"
            autoComplete="family-name"
            required
          />

          <input
            name="alias"
            value={form.alias}
            onChange={handleChange}
            className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
            placeholder="Nombre de usuario / alias"
            autoComplete="nickname"
          />

          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
            placeholder="Teléfono peruano opcional"
            autoComplete="tel"
          />

          <select
            name="genero"
            value={form.genero}
            onChange={handleChange}
            className="rounded-2xl border border-gray-200 px-4 py-3 md:col-span-2 bg-white outline-none focus:border-[#87CCC8]"
          >
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="prefiero_no_decir">Prefiero no decir</option>
          </select>

          <p className="text-xs text-gray-500 leading-5 md:col-span-2">
            El género no será público. Solo podrá usarse para mejorar
            preferencias y recomendaciones dentro de la tienda.
          </p>

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="rounded-2xl border border-gray-200 px-4 py-3 md:col-span-2 outline-none focus:border-[#87CCC8]"
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
            className="md:col-span-2"
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="smika-button-primary md:col-span-2 disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Registrarme"}
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
            onError={() => setError("No se pudo continuar con Google.")}
          />
        </div>

        <p className="mt-6 text-sm text-center text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link to={loginPath} className="font-bold text-[#87CCC8]">
            Inicia sesión
          </Link>
        </p>
      </div>
    </section>
  );
}

export default RegisterPage;