import { Link } from "react-router-dom";

import { socialLinks } from "../../data/navigationData";

function getUploadAsset(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}${cleanPath}`;
}

const socialItems = [
  {
    label: "Instagram",
    shortLabel: "IG",
    href: socialLinks.instagram,
    image: getUploadAsset("/Instagram.png"),
    gradient: "from-[#F7D9D8] via-[#ffffff] to-[#D1B0C7]",
    ring: "hover:ring-[#D1B0C7]/50",
    description: "Novedades y fotos"
  },
  {
    label: "TikTok",
    shortLabel: "TT",
    href: socialLinks.tiktok,
    image: getUploadAsset("/Tiktok.png"),
    gradient: "from-[#2F2F2F] via-[#ffffff] to-[#87CCC8]",
    ring: "hover:ring-[#87CCC8]/50",
    description: "Videos de productos"
  },
  {
    label: "WhatsApp",
    shortLabel: "WA",
    href: socialLinks.whatsappChannel,
    image: getUploadAsset("/Whatsapp.png"),
    gradient: "from-[#87CCC8] via-[#ffffff] to-[#CDEDEA]",
    ring: "hover:ring-[#87CCC8]/50",
    description: "Canal de avisos"
  }
];

function Footer() {
  return (
    <footer className="mt-20 border-t border-[#87CCC8]/20 bg-[#F8F6F7]">
      <div className="container-smika py-12 grid gap-10 lg:grid-cols-[1.2fr_0.8fr_1.1fr]">
        <div>
          <div className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-[#87CCC8] smika-shadow">
            Smika Store
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight">
            Detalles bonitos para fans
          </h2>

          <p className="mt-3 max-w-sm text-sm text-gray-600 leading-7">
            Tienda online tipo catálogo para productos de series, eventos,
            libros, preventas y personalizados.
          </p>
        </div>

        <div>
          <h3 className="font-black mb-4">Explorar</h3>

          <div className="grid gap-2 text-sm text-gray-600">
            <Link className="hover:text-[#87CCC8] font-semibold" to="/series">
              Series
            </Link>
            <Link className="hover:text-[#87CCC8] font-semibold" to="/eventos">
              Eventos
            </Link>
            <Link className="hover:text-[#87CCC8] font-semibold" to="/libros">
              Libros
            </Link>
            <Link className="hover:text-[#87CCC8] font-semibold" to="/preventa">
              Preventa
            </Link>
            <Link
              className="hover:text-[#87CCC8] font-semibold"
              to="/personalizados"
            >
              Personalizados
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-black mb-4">Redes</h3>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {socialItems.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className={`group rounded-[28px] bg-white p-3 smika-shadow border border-white/80 transition hover:-translate-y-1 hover:ring-4 ${social.ring}`}
                title={social.label}
              >
                <span
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${social.gradient} shadow-sm transition group-hover:scale-105`}
                >
                  <img
                    src={social.image}
                    alt={social.label}
                    className="h-8 w-8 object-contain"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.nextElementSibling.style.display = "grid";
                    }}
                  />

                  <span className="hidden h-8 w-8 place-items-center rounded-full bg-white/85 text-xs font-black text-[#2F2F2F]">
                    {social.shortLabel}
                  </span>
                </span>

                <span className="mt-3 block text-center text-sm font-black">
                  {social.label}
                </span>

                <span className="mt-1 block text-center text-[11px] font-semibold text-gray-500">
                  {social.description}
                </span>
              </a>
            ))}
          </div>

          <p className="mt-4 text-xs leading-6 text-gray-500">
            Los íconos se cargan desde el backend en{" "}
            <span className="font-black text-[#87CCC8]">/uploads/social</span>.
          </p>
        </div>
      </div>

      <div className="border-t border-[#87CCC8]/20 py-4 text-center text-xs text-gray-500">
        © 2026 Smika Store. Proyecto web en desarrollo.
      </div>
    </footer>
  );
}

export default Footer;
