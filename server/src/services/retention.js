const fs = require('fs')
const path = require('path')
const ExcelJS = require('exceljs')
const { prisma } = require('../db')
const { fechaLimite } = require('../utils/fechas')

const BACKUPS_DIR = path.join(__dirname, '..', '..', 'backups')

async function respaldarAntesDeBorrar({ pedidos, ventas, domicilios }, limite) {
  if (!pedidos.length && !ventas.length && !domicilios.length) return null

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'El Cabuyal'
  workbook.created = new Date()

  const hVentas = workbook.addWorksheet('Ventas')
  hVentas.addRow(['ID', 'Mesa', 'Total', 'Mesero', 'Fecha'])
  ventas.forEach((v) => hVentas.addRow([v.id, v.mesaId, v.total, v.mesero, v.fecha]))

  const hPedidos = workbook.addWorksheet('Pedidos')
  hPedidos.addRow(['ID', 'Mesa', 'Plato', 'Categoría', 'Precio', 'Cantidad', 'Estado', 'Fecha'])
  pedidos.forEach((p) => hPedidos.addRow([p.id, p.mesaId, p.nombrePlato, p.categoria, p.precio, p.cantidad, p.estado, p.fecha]))

  const hDom = workbook.addWorksheet('Domicilios')
  hDom.addRow(['ID', 'Nombre', 'Teléfono', 'Dirección', 'Total', 'Estado', 'Fecha'])
  domicilios.forEach((d) => hDom.addRow([d.id, d.nombre, d.telefono, d.direccion, d.total, d.estado, d.fecha]))

  fs.mkdirSync(BACKUPS_DIR, { recursive: true })
  const nombreArchivo = `respaldo_${limite.toISOString().slice(0, 10)}_${Date.now()}.xlsx`
  const rutaCompleta = path.join(BACKUPS_DIR, nombreArchivo)
  await workbook.xlsx.writeFile(rutaCompleta)
  return rutaCompleta
}

async function ejecutarRetencion() {
  const limite = fechaLimite()

  const [pedidos, ventas, domicilios] = await Promise.all([
    prisma.pedido.findMany({ where: { fecha: { lt: limite } } }),
    prisma.venta.findMany({ where: { fecha: { lt: limite } } }),
    prisma.domicilio.findMany({ where: { fecha: { lt: limite } } }),
  ])

  if (!pedidos.length && !ventas.length && !domicilios.length) {
    return { borrados: 0 }
  }

  const rutaRespaldo = await respaldarAntesDeBorrar({ pedidos, ventas, domicilios }, limite)

  await prisma.$transaction([
    prisma.pedido.deleteMany({ where: { fecha: { lt: limite } } }),
    prisma.venta.deleteMany({ where: { fecha: { lt: limite } } }),
    prisma.domicilio.deleteMany({ where: { fecha: { lt: limite } } }),
  ])

  const total = pedidos.length + ventas.length + domicilios.length
  console.log(`Retención de datos: se archivaron y borraron ${total} registros anteriores a ${limite.toISOString().slice(0, 10)} → ${rutaRespaldo}`)
  return { borrados: total, rutaRespaldo }
}

module.exports = { ejecutarRetencion }
