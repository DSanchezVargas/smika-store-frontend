import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Save, Settings } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../../components/ui/PasswordInput";
import { storyFiltersByCountry } from "../../data/catalogFilters";

const availableSeries = Object.values(storyFiltersByCountry).flat();

function UserSettingsPage() {
  const { user, isAuthenticated } = useAuth();

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

  if (!isAuthenticated) {
    return (
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8">
          <h2 className="text-3xl font-black">
            Debes iniciar sesión
          </h2>

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

        <h2 className="text-4xl font-black mt-2">
          Configuración de perfil
        </h2>

        <p className="mt-3 text-gray-600 max-w-3xl leading-7">
          Aquí el usuario podrá cambiar su alias, actualizar su contraseña y
          guardar sus series favoritas para recibir mejores recomendaciones.
        </p>
      </div>

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

            <button className="mt-6 smika-button-primary flex items-center gap-2">
              <Save size={18} />
              Guardar cambios
            </button>
          </div>

          <div className="smika-card smika-shadow p-6">
            <h3 className="text-2xl font-black">
              Cambiar contraseña
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Para mayor seguridad, el usuario debe escribir su contraseña
              actual y luego su nueva contraseña.
            </p>

            <div className="mt-6 grid gap-4">
              <PasswordInput
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Contraseña actual"
              />

              <PasswordInput
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Nueva contraseña"
              />
            </div>

            <button className="mt-6 smika-button-primary flex items-center gap-2">
              <Save size={18} />
              Actualizar contraseña
            </button>
          </div>
        </div>

        <aside className="smika-card smika-shadow p-6 h-fit">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-[#D1B0C7]" />
            <h3 className="text-2xl font-black">Series favoritas</h3>
          </div>

          <p className="mt-2 text-sm text-gray-600 leading-6">
            El usuario podrá elegir series existentes. Estas series serán
            creadas y administradas desde el panel de administración.
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