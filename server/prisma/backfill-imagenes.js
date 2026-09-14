// Uso único: asigna una foto de referencia por categoría y una descripción base a los
// platos que ya existían sin ellas (creados antes de que el seed las incluyera). No toca
// los que ya tengan imagenUrl o descripción propia cargada desde Menú.
const { PrismaClient } = require('@prisma/client')
const { IMAGENES_CATEGORIA } = require('./imagenes-categoria')
const { DESCRIPCIONES } = require('./descripciones-menu')

const prisma = new PrismaClient()

async function backfillImagenes() {
  let total = 0
  for (const [categoria, url] of Object.entries(IMAGENES_CATEGORIA)) {
    const { count } = await prisma.plato.updateMany({
      where: { categoria, imagenUrl: null },
      data: { imagenUrl: url },
    })
    total += count
    if (count > 0) console.log(`Imagen — ${categoria}: ${count} plato(s) actualizados`)
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
