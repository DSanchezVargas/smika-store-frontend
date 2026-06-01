import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  Link2,
  Loader2,
  Save,
  Settings,
  ShieldCheck
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/ui/PasswordInput";
import { apiRequest } from "../../services/api";
import { storyFiltersByCountry } from "../../data/catalogFilters";

const availableSeries = Object.values(storyFiltersByCountry).flat();

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  import.meta.env.VITE_GOOGLE_CLIENT_ID_PUBLIC ||
  "";

const PASSWORD_HELP =
  "Mínimo 8 caracteres. Puedes usar letras, números y símbolos como . , _ - *";

function validatePassword(password = "") {
  if (!password.trim()) {
    return "Escribe la nueva contraseña.";
  }

  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (!/^[A-Za-z0-9.,_\-*]+$/.test(password)) {
    return "La contraseña solo puede usar letras, números y símbolos . , _ - *";
  }

  return "";
}

function loadGoogleIdentityScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google));
      existingScript.addEventListener("error", () =>
        reject(new Error("No se pudo cargar Google Identity Services."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () =>
      reject(new Error("No se pudo cargar Google Identity Services."));

    document.body.appendChild(script);
  });
}

function UserSettingsPage() {
  const { user, isAuthenticated, refreshProfile, linkGoogleAccount } = useAuth();

  const [profileForm, setProfileForm] = useState({
    alias: user?.alias || "",
    nombre: user?.nombre || "",
    apellido: user?.apellido || ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  });

  const [favoriteSeries, setFavoriteSeries] = useState([]);
  const [notice, setNotice] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const hasPassword = Boolean(user?.hasPassword);
  const googleLinked = Boolean(user?.googleLinked || user?.authProvider === "google");
  const isGoogleAccount = user?.authProvider === "google" || googleLinked;

  const passwordModeTitle = hasPassword ? "Cambiar contraseña" : "Crear contraseña";

  const passwordModeDescription = hasPassword
    ? "Para mayor seguridad, escribe tu contraseña actual y luego tu nueva contraseña."
    : isGoogleAccount
    ? "Tu cuenta está vinculada con Google. Puedes crear una contraseña para iniciar sesión también con correo y contraseña."
    : "Crea una contraseña para tu cuenta.";

  const passwordButtonText = hasPassword ? "Actualizar contraseña" : "Crear contraseña";

  const newPasswordError = useMemo(() => {
    if (!passwordForm.newPassword) return "";
    return validatePassword(passwordForm.newPassword);
  }, [passwordForm.newPassword]);

  useEffect(() => {
    setProfileForm({
      alias: user?.alias || "",
      nombre: user?.nombre || "",
      apellido: user?.apellido || ""
    });
  }, [user]);

  const showNotice = (type, message) => {
    setNotice({
      type,
      message
    });
  };

  const handleProfileChange = (event) => {
    setProfileForm({
      ...profileForm,
      [event.target.name]: event.target.value
    });
  };

  const handlePasswordChange = (event) => {
    setPasswordForm({
      ...passwordForm,
      [event.target.name]: event.target.value
    });
  };

  const handleAddFavoriteSerie = (event) => {
    const selectedSerie = event.target.value;

    if (!selectedSerie) return;

    if (!favoriteSeries.includes(selectedSerie)) {
      setFavoriteSeries([...favoriteSeries, selectedSerie]);
    }

    event.target.value = "";
  };

  const handleRemoveFavoriteSerie = (serie) => {
    setFavoriteSeries(favoriteSeries.filter((item) => item !== serie));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    setNotice(null);

    if (hasPassword && !passwordForm.currentPassword.trim()) {
      showNotice("error", "Falta escribir tu contraseña actual.");
      return;
    }

    const validationMessage = validatePassword(passwordForm.newPassword);

    if (validationMessage) {
      showNotice("error", validationMessage);
      return;
    }

    setSavingPassword(true);

    try {
      const data = await apiRequest("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: ""
      });

      await refreshProfile?.();

      showNotice(
        "success",
        data.message ||
          (hasPassword
            ? "Contraseña actualizada correctamente."
            : "Contraseña creada correctamente.")
      );
    } catch (error) {
      showNotice(
        "error",
        error.message || "No se pudo actualizar la contraseña."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLinkGoogle = async () => {
    setNotice(null);

    if (googleLinked) {
      showNotice("success", "Tu cuenta ya está vinculada con Google.");
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      showNotice(
        "error",
        "Falta configurar VITE_GOOGLE_CLIENT_ID en el frontend."
      );
      return;
    }

    setLinkingGoogle(true);

    try {
      const google = await loadGoogleIdentityScript();

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const data = await linkGoogleAccount(response.credential);
            await refreshProfile?.();
            showNotice(
              "success",
              data.message || "Cuenta vinculada con Google correctamente."
            );
          } catch (error) {
            showNotice(
              "error",
              error.message || "No se pudo vincular la cuenta con Google."
            );
          } finally {
            setLinkingGoogle(false);
          }
        }
      });

      google.accounts.id.prompt((notification) => {
        if (
          notification.isNotDisplayed?.() ||
          notification.isSkippedMoment?.() ||
          notification.isDismissedMoment?.()
        ) {
          setLinkingGoogle(false);
        }
      });
    } catch (error) {
      setLinkingGoogle(false);
      showNotice(
        "error",
        error.message || "No se pudo iniciar la vinculación con Google."
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8">
          <h2 className="text-3xl font-black">Debes iniciar sesión</h2>

          <p className="mt-3 text-gray-600">
            Para editar tu perfil, primero inicia sesión o crea una cuenta.
          </p>

          <Link to="/login" className="mt-6 smika-button-primary inline-block">
            Iniciar sesión
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container-smika py-12">
      <div className="rounded-[32px] bg-[#F8F6F7] p-8 mb-8">
        <p className="text-[#87CCC8] font-black">Mi cuenta</p>

        <h2 className="text-4xl font-black mt-2">Configuración de perfil</h2>

        <p className="mt-3 text-gray-600 max-w-3xl leading-7">
          Administra tus datos, contraseña, vinculación con Google y preferencias.
        </p>
      </div>

      {notice && (
        <div
          className={`mb-6 rounded-[24px] px-5 py-4 text-sm font-black flex items-start gap-3 ${
            notice.type === "success"
              ? "bg-[#87CCC8]/20 text-[#2F2F2F]"
              : "bg-[#F7D9D8] text-[#2F2F2F]"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={20} className="shrink-0 text-[#87CCC8]" />
          ) : (
            <AlertCircle size={20} className="shrink-0 text-red-500" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <div className="smika-card smika-shadow p-6">
            <div className="flex items-center gap-2">
              <Settings size={20} className="text-[#87CCC8]" />
              <h3 className="text-2xl font-black">Datos del perfil</h3>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">
                Nombre
                <input
                  name="nombre"
                  value={profileForm.nombre}
                  onChange={handleProfileChange}
                  className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                  placeholder="Nombre"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold">
                Apellido
                <input
                  name="apellido"
                  value={profileForm.apellido}
                  onChange={handleProfileChange}
                  className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                  placeholder="Apellido"
                />
              </label>

              <label className="grid gap-2 text-sm font-bold md:col-span-2">
                Alias / nombre de usuario
                <input
                  name="alias"
                  value={profileForm.alias}
                  onChange={handleProfileChange}
                  className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                  placeholder="Ejemplo: smika_fan"
                />
              </label>
            </div>

            <button
              type="button"
              className="mt-6 smika-button-primary flex items-center gap-2 opacity-60"
              title="La edición de datos de perfil queda pendiente para el siguiente bloque."
            >
              <Save size={18} />
              Guardar cambios
            </button>
          </div>

          <form onSubmit={handlePasswordSubmit} className="smika-card smika-shadow p-6">
            <h3 className="text-2xl font-black">{passwordModeTitle}</h3>

            <p className="mt-2 text-sm text-gray-600 leading-6">
              {passwordModeDescription}
            </p>

            <p className="mt-2 text-xs font-bold text-gray-500">{PASSWORD_HELP}</p>

            <div className="mt-6 grid gap-4">
              {hasPassword && (
                <PasswordInput
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Contraseña actual"
                />
              )}

              <PasswordInput
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Nueva contraseña"
              />

              {newPasswordError && (
                <p className="text-sm font-black text-red-500">
                  {newPasswordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={savingPassword || Boolean(newPasswordError)}
              className="mt-6 smika-button-primary flex items-center gap-2 disabled:opacity-60"
            >
              {savingPassword ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {savingPassword ? "Guardando..." : passwordButtonText}
            </button>
          </form>

          <div className="smika-card smika-shadow p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#87CCC8]" />
              <h3 className="text-2xl font-black">Vinculación con Google</h3>
            </div>

            <p className="mt-2 text-sm text-gray-600 leading-6">
              Puedes vincular Google solo desde una sesión iniciada. Smika no vincula automáticamente una cuenta manual cuando alguien intenta entrar con Google.
            </p>

            {googleLinked ? (
              <div className="mt-5 rounded-2xl bg-[#87CCC8]/20 px-5 py-4 font-black flex items-center gap-2">
                <CheckCircle2 size={19} className="text-[#87CCC8]" />
                Vinculada con Google
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={linkingGoogle}
                className="mt-5 rounded-full bg-white border border-[#87CCC8]/40 px-5 py-3 font-black flex items-center gap-2 disabled:opacity-60"
              >
                {linkingGoogle ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Link2 size={18} />
                )}
                {linkingGoogle ? "Abriendo Google..." : "Vincular con Google"}
              </button>
            )}
          </div>
        </div>

        <aside className="smika-card smika-shadow p-6 h-fit">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-[#D1B0C7]" />
            <h3 className="text-2xl font-black">Series favoritas</h3>
          </div>

          <p className="mt-2 text-sm text-gray-600 leading-6">
            El usuario podrá elegir series existentes. Estas series serán creadas y administradas desde el panel de administración.
          </p>

          <select
            onChange={handleAddFavoriteSerie}
            className="mt-5 w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 bg-white outline-none focus:border-[#87CCC8]"
          >
            <option value="">Seleccionar serie</option>

            {availableSeries.map((serie) => (
              <option key={serie} value={serie}>
                {serie}
              </option>
            ))}
          </select>

          <div className="mt-5 flex flex-wrap gap-2">
            {favoriteSeries.length > 0 ? (
              favoriteSeries.map((serie) => (
                <button
                  key={serie}
                  type="button"
                  onClick={() => handleRemoveFavoriteSerie(serie)}
                  className="rounded-full bg-[#F7D9D8] px-4 py-2 text-sm font-bold"
                  title="Quitar serie"
                >
                  {serie} ×
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                Aún no agregaste series favoritas.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default UserSettingsPage;
