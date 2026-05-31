import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  ShieldCheck
} from "lucide-react";

import { apiRequest } from "../../services/api";

const initialForm = {
  nombre: "",
  apellido: "",
  alias: "",
  email: "",
  password: "",
  pais: "PE",
  codigoPais: "+51",
  telefono: "",
  activo: true
};

function getId(item) {
  return item?._id || item?.id || "";
}

function getFullName(user) {
  return `${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "Subadmin";
}

function normalizeSubadmin(user = {}) {
  return {
    ...user,
    id: getId(user),
    _id: getId(user),
    nombre: user.nombre || "",
    apellido: user.apellido || "",
    alias: user.alias || "",
    email: user.email || "",
    pais: user.pais || "PE",
    codigoPais: user.codigoPais || "+51",
    telefono: user.telefono || "",
    telefonoCompleto: user.telefonoCompleto || "",
    role: user.role || "subadmin",
    activo: user.activo !== false
  };
}

function AdminSubadminsPage() {
  const [subadmins, setSubadmins] = useState([]);
  const [view, setView] = useState("list");
  const [editingSubadmin, setEditingSubadmin] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingSubadmins, setLoadingSubadmins] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(editingSubadmin);

  const loadSubadmins = async () => {
    setLoadingSubadmins(true);
    setMessage("");

    try {
      const data = await apiRequest("/users?role=subadmin&activos=false");

      setSubadmins((data.users || []).map(normalizeSubadmin));
    } catch (error) {
      setMessage(error.message || "No se pudieron cargar los subadmins.");
    } finally {
      setLoadingSubadmins(false);
    }
  };

  useEffect(() => {
    loadSubadmins();
  }, []);

  const sortedSubadmins = useMemo(() => {
    return [...subadmins].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return getFullName(a).localeCompare(getFullName(b));
    });
  }, [subadmins]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingSubadmin(null);
    setShowPassword(false);
    setView("list");
  };

  const openCreateForm = () => {
    setMessage("");
    setEditingSubadmin(null);
    setForm(initialForm);
    setShowPassword(false);
    setView("form");
  };

  const openEditForm = (subadmin) => {
    setMessage("");
    setEditingSubadmin(subadmin);

    setForm({
      nombre: subadmin.nombre || "",
      apellido: subadmin.apellido || "",
      alias: subadmin.alias || "",
      email: subadmin.email || "",
      password: "",
      pais: subadmin.pais || "PE",
      codigoPais: subadmin.codigoPais || "+51",
      telefono: subadmin.telefono || "",
      activo: subadmin.activo !== false
    });

    setShowPassword(false);
    setView("form");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const buildCreatePayload = () => ({
    nombre: form.nombre.trim(),
    apellido: form.apellido.trim(),
    alias: form.alias.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    pais: form.pais.trim() || "PE",
    codigoPais: form.codigoPais.trim() || "+51",
    telefono: form.telefono.trim(),
    activo: Boolean(form.activo)
  });

  const buildUpdatePayload = () => {
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      alias: form.alias.trim(),
      email: form.email.trim().toLowerCase(),
      pais: form.pais.trim() || "PE",
      codigoPais: form.codigoPais.trim() || "+51",
      telefono: form.telefono.trim(),
      activo: Boolean(form.activo)
    };

    if (form.password.trim()) {
      payload.password = form.password;
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

    if (form.password && form.password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSaving(true);
    setMessage(isEditing ? "Actualizando subadmin..." : "Creando subadmin...");

    try {
      if (isEditing) {
        const data = await apiRequest(`/users/${getId(editingSubadmin)}`, {
          method: "PATCH",
          body: JSON.stringify(buildUpdatePayload())
        });

        const updatedSubadmin = normalizeSubadmin(data.user);

        setSubadmins((currentSubadmins) =>
          currentSubadmins.map((subadmin) =>
            getId(subadmin) === getId(updatedSubadmin)
              ? updatedSubadmin
              : subadmin
          )
        );

        setMessage("Subadmin actualizado correctamente.");
      } else {
        const data = await apiRequest("/users/subadmins", {
          method: "POST",
          body: JSON.stringify(buildCreatePayload())
        });

        const createdSubadmin = normalizeSubadmin(data.user);

        setSubadmins((currentSubadmins) => [
          createdSubadmin,
          ...currentSubadmins.filter(
            (subadmin) => getId(subadmin) !== getId(createdSubadmin)
          )
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
    const subadminId = getId(subadmin);

    if (!subadminId) {
      setMessage("No se encontró el ID del subadmin.");
      return;
    }

    setSaving(true);
    setMessage(
      subadmin.activo ? "Desactivando subadmin..." : "Activando subadmin..."
    );

    try {
      if (subadmin.activo) {
        await apiRequest(`/users/${subadminId}`, {
          method: "DELETE"
        });

        setSubadmins((currentSubadmins) =>
          currentSubadmins.map((item) =>
            getId(item) === subadminId ? { ...item, activo: false } : item
          )
        );

        setMessage("Subadmin desactivado correctamente.");
      } else {
        const data = await apiRequest(`/users/${subadminId}`, {
          method: "PATCH",
          body: JSON.stringify({
            activo: true
          })
        });

        const updatedSubadmin = normalizeSubadmin(data.user);

        setSubadmins((currentSubadmins) =>
          currentSubadmins.map((item) =>
            getId(item) === subadminId ? updatedSubadmin : item
          )
        );

        setMessage("Subadmin activado correctamente.");
      }

      await loadSubadmins();
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado del subadmin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Subadmins</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">
              Gestión de subadministradores
            </h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Crea y administra subadmins reales desde MongoDB.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {view === "list" && (
              <button
                type="button"
                onClick={loadSubadmins}
                disabled={loadingSubadmins || saving}
                className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loadingSubadmins ? "animate-spin" : ""}
                />
                Recargar
              </button>
            )}

            {view === "list" ? (
              <button
                type="button"
                onClick={openCreateForm}
                className="smika-button-primary flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Crear subadmin
              </button>
            ) : (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full bg-[#F7D9D8] px-5 py-3 font-black flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Volver
              </button>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message}
        </div>
      )}

      {view === "form" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] bg-white p-6 smika-shadow border border-[#87CCC8]/20"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[#87CCC8] font-black">
                {isEditing ? "Editar subadmin" : "Nuevo subadmin"}
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {isEditing
                  ? "Actualizar datos del subadmin"
                  : "Crear cuenta de subadmin"}
              </h3>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="smika-button-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Nombre
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Apellido
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Alias
              <input
                name="alias"
                value={form.alias}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Correo
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Contraseña {isEditing && "(opcional)"}
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#87CCC8]/30 px-4 py-3 pr-12 outline-none"
                  placeholder={
                    isEditing
                      ? "Dejar vacío para no cambiar"
                      : "Mínimo 6 caracteres"
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Teléfono
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Opcional"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              País
              <input
                name="pais"
                value={form.pais}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Código país
              <input
                name="codigoPais"
                value={form.codigoPais}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="flex items-center justify-between rounded-3xl bg-[#F8F6F7] p-4 text-sm font-black lg:col-span-2">
              Cuenta activa
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={handleChange}
                className="h-5 w-5"
              />
            </label>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          {loadingSubadmins ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando subadmins...</p>
            </div>
          ) : sortedSubadmins.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <ShieldCheck size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay subadmins
              </h3>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-3">
              {sortedSubadmins.map((subadmin) => (
                <article
                  key={getId(subadmin)}
                  className="rounded-[28px] bg-white p-6 border border-[#87CCC8]/20 smika-shadow"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                      {subadmin.activo ? "Activo" : "Inactivo"}
                    </span>

                    <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                      Subadmin
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black">
                    {getFullName(subadmin)}
                  </h3>

                  <div className="mt-3 grid gap-2 text-sm text-gray-600">
                    <p>
                      <strong>Alias:</strong> {subadmin.alias || "Sin alias"}
                    </p>

                    <p>
                      <strong>Correo:</strong> {subadmin.email}
                    </p>

                    <p>
                      <strong>Teléfono:</strong>{" "}
                      {subadmin.telefonoCompleto ||
                        `${subadmin.codigoPais || ""} ${
                          subadmin.telefono || ""
                        }`.trim() ||
                        "Sin teléfono"}
                    </p>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(subadmin)}
                      className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(subadmin)}
                      disabled={saving}
                      className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                      title={subadmin.activo ? "Desactivar" : "Activar"}
                    >
                      <Power
                        size={17}
                        className={
                          subadmin.activo ? "text-gray-500" : "text-red-500"
                        }
                      />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminSubadminsPage;