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
    ring: "hover:ring-[#D1B0C7]/40",
    accent: "bg-[#F7D9D8]/40",
    description: "Novedades y fotos"
  },
  {
    label: "TikTok",
    shortLabel: "TT",
    href: socialLinks.tiktok,
    image: getUploadAsset("/Tiktok.png"),
    gradient: "from-[#2F2F2F] via-[#ffffff] to-[#87CCC8]",
    ring: "hover:ring-[#87CCC8]/40",
    accent: "bg-[#87CCC8]/35",
    description: "Videos de productos"
  },
  {
    label: "WhatsApp",
    shortLabel: "WA",
    href: socialLinks.whatsappChannel,
    image: getUploadAsset("/Whatsapp.png"),
    gradient: "from-[#87CCC8] via-[#ffffff] to-[#CDEDEA]",
    ring: "hover:ring-[#87CCC8]/40",
    accent: "bg-[#CDEDEA]/60",
    description: "Canal de avisos"
  }
];

function Footer() {
  return (
    <footer className="mt-20 overflow-hidden border-t border-[#87CCC8]/20 bg-[#F8F6F7]">
      <div className="container-smika relative py-12">
        <div className="pointer-events-none absolute -right-16 top-8 h-44 w-44 rounded-full bg-[#87CCC8]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-8 h-36 w-36 rounded-full bg-[#F7D9D8]/60 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.75fr_1.25fr]">
          <div>
            <div className="inline-flex rounded-full bg-white/80 px-4 py-2 text-xs font-black text-[#87CCC8] shadow-sm ring-1 ring-[#87CCC8]/15">
              Smika Store
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#2F2F2F]">
              Detalles bonitos para fans
            </h2>

            <p className="mt-3 max-w-sm text-sm text-gray-600 leading-7">
              Tienda online tipo catálogo para productos de series, eventos,
              libros, preventas y personalizados.
            </p>
          </div>

          <div>
            <h3 className="font-black mb-4 text-[#2F2F2F]">Explorar</h3>

            <div className="grid gap-2 text-sm text-gray-600">
              <Link className="font-semibold transition hover:translate-x-1 hover:text-[#87CCC8]" to="/series">
                Series
              </Link>
              <Link className="font-semibold transition hover:translate-x-1 hover:text-[#87CCC8]" to="/eventos">
                Eventos
              </Link>
              <Link className="font-semibold transition hover:translate-x-1 hover:text-[#87CCC8]" to="/libros">
                Libros
              </Link>
              <Link className="font-semibold transition hover:translate-x-1 hover:text-[#87CCC8]" to="/preventa">
                Preventa
              </Link>
              <Link
                className="font-semibold transition hover:translate-x-1 hover:text-[#87CCC8]"
                to="/personalizados"
              >
                Personalizados
              </Link>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-[#2F2F2F]">Redes</h3>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Síguenos y revisa las novedades de Smika.
                </p>
              </div>
            </div>

            <div className="rounded-[34px] border border-white/80 bg-white/50 p-3 shadow-[0_18px_45px_rgba(47,47,47,0.06)] backdrop-blur">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {socialItems.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`group relative overflow-hidden rounded-[26px] border border-[#87CCC8]/15 bg-white/75 p-3 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_35px_rgba(47,47,47,0.08)] hover:ring-4 ${social.ring}`}
                    title={social.label}
                  >
                    <span
                      className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${social.accent} blur-2xl transition group-hover:scale-125`}
                    />

                    <span className="relative flex flex-col items-center text-center">
                      <span
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${social.gradient} shadow-sm ring-1 ring-white/70 transition duration-300 group-hover:scale-105 group-hover:rotate-3`}
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

                      <span className="mt-3 block text-sm font-black text-[#2F2F2F]">
                        {social.label}
                      </span>

                      <span className="mt-1 block text-[11px] font-semibold leading-4 text-gray-500">
                        {social.description}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#87CCC8]/20 bg-white/35 py-4 text-center text-xs font-semibold text-gray-500">
        © 2026 Smika Store. Proyecto web en desarrollo.
      </div>
    </footer>
  );
}

export default Footer;
