import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Power,
  RefreshCw,
  Save,
  Search,
  UsersRound
} from "lucide-react";

import { apiRequest } from "../../services/api";

const initialForm = {
  nombre: "",
  apellido: "",
  alias: "",
  email: "",
  pais: "PE",
  codigoPais: "+51",
  telefono: "",
  role: "cliente",
  activo: true
};

const roleOptions = [
  { value: "", label: "Todos" },
  { value: "cliente", label: "Clientes" },
  { value: "subadmin", label: "Subadmins" },
  { value: "admin", label: "Admins" }
];

function getId(item) {
  return item?._id || item?.id || "";
}

function getFullName(user) {
  return `${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "Usuario";
}

function getRoleLabel(role) {
  const labels = {
    cliente: "Cliente",
    admin: "Admin",
    subadmin: "Subadmin"
  };

  return labels[role] || "Cliente";
}

function getStatusText(user) {
  return user?.activo !== false ? "Activo" : "Inactivo";
}

function normalizeUser(user = {}) {
  return {
    ...user,
    id: getId(user),
    _id: getId(user),
    nombre: user.nombre || "",
    apellido: user.apellido || "",
    alias: user.alias || "",
    email: user.email || user.correo || "",
    pais: user.pais || "PE",
    codigoPais: user.codigoPais || "+51",
    telefono: user.telefono || "",
    telefonoCompleto: user.telefonoCompleto || "",
    role: user.role || "cliente",
    activo: user.activo !== false
  };
}

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [view, setView] = useState("list");
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [message, setMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setMessage("");

    try {
      const params = new URLSearchParams({
        activos: "false"
      });

      if (search.trim()) params.set("search", search.trim());
      if (roleFilter) params.set("role", roleFilter);

      const data = await apiRequest(`/users?${params.toString()}`);

      setUsers((data.users || []).map(normalizeUser));
    } catch (error) {
      setMessage(error.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      return getFullName(a).localeCompare(getFullName(b));
    });
  }, [users]);

  const resetForm = () => {
    setEditingUser(null);
    setForm(initialForm);
    setView("list");
  };

  const openEditForm = (user) => {
    setMessage("");
    setEditingUser(user);

    setForm({
      nombre: user.nombre || "",
      apellido: user.apellido || "",
      alias: user.alias || "",
      email: user.email || "",
      pais: user.pais || "PE",
      codigoPais: user.codigoPais || "+51",
      telefono: user.telefono || "",
      role: user.role || "cliente",
      activo: user.activo !== false
    });

    setView("form");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const buildUserPayload = () => ({
    nombre: form.nombre.trim(),
    apellido: form.apellido.trim(),
    alias: form.alias.trim(),
    email: form.email.trim().toLowerCase(),
    pais: form.pais.trim() || "PE",
    codigoPais: form.codigoPais.trim() || "+51",
    telefono: form.telefono.trim(),
    activo: Boolean(form.activo)
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editingUser) return;

    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      setMessage("Completa nombre, apellido y correo.");
      return;
    }

    setSaving(true);
    setMessage("Guardando cambios del usuario...");

    try {
      const userId = getId(editingUser);

      const data = await apiRequest(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(buildUserPayload())
      });

      let updatedUser = normalizeUser(data.user);

      if (form.role !== editingUser.role) {
        const roleData = await apiRequest(`/users/${userId}/role`, {
          method: "PATCH",
          body: JSON.stringify({
            role: form.role
          })
        });

        updatedUser = normalizeUser(roleData.user);
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          getId(user) === userId ? updatedUser : user
        )
      );

      setMessage("Usuario actualizado correctamente.");
      resetForm();
      await loadUsers();
    } catch (error) {
      setMessage(error.message || "No se pudo actualizar el usuario.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const userId = getId(user);

    if (!userId) {
      setMessage("No se encontró el ID del usuario.");
      return;
    }

    setSaving(true);
    setMessage(user.activo ? "Desactivando usuario..." : "Activando usuario...");

    try {
      if (user.activo) {
        await apiRequest(`/users/${userId}`, {
          method: "DELETE"
        });

        setUsers((currentUsers) =>
          currentUsers.map((item) =>
            getId(item) === userId ? { ...item, activo: false } : item
          )
        );

        setMessage("Usuario desactivado correctamente.");
      } else {
        const data = await apiRequest(`/users/${userId}`, {
          method: "PATCH",
          body: JSON.stringify({
            activo: true
          })
        });

        const updatedUser = normalizeUser(data.user);

        setUsers((currentUsers) =>
          currentUsers.map((item) =>
            getId(item) === userId ? updatedUser : item
          )
        );

        setMessage("Usuario activado correctamente.");
      }

      await loadUsers();
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar el estado del usuario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Usuarios</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">
              Gestión de usuarios
            </h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Revisa clientes, admins y subadmins registrados. Puedes editar
              datos básicos, cambiar rol y activar o desactivar cuentas.
            </p>
          </div>

          {view === "list" ? (
            <button
              type="button"
              onClick={loadUsers}
              disabled={loadingUsers || saving}
              className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={loadingUsers ? "animate-spin" : ""}
              />
              Recargar
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
                Editar usuario
              </p>

              <h3 className="mt-2 text-2xl font-black">
                {getFullName(editingUser)}
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

            <label className="grid gap-2 text-sm font-black">
              Teléfono
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Rol
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                <option value="cliente">Cliente</option>
                <option value="subadmin">Subadmin</option>
                <option value="admin">Admin</option>
              </select>
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
          <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
            <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
              <label className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-2xl border border-[#87CCC8]/30 px-11 py-3 outline-none"
                  placeholder="Buscar por nombre, alias, correo o teléfono..."
                />
              </label>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadUsers}
                disabled={loadingUsers}
                className="smika-button-primary flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Search size={17} />
                Buscar
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando usuarios...</p>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <UsersRound size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                No hay usuarios registrados
              </h3>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-3">
              {sortedUsers.map((user) => (
                <article
                  key={getId(user)}
                  className="rounded-[28px] bg-white p-6 border border-[#87CCC8]/20 smika-shadow"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                      {getStatusText(user)}
                    </span>

                    <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black">
                    {getFullName(user)}
                  </h3>

                  <div className="mt-3 grid gap-2 text-sm text-gray-600">
                    <p>
                      <strong>Alias:</strong> {user.alias || "Sin alias"}
                    </p>

                    <p>
                      <strong>Correo:</strong> {user.email}
                    </p>

                    <p>
                      <strong>Teléfono:</strong>{" "}
                      {user.telefonoCompleto ||
                        `${user.codigoPais || ""} ${user.telefono || ""}`.trim() ||
                        "Sin teléfono"}
                    </p>

                    <p>
                      <strong>Registro:</strong>{" "}
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("es-PE")
                        : "Sin fecha"}
                    </p>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(user)}
                      className="smika-button-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user)}
                      disabled={saving}
                      className="h-11 w-11 rounded-full bg-[#F8F6F7] flex items-center justify-center disabled:opacity-60"
                      title={user.activo ? "Desactivar" : "Activar"}
                    >
                      <Power
                        size={17}
                        className={
                          user.activo ? "text-gray-500" : "text-red-500"
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

export default AdminUsersPage;