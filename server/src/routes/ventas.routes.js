const { Router } = require('express')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { rangoFecha } = require('../utils/fechas')

const router = Router()

router.use(requireAuth, requireRole('admin', 'caja'))

// Historial de cuentas cobradas. Filtros: periodo (filtro / desde / hasta) y número de mesa.
// "abiertaEn" es la hora del primer producto pedido en esa cuenta, o sea cuándo se empezó a usar la mesa.
router.get('/', async (req, res) => {
  const fecha = rangoFecha(req.query)
  const numeroMesa = Number(req.query.mesa)
  const ventas = await prisma.venta.findMany({
    where: { fecha, ...(Number.isInteger(numeroMesa) && numeroMesa > 0 ? { mesa: { numero: numeroMesa } } : {}) },
    include: {
      mesa: { select: { numero: true } },
      pedidos: { select: { fecha: true } },
    },
    orderBy: { fecha: 'desc' },
  })
  res.json(ventas.map((v) => ({
    id: v.id, mesa: v.mesa.numero, total: v.total, subtotal: v.subtotal, propina: v.propina,
    metodoPago: v.metodoPago, mesero: v.mesero, fecha: v.fecha,
    abiertaEn: v.pedidos.length ? new Date(Math.min(...v.pedidos.map((p) => p.fecha.getTime()))) : null,
    items: v.pedidos.length,
  })))
})

router.get('/:id/recibo', async (req, res) => {
  const id = Number(req.params.id)
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      mesa: { select: { numero: true } },
      pedidos: { orderBy: { fecha: 'asc' } },
    },
  })
  if (!venta) return res.status(404).json({ error: 'Recibo no encontrado' })
  res.json(venta)
})

router.get('/stats', async (req, res) => {
  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const inicioSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const [hoy, semana, mes] = await Promise.all([
    prisma.venta.aggregate({ where: { fecha: { gte: inicioHoy } }, _sum: { total: true }, _count: true }),
    prisma.venta.aggregate({ where: { fecha: { gte: inicioSemana } }, _sum: { total: true } }),
    prisma.venta.aggregate({ where: { fecha: { gte: inicioMes } }, _sum: { total: true } }),
  ])

  res.json({
    hoy_cierres: hoy._count,
    hoy_total: hoy._sum.total || 0,
    semana: semana._sum.total || 0,
    mes: mes._sum.total || 0,
  })
})

module.exports = router
