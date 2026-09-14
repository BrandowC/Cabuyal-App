const { Router } = require('express')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { rangoFecha, etiquetaPeriodo } = require('../utils/fechas')
const { generarGanancias, generarStock } = require('../services/excel')

const router = Router()

router.use(requireAuth)

router.get('/ganancias', requireRole('admin', 'caja'), async (req, res) => {
  const fecha = rangoFecha(req.query)

  const [ventasRaw, domicilios] = await Promise.all([
    prisma.venta.findMany({ where: { fecha }, include: { mesa: { select: { numero: true } } } }),
    prisma.domicilio.findMany({ where: { fecha, estado: { not: 'cancelado' } } }),
  ])
  const ventas = ventasRaw.map((v) => ({ mesa: v.mesa.numero, total: v.total, fecha: v.fecha }))

  const buffer = await generarGanancias({ ventas, domicilios, etiquetaPeriodo: etiquetaPeriodo(req.query) })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="Ganancias_ElCabuyal_${new Date().toISOString().slice(0, 10)}.xlsx"`)
  res.send(Buffer.from(buffer))
})

router.get('/stock', requireRole('admin'), async (req, res) => {
  const platos = await prisma.plato.findMany({ orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }] })
  const buffer = await generarStock(platos)

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="Stock_ElCabuyal_${new Date().toISOString().slice(0, 10)}.xlsx"`)
  res.send(Buffer.from(buffer))
})

module.exports = router
