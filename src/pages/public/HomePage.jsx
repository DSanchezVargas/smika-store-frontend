import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

import { useAdminData } from "../../context/AdminDataContext";
import { getPublicProducts } from "../../utils/publicProducts";

import ProductCard from "../../components/product/ProductCard";
import UserRegisteredEventsSection from "../../components/event/UserRegisteredEventsSection";

const homeBannerImage = "/images/home-banner.jpg";

function HomePage() {
  const { products } = useAdminData();

  const publicProducts = useMemo(() => {
    return getPublicProducts(products);
  }, [products]);

  const featuredProducts = useMemo(() => {
    return publicProducts.slice(0, 8);
  }, [publicProducts]);

  const categories = [
    {
      title: "Series",
      text: "Chinas, coreanas, japonesas y variado.",
      path: "/series"
    },
    {
      title: "Eventos",
      text: "Café, pop up, Lebom y especiales.",
      path: "/eventos"
    },
    {
      title: "Libros",
      text: "Tomos China, KR, JP y TW.",
      path: "/libros"
    },
    {
      title: "Preventa",
      text: "Productos por llegar desde Asia.",
      path: "/preventa"
    }
  ];

  return (
    <>
      <section className="bg-gradient-to-br from-[#F7D9D8]/60 via-white to-[#87CCC8]/30">
        <div className="container-smika py-16 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 smika-shadow text-sm font-bold">
              <Sparkles size={16} className="text-[#D1B0C7]" />
              Catálogo bonito para fans
            </div>

            <h2 className="mt-6 text-4xl md:text-6xl font-black leading-tight">
              Encuentra productos especiales en{" "}
              <span className="text-[#87CCC8]">Smika Store</span>
            </h2>

            <p className="mt-5 text-gray-600 text-lg leading-8">
              Explora series, eventos, libros, preventas y personalizados.
              Arma tu lista de pedido y coordina por WhatsApp.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/nuevos-productos" className="smika-button-primary">
                Ver nuevos productos
              </Link>

              <Link to="/lista-pedido" className="smika-button">
                Mi lista de pedido
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[36px] bg-white p-5 smika-shadow">
              <img
                src="/home-banner.jpg"
                alt="Banner principal de Smika Store"
                className="aspect-square w-full rounded-[28px] object-cover"
              />
            </div>

            <div className="absolute -bottom-5 -left-5 bg-white rounded-3xl p-5 smika-shadow hidden md:block">
              <p className="text-sm text-gray-500">Pedido por WhatsApp</p>
              <p className="font-black text-lg">rápido y ordenado</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-smika py-14">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[#87CCC8] font-black">Explora</p>
            <h2 className="text-3xl font-black">Categorías principales</h2>
          </div>

          <Link
            to="/series"
            className="hidden sm:flex items-center gap-2 font-bold"
          >
            Ver todo <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.title}
              to={category.path}
              className="rounded-3xl p-6 bg-[#F8F6F7] hover:bg-[#F7D9D8]/60 transition"
            >
              <h3 className="text-xl font-black">{category.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-6">
                {category.text}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <UserRegisteredEventsSection title="Tus eventos registrados" />

      <section className="container-smika py-10">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[#D1B0C7] font-black">Novedades</p>
            <h2 className="text-3xl font-black">Nuevos productos</h2>
          </div>

          <Link
            to="/nuevos-productos"
            className="hidden sm:flex items-center gap-2 font-bold"
          >
            Ver más <ArrowRight size={18} />
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-[#F8F6F7] p-8 text-center">
            <p className="font-black text-[#2F2F2F]">
              Todavía no hay productos activos.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Cuando admin cree productos activos, aparecerán aquí.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

export default HomePage;