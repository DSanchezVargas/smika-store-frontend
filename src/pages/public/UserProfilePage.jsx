import UserRegisteredEventsSection from "../../components/event/UserRegisteredEventsSection";

function UserProfilePage() {
  return (
    <>
      <section className="container-smika py-12">
        <div className="rounded-[32px] bg-[#F8F6F7] p-8">
          <p className="text-[#87CCC8] font-black">Mi cuenta</p>

          <h2 className="text-4xl font-black mt-2">
            Perfil, pedidos y favoritos
          </h2>

          <p className="mt-3 text-gray-600 max-w-3xl leading-7">
            Aquí el usuario verá sus pedidos, favoritos, lista de deseos,
            recomendaciones, notificaciones y eventos registrados.
          </p>
        </div>
      </section>

      <UserRegisteredEventsSection title="Mis eventos registrados" />

      <section className="container-smika py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="smika-card smika-shadow p-6">
            <p className="text-[#87CCC8] font-black">Pedidos</p>
            <h3 className="mt-2 text-2xl font-black">Mis pedidos</h3>
            <p className="mt-2 text-gray-600">
              Seguimiento de pedidos, pagos, envío y tracking.
            </p>
          </div>

          <div className="smika-card smika-shadow p-6">
            <p className="text-[#D1B0C7] font-black">Favoritos</p>
            <h3 className="mt-2 text-2xl font-black">Lista de deseos</h3>
            <p className="mt-2 text-gray-600">
              Productos, series e intereses guardados por el usuario.
            </p>
          </div>

          <div className="smika-card smika-shadow p-6">
            <p className="text-[#87CCC8] font-black">Para ti</p>
            <h3 className="mt-2 text-2xl font-black">Recomendados</h3>
            <p className="mt-2 text-gray-600">
              Productos sugeridos según sus preferencias.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default UserProfilePage;