// Uso único: asigna una foto de referencia por categoría y una descripción base a los
// platos que ya existían sin ellas (creados antes de que el seed las incluyera). No toca
// los que ya tengan imagenUrl o descripción propia cargada desde Menú.
const { PrismaClient } = require('@prisma/client')
const { IMAGENES_CATEGORIA } = require('./imagenes-categoria')
const { IMAGENES_PLATO } = require('./imagenes-plato')
const { DESCRIPCIONES } = require('./descripciones-menu')

const prisma = new PrismaClient()

async function backfillImagenes() {
  let total = 0
  // Foto propia del plato (por nombre). Solo reemplaza si no tiene foto o tiene la
  // genérica de su categoría; nunca pisa una URL que se haya cargado desde Menú.
  const genericas = Object.values(IMAGENES_CATEGORIA)
  for (const [nombre, url] of Object.entries(IMAGENES_PLATO)) {
    const { count } = await prisma.plato.updateMany({
      where: { nombre, OR: [{ imagenUrl: null }, { imagenUrl: { in: genericas } }] },
      data: { imagenUrl: url },
    })
    total += count
  }
  // Lo que no tenga foto por nombre queda con la de su categoría
  for (const [categoria, url] of Object.entries(IMAGENES_CATEGORIA)) {
    const { count } = await prisma.plato.updateMany({
      where: { categoria, imagenUrl: null },
      data: { imagenUrl: url },
    })
    total += count
  }
  return total
}

async function backfillDescripciones() {
  let total = 0
  for (const [nombre, descripcion] of Object.entries(DESCRIPCIONES)) {
    const { count } = await prisma.plato.updateMany({
      where: { nombre, descripcion: '' },
      data: { descripcion },
    })
    total += count
  }
  return total
}

async function main() {
  const imagenes = await backfillImagenes()
  const descripciones = await backfillDescripciones()
  console.log(`Listo. ${imagenes} imagen(es) y ${descripciones} descripción(es) actualizadas.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
