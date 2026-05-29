export const mainNavigation = [
  {
    label: "Inicio",
    path: "/"
  },
  {
    label: "Nuevos productos",
    path: "/nuevos-productos"
  },
  {
    label: "Series",
    path: "/series",
    children: [
      { label: "Chinas", path: "/series/chinas" },
      { label: "Coreanas", path: "/series/coreanas" },
      { label: "Japonesas", path: "/series/japonesas" },
      { label: "Variado", path: "/series/variado" }
    ]
  },
  {
    label: "Eventos",
    path: "/eventos",
    children: [
      { label: "Café", path: "/eventos/cafe" },
      { label: "Pop up", path: "/eventos/pop-up" },
      { label: "Lebom", path: "/eventos/lebom" },
      { label: "Especiales", path: "/eventos/especiales" }
    ]
  },
  {
    label: "Libros",
    path: "/libros",
    children: [
      { label: "Tomos China", path: "/libros/tomos-china" },
      { label: "Tomos KR", path: "/libros/tomos-kr" },
      { label: "Tomos JP", path: "/libros/tomos-jp" },
      { label: "Tomos TW", path: "/libros/tomos-tw" }
    ]
  },
  {
    label: "Preventa",
    path: "/preventa",
    children: [
      { label: "China", path: "/preventa/china" },
      { label: "Corea", path: "/preventa/corea" },
      { label: "Japón", path: "/preventa/japon" },
      { label: "Variado", path: "/preventa/variado" }
    ]
  },
  {
    label: "Personalizados",
    path: "/personalizados"
  }
];

export const socialLinks = {
  tiktok: "https://www.tiktok.com/@smikastore",
  instagram: "https://www.instagram.com/smika.shop",
  whatsappChannel: "https://whatsapp.com/channel/0029Vb64qIM89inZ5QbQOT33"
};