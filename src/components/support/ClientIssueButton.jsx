import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, MessageSquare, Send, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { createClientIssue } from "../../services/clientIssueService";

const issueTypes = [
  { value: "comentario_pagina", label: "Comentario sobre la página" },
  { value: "algo_no_carga", label: "Algo no carga" },
  { value: "falla_producto", label: "Falla en producto" },
  { value: "falla_pedido", label: "Falla en pedido" },
  { value: "problema_visual", label: "Problema visual" },
  { value: "otro", label: "Otro" }
];

const initialForm = {
  tipo: "comentario_pagina",
  titulo: "",
  descripcion: ""
};

function ClientIssueButton() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const user = auth?.user || auth?.currentUser || null;
  const isAuthenticated = Boolean(auth?.isAuthenticated || user);

  const handleOpen = () => {
    if (!isAuthenticated) {
      navigate(
        `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
      );
      return;
    }

    setOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.descripcion.trim()) {
      setMessage("Describe brevemente lo que pasó.");
      return;
    }

    setSaving(true);
    setMessage("Enviando incidencia...");

    try {
      await createClientIssue({
        ...form,
        pagina: location.pathname + location.search
      });

      setMessage("Incidencia enviada. El equipo de Smika la revisará.");
      setForm(initialForm);

      setTimeout(() => {
        setOpen(false);
        setMessage("");
      }, 1800);
    } catch (error) {
      setMessage(error.message || "No se pudo enviar la incidencia.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-24 right-5 z-[999] flex h-14 w-14 items-center justify-center rounded-full bg-[#D1B0C7] text-white shadow-xl transition hover:scale-105"
        title="Reportar incidencia"
      >
        <MessageSquare size={25} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-[32px] bg-white p-6 smika-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[#87CCC8] font-black">Incidencias de clientes</p>
                <h2 className="mt-1 text-2xl font-black">Cuéntanos qué pasó</h2>
                <p className="mt-2 text-sm text-gray-600 leading-6">
                  Este reporte llegará al panel de admin/subadmin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8F6F7]"
              >
                <X size={20} />
              </button>
            </div>

            {message && (
              <div className="mt-4 rounded-2xl bg-[#F7D9D8] px-4 py-3 text-sm font-black">
                {message}
              </div>
            )}

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-black">
                Tipo de reporte
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                >
                  {issueTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-black">
                Título opcional
                <input
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                  placeholder="Ejemplo: No carga un producto"
                />
              </label>

              <label className="grid gap-2 text-sm font-black">
                Descripción
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows="5"
                  className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                  placeholder="Describe el comentario, falla o parte que no carga."
                />
              </label>

              <div className="rounded-2xl bg-[#F8F6F7] p-4 text-xs text-gray-600 leading-5">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#D1B0C7]" />
                  <p>
                    Página detectada: <strong>{location.pathname}</strong>
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-full bg-[#87CCC8] px-5 py-3 font-black text-white disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Enviar reporte
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default ClientIssueButton;
