const { Router } = require('express')
const { z } = require('zod')
const { prisma } = require('../db')
const { requireAuth, requireRole } = require('../auth/middleware')
const { validateBody } = require('../validate')
const { emitir } = require('../realtime')

const router = Router()

router.use(requireAuth)

// "pedidoListo": la mesa tiene productos y la cocina ya terminó y despachó todos (ninguno nuevo,
// en cola ni en preparación). Sirve para avisar al mesero que ya puede llevar el pedido.
const ESTADOS_EN_PROCESO = ['nuevo', 'pendiente', 'preparando']

router.get('/', async (req, res) => {
  const [mesas, conteos] = await Promise.all([
    prisma.mesa.findMany({ orderBy: { numero: 'asc' } }),
    prisma.pedido.groupBy({ by: ['mesaId', 'estado'], where: { estado: { not: 'cerrado' } }, _count: { _all: true } }),
  ])
  const abiertos = new Map()
  const enProceso = new Map()
  conteos.forEach(({ mesaId, estado, _count }) => {
    abiertos.set(mesaId, (abiertos.get(mesaId) || 0) + _count._all)
    if (ESTADOS_EN_PROCESO.includes(estado)) enProceso.set(mesaId, (enProceso.get(mesaId) || 0) + _count._all)
  })
  res.json(mesas.map((m) => ({ ...m, pedidoListo: (abiertos.get(m.id) || 0) > 0 && !enProceso.get(m.id) })))
})

const estadoSchema = z.object({
  estado: z.enum(['libre', 'ocupada', 'cuenta']),
  mesero: z.string().optional().default(''),
})

router.patch('/:id', requireRole('admin', 'empleado', 'caja'), validateBody(estadoSchema), async (req, res) => {
  const id = Number(req.params.id)
  const { estado, mesero } = req.body
  if (estado === 'libre') {
    // Liberar una mesa solo se permite si no tiene consumo; si lo tiene, hay que cobrarla
    const abiertos = await prisma.pedido.count({ where: { mesaId: id, estado: { not: 'cerrado' } } })
    if (abiertos > 0) return res.status(400).json({ error: 'La mesa tiene productos pendientes de cobro' })
  }
  await prisma.mesa.update({ where: { id }, data: { estado, mesero: estado === 'libre' ? '' : mesero } })
  emitir('mesas:cambio', { mesaId: id })
  res.json({ ok: true })
})

const layoutSchema = z.object({
  numero: z.number().int().positive().optional(),
  capacidad: z.number().int().positive().optional(),
  zona: z.string().optional(),
  forma: z.enum(['cuadrada', 'circular', 'rectangular']).optional(),
  posX: z.number().int().optional(),
  posY: z.number().int().optional(),
  ancho: z.number().int().positive().optional(),
  alto: z.number().int().positive().optional(),
  imagenUrl: z.string().url().nullable().optional(),
})

router.put('/:id', requireRole('admin'), validateBody(layoutSchema), async (req, res) => {
  const id = Number(req.params.id)
  const mesa = await prisma.mesa.update({ where: { id }, data: req.body })
  emitir('mesas:layout', { mesaId: id })
  res.json(mesa)
})

module.exports = router
