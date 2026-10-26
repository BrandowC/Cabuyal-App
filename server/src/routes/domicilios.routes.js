const { Router } = require('express')
const { z } = require('zod')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { validateBody } = require('../validate')
const { emitir } = require('../realtime')
const { rangoFecha } = require('../utils/fechas')

const router = Router()

router.use(requireAuth, requireRole('admin', 'caja'))

router.get('/', async (req, res) => {
  const inicioHoy = new Date()
  inicioHoy.setHours(0, 0, 0, 0)

  if (req.query.cancelados === '1') {
    const cancelados = await prisma.domicilio.findMany({
      where: { estado: 'cancelado', fecha: { gte: inicioHoy } },
      include: { items: true },
      orderBy: { fecha: 'desc' },
    })
    return res.json(cancelados)
  }

  // Trae los activos de siempre + los despachados de hoy, para que el tablero Kanban
  // muestre la columna "Despachado" con contenido en vez de vaciarse al instante.
  const domicilios = await prisma.domicilio.findMany({
    where: {
      estado: { not: 'cancelado' },
      OR: [
        { estado: { not: 'despachado' } },
        { estado: 'despachado', fecha: { gte: inicioHoy } },
      ],
    },
    include: { items: true },
    orderBy: { fecha: 'desc' },
  })
  res.json(domicilios)
})

// Historial de pedidos de cualquier estado (incluye despachados y cancelados) en un periodo
router.get('/historial', async (req, res) => {
  const domicilios = await prisma.domicilio.findMany({
    where: { fecha: rangoFecha(req.query) },
    include: { items: true },
    orderBy: { fecha: 'desc' },
  })
  res.json(domicilios)
})

const itemSchema = z.object({
  nombre: z.string().min(1),
  precio: z.number().nonnegative(),
  cantidad: z.number().int().positive(),
  notas: z.string().optional().default(''),
})

const addSchema = z.object({
  nombre: z.string().min(1),
  telefono: z.string().min(1),
  direccion: z.string().optional().default(''),
  referencia: z.string().optional().default(''),
  items: z.array(itemSchema).min(1),
  tipoEntrega: z.enum(['domicilio', 'recoger']).optional().default('domicilio'),
  costoEnvio: z.number().nonnegative().optional().default(0),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional().default('efectivo'),
}).refine((d) => d.tipoEntrega === 'recoger' || d.direccion.trim().length > 0, {
  message: 'La dirección es obligatoria para domicilios', path: ['direccion'],
})

router.post('/', validateBody(addSchema), async (req, res) => {
  const { nombre, telefono, direccion, referencia, items, tipoEntrega, costoEnvio, metodoPago } = req.body
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const envio = tipoEntrega === 'domicilio' ? costoEnvio : 0
  const total = subtotal + envio

  const domicilio = await prisma.domicilio.create({
    data: {
      nombre, telefono, direccion, referencia, subtotal, costoEnvio: envio, total, tipoEntrega, metodoPago,
      creadoPor: req.user.nombre,
      items: { create: items },
    },
    include: { items: true },
  })
  emitir('domicilios:cambio', { id: domicilio.id })
  res.status(201).json(domicilio)
})

const updateSchema = z.object({
  estado: z.enum(['pendiente', 'pendiente_confirmacion', 'despachado', 'cancelado']),
})

router.patch('/:id', validateBody(updateSchema), async (req, res) => {
  const id = Number(req.params.id)
  await prisma.domicilio.update({ where: { id }, data: { estado: req.body.estado } })
  emitir('domicilios:cambio', { id })
  res.json({ ok: true })
})

module.exports = router
module.exports.itemSchema = itemSchema
module.exports.addSchema = addSchema
