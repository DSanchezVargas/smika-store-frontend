import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Trash2 } from "lucide-react";

import {
  deleteClientIssue,
  getClientIssues,
  updateClientIssue
} from "../../services/clientIssueService";

const statusOptions = ["pendiente", "revisado", "resuelto", "descartado"];

const typeLabels = {
  comentario_pagina: "Comentario sobre la página",
  algo_no_carga: "Algo no carga",
  falla_producto: "Falla en producto",
  falla_pedido: "Falla en pedido",
  problema_visual: "Problema visual",
  otro: "Otro"
};

function pickIssues(data) {
  if (Array.isArray(data?.issues)) return data.issues;
  if (Array.isArray(data?.incidencias)) return data.incidencias;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;

  return [];
}

function getId(issue) {
  return issue?._id || issue?.id || "";
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function AdminClientIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const filteredIssues = useMemo(() => {
    if (statusFilter === "todos") return issues;

    return issues.filter((issue) => issue.estado === statusFilter);
  }, [issues, statusFilter]);

  const pendingCount = useMemo(() => {
    return issues.filter((issue) => issue.estado === "pendiente").length;
  }, [issues]);

  const loadIssues = async () => {
    setLoading(true);
    setMessage("");

    try {
      const params = statusFilter === "todos" ? {} : { estado: statusFilter };
      const data = await getClientIssues(params);
      setIssues(pickIssues(data));
    } catch (error) {
      setMessage(error.message || "No se pudieron cargar las incidencias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

  const handleStatusChange = async (issue, nextStatus) => {
    const id = getId(issue);

    if (!id) return;

    setSavingId(id);
    setMessage("Actualizando incidencia...");

    try {
      const data = await updateClientIssue(id, {
        estado: nextStatus
      });

      const updatedIssue = data.issue || data.incidencia || data.data;

      setIssues((currentIssues) =>
        currentIssues.map((currentIssue) =>
          getId(currentIssue) === id ? { ...currentIssue, ...updatedIssue } : currentIssue
        )
      );

      setMessage("Incidencia actualizada correctamente.");
    } catch (error) {
      setMessage(error.message || "No se pudo actualizar la incidencia.");
    } finally {
      setSavingId("");
    }
  };

  const handleDelete = async (issue) => {
    const id = getId(issue);

    if (!id) return;

    const confirmed = window.confirm(
      `¿Ocultar la incidencia de ${issue.usuarioEmail || issue.usuarioNombre || "cliente"}?`
    );

    if (!confirmed) return;

    setSavingId(id);
    setMessage("Ocultando incidencia...");

    try {
      await deleteClientIssue(id);
      setIssues((currentIssues) => currentIssues.filter((item) => getId(item) !== id));
      setMessage("Incidencia ocultada correctamente.");
    } catch (error) {
      setMessage(error.message || "No se pudo ocultar la incidencia.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Incidencias de clientes</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Reportes, comentarios y fallas</h2>
            <p className="mt-3 max-w-3xl text-gray-600 leading-7">
              Aquí admin y subadmin revisan los reportes enviados por usuarios registrados desde la tienda pública.
            </p>
          </div>

          <button
            type="button"
            onClick={loadIssues}
            disabled={loading}
            className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Recargar
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-[24px] bg-[#F7D9D8] px-5 py-4 text-sm font-black">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
          <AlertTriangle size={22} className="text-[#D1B0C7]" />
          <p className="mt-2 text-3xl font-black">{pendingCount}</p>
          <p className="text-sm font-black text-gray-500">Pendientes</p>
        </div>

        <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20 md:col-span-3">
          <label className="grid gap-2 text-sm font-black">
            Filtrar por estado
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
            >
              <option value="todos">Todos</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
          <Loader2 size={42} className="mx-auto animate-spin text-[#87CCC8]" />
          <p className="mt-4 font-black">Cargando incidencias...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
          <CheckCircle2 size={42} className="mx-auto text-[#87CCC8]" />
          <h3 className="mt-4 text-2xl font-black">No hay incidencias en este filtro</h3>
          <p className="mt-2 text-gray-600">Cuando un cliente reporte algo aparecerá aquí.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredIssues.map((issue) => {
            const id = getId(issue);
            const isSaving = savingId === id;

            return (
              <article
                key={id}
                className="rounded-[28px] bg-white p-6 smika-shadow border border-[#87CCC8]/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-[#87CCC8]">
                      {typeLabels[issue.tipo] || issue.tipo || "Incidencia"}
                    </p>

                    <h3 className="mt-1 text-2xl font-black">
                      {issue.titulo || "Reporte de cliente"}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {issue.usuarioNombre || "Usuario"} · {issue.usuarioEmail || "sin correo"} · {formatDate(issue.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={issue.estado || "pendiente"}
                      onChange={(event) => handleStatusChange(issue, event.target.value)}
                      disabled={isSaving}
                      className="rounded-full border border-[#87CCC8]/30 px-4 py-2 text-sm font-black outline-none disabled:opacity-60"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDelete(issue)}
                      disabled={isSaving}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 disabled:opacity-60"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl bg-[#F8F6F7] p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {issue.descripcion || "Sin descripción."}
                  </p>

                  {issue.pagina && (
                    <p className="mt-4 text-xs font-black text-gray-500">
                      Página: {issue.pagina}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminClientIssuesPage;
