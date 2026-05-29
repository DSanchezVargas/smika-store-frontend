function AdminOrdersPage() {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[#87CCC8] font-black">Panel administrador</p>
          <h2 className="text-3xl font-black">Pedidos</h2>
          <p className="mt-2 text-gray-600">
            Aquí la administradora gestionará estados, pagos, envío y tracking.
          </p>
        </div>

        <button className="smika-button-primary">
          Actualizar pedidos
        </button>
      </div>

      <div className="mt-8 smika-card smika-shadow overflow-hidden">
        <div className="grid grid-cols-5 gap-4 bg-[#F8F6F7] px-5 py-4 text-sm font-black">
          <span>Cliente</span>
          <span>Total</span>
          <span>Pago</span>
          <span>Estado</span>
          <span>Tracking</span>
        </div>

        <div className="px-5 py-8 text-center text-gray-500">
          Todavía no hay pedidos cargados en esta vista.
        </div>
      </div>
    </section>
  );
}

export default AdminOrdersPage;
