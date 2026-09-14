const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { IMAGENES_CATEGORIA } = require('./imagenes-categoria')
const { DESCRIPCIONES } = require('./descripciones-menu')

const prisma = new PrismaClient()

async function seedMesas() {
  const count = await prisma.mesa.count()
  if (count > 0) return
  const mesas = [
    ...Array.from({ length: 7 }, (_, i) => [i + 1, 4, 'Casa']),
    ...Array.from({ length: 3 }, (_, i) => [i + 8, 4, 'Salón 1']),
    ...Array.from({ length: 2 }, (_, i) => [i + 11, 4, 'Salón Madera']),
    ...Array.from({ length: 5 }, (_, i) => [i + 13, 4, 'Salón 2']),
    [18, 4, 'Sombrilla 1'],
    [19, 4, 'Sombrilla 2'],
  ]
  const GRID_COLS = 5
  const GRID_GAP = 130
  const GRID_OFFSET = 24
  await prisma.mesa.createMany({
    data: mesas.map(([numero, capacidad, zona], i) => ({
      numero, capacidad, zona,
      posX: GRID_OFFSET + (i % GRID_COLS) * GRID_GAP,
      posY: GRID_OFFSET + Math.floor(i / GRID_COLS) * GRID_GAP,
    })),
  })
  console.log(`Mesas creadas: ${mesas.length}`)
}

async function seedMenu() {
  const count = await prisma.plato.count()
  if (count > 0) return

  const comidas = [
    ['COSTILLAS BBQ', 'Parrilla', 22000],
    ['PARRILLADA', 'Parrilla', 24000],
    ['CHURRASCO', 'Parrilla', 28000],
    ['FILET MIGNON', 'Parrilla', 32000],
    ['PUNTA DE ANCA', 'Parrilla', 40000],
    ['PICADA', 'Parrilla', 40000],
    ['BROCHETA DE POLLO', 'Pollo', 16000],
    ['ALITAS BBQ', 'Pollo', 15000],
    ['PECHUGA ASADA', 'Pollo', 23000],
    ['PECHUGA GRATINADA', 'Pollo', 27000],
    ['PECHUGA CABUYAL', 'Pollo', 28000],
    ['PECHUGA EN SALSA CON CAMARON', 'Pollo', 30000],
    ['LASAGNA DE POLLO', 'Lasagna', 22000],
    ['LASAGNA MIXTA', 'Lasagna', 25000],
    ['SALCHIPAPA TRADICIONAL', 'Rápidos', 9000],
    ['SALCHIPAPA MIXTA', 'Rápidos', 18000],
    ['PERRO TRADICIONAL', 'Rápidos', 9000],
    ['PERRO LOCO', 'Rápidos', 17000],
    ['TACO CABUYAL', 'Rápidos', 18000],
    ['CAJITA FELIZ', 'Rápidos', 16000],
    ['HAMBURGUESA SENCILLA', 'Hamburguesas', 11000],
    ['HAMBURGUESA CON TODO', 'Hamburguesas', 22500],
    ['PAPA FRANCESA', 'Adiciones', 4000],
    ['PORCION PATACON', 'Adiciones', 4000],
    ['PORCION ARROZ', 'Adiciones', 2000],
    ['PORCION ENSALADA', 'Adiciones', 2000],
    ['PORCION CARNE DE HAMBURGUESA', 'Adiciones', 4000],
    ['HUEVO', 'Adiciones', 1000],
    ['JALAPENOS', 'Adiciones', 1000],
    ['PEPINILLO', 'Adiciones', 1000],
    ['GUACAMOLE', 'Adiciones', 1000],
    ['MAIZ EN SALSA', 'Adiciones', 1000],
    ['PINA', 'Adiciones', 1000],
    ['JAMON', 'Adiciones', 1000],
    ['TOCINETA', 'Adiciones', 1500],
    ['SALSA CABUYAL', 'Salsas', 1500],
    ['SALSA QUESO', 'Salsas', 1500],
  ]

  const bebidas = [
    ['SODA', 'Bebidas', 3000],
    ['SODA CON LIMON', 'Bebidas', 3500],
    ['SODA SABORIZADA', 'Bebidas', 10000],
    ['LIMONADA CEREZADA', 'Limonadas', 10000],
    ['LIMONADA HIERBABUENA', 'Limonadas', 10000],
    ['LIMONADA DE COCO', 'Limonadas', 12000],
    ['MALTEADA MACADAMIA', 'Malteadas', 12000],
    ['MALTEADA LULO', 'Malteadas', 12000],
    ['MALTEADA TRES LECHES', 'Malteadas', 12000],
    ['MARACUYA JARRA (PEQUEÑA)', 'Jarras', 10000],
    ['MARACUYA JARRA (GRANDE)', 'Jarras', 15000],
    ['CHOLUPA JARRA (PEQUEÑA)', 'Jarras', 10000],
    ['CHOLUPA JARRA (GRANDE)', 'Jarras', 15000],
    ['COCA COLA PERSONAL', 'Gaseosas', 4000],
    ['COCA COLA 1.5 LT', 'Gaseosas', 8000],
    ['COCA COLA 3 LT', 'Gaseosas', 12000],
    ['CUATRO', 'Gaseosas', 8000],
    ['GINGER', 'Gaseosas', 8000],
    ['AGUA EN BOTELLA', 'Bebidas', 4000],
    ['AGUILA / POKER / AGUILA LIGHT', 'Cervezas', 3500],
    ['CLUB COLOMBIA DORADA', 'Cervezas', 5000],
    ['MICHELADA', 'Cervezas', 5000],
  ]

  await prisma.plato.createMany({
    data: [...comidas, ...bebidas].map(([nombre, categoria, precio]) => ({
      nombre, categoria, precio,
      imagenUrl: IMAGENES_CATEGORIA[categoria] || null,
      descripcion: DESCRIPCIONES[nombre] || '',
    })),
  })
  console.log(`Platos creados: ${comidas.length + bebidas.length}`)
}

async function seedAdmin() {
  const existe = await prisma.usuario.findFirst({ where: { rol: 'admin' } })
  if (existe) return
  const password = await bcrypt.hash('admin123', 10)
  await prisma.usuario.create({
    data: { nombre: 'Administrador', usuario: 'admin', password, rol: 'admin' },
  })
  console.log('Usuario admin creado (usuario: admin, password: admin123 — cámbiala apenas entres)')
}

async function main() {
  await seedMesas()
  await seedMenu()
  await seedAdmin()
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
