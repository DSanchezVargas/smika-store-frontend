import { useState } from "react";
import {
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Power,
  Save,
  ShieldCheck,
  X
} from "lucide-react";

const initialSubadmins = [
  {
    id: 1,
    nombre: "Subadmin",
    apellido: "Smika",
    alias: "subadmin_smika",
    email: "subadmin@smika.local",
    role: "subadmin",
    estado: "Activo"
  }
];

function AdminSubadminsPage() {
  const [subadmins, setSubadmins] = useState(initialSubadmins);
  const [showForm, setShowForm] = useState(false);
  const [editingSubadminId, setEditingSubadminId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    alias: "",
    email: "",
    password: "",
    estado: "Activo"
  });

  const isEditing = Boolean(editingSubadminId);

  const resetForm = () => {
    setForm({
      nombre: "",
      apellido: "",
      alias: "",
      email: "",
      password: "",
      estado: "Activo"
    });

    setEditingSubadminId(null);
    setShowForm(false);
    setShowPassword(false);
  };

  const handleOpenCreate = () => {
    setMessage("");
    setForm({
      nombre: "",
      apellido: "",
      alias: "",
      email: "",
      password: "",
      estado: "Activo"
    });

    setEditingSubadminId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (subadmin) => {
    setMessage("");
    setForm({
      nombre: subadmin.nombre,
      apellido: subadmin.apellido,
      alias: subadmin.alias,
      email: subadmin.email,
      password: "",
      estado: subadmin.estado
    });

    setEditingSubadminId(subadmin.id);
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.nombre || !form.apellido || !form.email) {
      setMessage("Completa nombre, apellido y correo.");
      return;
    }

    if (!isEditing && !form.password) {
      setMessage("Para crear un subadmin debes colocar una contraseña.");
      return;
    }

    if (!isEditing) {
      const emailExists = subadmins.some(
        (subadmin) => subadmin.email.toLowerCase() === form.email.toLowerCase()
      );

      if (emailExists) {
        setMessage("Ya existe un subadmin con ese correo.");
        return;
      }

      const newSubadmin = {
        id: Date.now(),
        nombre: form.nombre,
        apellido: form.apellido,
        alias: form.alias || form.email.split("@")[0],
        email: form.email.toLowerCase().trim(),
        role: "subadmin",
        estado: form.estado
      };

      setSubadmins([newSubadmin, ...subadmins]);
      setMessage("Subadmin creado correctamente.");
      resetForm();
      return;
    }

    const updatedSubadmins = subadmins.map((subadmin) => {
      if (subadmin.id !== editingSubadminId) {
        return subadmin;
      }

      return {
        ...subadmin,
        nombre: form.nombre,
        apellido: form.apellido,
        alias: form.alias || form.email.split("@")[0],
        email: form.email.toLowerCase().trim(),
        estado: form.estado
      };
    });

    setSubadmins(updatedSubadmins);
    setMessage("Subadmin actualizado correctamente.");
    resetForm();
  };

  const handleToggleStatus = (subadminId) => {
    const updatedSubadmins = subadmins.map((subadmin) => {
      if (subadmin.id !== subadminId) {
        return subadmin;
      }

      return {
        ...subadmin,
        estado: subadmin.estado === "Activo" ? "Inactivo" : "Activo"
      };
    });

    setSubadmins(updatedSubadmins);
    setMessage("Estado del subadmin actualizado.");
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
              Aquí la administradora podrá crear y gestionar subadmins. Por
              ahora, admin y subadmin tendrán acceso a las mismas funciones del
              panel.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="smika-button-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Crear subadmin
          </button>
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
                El subadmin podrá acceder al panel administrativo con las mismas
                funciones que la administradora.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="h-10 w-10 rounded-full bg-[#F8F6F7] flex items-center justify-center"
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
                name="estado"
                value={form.estado}
                onChange={handleChange}
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
              className="smika-button-primary flex items-center gap-2"
            >
              <Save size={18} />
              {isEditing ? "Guardar cambios" : "Crear subadmin"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="smika-button"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow">
        <h3 className="text-2xl font-black">Subadmins registrados</h3>

        <div className="mt-6 overflow-hidden rounded-3xl border border-gray-100">
          <div className="grid grid-cols-[1.3fr_1.4fr_1fr_120px] bg-[#F8F6F7] px-5 py-4 text-sm font-black">
            <span>Nombre</span>
            <span>Correo</span>
            <span>Rol</span>
            <span className="text-right">Acciones</span>
          </div>

          {subadmins.map((subadmin) => (
            <div
              key={subadmin.id}
              className="grid grid-cols-[1.3fr_1.4fr_1fr_120px] px-5 py-5 text-sm border-t border-gray-100 items-center"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-11 w-11 rounded-full text-white flex items-center justify-center ${
                    subadmin.estado === "Activo"
                      ? "bg-[#87CCC8]"
                      : "bg-gray-300"
                  }`}
                >
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <p className="font-black">
                    {subadmin.nombre} {subadmin.apellido}
                  </p>

                  <p className="text-xs text-gray-500">
                    {subadmin.alias} · {subadmin.estado}
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
                  className="h-9 w-9 rounded-full bg-[#F7D9D8] flex items-center justify-center"
                  title="Editar subadmin"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(subadmin.id)}
                  className={`h-9 w-9 rounded-full flex items-center justify-center ${
                    subadmin.estado === "Activo"
                      ? "bg-[#F8F6F7]"
                      : "bg-red-50 text-red-500"
                  }`}
                  title={
                    subadmin.estado === "Activo"
                      ? "Desactivar subadmin"
                      : "Reactivar subadmin"
                  }
                >
                  <Power size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-sm text-gray-500">
          Por ahora estos cambios funcionan visualmente en el frontend. Luego se
          conectarán al backend para guardarse en MongoDB.
        </p>
      </div>
    </section>
  );
}

export default AdminSubadminsPage;