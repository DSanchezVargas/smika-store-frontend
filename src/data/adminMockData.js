export const adminProducts = [
  {
    id: 1,
    nombre: "Stand de acrílico Shuraka",
    serie: "La Ventura del Caballero Blanco",
    tipo: "Stand de acrílico",
    evento: "Evento café",
    precio: 28,
    stock: 12,
    estado: "Activo"
  },
  {
    id: 2,
    nombre: "Pin edición evento café",
    serie: "La Ventura del Caballero Blanco",
    tipo: "Pin",
    evento: "Evento café",
    precio: 18,
    stock: 20,
    estado: "Activo"
  },
  {
    id: 3,
    nombre: "Photocard colección especial",
    serie: "Tian Guan Ci Fu",
    tipo: "Photocard",
    evento: "Pop up especial",
    precio: 15,
    stock: 30,
    estado: "Preventa"
  }
];

export const adminEvents = [
  {
    id: 1,
    nombre: "Evento café",
    tipo: "Café",
    serie: "La Ventura del Caballero Blanco",
    pais: "China",
    duracion: "15 días",
    productos: 3,
    estado: "Actual"
  },
  {
    id: 2,
    nombre: "Pop up especial",
    tipo: "Pop up",
    serie: "Tian Guan Ci Fu",
    pais: "China",
    duracion: "Próximamente",
    productos: 2,
    estado: "Próximo"
  },
  {
    id: 3,
    nombre: "Lebom",
    tipo: "Lebom",
    serie: "Variado",
    pais: "Variado",
    duracion: "Programación pendiente",
    productos: 1,
    estado: "Próximo"
  }
];

export const adminSeries = [
  {
    id: 1,
    nombre: "La Ventura del Caballero Blanco",
    categoria: "Series",
    pais: "China",
    tipo: "Manhua",
    genero: "BL",
    autor: "Autor registrado",
    personajes: 1,
    anio: 2023,
    estado: "Activo"
  },
  {
    id: 2,
    nombre: "Tian Guan Ci Fu",
    categoria: "Series",
    pais: "China",
    tipo: "Manhua",
    genero: "Fantasía",
    autor: "Mo Xiang Tong Xiu",
    personajes: 2,
    anio: 2017,
    estado: "Activo"
  },
  {
    id: 3,
    nombre: "Jinx",
    categoria: "Series",
    pais: "Corea",
    tipo: "Manhwa",
    genero: "BL",
    autor: "Mingwa",
    personajes: 0,
    anio: 2022,
    estado: "Activo"
  }
];

export const adminUsers = [
  {
    id: 1,
    nombre: "Smika Support",
    email: "soporte.smika@gmail.com",
    role: "admin",
    estado: "Activo"
  },
  {
    id: 2,
    nombre: "Subadmin Smika",
    email: "subadmin@smika.local",
    role: "subadmin",
    estado: "Activo"
  },
  {
    id: 3,
    nombre: "Cliente Prueba",
    email: "cliente@smika.local",
    role: "cliente",
    estado: "Activo"
  }
];