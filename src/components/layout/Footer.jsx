import { Link } from "react-router-dom";

import { socialLinks } from "../../data/navigationData";

function Footer() {
  return (
    <footer className="mt-20 border-t border-[#87CCC8]/20 bg-[#F8F6F7]">
      <div className="container-smika py-10 grid gap-8 md:grid-cols-3">
        <div>
          <h2 className="text-2xl font-black">Smika Store</h2>
          <p className="mt-3 text-sm text-gray-600 leading-6">
            Tienda online tipo catálogo para productos de series, eventos,
            libros, preventas y personalizados.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-3">Explorar</h3>

          <div className="grid gap-2 text-sm text-gray-600">
            <Link to="/series">Series</Link>
            <Link to="/eventos">Eventos</Link>
            <Link to="/libros">Libros</Link>
            <Link to="/preventa">Preventa</Link>
            <Link to="/personalizados">Personalizados</Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-3">Redes</h3>

          <div className="flex gap-3">
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              className="h-11 w-11 rounded-full bg-white flex items-center justify-center smika-shadow font-black text-sm hover:bg-[#F7D9D8]"
              title="Instagram"
            >
              IG
            </a>

            <a
              href={socialLinks.tiktok}
              target="_blank"
              rel="noreferrer"
              className="h-11 w-11 rounded-full bg-white flex items-center justify-center smika-shadow font-black text-sm hover:bg-[#F7D9D8]"
              title="TikTok"
            >
              TT
            </a>

            <a
              href={socialLinks.whatsappChannel}
              target="_blank"
              rel="noreferrer"
              className="h-11 w-11 rounded-full bg-white flex items-center justify-center smika-shadow font-black text-sm hover:bg-[#F7D9D8]"
              title="Canal de WhatsApp"
            >
              WA
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[#87CCC8]/20 py-4 text-center text-xs text-gray-500">
        © 2026 Smika Store. Proyecto web en desarrollo.
      </div>
    </footer>
  );
}

export default Footer;