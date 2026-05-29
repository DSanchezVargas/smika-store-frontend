import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  ShieldCheck,
  X
} from "lucide-react";

import { apiRequest } from "../../services/api";

const initialForm = {
  nombre: "",
  apellido: "",
  alias: "",
  email: "",
  password: "",
  activo: true
};

function getUserId(user) {
  return user?._id || user?.id || "";
}

function normalizeSubadmin(user = {}) {
  return {
    ...user,
    id: getUserId(user),
    _id: getUserId(user),
    nombre: user.nombre || "",
    apellido: user.apellido || "",
    alias: user.alias || "",
    email: user.email || user.correo || "",
    role: user.role || "subadmin",
    activo: user.activo !== false,
    estado: user.activo === false ? "Inactivo" : "Activo"
  };
}

function AdminSubadminsPage() {
  const [subadmins, setSubadmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSubadmin, setEditingSubadmin] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingSubadmins, setLoadingSubadmins] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(initialForm);

  const isEditing = Boolean(editingSubadmin);

  const sortedSubadmins = useMemo(() => {
    return [...subadmins].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return `${a.nombre} ${a.apellido}`.localeCompare(
        `${b.nombre} ${b.apellido}`
      );
    });
  }, [subadmins]);

  const loadSubadmins = async () => {
    setLoadingSubadmins(true);

    try {
      const data = await apiRequest("/users?role=subadmin&activos=false", {
        method: "GET"
      });

      const users = data.users || data.data || [];

      setSubadmins(users.map(normalizeSubadmin));
    } catch (error) {
      setMessage(
        error.message || "No se pudieron cargar los subadministradores."
      );
    } finally {
      setLoadingSubadmins(false);
    }
  };

  useEffect(() => {
    loadSubadmins();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingSubadmin(null);
    setShowForm(false);
    setShowPassword(false);
  };

  const handleOpenCreate = () => {
    setMessage("");
    setForm(initialForm);
    setEditingSubadmin(null);
    setShowForm(true);
  };

  const handleOpenEdit = (subadmin) => {
    setMessage("");
    setForm({
      nombre: subadmin.nombre || "",
      apellido: subadmin.apellido || "",
      alias: subadmin.alias || "",
      email: subadmin.email || "",
      password: "",
      activo: subadmin.activo !== false
    });

    setEditingSubadmin(subadmin);
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleActivoChange = (event) => {
    setForm({
      ...form,
      activo: event.target.value === "Activo"
    });
  };

  const buildPayload = () => {
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      alias: form.alias.trim() || form.email.split("@")[0],
      email: form.email.toLowerCase().trim(),
      activo: Boolean(form.activo)
    };

    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      setMessage("Completa nombre, apellido y correo.");
      return;
    }

    if (!isEditing && !form.password.trim()) {
      setMessage("Para crear un subadmin debes colocar una contraseña.");
      return;
    }

    if (form.password.trim() && form.password.trim().length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSaving(true);
    setMessage(isEditing ? "Actualizando subadmin..." : "Creando subadmin...");

    try {
      if (isEditing) {
        const subadminId = getUserId(editingSubadmin);

        const data = await apiRequest(`/users/${subadminId}`, {
          method: "PATCH",
          body: JSON.stringify(buildPayload())
        });

        const updatedSubadmin = normalizeSubadmin(data.user);

        setSubadmins((currentSubadmins) =>
          currentSubadmins.map((subadmin) =>
            getUserId(subadmin) === subadminId ? updatedSubadmin : subadmin
          )
        );

        setMessage("Subadmin actualizado correctamente.");
      } else {
        const data = await apiRequest("/users/subadmins", {
          method: "POST",
          body: JSON.stringify(buildPayload())
        });

        const createdSubadmin = normalizeSubadmin(data.user);

        setSubadmins((currentSubadmins) => [
          createdSubadmin,
          ...currentSubadmins
        ]);

        setMessage("Subadmin creado correctamente.");
      }

      resetForm();
      await loadSubadmins();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar el subadmin.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (subadmin) => {
    const subadminId = getUserId(subadmin);

    if (!subadminId) {
      setMessage("No se encontró el ID del subadmin.");
      return;
    }

    setSaving(true);
    setMessage(
      subadmin.activo
        ? "Desactivando subadmin..."
        : "Reactivando subadmin..."
    );

    try {
      if (subadmin.activo) {
        await apiRequest(`/users/${subadminId}`, {
          method: "DELETE"
        });
      } else {
        await apiRequest(`/users/${subadminId}`, {
          method: "PATCH",
          body: JSON.stringify({
            activo: true
          })
        });
      }

      await loadSubadmins();

      setMessage(
        subadmin.activo
          ? "Subadmin desactivado correctamente."
          : "Subadmin reactivado correctamente."
      );
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado del subadmin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Subadmins</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">
              Gestión de subadministradores
            </h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Aquí la administradora puede crear, editar, activar y desactivar
              subadmins reales. Los datos se guardan en el backend y se
              conservan aunque recargues la página.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadSubadmins}
              disabled={loadingSubadmins || saving}
              className="smika-button flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={loadingSubadmins ? "animate-spin" : ""}
              />
              Recargar
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={saving}
              className="smika-button-primary flex items-center gap-2 disabled:opacity-60"
            >
              <Plus size={18} />
              Crear subadmin
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-6 rounded-3xl bg-[#F7D9D8]/70 px-5 py-4 font-bold">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[#87CCC8] font-black">
                {isEditing ? "Editar subadmin" : "Nuevo subadmin"}
              </p>

              <h3 className="text-2xl font-black mt-1">
                {isEditing
                  ? "Actualizar datos del subadmin"
                  : "Crear cuenta de subadmin"}
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                La contraseña no se muestra ni se guarda en el navegador. Si la
                escribes, se enviará al backend para guardarse protegida.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="h-10 w-10 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Nombre
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                placeholder="Nombre"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Apellido
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                placeholder="Apellido"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Alias
              <input
                name="alias"
                value={form.alias}
                onChange={handleChange}
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                placeholder="Ejemplo: smika_subadmin"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Correo
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                placeholder="correo@ejemplo.com"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              {isEditing
                ? "Nueva contraseña opcional"
                : "Contraseña del subadmin"}

              <div className="relative">
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 pr-12 outline-none focus:border-[#87CCC8]"
                  placeholder={
                    isEditing
                      ? "Dejar vacío si no deseas cambiarla"
                      : "Contraseña"
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#87CCC8]"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </label>

            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Estado
              <select
                value={form.activo ? "Activo" : "Inactivo"}
                onChange={handleActivoChange}
                className="rounded-2xl border border-gray-200 px-4 py-3 bg-white outline-none focus:border-[#87CCC8]"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="smika-button-primary flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isEditing ? "Guardar cambios" : "Crear subadmin"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="smika-button disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-black">Subadmins registrados</h3>

          {loadingSubadmins && (
            <span className="flex items-center gap-2 text-sm font-bold text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Cargando...
            </span>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-gray-100">
          <div className="grid grid-cols-[1.3fr_1.4fr_1fr_120px] bg-[#F8F6F7] px-5 py-4 text-sm font-black">
            <span>Nombre</span>
            <span>Correo</span>
            <span>Rol</span>
            <span className="text-right">Acciones</span>
          </div>

          {sortedSubadmins.map((subadmin) => (
            <div
              key={getUserId(subadmin)}
              className="grid grid-cols-[1.3fr_1.4fr_1fr_120px] px-5 py-5 text-sm border-t border-gray-100 items-center"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-full text-white flex items-center justify-center ${
                    subadmin.activo ? "bg-[#87CCC8]" : "bg-gray-300"
                  }`}
                >
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <p className="font-black">
                    {subadmin.nombre} {subadmin.apellido}
                  </p>

                  <p className="text-xs text-gray-500">
                    {subadmin.alias || "Sin alias"} ·{" "}
                    {subadmin.activo ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>

              <span>{subadmin.email}</span>

              <span className="w-fit rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                {subadmin.role}
              </span>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(subadmin)}
                  disabled={saving}
                  className="h-9 w-9 rounded-full bg-[#F7D9D8] flex items-center justify-center disabled:opacity-60"
                  title="Editar subadmin"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(subadmin)}
                  disabled={saving}
                  className={`h-9 w-9 rounded-full flex items-center justify-center disabled:opacity-60 ${
                    subadmin.activo
                      ? "bg-[#F8F6F7]"
                      : "bg-red-50 text-red-500"
                  }`}
                  title={
                    subadmin.activo
                      ? "Desactivar subadmin"
                      : "Reactivar subadmin"
                  }
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          ))}

          {!loadingSubadmins && sortedSubadmins.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              Todavía no hay subadmins registrados.
            </div>
          )}
        </div>

        <p className="mt-5 text-sm text-gray-500">
          Los cambios ahora se guardan en el backend. Al recargar la página, los
          subadmins se vuelven a cargar desde la base de datos.
        </p>
      </div>
    </section>
  );
}

export default AdminSubadminsPage;