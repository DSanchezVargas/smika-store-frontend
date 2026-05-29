import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Pencil,
  Plus,
  Power,
  Save,
  UserRound,
  X
} from "lucide-react";

import { useAdminData } from "../../context/AdminDataContext";

const emptyForm = {
  nombre: "",
  serie: "",
  descripcion: ""
};

function AdminCharactersPage() {
  const {
    characters,
    createCharacterFull,
    updateCharacter,
    toggleCharacterStatus
  } = useAdminData();

  const [view, setView] = useState("list");
  const [editingCharacterId, setEditingCharacterId] = useState(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);

  const isEditing = editingCharacterId !== null;

  const goToList = () => {
    setView("list");
    setEditingCharacterId(null);
    setForm(emptyForm);
  };

  const handleOpenCreate = () => {
    setMessage("");
    setEditingCharacterId(null);
    setForm(emptyForm);
    setView("form");
  };

  const handleOpenEdit = (character) => {
    setMessage("");
    setEditingCharacterId(character.id);
    setForm({
      nombre: character.nombre,
      serie: character.serie === "Pendiente" ? "" : character.serie,
      descripcion: character.descripcion || ""
    });
    setView("form");
  };

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.nombre || !form.serie) {
      setMessage("Completa el nombre y la serie del personaje.");
      return;
    }

    if (isEditing) {
      updateCharacter(editingCharacterId, {
        nombre: form.nombre,
        serie: form.serie,
        descripcion: form.descripcion || "Personaje registrado"
      });

      setMessage("Personaje actualizado correctamente.");
      goToList();
      return;
    }

    createCharacterFull({
      nombre: form.nombre,
      serie: form.serie,
      descripcion: form.descripcion || "Personaje registrado"
    });

    setMessage("Personaje creado correctamente.");
    goToList();
  };

  if (view === "form") {
    return (
      <section>
        <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
          <button
            type="button"
            onClick={goToList}
            className="mb-5 smika-button flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver a personajes
          </button>

          <p className="text-[#87CCC8] font-black">Personajes / Criaturas</p>

          <h2 className="mt-2 text-4xl font-black">
            {isEditing ? "Editar personaje" : "Crear personaje"}
          </h2>

          <p className="mt-3 text-gray-600 max-w-3xl leading-7">
            Completa los datos del personaje. Si fue agregado rápidamente desde
            un producto, aquí se termina de revisar.
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-3xl bg-[#F7D9D8]/70 px-5 py-4 font-bold">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Nombre del personaje
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                placeholder="Ejemplo: Tamon"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold">
              Serie relacionada
              <input
                name="serie"
                value={form.serie}
                onChange={handleChange}
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                placeholder="Ejemplo: La Ventura del Caballero Blanco"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Descripción opcional
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="4"
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#87CCC8]"
                placeholder="Notas internas del personaje"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              className="smika-button-primary flex items-center gap-2"
            >
              <Save size={18} />
              {isEditing ? "Guardar cambios" : "Crear personaje"}
            </button>

            <button
              type="button"
              onClick={goToList}
              className="smika-button flex items-center gap-2"
            >
              <X size={18} />
              Cancelar
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section>
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Personajes / Criaturas</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de personajes</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Aquí se crean y completan personajes. Los personajes agregados
              rápidamente desde productos aparecerán con “Faltan detalles”.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="smika-button-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Crear personaje
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-6 rounded-3xl bg-[#F7D9D8]/70 px-5 py-4 font-bold">
          {message}
        </div>
      )}

      <div className="mt-8 rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow">
        <h3 className="text-2xl font-black">Personajes registrados</h3>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[900px] overflow-hidden rounded-3xl border border-gray-100">
            <div className="grid grid-cols-[1.3fr_1.4fr_1fr_120px] bg-[#F8F6F7] px-5 py-4 text-sm font-black">
              <span>Personaje</span>
              <span>Serie</span>
              <span>Estado</span>
              <span className="text-right">Acciones</span>
            </div>

            {characters.map((character) => (
              <div
                key={character.id}
                className="grid grid-cols-[1.3fr_1.4fr_1fr_120px] px-5 py-5 text-sm border-t border-gray-100 items-center"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-full text-white flex items-center justify-center ${
                      character.needsReview ? "bg-[#D1B0C7]" : "bg-[#87CCC8]"
                    }`}
                  >
                    {character.needsReview ? (
                      <AlertCircle size={19} />
                    ) : (
                      <UserRound size={19} />
                    )}
                  </div>

                  <div>
                    <p className="font-black">{character.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {character.activo ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>

                <span>{character.serie}</span>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                    character.needsReview
                      ? "bg-[#F7D9D8]"
                      : "bg-[#87CCC8] text-white"
                  }`}
                >
                  {character.needsReview ? "Faltan detalles" : "Completo"}
                </span>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(character)}
                    className="h-9 w-9 rounded-full bg-[#F7D9D8] flex items-center justify-center"
                    title="Editar personaje"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCharacterStatus(character.id)}
                    className={`h-9 w-9 rounded-full flex items-center justify-center ${
                      character.activo
                        ? "bg-[#F8F6F7]"
                        : "bg-red-50 text-red-500"
                    }`}
                    title={
                      character.activo
                        ? "Desactivar personaje"
                        : "Reactivar personaje"
                    }
                  >
                    <Power size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminCharactersPage;