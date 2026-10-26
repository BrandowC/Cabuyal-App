const { Router } = require('express')
const { z } = require('zod')
const { validateBody } = require('../validate')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { rangoFecha } = require('../utils/fechas')

const router = Router()

router.use(requireAuth, requireRole('admin', 'caja'))

router.get('/', async (req, res) => {
  const fecha = rangoFecha(req.query)
  const ventas = await prisma.venta.findMany({
    where: { fecha },
    include: { mesa: { select: { numero: true } } },
    orderBy: { fecha: 'desc' },
  })
  res.json(ventas.map((v) => ({
    id: v.id, mesa: v.mesa.numero, total: v.total, mesero: v.mesero, fecha: v.fecha,
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

// La propina se define en el recibo, cuando el cliente decide: se recalcula el total de la venta
const propinaSchema = z.object({ propina: z.number().nonnegative().max(100000000) })

router.patch('/:id/propina', validateBody(propinaSchema), async (req, res) => {
  const id = Number(req.params.id)
  const actual = await prisma.venta.findUnique({ where: { id }, select: { subtotal: true } })
  if (!actual) return res.status(404).json({ error: 'Venta no encontrada' })

  const propina = Math.round(req.body.propina)
  const venta = await prisma.venta.update({
    where: { id },
    data: { propina, total: actual.subtotal + propina },
    include: { mesa: { select: { numero: true } }, pedidos: { orderBy: { fecha: 'asc' } } },
  })
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
