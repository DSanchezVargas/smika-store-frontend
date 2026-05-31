import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Search
} from "lucide-react";

import { apiRequest } from "../../services/api";

const estadoPedidoOptions = [
  { value: "", label: "Todos" },
  { value: "pendiente_whatsapp", label: "Pendiente WhatsApp" },
  { value: "cotizado", label: "Cotizado" },
  { value: "separado", label: "Separado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "empaquetado", label: "Empaquetado" },
  { value: "listo_para_entrega", label: "Listo para entrega" },
  { value: "enviado", label: "Enviado" },
  { value: "en_courier", label: "En courier" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" }
];

const estadoPagoOptions = [
  { value: "", label: "Todos" },
  { value: "sin_pago", label: "Sin pago" },
  { value: "adelanto", label: "Adelanto" },
  { value: "pago_completo", label: "Pago completo" },
  { value: "cuotas", label: "Cuotas" }
];

const initialForm = {
  estadoPedido: "pendiente_whatsapp",
  estadoPago: "sin_pago",
  montoPagado: 0,
  observaciones: "",
  notasAdmin: "",
  envio: {
    courier: "",
    numeroTracking: "",
    trackingUrl: "",
    fechaEnvio: "",
    fechaEntregaEstimada: "",
    direccionEntrega: ""
  }
};

function getId(item) {
  return item?._id || item?.id || "";
}

function getLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value || "-";
}

function formatCurrency(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function getClientName(order) {
  const cliente = order?.cliente || {};
  const fullName = `${cliente.nombre || ""} ${cliente.apellido || ""}`.trim();

  return fullName || cliente.alias || "Cliente";
}

function normalizeOrder(order = {}) {
  return {
    ...order,
    id: getId(order),
    _id: getId(order),
    cliente: {
      nombre: order.cliente?.nombre || "",
      apellido: order.cliente?.apellido || "",
      alias: order.cliente?.alias || "",
      telefono: order.cliente?.telefono || "",
      telefonoCompleto: order.cliente?.telefonoCompleto || "",
      email: order.cliente?.email || ""
    },
    items: Array.isArray(order.items) ? order.items : [],
    totalReferencial: Number(order.totalReferencial || 0),
    montoPagado: Number(order.montoPagado || 0),
    saldoPendiente: Number(order.saldoPendiente || 0),
    estadoPago: order.estadoPago || "sin_pago",
    estadoPedido: order.estadoPedido || "pendiente_whatsapp",
    observaciones: order.observaciones || "",
    notasAdmin: order.notasAdmin || "",
    envio: {
      courier: order.envio?.courier || "",
      numeroTracking: order.envio?.numeroTracking || "",
      trackingUrl: order.envio?.trackingUrl || "",
      fechaEnvio: order.envio?.fechaEnvio || "",
      fechaEntregaEstimada: order.envio?.fechaEntregaEstimada || "",
      direccionEntrega: order.envio?.direccionEntrega || ""
    }
  };
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("list");
  const [editingOrder, setEditingOrder] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [search, setSearch] = useState("");
  const [estadoPedidoFilter, setEstadoPedidoFilter] = useState("");
  const [estadoPagoFilter, setEstadoPagoFilter] = useState("");

  const [message, setMessage] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadOrders = async () => {
    setLoadingOrders(true);
    setMessage("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (estadoPedidoFilter) params.set("estadoPedido", estadoPedidoFilter);
      if (estadoPagoFilter) params.set("estadoPago", estadoPagoFilter);

      const endpoint = params.toString()
        ? `/orders?${params.toString()}`
        : "/orders";

      const data = await apiRequest(endpoint);

      setOrders((data.orders || []).map(normalizeOrder));
    } catch (error) {
      setMessage(error.message || "No se pudieron cargar los pedidos.");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    });
  }, [orders]);

  const resetForm = () => {
    setEditingOrder(null);
    setForm(initialForm);
    setView("list");
  };

  const openEditForm = (order) => {
    setMessage("");
    setEditingOrder(order);

    setForm({
      estadoPedido: order.estadoPedido || "pendiente_whatsapp",
      estadoPago: order.estadoPago || "sin_pago",
      montoPagado: Number(order.montoPagado || 0),
      observaciones: order.observaciones || "",
      notasAdmin: order.notasAdmin || "",
      envio: {
        courier: order.envio?.courier || "",
        numeroTracking: order.envio?.numeroTracking || "",
        trackingUrl: order.envio?.trackingUrl || "",
        fechaEnvio: formatDateInput(order.envio?.fechaEnvio),
        fechaEntregaEstimada: formatDateInput(order.envio?.fechaEntregaEstimada),
        direccionEntrega: order.envio?.direccionEntrega || ""
      }
    });

    setView("form");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));
  };

  const handleShippingChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      envio: {
        ...currentForm.envio,
        [name]: value
      }
    }));
  };

  const buildPayload = () => ({
    estadoPedido: form.estadoPedido,
    estadoPago: form.estadoPago,
    montoPagado: Number(form.montoPagado || 0),
    observaciones: form.observaciones,
    notasAdmin: form.notasAdmin,
    envio: {
      courier: form.envio.courier,
      numeroTracking: form.envio.numeroTracking,
      trackingUrl: form.envio.trackingUrl,
      fechaEnvio: form.envio.fechaEnvio || null,
      fechaEntregaEstimada: form.envio.fechaEntregaEstimada || null,
      direccionEntrega: form.envio.direccionEntrega
    }
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editingOrder) return;

    if (Number(form.montoPagado || 0) < 0) {
      setMessage("El monto pagado no puede ser negativo.");
      return;
    }

    setSaving(true);
    setMessage("Actualizando pedido...");

    try {
      const orderId = getId(editingOrder);

      const data = await apiRequest(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify(buildPayload())
      });

      const updatedOrder = normalizeOrder(data.order);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          getId(order) === orderId ? updatedOrder : order
        )
      );

      setMessage("Pedido actualizado correctamente.");
      resetForm();
      await loadOrders();
    } catch (error) {
      setMessage(error.message || "No se pudo actualizar el pedido.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">Pedidos</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">Gestión de pedidos</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              Gestiona estado del pedido, pago, saldo pendiente, envío,
              courier y tracking.
            </p>
          </div>

          {view === "list" ? (
            <button
              type="button"
              onClick={loadOrders}
              disabled={loadingOrders || saving}
              className="rounded-full bg-[#F8F6F7] px-5 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={loadingOrders ? "animate-spin" : ""}
              />
              Actualizar pedidos
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
              <p className="text-[#87CCC8] font-black">Editar pedido</p>

              <h3 className="mt-2 text-2xl font-black">
                {getClientName(editingOrder)}
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Total: {formatCurrency(editingOrder?.totalReferencial)} · Saldo:
                {" "}
                {formatCurrency(editingOrder?.saldoPendiente)}
              </p>
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
              {saving ? "Guardando..." : "Guardar pedido"}
            </button>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-black">
              Estado del pedido
              <select
                name="estadoPedido"
                value={form.estadoPedido}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                {estadoPedidoOptions
                  .filter((option) => option.value)
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Estado de pago
              <select
                name="estadoPago"
                value={form.estadoPago}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                {estadoPagoOptions
                  .filter((option) => option.value)
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-black">
              Monto pagado
              <input
                name="montoPagado"
                type="number"
                min="0"
                step="0.01"
                value={form.montoPagado}
                onChange={handleChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Courier
              <input
                name="courier"
                value={form.envio.courier}
                onChange={handleShippingChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
                placeholder="Olva, Shalom, Serpost..."
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Número de tracking
              <input
                name="numeroTracking"
                value={form.envio.numeroTracking}
                onChange={handleShippingChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              URL de tracking
              <input
                name="trackingUrl"
                value={form.envio.trackingUrl}
                onChange={handleShippingChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Fecha de envío
              <input
                name="fechaEnvio"
                type="date"
                value={form.envio.fechaEnvio}
                onChange={handleShippingChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black">
              Fecha estimada de entrega
              <input
                name="fechaEntregaEstimada"
                type="date"
                value={form.envio.fechaEntregaEstimada}
                onChange={handleShippingChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Dirección de entrega
              <input
                name="direccionEntrega"
                value={form.envio.direccionEntrega}
                onChange={handleShippingChange}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Observaciones del cliente
              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                rows="3"
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-black lg:col-span-2">
              Notas internas admin
              <textarea
                name="notasAdmin"
                value={form.notasAdmin}
                onChange={handleChange}
                rows="3"
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              />
            </label>

            <div className="rounded-[28px] bg-[#F8F6F7] p-5 lg:col-span-2">
              <p className="font-black">Productos del pedido</p>

              <div className="mt-4 grid gap-3">
                {editingOrder?.items?.map((item, index) => (
                  <div
                    key={`${item.producto || item.nombreProducto}-${index}`}
                    className="rounded-2xl bg-white p-4 text-sm"
                  >
                    <p className="font-black">{item.nombreProducto}</p>

                    <p className="mt-1 text-gray-600">
                      Cantidad: {item.cantidad} · Unitario:{" "}
                      {formatCurrency(item.precioReferencialUnitario)} ·
                      Subtotal: {formatCurrency(item.subtotalReferencial)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}

      {view === "list" && (
        <>
          <div className="rounded-[28px] bg-white p-5 smika-shadow border border-[#87CCC8]/20">
            <div className="grid gap-4 xl:grid-cols-[1fr_220px_220px_auto]">
              <label className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-2xl border border-[#87CCC8]/30 px-11 py-3 outline-none"
                  placeholder="Buscar por cliente, teléfono o correo..."
                />
              </label>

              <select
                value={estadoPedidoFilter}
                onChange={(event) => setEstadoPedidoFilter(event.target.value)}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                {estadoPedidoOptions.map((option) => (
                  <option key={option.value || "todos"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={estadoPagoFilter}
                onChange={(event) => setEstadoPagoFilter(event.target.value)}
                className="rounded-2xl border border-[#87CCC8]/30 px-4 py-3 outline-none"
              >
                {estadoPagoOptions.map((option) => (
                  <option key={option.value || "todos"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadOrders}
                disabled={loadingOrders}
                className="smika-button-primary flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Search size={17} />
                Buscar
              </button>
            </div>
          </div>

          {loadingOrders ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <Loader2
                size={42}
                className="mx-auto animate-spin text-[#87CCC8]"
              />
              <p className="mt-4 font-black">Cargando pedidos...</p>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center smika-shadow">
              <ClipboardList size={42} className="mx-auto text-[#D1B0C7]" />

              <h3 className="mt-4 text-2xl font-black">
                Todavía no hay pedidos
              </h3>

              <p className="mt-2 text-gray-600">
                Los pedidos aparecerán cuando el cliente genere su lista o pedido.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {sortedOrders.map((order) => (
                <article
                  key={getId(order)}
                  className="rounded-[28px] bg-white p-6 border border-[#87CCC8]/20 smika-shadow"
                >
                  <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr_1fr_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#F7D9D8] px-3 py-1 text-xs font-black">
                          {getLabel(estadoPedidoOptions, order.estadoPedido)}
                        </span>

                        <span className="rounded-full bg-[#87CCC8]/20 px-3 py-1 text-xs font-black">
                          {getLabel(estadoPagoOptions, order.estadoPago)}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-black">
                        {getClientName(order)}
                      </h3>

                      <p className="mt-2 text-sm text-gray-600">
                        {order.cliente.telefonoCompleto ||
                          order.cliente.telefono ||
                          "Sin teléfono"}{" "}
                        · {order.cliente.email || "Sin correo"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Creado: {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Total:</strong>{" "}
                        {formatCurrency(order.totalReferencial)}
                      </p>

                      <p>
                        <strong>Pagado:</strong>{" "}
                        {formatCurrency(order.montoPagado)}
                      </p>

                      <p>
                        <strong>Saldo:</strong>{" "}
                        {formatCurrency(order.saldoPendiente)}
                      </p>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Productos:</strong> {order.items.length}
                      </p>

                      <p>
                        <strong>Courier:</strong>{" "}
                        {order.envio.courier || "Sin courier"}
                      </p>

                      <p>
                        <strong>Tracking:</strong>{" "}
                        {order.envio.numeroTracking || "Sin tracking"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditForm(order)}
                      className="smika-button-primary flex items-center justify-center gap-2"
                    >
                      <Pencil size={16} />
                      Editar
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

export default AdminOrdersPage;