import { Plus } from "lucide-react";

function AdminPlaceholderPage({
  eyebrow = "Panel administrador",
  title,
  description,
  buttonText = "Agregar registro"
}) {
  return (
    <section>
      <div className="rounded-[32px] bg-white p-8 smika-shadow border border-[#87CCC8]/20">
        <p className="text-[#87CCC8] font-black">{eyebrow}</p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black">{title}</h2>

            <p className="mt-3 text-gray-600 max-w-3xl leading-7">
              {description}
            </p>
          </div>

          <button className="smika-button-primary flex items-center gap-2">
            <Plus size={18} />
            {buttonText}
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] bg-white border border-[#87CCC8]/20 p-6 smika-shadow">
        <h3 className="text-2xl font-black">Listado</h3>

        <p className="mt-2 text-gray-600">
          Aquí se mostrará la tabla administrable cuando conectemos esta sección
          con el backend.
        </p>
      </div>
    </section>
  );
}

export default AdminPlaceholderPage;